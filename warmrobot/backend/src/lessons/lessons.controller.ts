import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../common/constants/roles';
import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { ReorderLessonsDto } from './dto/reorder-lessons.dto';
import { SetDayTeacherAssignmentDto } from './dto/set-day-teacher-assignment.dto';
import { SetDaySubstitutionDto } from './dto/set-day-substitution.dto';
import { UpsertDayPermissionsDto } from './dto/upsert-day-permissions.dto';
import type { LessonDayIndex } from './types/lesson-schedule.types';

function parseDayIndex(raw: string, fallback = 0): LessonDayIndex {
  const di = parseInt(raw, 10);
  if (Number.isNaN(di) || di < 0 || di > 6) return fallback as LessonDayIndex;
  return di as LessonDayIndex;
}

@Controller('lessons')
@UseGuards(JwtAuthGuard)
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Get('schedule-context')
  getScheduleContext(
    @CurrentUser() user: { id: string },
    @Query('dayIndex') dayIndex: string,
  ) {
    const di = parseDayIndex(dayIndex, 0);
    return this.lessonsService.getScheduleContext(user.id, di);
  }

  @Get('permissions/:userId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  getPermissions(@Param('userId') userId: string) {
    return this.lessonsService.getUserDayPermissions(userId);
  }

  @Get()
  findAll(
    @CurrentUser() user: { id: string },
    @Query('dayIndex') dayIndex?: string,
  ) {
    if (dayIndex !== undefined && dayIndex !== '') {
      const di = parseInt(dayIndex, 10);
      if (!Number.isNaN(di)) {
        return this.lessonsService.findAllByDay(di, user.id);
      }
    }
    return this.lessonsService.findAll(user.id);
  }

  @Post()
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateLessonDto) {
    return this.lessonsService.create(user.id, dto);
  }

  @Patch('reorder')
  reorder(@CurrentUser() user: { id: string }, @Body() dto: ReorderLessonsDto) {
    return this.lessonsService.reorder(user.id, dto);
  }

  @Patch('day-assignment/:dayIndex')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  setDayAssignment(
    @Param('dayIndex') dayIndex: string,
    @Body() dto: SetDayTeacherAssignmentDto,
  ) {
    return this.lessonsService.setDayTeacherAssignment(parseDayIndex(dayIndex), dto);
  }

  @Patch('day-substitution/:dayIndex')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  setDaySubstitution(
    @CurrentUser() user: { id: string },
    @Param('dayIndex') dayIndex: string,
    @Body() dto: SetDaySubstitutionDto,
  ) {
    return this.lessonsService.setDaySubstitution(
      user.id,
      parseDayIndex(dayIndex),
      dto,
    );
  }

  @Delete('day-substitution/:dayIndex')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  clearDaySubstitution(@Param('dayIndex') dayIndex: string) {
    return this.lessonsService.clearDaySubstitution(parseDayIndex(dayIndex));
  }

  @Patch('permissions/:userId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  upsertPermissions(
    @Param('userId') userId: string,
    @Body() dto: UpsertDayPermissionsDto,
  ) {
    return this.lessonsService.upsertUserDayPermissions(userId, dto);
  }

  @Get(':id')
  findOne(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.lessonsService.findOne(id, user.id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: UpdateLessonDto,
  ) {
    return this.lessonsService.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.lessonsService.remove(user.id, id);
  }
}
