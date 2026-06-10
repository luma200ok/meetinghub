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
    // ...init 를 먼저 펼치고 headers 를 마지막에 병합한다.
    // 호출자가 authHeaders 등 custom headers 를 넘길 때 'Content-Type' 이 사라져
    // 백엔드 request.get_json() 이 415(Unsupported Media Type)로 깨지던 버그 방지.
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    // HTTP 상태코드를 에러에 실어, 호출자가 메시지 문자열 매칭 대신 status 로 분기할 수 있게 한다.
    // (예: getByReservation 이 404 만 null 로 처리하고 401/403 은 throw)
    const base = error.error ?? error.message ?? res.statusText;
    // 서버가 detail(예외 타입/메시지)을 함께 주면 메시지에 덧붙여 원인 파악을 돕는다.
    const message = error.detail ? `${base} (${error.detail})` : base;
    const err = new Error(message) as Error & { status?: number };
    err.status = res.status;
    throw err;
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
