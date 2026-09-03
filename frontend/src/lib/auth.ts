import { cookies } from "next/headers";
import { backendFetch, ApiError } from "@/lib/api-client";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    return null;
  }

  try {
    const user = await backendFetch("/auth/me", { method: "GET" }, token);
    return { user, token };
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }
    throw error;
  }
}
