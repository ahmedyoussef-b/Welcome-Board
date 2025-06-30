
import prisma from '@/lib/prisma';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt, { type SignOptions, type Secret } from 'jsonwebtoken';
import type { SafeUser } from '@/types/index';
import { Role } from "@prisma/client"; // Role enum from Prisma

const JWT_SECRET_KEY_VALUE = process.env.JWT_SECRET_KEY;
const JWT_EXPIRES_IN = process.env.JWT_ACCESS_TOKEN_EXPIRATION_TIME || '1h';
const SESSION_COOKIE_NAME = 'sessionToken';
const HASH_ROUNDS = 10;

export async function POST(req: NextRequest) {
  if (!JWT_SECRET_KEY_VALUE) {
    console.error('JWT_SECRET_KEY is not defined in environment variables.');
    return NextResponse.json({ message: 'Internal server error: JWT secret missing' }, { status: 500 });
  }

  try {
    const { email, password, role, name } = await req.json() as { email: string, password?: string, role: Role, name?: string };

    if (!email || !password || !role) {
      return NextResponse.json({ message: 'Email, password, and role are required' }, { status: 400 });
    }

    if (!Object.values(Role).includes(role)) {
        return NextResponse.json({ message: 'Invalid role provided' }, { status: 400 });
    }

    const username = email;

    const existingUserByEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUserByEmail) {
      return NextResponse.json({ message: 'User already exists with this email' }, { status: 409 });
    }

    const existingUserByUsername = await prisma.user.findUnique({
        where: { username },
    });

    if (existingUserByUsername) {
        return NextResponse.json({ message: 'Username already taken. Please choose another or modify email.' }, { status: 409 });
    }


    const hashedPassword = await bcrypt.hash(password, HASH_ROUNDS);

    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role: role,
        ...(name && { name }), // Include name only if it exists
        active: true,
      },
    });

    const { password: _, ...userWithoutPassword } = newUser;

    const tokenPayload = {
      userId: newUser.id,
      username: newUser.username,
      role: newUser.role,
      email: newUser.email
    };

    const secretKey: Secret = JWT_SECRET_KEY_VALUE; // Explicitly type as Secret
    const signOptions: SignOptions = {
      expiresIn: 86400 // 1 day in seconds
    };

    const token = jwt.sign(tokenPayload, secretKey, signOptions);

    const response = NextResponse.json({ message: 'User registered successfully', user: userWithoutPassword as SafeUser }, { status: 201 });

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
      sameSite: 'lax',
    });

    return response;

  } catch (error) {
    console.error('[REGISTER_API_ERROR]', error);
    if ((error as any).code === 'P2002') { // Prisma unique constraint violation
        return NextResponse.json({ message: 'Email or username already exists.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
