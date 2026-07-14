import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const roles = user.roles.map((r) => r.role.name);
    const payload = { sub: user.id, email: user.email, roles };
    return {
      accessToken: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles,
      },
    };
  }

  async validateUser(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles.map((r) => r.role.name),
    };
  }
}
