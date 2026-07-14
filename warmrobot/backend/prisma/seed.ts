import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const roles = ['admin', 'moderator', 'teacher', 'parent'];
  for (const name of roles) {
    await prisma.role.upsert({
      where: { name },
      create: { name },
      update: {},
    });
  }

  const adminRole = await prisma.role.findUniqueOrThrow({ where: { name: 'admin' } });
  const teacherRole = await prisma.role.findUniqueOrThrow({ where: { name: 'teacher' } });

  const passwordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    create: {
      email: 'admin@example.com',
      passwordHash,
      name: 'Admin',
      roles: { create: [{ roleId: adminRole.id }] },
    },
    update: {},
  });

  const teacherA = await prisma.user.upsert({
    where: { email: 'teacher-a@example.com' },
    create: {
      email: 'teacher-a@example.com',
      passwordHash,
      name: 'Teacher A',
      roles: { create: [{ roleId: teacherRole.id }] },
    },
    update: {},
  });

  const teacherB = await prisma.user.upsert({
    where: { email: 'teacher-b@example.com' },
    create: {
      email: 'teacher-b@example.com',
      passwordHash,
      name: 'Teacher B',
      roles: { create: [{ roleId: teacherRole.id }] },
    },
    update: {},
  });

  for (let dayIndex = 0; dayIndex <= 6; dayIndex++) {
    await prisma.dayTeacherAssignment.upsert({
      where: { dayIndex },
      create: { dayIndex, baseTeacherId: teacherA.id },
      update: { baseTeacherId: teacherA.id },
    });
  }

  await prisma.dayTeacherAssignment.update({
    where: { dayIndex: 2 },
    data: { substituteTeacherId: teacherB.id, assignedByUserId: admin.id, assignedAt: new Date() },
  });

  console.log('Seed OK:', { admin: admin.email, teacherA: teacherA.email, teacherB: teacherB.email });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
