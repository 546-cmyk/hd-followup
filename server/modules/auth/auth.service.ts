import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DRIZZLE_DATABASE } from '@lark-apaas/fullstack-nestjs-core';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { parentUsers, children, doctorUsers } from '@server/database/schema';
import type { ParentUser, DoctorUser } from '@shared/api.interface';

export interface AuthResult<T> {
  token: string;
  user: T;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
    private readonly jwtService: JwtService,
  ) {}

  async parentLogin(phone: string, password: string): Promise<AuthResult<ParentUser>> {
    const results = await this.db
      .select({
        id: parentUsers.id,
        phone: parentUsers.phone,
        name: parentUsers.name,
        password: parentUsers.password,
      })
      .from(parentUsers)
      .where(eq(parentUsers.phone, phone))
      .limit(1);

    if (results.length === 0) {
      throw new UnauthorizedException('手机号或密码错误');
    }
    const user = results[0];
    if (user.password !== password) {
      throw new UnauthorizedException('手机号或密码错误');
    }

    const childResults = await this.db
      .select({ id: children.id, name: children.name })
      .from(children)
      .where(eq(children.parentId, user.id))
      .limit(1);

    const child = childResults[0];
    const userData: ParentUser = {
      id: user.id,
      phone: user.phone,
      name: user.name,
      childId: child?.id ?? '',
      childName: child?.name ?? '',
      role: 'parent',
    };
    const token = this.jwtService.sign({
      sub: user.id,
      phone: user.phone,
      name: user.name,
      role: 'parent',
    });
    return { token, user: userData };
  }

  async parentRegister(data: {
    phone: string;
    password: string;
    childName: string;
    surgeryDate: string;
    diagnosisType: string;
    contactName: string;
  }): Promise<AuthResult<ParentUser>> {
    const existing = await this.db
      .select({ id: parentUsers.id })
      .from(parentUsers)
      .where(eq(parentUsers.phone, data.phone))
      .limit(1);

    if (existing.length > 0) {
      throw new BadRequestException('该手机号已注册');
    }

    return this.db.transaction(async (tx) => {
      const insertedParents = await tx
        .insert(parentUsers)
        .values({
          phone: data.phone,
          password: data.password,
          name: data.contactName,
        })
        .returning({ id: parentUsers.id, name: parentUsers.name, phone: parentUsers.phone });

      const parent = insertedParents[0];

      const insertedChildren = await tx
        .insert(children)
        .values({
          parentId: parent.id,
          name: data.childName,
          surgeryDate: data.surgeryDate,
          diagnosisType: data.diagnosisType,
        })
        .returning({ id: children.id, name: children.name });

      const child = insertedChildren[0];

      const userData: ParentUser = {
        id: parent.id,
        phone: parent.phone,
        name: parent.name,
        childId: child.id,
        childName: child.name,
        role: 'parent',
      };
      const token = this.jwtService.sign({
        sub: parent.id,
        phone: parent.phone,
        name: parent.name,
        role: 'parent',
      });
      return { token, user: userData };
    });
  }

  async doctorLogin(phone: string, password: string): Promise<AuthResult<DoctorUser>> {
    const results = await this.db
      .select()
      .from(doctorUsers)
      .where(eq(doctorUsers.phone, phone))
      .limit(1);

    if (results.length === 0) {
      throw new UnauthorizedException('手机号或密码错误');
    }
    const user = results[0];
    if (user.password !== password) {
      throw new UnauthorizedException('手机号或密码错误');
    }

    const userData: DoctorUser = {
      id: user.id,
      phone: user.phone,
      name: user.name,
      department: user.department ?? undefined,
      title: user.title ?? undefined,
      role: 'doctor',
    };
    const token = this.jwtService.sign({
      sub: user.id,
      phone: user.phone,
      name: user.name,
      role: 'doctor',
    });
    return { token, user: userData };
  }
}
