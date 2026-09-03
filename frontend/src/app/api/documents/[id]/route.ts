import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://backend:8000";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    return NextResponse.json({ detail: "Non authentifié." }, { status: 401 });
  }

  const backendResponse = await fetch(`${BACKEND_API_URL}/documents/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await backendResponse.json();

  return NextResponse.json(data, { status: backendResponse.status });
}
