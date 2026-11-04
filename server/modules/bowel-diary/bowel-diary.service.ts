import { Injectable, NotFoundException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { DRIZZLE_DATABASE } from '@lark-apaas/fullstack-nestjs-core';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, desc, and, gte, lte, count } from 'drizzle-orm';
import { bowelDiaryRecords, children } from '@server/database/schema';
import {
  type BowelDiaryRecord,
  type BowelDiaryTrend,
  BRISTOL_STOOL_TYPES,
  type BristolStoolType,
  type BloatingLevel,
} from '@shared/api.interface';

interface CreateRecordInput {
  childId: string;
  recordDate: string;
  bowelCount: number;
  stoolType: number;
  bloatingLevel: string;
  temperature: number;
  notes?: string;
}

@Injectable()
export class BowelDiaryService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async createRecord(data: CreateRecordInput): Promise<BowelDiaryRecord> {
    // 验证患儿存在
    const childResults = await this.db
      .select({ id: children.id })
      .from(children)
      .where(eq(children.id, data.childId))
      .limit(1);

    if (childResults.length === 0) {
      throw new NotFoundException('患儿不存在');
    }

    // upsert by childId + recordDate
    const result = await this.db
      .insert(bowelDiaryRecords)
      .values({
        childId: data.childId,
        recordDate: data.recordDate,
        bowelCount: data.bowelCount,
        stoolType: data.stoolType,
        bloatingLevel: data.bloatingLevel,
        temperature: String(data.temperature),
        notes: data.notes ?? null,
      })
      .onConflictDoUpdate({
        target: [bowelDiaryRecords.childId, bowelDiaryRecords.recordDate],
        set: {
          bowelCount: data.bowelCount,
          stoolType: data.stoolType,
          bloatingLevel: data.bloatingLevel,
          temperature: String(data.temperature),
          notes: data.notes ?? null,
        },
      })
      .returning();

    const r = result[0];
    return {
      id: r.id,
      childId: r.childId,
      recordDate: String(r.recordDate),
      bowelCount: r.bowelCount,
      stoolType: r.stoolType as BristolStoolType,
      bloatingLevel: r.bloatingLevel as BloatingLevel,
      temperature: Number(r.temperature),
      notes: r.notes ?? undefined,
      createdAt: r.createdAt.toISOString(),
    };
  }

  async getRecords(
    childId: string,
    startDate?: string,
    endDate?: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{
    items: BowelDiaryRecord[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const conditions = [eq(bowelDiaryRecords.childId, childId)];
    if (startDate) conditions.push(gte(bowelDiaryRecords.recordDate, startDate));
    if (endDate) conditions.push(lte(bowelDiaryRecords.recordDate, endDate));

    const countResult = await this.db
      .select({ count: count() })
      .from(bowelDiaryRecords)
      .where(and(...conditions));

    const total = countResult[0]?.count ?? 0;

    const records = await this.db
      .select()
      .from(bowelDiaryRecords)
      .where(and(...conditions))
      .orderBy(desc(bowelDiaryRecords.recordDate))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    const items: BowelDiaryRecord[] = records.map((r) => ({
      id: r.id,
      childId: r.childId,
      recordDate: String(r.recordDate),
      bowelCount: r.bowelCount,
      stoolType: r.stoolType as BristolStoolType,
      bloatingLevel: r.bloatingLevel as BloatingLevel,
      temperature: Number(r.temperature),
      notes: r.notes ?? undefined,
      createdAt: r.createdAt.toISOString(),
    }));

    return { items, total, page, pageSize };
  }

  async getTrend(
    childId: string,
    days: number = 30,
  ): Promise<BowelDiaryTrend> {
    // 生成过去N天的日期数组
    const dates: string[] = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }

    const startDate = dates[0];
    const endDate = dates[dates.length - 1];

    const records = await this.db
      .select()
      .from(bowelDiaryRecords)
      .where(
        and(
          eq(bowelDiaryRecords.childId, childId),
          gte(bowelDiaryRecords.recordDate, startDate),
          lte(bowelDiaryRecords.recordDate, endDate),
        ),
      )
      .orderBy(bowelDiaryRecords.recordDate);

    // 构建日期 -> 记录的映射
    const recordMap = new Map<string, typeof records[0]>();
    for (const r of records) {
      recordMap.set(String(r.recordDate), r);
    }

    const frequency: number[] = [];
    const bloating: BloatingLevel[] = [];
    const temperature: number[] = [];
    const stoolTypes: Record<BristolStoolType, number> = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0,
    };

    for (const date of dates) {
      const r = recordMap.get(date);
      if (r) {
        frequency.push(r.bowelCount);
        bloating.push(r.bloatingLevel as BloatingLevel);
        temperature.push(Number(r.temperature));
        const st = r.stoolType as BristolStoolType;
        if (st >= 1 && st <= 7) {
          stoolTypes[st] = (stoolTypes[st] ?? 0) + 1;
        }
      } else {
        frequency.push(0);
        bloating.push('none');
        temperature.push(36.5);
      }
    }

    return {
      dates,
      frequency,
      stoolTypes,
      bloating,
      temperature,
    };
  }
}
