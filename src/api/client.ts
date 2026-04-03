const API_BASE_URL = 'http://localhost:8080';

export interface LoginResponse {
  success: boolean;
  token: string;
  userId: string;
  bucket: string;
}

export interface AuthState {
  token: string;
  userId: string;
  bucket: string;
  email: string;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `HTTP error ${response.status}`;
    try {
      const data = await response.json();
      if (typeof data?.error === 'string') {
        message = data.error;
      }
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }
  if (response.status === 204) {
    // no content
    return undefined as unknown as T;
  }
  const text = await response.text();
  if (!text) {
    return undefined as unknown as T;
  }
  return JSON.parse(text) as T;
}

export async function apiLogin(email: string, password: string): Promise<AuthState> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await handleResponse<LoginResponse>(res);

  if (!data.success || !data.token) {
    throw new Error('Не удалось выполнить вход');
  }

  return {
    token: data.token,
    userId: data.userId,
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
  }).then((res) => handleResponse<void>(res));
}

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
  };
}

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

  return handleResponse<ListFilesResponse>(res);
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

  await handleResponse<void>(res);
}

export async function apiDeleteFile(
  bucket: string,
  token: string,
  filePath: string,
): Promise<void> {
  const res = await fetch(
    `${API_BASE_URL}/bucket/${encodeURIComponent(bucket)}/deleteFile/${encodeURIComponent(
      filePath,
    )}`,
    {
      method: 'DELETE',
      headers: authHeaders(token),
    },
  );

  await handleResponse<void>(res);
}

export async function apiDeleteUser(uid: string, token: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/users/${encodeURIComponent(uid)}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });

  await handleResponse<void>(res);
}

