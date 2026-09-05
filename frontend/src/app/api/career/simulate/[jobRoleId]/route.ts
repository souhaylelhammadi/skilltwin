import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://backend:8000";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobRoleId: string }> }
) {
  const { jobRoleId } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    return NextResponse.json({ detail: "Non authentifié." }, { status: 401 });
  }

  const body = await request.json();

  const backendResponse = await fetch(
    `${BACKEND_API_URL}/career/simulate/${jobRoleId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    }
  );

  const data = await backendResponse.json();

  return NextResponse.json(data, { status: backendResponse.status });
}
