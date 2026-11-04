import { Injectable, NotFoundException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { DRIZZLE_DATABASE } from '@lark-apaas/fullstack-nestjs-core';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, desc } from 'drizzle-orm';
import { children } from '@server/database/schema';
import type { ChildInfo } from '@shared/api.interface';

function calculateAgeMonths(birthDate: string | null | undefined): number {
  if (!birthDate) return 0;
  const birth = new Date(birthDate);
  const now = new Date();
  const months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth());
  return Math.max(0, months);
}

@Injectable()
export class ChildrenService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async getMyChild(parentId: string): Promise<ChildInfo> {
    const results = await this.db
      .select()
      .from(children)
      .where(eq(children.parentId, parentId))
      .limit(1);

    if (results.length === 0) {
      throw new NotFoundException('未找到患儿信息');
    }

    const child = results[0];
    return {
      id: child.id,
      name: child.name,
      surgeryDate: String(child.surgeryDate),
      diagnosisType: child.diagnosisType as any,
      ageMonths: calculateAgeMonths(child.birthDate as string | null),
      gender: (child.gender as 'male' | 'female') ?? undefined,
      currentRiskLevel: child.currentRiskLevel as any,
      latestCheckDate: child.latestCheckDate
        ? String(child.latestCheckDate)
        : undefined,
    };
  }

  async getChildById(childId: string): Promise<ChildInfo> {
    const results = await this.db
      .select()
      .from(children)
      .where(eq(children.id, childId))
      .limit(1);

    if (results.length === 0) {
      throw new NotFoundException('未找到患儿信息');
    }

    const child = results[0];
    return {
      id: child.id,
      name: child.name,
      surgeryDate: String(child.surgeryDate),
      diagnosisType: child.diagnosisType as any,
      ageMonths: calculateAgeMonths(child.birthDate as string | null),
      gender: (child.gender as 'male' | 'female') ?? undefined,
      currentRiskLevel: child.currentRiskLevel as any,
      latestCheckDate: child.latestCheckDate
        ? String(child.latestCheckDate)
        : undefined,
    };
  }
}
