export type LessonDayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface LessonDayPermissionEntry {
  dayIndex: number;
  canCreate: boolean;
  canEdit: boolean;
  canDeleteOthers: boolean;
}

export interface ScheduleContextResponse {
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
