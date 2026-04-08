const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
export const AUTH_EXPIRED_EVENT = 'auth:expired';

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface LoginResponse {
  success: boolean;
  token: string;
  name?: string;
  userId: string;
  bucket: string;
}

export interface AuthState {
  token: string;
  userId: string;
  name?: string;
  bucket: string;
  email: string;
}

// ─── Generic helpers ─────────────────────────────────────────────────────────

interface ApiErrorResponse {
  error?: string;
  code?: string;
}

interface HandleResponseOptions {
  logoutOnUnauthorized?: boolean;
}

function localizeErrorMessage(message: string, status: number): string {
  const normalized = message.trim().toLowerCase();

  if (status === 400) return 'Некорректный запрос';
  if (status === 401) return 'Неверный email или пароль';
  if (status === 403) return 'Доступ запрещен';
  if (status === 404) return 'Ресурс не найден';
  if (status === 409) return 'Пользователь с таким email уже существует';

  if (
    normalized.includes('invalid credentials') ||
    normalized.includes('invalid email') ||
    normalized.includes('wrong password') ||
    normalized.includes('unauthorized')
  ) {
    return 'Неверный email или пароль';
  }

  if (
    normalized.includes('email already exists') ||
    normalized.includes('user already exists') ||
    normalized.includes('already registered')
  ) {
    return 'Пользователь с таким email уже существует';
  }

  if (normalized.includes('network') || normalized.includes('failed to fetch')) {
    return 'Нет соединения с сервером';
  }

  return message;
}

function emitAuthExpired(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
  }
}

async function handleResponse<T>(response: Response, options?: HandleResponseOptions): Promise<T> {
  const shouldLogout = options?.logoutOnUnauthorized ?? true;

  if (response.status === 401 && shouldLogout) {
    emitAuthExpired();
  }

  if (!response.ok) {
    let message = `HTTP error ${response.status}`;
    let errorCode: string | undefined;
    try {
      const data = await response.json() as ApiErrorResponse;
      if (typeof data?.error === 'string') {
        message = data.error;
      }
      if (typeof data?.code === 'string') {
        errorCode = data.code;
      }
    } catch {
      // ignore parse errors
    }
    const localizedMessage = localizeErrorMessage(message, response.status);
    const error = new Error(localizedMessage) as Error & { status?: number; code?: string };
    error.status = response.status;
    error.code = errorCode;
    throw error;
  }
  if (response.status === 204) {
    return undefined as unknown as T;
  }
  const text = await response.text();
  if (!text) {
    return undefined as unknown as T;
  }
  return JSON.parse(text) as T;
}

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
  };
}

// ─── Auth API ────────────────────────────────────────────────────────────────

export async function apiLogin(email: string, password: string): Promise<AuthState> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await handleResponse<LoginResponse>(res, { logoutOnUnauthorized: false });

  if (!data.success || !data.token) {
    throw new Error('Не удалось выполнить вход');
  }

  return {
    token: data.token,
    userId: data.userId,
    name: data.name,
    bucket: data.bucket,
    email,
  };
}

export async function apiRegister(email: string, password: string, name?: string): Promise<void> {
  await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password, name }),
  }).then((res) => handleResponse<void>(res, { logoutOnUnauthorized: false }));
}

export async function apiPasswordReset(email: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/auth/password-reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  await handleResponse<void>(res, { logoutOnUnauthorized: false });
}

