import { NextResponse } from "next/server";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://backend:8000";

export async function GET() {
  const backendResponse = await fetch(`${BACKEND_API_URL}/career/roles`);
  const data = await backendResponse.json();

  return NextResponse.json(data, { status: backendResponse.status });
}
