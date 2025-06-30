
import type { Role } from "@/types/index"; // Use Role type from centralized source

export const ITEM_PER_PAGE = 10;

// Define RouteAccessMap using string literals that are compatible with the Role type.
// Role type (from @/types/index.ts, sourced from @prisma/client) is a union of string literals.
type RouteAccessMap = {
  [key: string]: Role[]; 
};

// Values used here must match the string values of the Role enum
export const routeAccessMap: RouteAccessMap = {
  "/admin(.*)": ["ADMIN"],
  "/student(.*)": ["STUDENT"],
  "/teacher(.*)": ["TEACHER"],
  "/parent(.*)": ["PARENT"],
  "/list/teachers": ["ADMIN", "TEACHER"],
  "/list/students": ["ADMIN", "TEACHER"],
  "/list/parents": ["ADMIN", "TEACHER"],
  "/list/subjects": ["ADMIN"],
  "/list/classes": ["ADMIN", "TEACHER"],
  "/list/lessons": ["ADMIN", "TEACHER"], 
  "/list/exams": ["ADMIN", "TEACHER", "STUDENT", "PARENT"],
  "/list/assignments": ["ADMIN", "TEACHER", "STUDENT", "PARENT"],
  "/list/results": ["ADMIN", "TEACHER", "STUDENT", "PARENT"],
  "/list/attendance": ["ADMIN", "TEACHER", "STUDENT", "PARENT"], 
  "/list/events": ["ADMIN", "TEACHER", "STUDENT", "PARENT"],
  "/list/announcements": ["ADMIN", "TEACHER", "STUDENT", "PARENT"],
  "/list/messages": ["ADMIN", "TEACHER", "STUDENT", "PARENT"], 
  "/profile(.*)": ["ADMIN", "TEACHER", "STUDENT", "PARENT"],
  "/settings(.*)": ["ADMIN", "TEACHER", "STUDENT", "PARENT"],
};
