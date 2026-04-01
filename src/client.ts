export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
  ) {
    const msg =
      typeof body === "object" && body && "error" in body
        ? (body as { error: string }).error
        : JSON.stringify(body);
    super(`API Error (${status}): ${msg}`);
  }
}

export class ApvisoClient {
  constructor(
    private apiKey: string,
    private baseUrl: string,
  ) {}

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    params?: Record<string, string>,
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined) url.searchParams.set(k, v);
      }
    }

    const res = await fetch(url.toString(), {
      method,
      headers: {
        "X-API-Key": this.apiKey,
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const text = await res.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }

    if (!res.ok) {
      throw new ApiError(res.status, parsed);
    }

    return parsed as T;
  }

  get<T>(path: string, params?: Record<string, string>): Promise<T> {
    return this.request("GET", path, undefined, params);
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request("POST", path, body);
  }

  patch<T>(path: string, body: unknown): Promise<T> {
    return this.request("PATCH", path, body);
  }

  delete<T>(path: string): Promise<T> {
    return this.request("DELETE", path);
  }
}
