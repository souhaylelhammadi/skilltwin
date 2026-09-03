import { NextRequest, NextResponse } from "next/server";
import { backendFetch, ApiError } from "@/lib/api-client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const data = await backendFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    });

    const response = NextResponse.json({ user: data.user });

    response.cookies.set("access_token", data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60, // 1 heure, cohérent avec JWT_EXPIRATION_MINUTES côté backend
    });

    return response;
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ detail: error.detail }, { status: error.status });
    }
    return NextResponse.json(
      { detail: "Erreur serveur inattendue." },
      { status: 500 }
    );
  }
}