export async function apiVerifyEmail(token: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/auth/verify-email`, {
    method: 'POST',
    headers: authHeaders(token),
  });
  await handleResponse<void>(res, { logoutOnUnauthorized: true });
}

// ─── User API ────────────────────────────────────────────────────────────────

export async function apiDeleteUser(uid: string, token: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/users/${encodeURIComponent(uid)}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  await handleResponse<void>(res, { logoutOnUnauthorized: true });
}

// ─── Files API ───────────────────────────────────────────────────────────────

export interface ApiFile {
  name: string;
  path: string;
  size: number;
  human_size: string;
  is_dir: boolean;
  last_modified: string;
  content_type?: string;
  etag?: string;
  summary?: string;
  analysis_tags?: string[];
  analysis_status?: string;
}

export interface ListFilesResponse {
  bucket: string;
  uid: string;
  count: number;
  files: ApiFile[];
}

export async function apiListFiles(
  bucket: string,
  token: string,
  limit = 100,
  offset = 0,
): Promise<ListFilesResponse> {
  const url = new URL(`${API_BASE_URL}/bucket/${encodeURIComponent(bucket)}/files`);
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('offset', String(offset));

  const res = await fetch(url.toString(), {
    headers: authHeaders(token),
  });

  return handleResponse<ListFilesResponse>(res, { logoutOnUnauthorized: true });
}

export async function apiListFolder(
  bucket: string,
  token: string,
  folder: string,
): Promise<ListFilesResponse> {
  const res = await fetch(
    `${API_BASE_URL}/bucket/${encodeURIComponent(bucket)}/folder/${encodeURIComponent(folder)}`,
    { headers: authHeaders(token) },
  );
  return handleResponse<ListFilesResponse>(res, { logoutOnUnauthorized: true });
}

export async function apiCreateFolder(
  bucket: string,
  token: string,
  folder: string,
): Promise<void> {
  const res = await fetch(
    `${API_BASE_URL}/bucket/${encodeURIComponent(bucket)}/folder/${encodeURIComponent(folder)}`,
    {
      method: 'POST',
      headers: authHeaders(token),
    },
  );
  await handleResponse<void>(res, { logoutOnUnauthorized: true });
}

export async function apiDeleteFolder(
  bucket: string,
  token: string,
  folder: string,
): Promise<void> {
  const res = await fetch(
    `${API_BASE_URL}/bucket/${encodeURIComponent(bucket)}/folder/${encodeURIComponent(folder)}`,
    {
      method: 'DELETE',
      headers: authHeaders(token),
    },
  );
  await handleResponse<void>(res, { logoutOnUnauthorized: true });
}

export async function apiUploadFile(
  bucket: string,
  token: string,
  file: File,
  folder?: string,
): Promise<void> {
  const formData = new FormData();
  formData.append('file', file);
  if (folder) {
    formData.append('folder', folder);
  }

  const res = await fetch(
    `${API_BASE_URL}/bucket/${encodeURIComponent(bucket)}/upload`,
    {
      method: 'POST',
      headers: authHeaders(token),
      body: formData,
    },
  );

  await handleResponse<void>(res, { logoutOnUnauthorized: true });
}

export async function apiDownloadFile(
  bucket: string,
  token: string,
  filePath: string,
): Promise<Blob> {
  const res = await fetch(
    `${API_BASE_URL}/bucket/${encodeURIComponent(bucket)}/downloadFile/${encodeURIComponent(filePath)}`,
    { headers: authHeaders(token) },
  );
  if (!res.ok) {
    if (res.status === 401) {
      emitAuthExpired();
    }
    throw new Error(`Ошибка скачивания: ${res.status}`);
  }
  return res.blob();
}

export async function apiDeleteFile(
  bucket: string,
  token: string,
  filePath: string,
): Promise<void> {
  const res = await fetch(
    `${API_BASE_URL}/bucket/${encodeURIComponent(bucket)}/deleteFile/${encodeURIComponent(filePath)}`,
    {
      method: 'DELETE',
      headers: authHeaders(token),
    },
  );
  await handleResponse<void>(res, { logoutOnUnauthorized: true });
}

// ─── Search API ──────────────────────────────────────────────────────────────

export interface SearchFilesResponse {
  query: string;
  count: number;
  limit: number;
  offset: number;
  files: ApiFile[];
}

export async function apiSearchFiles(
  bucket: string,
  token: string,
  query: string,
): Promise<SearchFilesResponse> {
  const url = new URL(`${API_BASE_URL}/bucket/${encodeURIComponent(bucket)}/search`);
  url.searchParams.set('q', query);

  const res = await fetch(url.toString(), {
    headers: authHeaders(token),
  });

  return handleResponse<SearchFilesResponse>(res, { logoutOnUnauthorized: true });
}

// ─── Rename / Move API ──────────────────────────────────────────────────────

export async function apiRenameObject(
  bucket: string,
  token: string,
  oldPath: string,
  newPath: string,
  isFolder: boolean,
): Promise<void> {
  const res = await fetch(
    `${API_BASE_URL}/bucket/${encodeURIComponent(bucket)}/rename`,
    {
      method: 'POST',
      headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
      body: JSON.stringify({ old_path: oldPath, new_path: newPath, is_folder: isFolder }),
    },
  );
  await handleResponse<void>(res, { logoutOnUnauthorized: true });
}

export async function apiMoveObject(
  bucket: string,
  token: string,
  oldPath: string,
  newPath: string,
  isFolder: boolean,
): Promise<void> {
  const res = await fetch(
    `${API_BASE_URL}/bucket/${encodeURIComponent(bucket)}/move`,
    {
      method: 'POST',
      headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
      body: JSON.stringify({ old_path: oldPath, new_path: newPath, is_folder: isFolder }),
    },
  );
  await handleResponse<void>(res, { logoutOnUnauthorized: true });
}

// ─── Tags API ────────────────────────────────────────────────────────────────

export async function apiTagObject(
  bucket: string,
  token: string,
  objectPath: string,
  tags: string,
): Promise<void> {
  const url = new URL(
    `${API_BASE_URL}/bucket/${encodeURIComponent(bucket)}/tagObject/${encodeURIComponent(objectPath)}`,
  );
  url.searchParams.set('tags', tags);

  const res = await fetch(url.toString(), {
    method: 'PUT',
    headers: authHeaders(token),
  });
  await handleResponse<void>(res, { logoutOnUnauthorized: true });
}

export async function apiUntagObject(
  bucket: string,
  token: string,
  objectPath: string,
  tags: string,
): Promise<void> {
  const url = new URL(
    `${API_BASE_URL}/bucket/${encodeURIComponent(bucket)}/untagObject/${encodeURIComponent(objectPath)}`,
  );
  url.searchParams.set('tags', tags);

  const res = await fetch(url.toString(), {
    method: 'PUT',
    headers: authHeaders(token),
  });
  await handleResponse<void>(res, { logoutOnUnauthorized: true });
}

export interface ObjectTagsResponse {
  object: string;
  tags: string;
}

export async function apiGetObjectTags(
  bucket: string,
  token: string,
  objectPath: string,
): Promise<ObjectTagsResponse> {
  const res = await fetch(
    `${API_BASE_URL}/bucket/${encodeURIComponent(bucket)}/objectTags/${encodeURIComponent(objectPath)}`,
    { headers: authHeaders(token) },
  );
  return handleResponse<ObjectTagsResponse>(res, { logoutOnUnauthorized: true });
}

// ─── AI Analysis API ────────────────────────────────────────────────────────

export async function apiAnalyzeFile(
  bucket: string,
  token: string,
  filePath: string,
): Promise<void> {
  const res = await fetch(
    `${API_BASE_URL}/bucket/${encodeURIComponent(bucket)}/analyze/${encodeURIComponent(filePath)}`,
    {
      method: 'POST',
      headers: authHeaders(token),
    },
  );
  await handleResponse<void>(res, { logoutOnUnauthorized: true });
}

// ─── Usage API ──────────────────────────────────────────────────────────────

export interface UsageResponse {
  bucket: string;
  current: number;
  limit: number;
  percent: number;
}

export async function apiGetUsage(
  bucket: string,
  token: string,
): Promise<UsageResponse> {
  const res = await fetch(
    `${API_BASE_URL}/bucket/${encodeURIComponent(bucket)}/usage`,
    { headers: authHeaders(token) },
  );
  return handleResponse<UsageResponse>(res, { logoutOnUnauthorized: true });
}

// ─── SSE (Server-Sent Events) ───────────────────────────────────────────────

export interface AnalysisEvent {
  path: string;
  bucket: string;
  status: string;
  summary?: string;
  tags?: string[];
}

/**
 * Creates an SSE connection for real-time analysis events.
 * EventSource doesn't support custom headers, so we use token as query param
 * wrapped in a fetch-based approach.
 *
 * Returns an object with an `onEvent` callback setter and a `close` method.
 */
export function createSSEConnection(
  token: string,
  onEvent: (event: AnalysisEvent) => void,
  onError?: (error: Event) => void,
): { close: () => void } {
  // EventSource doesn't support Authorization header natively.
  // We'll use a polyfill approach with fetch + ReadableStream.
  const controller = new AbortController();

  (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/events`, {
        headers: authHeaders(token),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        if (res.status === 401) {
          emitAuthExpired();
        }
        onError?.(new Event('error'));
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6)) as AnalysisEvent;
              onEvent(data);
            } catch {
              // skip malformed events
            }
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        onError?.(new Event('error'));
      }
    }
  })();

  return {
    close: () => controller.abort(),
  };
}
