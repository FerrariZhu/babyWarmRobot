import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { UserRole } from '../common/constants/roles';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { ReorderLessonsDto } from './dto/reorder-lessons.dto';
import { SetDayTeacherAssignmentDto } from './dto/set-day-teacher-assignment.dto';
import { SetDaySubstitutionDto } from './dto/set-day-substitution.dto';
import { UpsertDayPermissionsDto } from './dto/upsert-day-permissions.dto';
import type { LessonDayIndex, LessonDayPermissionEntry } from './types/lesson-schedule.types';
import type { DayTeacherAssignment, Lesson, Prisma } from '@prisma/client';

@Injectable()
export class LessonsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  private async hasAnyRole(userId: string, roles: UserRole[]): Promise<boolean> {
    const names = await this.usersService.getRoleNames(userId);
    return roles.some((r) => names.includes(r));
  }

  async getBaseTeacherIdForDay(dayIndex: LessonDayIndex): Promise<string | null> {
    const row = await this.prisma.dayTeacherAssignment.findUnique({
      where: { dayIndex },
    });
    return row?.baseTeacherId ?? null;
  }

  async getActiveTeacherIdForDay(dayIndex: LessonDayIndex): Promise<string | null> {
    const row = await this.prisma.dayTeacherAssignment.findUnique({
      where: { dayIndex },
    });
    if (!row) return null;
    return row.substituteTeacherId ?? row.baseTeacherId;
  }

  async getScheduleContext(userId: string, dayIndex: LessonDayIndex) {
    const assignment = await this.prisma.dayTeacherAssignment.findUnique({
      where: { dayIndex },
      include: {
        baseTeacher: { select: { id: true, name: true, email: true } },
        substituteTeacher: { select: { id: true, name: true, email: true } },
      },
    });

    const roleNames = await this.usersService.getRoleNames(userId);
    const isAdmin = roleNames.includes(UserRole.ADMIN);
    const isModerator = roleNames.includes(UserRole.MODERATOR);
    const role: 'admin' | 'moderator' | 'teacher' | 'guest' = isAdmin
      ? 'admin'
      : isModerator
        ? 'moderator'
        : roleNames.includes(UserRole.TEACHER)
          ? 'teacher'
          : 'guest';

    const baseTeacherId = assignment?.baseTeacherId ?? null;
    const substituteTeacherId = assignment?.substituteTeacherId ?? null;
    const activeTeacherId =
      substituteTeacherId ?? baseTeacherId;

    const isBaseTeacher = baseTeacherId === userId;
    const isSubstituteTeacher = substituteTeacherId === userId;
    const isSubstitutionDay = isSubstituteTeacher;

    let canCreate = false;
    let canEdit = false;
    let canDeleteOthers = false;

    if (isAdmin || isModerator) {
      canCreate = true;
      canEdit = true;
      canDeleteOthers = true;
    } else if (isBaseTeacher) {
      const perms = await this.getUserDayPermissions(userId);
      const dayPerm = perms.find((p) => p.dayIndex === dayIndex);
      canCreate = dayPerm?.canCreate ?? true;
      canEdit = dayPerm?.canEdit ?? true;
      canDeleteOthers = dayPerm?.canDeleteOthers ?? true;
    } else if (isSubstituteTeacher) {
      canCreate = true;
      canEdit = true;
      canDeleteOthers = true;
    }

    return {
      dayIndex,
      role,
      baseTeacherId,
      substituteTeacherId,
      activeTeacherId,
      isBaseTeacher,
      isSubstituteTeacher,
      isSubstitutionDay,
      canCreate,
      canEdit,
      canDeleteOthers,
      assignment,
    };
  }

  async canCreateOnDay(userId: string, dayIndex: LessonDayIndex): Promise<boolean> {
    const ctx = await this.getScheduleContext(userId, dayIndex);
    return ctx.canCreate;
  }

  async canManageLessons(userId: string, dayIndex: LessonDayIndex): Promise<boolean> {
    const ctx = await this.getScheduleContext(userId, dayIndex);
    return ctx.role === 'admin' || ctx.role === 'moderator' || ctx.canCreate || ctx.canEdit;
  }

  async canEditOrDeleteAnyLessonOnDay(userId: string, dayIndex: LessonDayIndex): Promise<boolean> {
    const ctx = await this.getScheduleContext(userId, dayIndex);
    return ctx.role === 'admin' || ctx.role === 'moderator' || ctx.canEdit;
  }

  async canEditLesson(
    userId: string,
    lesson: Pick<Lesson, 'teacherId' | 'createdByUserId' | 'dayIndex'>,
  ): Promise<boolean> {
    if (await this.hasAnyRole(userId, [UserRole.ADMIN, UserRole.MODERATOR])) return true;

    const dayIndex = lesson.dayIndex as LessonDayIndex;
    const ctx = await this.getScheduleContext(userId, dayIndex);
    if (!ctx.canEdit) return false;

    if (ctx.isSubstituteTeacher) return true;

    const baseTeacherId = await this.getBaseTeacherIdForDay(dayIndex);
    if (!baseTeacherId || baseTeacherId !== userId) return false;

    return !lesson.teacherId || lesson.teacherId === userId;
  }

  async canDeleteLesson(
    userId: string,
    lesson: Pick<Lesson, 'teacherId' | 'createdByUserId' | 'dayIndex'>,
  ): Promise<boolean> {
    if (await this.hasAnyRole(userId, [UserRole.ADMIN, UserRole.MODERATOR])) return true;

    const dayIndex = lesson.dayIndex as LessonDayIndex;
    const ctx = await this.getScheduleContext(userId, dayIndex);
    if (!ctx.canEdit) return false;

    if (ctx.isSubstituteTeacher) return true;

    const baseTeacherId = await this.getBaseTeacherIdForDay(dayIndex);
    if (!baseTeacherId || baseTeacherId !== userId) return false;

    return true;
  }

  async hasActiveSubstitution(userId: string, dayIndex: LessonDayIndex): Promise<boolean> {
    const assignment = await this.prisma.dayTeacherAssignment.findUnique({
      where: { dayIndex },
    });
    if (!assignment?.substituteTeacherId) return false;
    return assignment.substituteTeacherId === userId;
  }

  async isSubstitutionTeacherOnDay(userId: string, dayIndex: LessonDayIndex): Promise<boolean> {
    return this.hasActiveSubstitution(userId, dayIndex);
  }

  async isSubstituteForDay(userId: string, dayIndex: LessonDayIndex): Promise<boolean> {
    return this.hasActiveSubstitution(userId, dayIndex);
  }

  async getLessonsWithContext(dayIndex?: LessonDayIndex, userId?: string) {
    const where: Prisma.LessonWhereInput = dayIndex !== undefined ? { dayIndex } : {};
    const lessons = await this.prisma.lesson.findMany({
      where,
      include: { createdBy: { select: { id: true, name: true, email: true } } },
      orderBy: [{ dayIndex: 'asc' }, { order: 'asc' }],
    });

    if (!userId) {
      return lessons.map((l) => ({
        ...l,
        canEdit: false,
        canDelete: false,
        isOwn: false,
      }));
    }

    const isAdmin = await this.hasAnyRole(userId, [UserRole.ADMIN, UserRole.MODERATOR]);
    const isSubstitutionDay =
      dayIndex !== undefined ? await this.hasActiveSubstitution(userId, dayIndex) : false;

    return Promise.all(
      lessons.map(async (l) => {
        let canEdit = false;
        let canDelete = false;
        const isOwn = l.teacherId === userId;

        if (isAdmin) {
          canEdit = true;
          canDelete = true;
        } else {
          canEdit = await this.canEditLesson(userId, l);
          canDelete = await this.canDeleteLesson(userId, l);
        }

        return {
          ...l,
          canEdit,
          canDelete,
          isOwn,
          isSubstitutionDay: dayIndex !== undefined ? isSubstitutionDay : undefined,
        };
      }),
    );
  }

  async setDayTeacherAssignment(dayIndex: LessonDayIndex, dto: SetDayTeacherAssignmentDto) {
    if (dayIndex < 0 || dayIndex > 6) {
      throw new BadRequestException('dayIndex must be 0 (Mon) through 6 (Sun)');
    }

    const user = await this.prisma.user.findUnique({ where: { id: dto.baseTeacherId } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.dayTeacherAssignment.upsert({
      where: { dayIndex },
      create: { dayIndex, baseTeacherId: dto.baseTeacherId },
      update: { baseTeacherId: dto.baseTeacherId },
    });
  }

  async setDaySubstitution(
    adminUserId: string,
    dayIndex: LessonDayIndex,
    dto: SetDaySubstitutionDto,
  ) {
    if (dayIndex < 0 || dayIndex > 6) {
      throw new BadRequestException('dayIndex must be 0 (Mon) through 6 (Sun)');
    }

    const existing = await this.prisma.dayTeacherAssignment.findUnique({ where: { dayIndex } });
    if (!existing) {
      throw new BadRequestException('Спочатку призначте основного вчителя на цей день');
    }

    if (!dto.substituteTeacherId) {
      return this.prisma.dayTeacherAssignment.update({
        where: { dayIndex },
        data: {
          substituteTeacherId: null,
          assignedByUserId: adminUserId,
          assignedAt: new Date(),
        },
      });
    }

    const subUser = await this.prisma.user.findUnique({ where: { id: dto.substituteTeacherId } });
    if (!subUser) throw new NotFoundException('Substitute user not found');
    if (dto.substituteTeacherId === existing.baseTeacherId) {
      throw new BadRequestException('Замінник не може збігатися з основним вчителем');
    }

    return this.prisma.dayTeacherAssignment.update({
      where: { dayIndex },
      data: {
        substituteTeacherId: dto.substituteTeacherId,
        assignedByUserId: adminUserId,
        assignedAt: new Date(),
      },
    });
  }

  async clearDaySubstitution(dayIndex: LessonDayIndex) {
    const existing = await this.prisma.dayTeacherAssignment.findUnique({ where: { dayIndex } });
    if (!existing) {
      throw new BadRequestException('На цей день ще не призначено основного вчителя');
    }
    return this.prisma.dayTeacherAssignment.update({
      where: { dayIndex },
      data: { substituteTeacherId: null, assignedByUserId: null, assignedAt: null },
    });
  }

  async upsertUserDayPermissions(userId: string, dto: UpsertDayPermissionsDto) {
    for (const p of dto.permissions) {
      const dayIndex = Math.max(0, Math.min(6, p.dayIndex));
      await this.prisma.userDayPermission.upsert({
        where: { userId_dayIndex: { userId, dayIndex } },
        create: {
          userId,
          dayIndex,
          canCreate: p.canCreate,
          canEdit: p.canEdit,
          canDeleteOthers: p.canDeleteOthers ?? true,
        },
        update: {
          canCreate: p.canCreate,
          canEdit: p.canEdit,
          canDeleteOthers: p.canDeleteOthers ?? true,
        },
      });
    }
    return { ok: true as const };
  }

  async getUserDayPermissions(userId: string): Promise<LessonDayPermissionEntry[]> {
    const rows = await this.prisma.userDayPermission.findMany({
      where: { userId },
      orderBy: { dayIndex: 'asc' },
    });
    return rows.map((r) => ({
      dayIndex: r.dayIndex,
      canCreate: r.canCreate,
      canEdit: r.canEdit,
      canDeleteOthers: r.canDeleteOthers,
    }));
  }

  async findAllByDay(dayIndex: number, userId?: string) {
    if (dayIndex < 0 || dayIndex > 6) {
      throw new BadRequestException('dayIndex must be 0 (Mon) through 6 (Sun)');
    }
    return this.getLessonsWithContext(dayIndex as LessonDayIndex, userId);
  }

  async findAll(userId?: string) {
    return this.getLessonsWithContext(undefined, userId);
  }

  async findOne(id: string, userId?: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: { createdBy: { select: { id: true, name: true, email: true } } },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');

    const list = await this.getLessonsWithContext(lesson.dayIndex as LessonDayIndex, userId);
    const one = list.find((l) => l.id === id);
    if (!one) throw new NotFoundException('Lesson not found');
    return one;
  }

  async create(userId: string, dto: CreateLessonDto) {
    if (dto.dayIndex < 0 || dto.dayIndex > 6) {
      throw new BadRequestException('dayIndex must be 0 (Mon) through 6 (Sun)');
    }

    const dayIndex = dto.dayIndex as LessonDayIndex;
    if (!(await this.canCreateOnDay(userId, dayIndex))) {
      throw new ForbiddenException('Немає права додавати урок на цей день');
    }

    const { activeTeacherId } = await this.getScheduleContext(userId, dayIndex);
    const teacherId = dto.teacherId ?? activeTeacherId;
    if (!teacherId) {
      throw new BadRequestException('teacherId обовʼязковий');
    }

    const maxOrder = await this.prisma.lesson.aggregate({
      where: { dayIndex },
      _max: { order: true },
    });

    return this.prisma.lesson.create({
      data: {
        dayIndex,
        order: dto.order ?? (maxOrder._max.order ?? -1) + 1,
        title: dto.title,
        goal: dto.goal ?? null,
        date: dto.date ? new Date(dto.date) : null,
        block: dto.block ?? null,
        teacherId,
        createdByUserId: userId,
        ageGroup: dto.ageGroup ?? null,
        status: dto.status ?? 'planned',
        isDraft: dto.isDraft ?? false,
      },
      include: { createdBy: { select: { id: true, name: true, email: true } } },
    });
  }

  async update(userId: string, id: string, dto: UpdateLessonDto) {
    const existing = await this.prisma.lesson.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Lesson not found');

    const isAdmin = await this.hasAnyRole(userId, [UserRole.ADMIN, UserRole.MODERATOR]);
    if (!isAdmin && !(await this.canEditLesson(userId, existing))) {
      throw new ForbiddenException('Немає права редагувати цей урок');
    }

    return this.prisma.lesson.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.goal !== undefined && { goal: dto.goal }),
        ...(dto.date !== undefined && { date: dto.date ? new Date(dto.date) : null }),
        ...(dto.block !== undefined && { block: dto.block }),
        ...(dto.teacherId !== undefined && { teacherId: dto.teacherId }),
        ...(dto.order !== undefined && { order: dto.order }),
        ...(dto.ageGroup !== undefined && { ageGroup: dto.ageGroup }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.isDraft !== undefined && { isDraft: dto.isDraft }),
        ...(dto.dayIndex !== undefined &&
          dto.dayIndex >= 0 &&
          dto.dayIndex <= 6 && { dayIndex: dto.dayIndex }),
      },
      include: { createdBy: { select: { id: true, name: true, email: true } } },
    });
  }

  async reorder(userId: string, dto: ReorderLessonsDto) {
    const first = dto.items[0];
    if (!first) return { ok: true as const };
    const dayIndex = first.dayIndex as LessonDayIndex;

    if (!(await this.hasAnyRole(userId, [UserRole.ADMIN, UserRole.MODERATOR]))) {
      if (!(await this.canEditOrDeleteAnyLessonOnDay(userId, dayIndex))) {
        throw new ForbiddenException('Немає права змінювати порядок уроків на цей день');
      }
    }

    await this.prisma.$transaction(
      dto.items.map((item) =>
        this.prisma.lesson.update({
          where: { id: item.id },
          data: { order: item.order, dayIndex: item.dayIndex },
        }),
      ),
    );

    return { ok: true as const };
  }

  async remove(userId: string, id: string) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id } });
    if (!lesson) throw new NotFoundException('Lesson not found');

    if (!(await this.canDeleteLesson(userId, lesson))) {
      throw new ForbiddenException('Немає права видалити цей урок');
    }

    await this.prisma.lesson.delete({ where: { id } });
    return { ok: true as const };
  }
}
