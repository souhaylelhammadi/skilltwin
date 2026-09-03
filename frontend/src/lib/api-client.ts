const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://backend:8000";

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.status = status;
    this.detail = detail;
  }
}

export async function backendFetch(
  path: string,
  options: RequestInit = {},
  token?: string,
) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${BACKEND_API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let detail = "Une erreur est survenue.";
    try {
      const errorBody = await response.json();
      detail = errorBody.detail || detail;
    } catch {
      // réponse non-JSON, on garde le message par défaut
    }
    throw new ApiError(response.status, detail);
  }

  return response.json();
}
