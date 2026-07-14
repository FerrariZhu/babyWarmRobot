import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { LessonsModule } from './lessons/lessons.module';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, LessonsModule],
})
export class AppModule {}
