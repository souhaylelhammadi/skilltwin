import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://backend:8000";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    return NextResponse.json({ detail: "Non authentifié." }, { status: 401 });
  }

  const formData = await request.formData();

  const backendResponse = await fetch(`${BACKEND_API_URL}/documents/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await backendResponse.json();

  return NextResponse.json(data, { status: backendResponse.status });
}
