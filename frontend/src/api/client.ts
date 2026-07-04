import { supabase } from '@/src/lib/supabase';

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";

function describeError(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }
  return String(error);
}

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_URL}${path}`;
  const method = init?.method ?? "GET";
  console.log(`[api] ${method} ${url}`);

  const { data: { session } } = await supabase.auth.getSession();
  const authHeaders: Record<string, string> = session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: { ...authHeaders, ...(init?.headers as Record<string, string> ?? {}) },
    });
  } catch (error) {
    console.error(`[api] ${method} ${url} failed before response: ${describeError(error)}`);
    throw error;
  }

  console.log(`[api] ${method} ${url} -> ${response.status}`);

  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      if (typeof body?.detail === "string") detail = body.detail;
    } catch {
      // JSONでないエラーレスポンスはステータスコードのまま扱う
    }
    console.error(`[api] ${method} ${url} error: ${detail}`);
    throw new ApiError(response.status, detail);
  }

  return response.json();
}
