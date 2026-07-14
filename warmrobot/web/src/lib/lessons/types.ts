export type LessonDayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface LessonDayPermissionEntry {
  dayIndex: number;
  canCreate: boolean;
  canEdit: boolean;
  canDeleteOthers: boolean;
}

export interface ScheduleContext {
  dayIndex: LessonDayIndex;
  role: 'admin' | 'moderator' | 'teacher' | 'guest';
  baseTeacherId: string | null;
  substituteTeacherId: string | null;
  activeTeacherId: string | null;
  isBaseTeacher: boolean;
  isSubstituteTeacher: boolean;
  isSubstitutionDay: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDeleteOthers: boolean;
}

export interface LessonWithFlags {
  id: string;
  dayIndex: number;
  order: number;
  title: string;
  goal: string | null;
  teacherId: string | null;
  createdByUserId: string | null;
  canEdit: boolean;
  canDelete: boolean;
  isOwn: boolean;
  isSubstitutionDay?: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  roles: string[];
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}
