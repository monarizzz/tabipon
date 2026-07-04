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

  let response: Response;
  try {
    response = await fetch(url, init);
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

  // 204 No Content などボディを持たないレスポンスは json() が失敗するため undefined を返す
  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return undefined as T;
  }

  return response.json();
}
