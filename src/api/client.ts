import type {
  User,
  Project,
  EcnEcr,
  SiteVisit,
  AlternatorCatalogItem,
  InspectionAuthority,
  FormFieldConfig,
} from '../types/index.ts';
import type { TrialRecord } from '../components/TrialsMaster.tsx';
import type { DrawingItem } from '../components/DrawingsMaster.tsx';

/**
 * Thin client for the Django REST API.
 * In development Vite proxies /api to the Django server (see vite.config.ts),
 * so the browser only ever talks to one origin.
 */
const API_BASE = '/api';
const TOKEN_KEY = 'koel_marine_token';

export const AUTH_EXPIRED_EVENT = 'koel-auth-expired';

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export const tokenStore = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* storage unavailable */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* storage unavailable */
    }
  },
};

/** Turns a DRF error body ({detail} or {field: [msgs]}) into one readable line. */
function describeError(data: unknown, fallback: string): string {
  if (!data || typeof data !== 'object') return fallback;
  const body = data as Record<string, unknown>;
  if (typeof body.detail === 'string') return body.detail;
  const parts = Object.entries(body).map(([field, msgs]) => {
    const text = Array.isArray(msgs) ? msgs.join(' ') : String(msgs);
    return field === 'non_field_errors' ? text : `${field}: ${text}`;
  });
  return parts.length ? parts.join(' | ') : fallback;
}

async function request<T>(method: string, path: string, body?: unknown, opts: { auth?: boolean } = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = tokenStore.get();
  if (token && opts.auth !== false) headers.Authorization = `Token ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Cannot reach the server. Check that the backend is running.', 0, null);
  }

  if (res.status === 204) return undefined as T;

  let data: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    // An expired/invalid token on a normal call means the session is over.
    if (res.status === 401 && opts.auth !== false) {
      tokenStore.clear();
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }
    throw new ApiError(describeError(data, `Request failed (${res.status})`), res.status, data);
  }
  return data as T;
}

function resource<T extends { id: string }>(path: string) {
  return {
    list: () => request<T[]>('GET', path),
    create: (item: T | Omit<T, 'id'>) => request<T>('POST', path, item),
    update: (id: string, item: Partial<T>) => request<T>('PUT', `${path}/${encodeURIComponent(id)}`, item),
    patch: (id: string, changes: Partial<T>) => request<T>('PATCH', `${path}/${encodeURIComponent(id)}`, changes),
    remove: (id: string) => request<void>('DELETE', `${path}/${encodeURIComponent(id)}`),
  };
}

export interface CreateEcnResult {
  ecn: EcnEcr;
  project: Project | null;
  didReopen: boolean;
}

export const api = {
  auth: {
    async login(username: string, password: string): Promise<User> {
      const res = await request<{ token: string; user: User }>('POST', '/auth/login', { username, password }, { auth: false });
      tokenStore.set(res.token);
      return res.user;
    },
    me: () => request<User>('GET', '/auth/me'),
    async logout(): Promise<void> {
      try {
        await request<void>('POST', '/auth/logout');
      } catch {
        /* token may already be invalid - still sign out locally */
      }
      tokenStore.clear();
    },
  },
  users: resource<User>('/users'),
  projects: resource<Project>('/projects'),
  ecns: {
    ...resource<EcnEcr>('/ecns'),
    /** Logs the notice and applies the "re-open closed project" rule on the server. */
    log: (ecn: EcnEcr) => request<CreateEcnResult>('POST', '/ecns', ecn),
  },
  siteVisits: resource<SiteVisit>('/site-visits'),
  alternators: resource<AlternatorCatalogItem>('/alternators'),
  authorities: resource<InspectionAuthority>('/authorities'),
  formFields: resource<FormFieldConfig>('/form-fields'),
  trials: resource<TrialRecord>('/trials'),
  drawings: resource<DrawingItem>('/drawings'),
  resetSampleData: () => request<{ detail: string }>('POST', '/admin/reset-sample-data'),
};

export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Unexpected error';
}
