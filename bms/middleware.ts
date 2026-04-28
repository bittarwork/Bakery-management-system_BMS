// Route protection middleware: JWT-based RBAC without database access
// Uses getToken to read the JWT directly without calling the database
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Get JWT token without database call
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
  });

  // Public route: allow login page, redirect if already authenticated
  if (pathname.startsWith("/login")) {
    if (token) {
      const dest = token.role === "ADMIN" ? "/dashboard" : "/my-orders";
      return NextResponse.redirect(new URL(dest, req.url));
    }
    return NextResponse.next();
  }

  // All other routes require authentication
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const role = token.role as string;

  // Admin-only routes
  const adminPaths = [
    "/dashboard", "/shops", "/products", "/orders",
    "/distribution", "/payments", "/reports", "/settings",
  ];

  if (adminPaths.some((p) => pathname.startsWith(p))) {
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/my-orders", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  // Exclude Next.js internals, static files, and API auth routes
  matcher: [
    "/((?!_next|api/auth|favicon.ico|.*\\.(?:svg|png|jpg|ico|css|js)).*)",
  ],
};
