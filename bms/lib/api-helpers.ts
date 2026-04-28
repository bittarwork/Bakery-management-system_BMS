// Shared helpers for API route handlers
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { Role } from "@/generated/client/enums";

// Returns session or a 401 response
export async function requireAuth(requiredRole?: Role) {
  const session = await auth();

  if (!session) {
    return {
      session: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (requiredRole && session.user.role !== requiredRole) {
    return {
      session: null,
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { session, error: null };
}

// Standard JSON error responses
export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function notFound(message = "Not found") {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function serverError(message = "Internal server error") {
  return NextResponse.json({ error: message }, { status: 500 });
}
