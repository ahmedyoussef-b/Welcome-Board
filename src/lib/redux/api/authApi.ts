
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { SafeUser, Role } from '@/types/index'; // Use Role from centralized types

export interface AuthResponse {
  message: string;
  user: SafeUser;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  role: Role; // Use Role from centralized types
  name?: string;
}

export interface SessionResponse {
  user: SafeUser; 
}

export interface LogoutResponse {
    message: string;
}

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/auth/' }),
  tagTypes: ['UserSession'],
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (credentials) => ({
        url: 'login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['UserSession'],
    }),
    register: builder.mutation<AuthResponse, RegisterRequest>({
      query: (userInfo) => ({
        url: 'register',
        method: 'POST',
        body: userInfo,
      }),
      invalidatesTags: ['UserSession'],
    }),
    logout: builder.mutation<LogoutResponse, void>({
      query: () => ({
        url: 'logout',
        method: 'POST',
      }),
      invalidatesTags: ['UserSession'],
    }),
    checkSession: builder.query<SessionResponse, void>({
      query: () => 'session',
      providesTags: ['UserSession'],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useCheckSessionQuery,
} = authApi;
