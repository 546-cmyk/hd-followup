import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { DRIZZLE_DATABASE } from '@lark-apaas/fullstack-nestjs-core';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, desc, count } from 'drizzle-orm';
import { rintalaRecords, children } from '@server/database/schema';
import {
  RINTALA_DIMENSIONS,
  RINTALA_DIMENSION_LABELS,
  RINTALA_DIMENSION_MAX_SCORES,
  type RintalaDimension,
  type RintalaRecord,
  type RintalaLevel,
} from '@shared/api.interface';

function calculateLevel(totalScore: number): RintalaLevel {
  if (totalScore >= 17) return 'good';
  if (totalScore >= 12) return 'fair';
  return 'poor';
}

function calculatePostOpMonths(surgeryDate: string): number {
  const surgery = new Date(surgeryDate);
  const now = new Date();
  const months =
    (now.getFullYear() - surgery.getFullYear()) * 12 +
    (now.getMonth() - surgery.getMonth());
  return Math.max(0, months);
}

@Injectable()
export class RintalaService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  getQuestions() {
    return RINTALA_DIMENSIONS.map((dim) => ({
      id: dim,
      name: RINTALA_DIMENSION_LABELS[dim],
      maxScore: RINTALA_DIMENSION_MAX_SCORES[dim],
    }));
  }

  async submit(
    answers: Record<RintalaDimension, number>,
    childId: string,
  ): Promise<RintalaRecord> {
    // 验证患儿存在
    const childResults = await this.db
      .select({ id: children.id, surgeryDate: children.surgeryDate })
      .from(children)
      .where(eq(children.id, childId))
      .limit(1);

    if (childResults.length === 0) {
      throw new NotFoundException('患儿不存在');
    }

    const child = childResults[0];

    // 计算总分
    let totalScore = 0;
    for (const dim of RINTALA_DIMENSIONS) {
      const score = answers[dim] ?? 0;
      if (score < 0 || score > RINTALA_DIMENSION_MAX_SCORES[dim]) {
        throw new BadRequestException(
          `${RINTALA_DIMENSION_LABELS[dim]}得分超出范围`,
        );
      }
      totalScore += score;
    }

    const level = calculateLevel(totalScore);
    const postOpMonths = calculatePostOpMonths(String(child.surgeryDate));

    // 查询上一次评分
    const lastRecords = await this.db
      .select({ totalScore: rintalaRecords.totalScore })
      .from(rintalaRecords)
      .where(eq(rintalaRecords.childId, childId))
      .orderBy(desc(rintalaRecords.completedAt))
      .limit(1);

    const lastScore = lastRecords[0]?.totalScore;

    // 保存新记录
    const inserted = await this.db
      .insert(rintalaRecords)
      .values({
        childId,
        totalScore,
        level,
        dimensions: answers as any,
        postOpMonths,
      })
      .returning();

    const record = inserted[0];

    return {
      id: record.id,
      childId: record.childId,
      totalScore: record.totalScore,
      level: record.level as any,
      dimensions: record.dimensions as any,
      completedAt: record.completedAt.toISOString(),
      postOpMonths: record.postOpMonths,
      declineFromLast:
        lastScore !== undefined ? lastScore - totalScore : undefined,
    };
  }

  async getRecords(
    childId: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{
    items: RintalaRecord[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const countResult = await this.db
      .select({ count: count() })
      .from(rintalaRecords)
      .where(eq(rintalaRecords.childId, childId));

    const total = countResult[0]?.count ?? 0;

    const records = await this.db
      .select()
      .from(rintalaRecords)
      .where(eq(rintalaRecords.childId, childId))
      .orderBy(desc(rintalaRecords.completedAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    const items: RintalaRecord[] = records.map((r) => ({
      id: r.id,
      childId: r.childId,
      totalScore: r.totalScore,
      level: r.level as any,
      dimensions: r.dimensions as any,
      completedAt: r.completedAt.toISOString(),
      postOpMonths: r.postOpMonths,
    }));

    return { items, total, page, pageSize };
  }
}
