import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { roles: { include: { role: true } } },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { roles: { include: { role: true } } },
    });
  }

  async getRoleNames(userId: string): Promise<string[]> {
    const rows = await this.prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    });
    return rows.map((r) => r.role.name);
  }

  async listTeachers() {
    const teacherRole = await this.prisma.role.findUnique({ where: { name: 'teacher' } });
    if (!teacherRole) return [];
    const links = await this.prisma.userRole.findMany({
      where: { roleId: teacherRole.id },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    return links.map((l) => l.user);
  }
}
