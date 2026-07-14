import type {
  LessonDayPermissionEntry,
  LessonWithFlags,
  LoginResponse,
  ScheduleContext,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_LESSONS_API_URL ?? 'http://localhost:3001';

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export async function loginLessonsApi(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error('Login failed');
  }
  return res.json();
}

export async function fetchScheduleContext(
  token: string,
  dayIndex: number,
): Promise<ScheduleContext> {
  const res = await fetch(
    `${API_BASE}/lessons/schedule-context?dayIndex=${dayIndex}`,
    { headers: authHeaders(token), cache: 'no-store' },
  );
  if (!res.ok) throw new Error('Failed to load schedule context');
  return res.json();
}

export async function fetchLessonsForDay(
  token: string,
  dayIndex: number,
): Promise<LessonWithFlags[]> {
  const res = await fetch(`${API_BASE}/lessons?dayIndex=${dayIndex}`, {
    headers: authHeaders(token),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to load lessons');
  return res.json();
}

export async function createLesson(
  token: string,
  body: { dayIndex: number; title: string; goal?: string },
): Promise<LessonWithFlags> {
  const res = await fetch(`${API_BASE}/lessons`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || 'Create failed');
  }
  return res.json();
}

export async function updateLesson(
  token: string,
  id: string,
  body: Partial<{ title: string; goal: string | null }>,
): Promise<LessonWithFlags> {
  const res = await fetch(`${API_BASE}/lessons/${id}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Update failed');
  return res.json();
}

export async function deleteLesson(token: string, id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/lessons/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Delete failed');
}

export async function fetchUserDayPermissions(
  token: string,
  userId: string,
): Promise<LessonDayPermissionEntry[]> {
  const res = await fetch(`${API_BASE}/lessons/permissions/${userId}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Failed to load permissions');
  return res.json();
}

export async function upsertUserDayPermissions(
  token: string,
  userId: string,
  permissions: LessonDayPermissionEntry[],
): Promise<void> {
  const res = await fetch(`${API_BASE}/lessons/permissions/${userId}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ permissions }),
  });
  if (!res.ok) throw new Error('Failed to save permissions');
}

export async function setDaySubstitution(
  token: string,
  dayIndex: number,
  substituteTeacherId: string | null,
): Promise<void> {
  const res = await fetch(`${API_BASE}/lessons/day-substitution/${dayIndex}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ substituteTeacherId }),
  });
  if (!res.ok) throw new Error('Failed to set substitution');
}
