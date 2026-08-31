// Centralized API Client

const BASE_URL = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('nuts_pos_token');
}

export function setAuthToken(token: string): void {
  localStorage.setItem('nuts_pos_token', token);
}

export function clearAuthToken(): void {
  localStorage.removeItem('nuts_pos_token');
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string }> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, config);
    const result = await res.json();

    if (!res.ok) {
      return {
        success: false,
        message: result.message || 'خطایی در ارسال درخواست رخ داد.',
      };
    }

    return result;
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'خطای اتصال به سرور',
    };
  }
}
