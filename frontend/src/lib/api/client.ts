// NEXT_PUBLIC_API_URL 은 빌드 타임에 번들로 인라인된다.
// 설정이 누락되면 과거처럼 'localhost:5000' 으로 조용히 깨지는(=배포 후에야 발견) 대신,
// 프로덕션 빌드를 명시적으로 실패시켜 배포 전에 잡는다.
function resolveApiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (url && url.length > 0) return url;

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      '[config] NEXT_PUBLIC_API_URL 이 설정되지 않았습니다. ' +
      '배포 환경(Netlify 등)에 백엔드 URL을 설정한 뒤 다시 빌드하세요. ' +
      '예: NEXT_PUBLIC_API_URL=https://<backend>.onrender.com',
    );
  }

  // 로컬 개발 기본값
  return 'http://localhost:5000';
}

const BASE_URL = resolveApiBaseUrl();

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error ?? error.message ?? res.statusText);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return res.json();
}

export function authHeaders(accessToken: string, companyId?: string): HeadersInit {
  return {
    Authorization: `Bearer ${accessToken}`,
    ...(companyId ? { 'X-Company-Id': companyId } : {}),
  };
}

export const api = {
  get:    <T>(path: string, init?: RequestInit) => request<T>(path, { method: 'GET', ...init }),
  post:   <T>(path: string, body: unknown, init?: RequestInit) => request<T>(path, { method: 'POST',  body: JSON.stringify(body), ...init }),
  put:    <T>(path: string, body: unknown, init?: RequestInit) => request<T>(path, { method: 'PUT',   body: JSON.stringify(body), ...init }),
  patch:  <T>(path: string, body: unknown, init?: RequestInit) => request<T>(path, { method: 'PATCH', body: JSON.stringify(body), ...init }),
  delete: <T>(path: string, init?: RequestInit) => request<T>(path, { method: 'DELETE', ...init }),
};
