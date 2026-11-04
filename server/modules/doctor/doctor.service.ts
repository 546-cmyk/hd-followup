import { Injectable, NotFoundException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { DRIZZLE_DATABASE } from '@lark-apaas/fullstack-nestjs-core';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import {
  eq,
  desc,
  count,
  sql,
  and,
  inArray,
  gte,
} from 'drizzle-orm';
import {
  children,
  parentUsers,
  redFlagRecords,
  bowelDiaryRecords,
  rintalaRecords,
  followupNotes,
} from '@server/database/schema';
import {
  type PatientListItem,
  type DashboardStats,
  type RiskLevel,
  type DiagnosisType,
  type RedFlagRecord,
  type BowelDiaryTrend,
  type RintalaRecord,
  type FollowupNote,
  type BristolStoolType,
  type BloatingLevel,
  type RedFlagTrendItem,
  type RintalaDistribution,
  type DashboardResponse,
  type PatientDetailResponse,
  type PatientListResponse,
  RISK_LEVELS,
} from '@shared/api.interface';

function calculateAgeMonths(birthDate: string | null | undefined): number {
  if (!birthDate) return 0;
  const birth = new Date(birthDate);
  const now = new Date();
  const months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth());
  return Math.max(0, months);
}

function calculatePostOpDays(surgeryDate: string): number {
  const surgery = new Date(surgeryDate);
  const now = new Date();
  const diffMs = now.getTime() - surgery.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

@Injectable()
export class DoctorService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async getPatients(
    doctorId: string | undefined,
    options: {
      page?: number;
      pageSize?: number;
      riskLevel?: string;
    } = {},
  ): Promise<PatientListResponse & { redCount: number; yellowCount: number; greenCount: number }> {
    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? 20;

    // 各等级计数
    const allCounts = await this.db
      .select({
        riskLevel: children.currentRiskLevel,
        count: count(),
      })
      .from(children)
      .groupBy(children.currentRiskLevel);

    let redCount = 0;
    let yellowCount = 0;
    let greenCount = 0;
    for (const row of allCounts) {
      if (row.riskLevel === 'red') redCount = Number(row.count);
      else if (row.riskLevel === 'yellow') yellowCount = Number(row.count);
      else if (row.riskLevel === 'green') greenCount = Number(row.count);
    }

    const total = redCount + yellowCount + greenCount;

    // 用条件数组构建查询
    const whereConditions = [];
    if (options.riskLevel && RISK_LEVELS.includes(options.riskLevel as any)) {
      whereConditions.push(eq(children.currentRiskLevel, options.riskLevel));
    }

    const rows = await this.db
      .select({
        id: children.id,
        childName: children.name,
        diagnosisType: children.diagnosisType,
        surgeryDate: children.surgeryDate,
        birthDate: children.birthDate,
        gender: children.gender,
        riskLevel: children.currentRiskLevel,
        latestCheckDate: children.latestCheckDate,
        parentId: children.parentId,
        parentPhone: parentUsers.phone,
        parentName: parentUsers.name,
      })
      .from(children)
      .leftJoin(parentUsers, eq(children.parentId, parentUsers.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(
        sql`CASE ${children.currentRiskLevel}
          WHEN 'red' THEN 0
          WHEN 'yellow' THEN 1
          WHEN 'green' THEN 2
          ELSE 3
        END ASC`,
        desc(children.latestCheckDate),
      )
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    // 批量查最近Rintala评分
    const childIds = rows.map((r) => r.id);
    const latestRintalaMap = new Map<string, number>();
    if (childIds.length > 0) {
      const latestScores = await this.db
        .select({
          childId: rintalaRecords.childId,
          totalScore: rintalaRecords.totalScore,
        })
        .from(rintalaRecords)
        .where(inArray(rintalaRecords.childId, childIds))
        .orderBy(desc(rintalaRecords.completedAt));

      const seen = new Set<string>();
      for (const s of latestScores) {
        if (!seen.has(s.childId)) {
          seen.add(s.childId);
          latestRintalaMap.set(s.childId, s.totalScore);
        }
      }
    }

    const items: PatientListItem[] = rows.map((r) => ({
      id: r.id,
      childName: r.childName,
      diagnosisType: r.diagnosisType as DiagnosisType,
      surgeryDate: String(r.surgeryDate),
      ageMonths: calculateAgeMonths(r.birthDate as string | null),
      gender: (r.gender as 'male' | 'female') ?? undefined,
      riskLevel: r.riskLevel as RiskLevel,
      latestCheckDate: r.latestCheckDate
        ? String(r.latestCheckDate)
        : undefined,
      parentPhone: r.parentPhone ?? '',
      parentName: r.parentName ?? undefined,
      latestRintalaScore: latestRintalaMap.get(r.id),
      postOpDays: calculatePostOpDays(String(r.surgeryDate)),
    }));

    return {
      items,
      total,
      page,
      pageSize,
      redCount,
      yellowCount,
      greenCount,
    };
  }

  async getPatientDetail(
    id: string,
    doctorId: string | undefined,
  ): Promise<PatientDetailResponse> {
    const childResults = await this.db
      .select({
        id: children.id,
        name: children.name,
        surgeryDate: children.surgeryDate,
        diagnosisType: children.diagnosisType,
        birthDate: children.birthDate,
        gender: children.gender,
        currentRiskLevel: children.currentRiskLevel,
        latestCheckDate: children.latestCheckDate,
        parentId: children.parentId,
      })
      .from(children)
      .where(eq(children.id, id))
      .limit(1);

    if (childResults.length === 0) {
      throw new NotFoundException('患儿不存在');
    }

    const child = childResults[0];

    // 查家长信息
    const parentResults = await this.db
      .select({ phone: parentUsers.phone, name: parentUsers.name })
      .from(parentUsers)
      .where(eq(parentUsers.id, child.parentId))
      .limit(1);

    const parent = parentResults[0];

    // 最近10条红旗征记录
    const redFlagRows = await this.db
      .select()
      .from(redFlagRecords)
      .where(eq(redFlagRecords.childId, id))
      .orderBy(desc(redFlagRecords.checkedAt))
      .limit(10);

    const redFlagRecordsList: RedFlagRecord[] = redFlagRows.map((r) => ({
      id: r.id,
      childId: r.childId,
      answers: r.answers as any,
      riskLevel: r.riskLevel as any,
      advice: r.advice,
      checkedAt: r.checkedAt.toISOString(),
      postOpDays: r.postOpDays,
    }));

    // 最近30天排便日记趋势
    const today = new Date();
    const dates: string[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }

    const startDateObj = new Date(dates[0]);

    const bowelRows = await this.db
      .select()
      .from(bowelDiaryRecords)
      .where(
        and(
          eq(bowelDiaryRecords.childId, id),
          gte(bowelDiaryRecords.recordDate, dates[0]),
        ),
      )
      .orderBy(bowelDiaryRecords.recordDate)
      .limit(30);

    const bowelMap = new Map<string, typeof bowelRows[0]>();
    for (const r of bowelRows) {
      bowelMap.set(String(r.recordDate), r);
    }

    const frequency: number[] = [];
    const bloating: BloatingLevel[] = [];
    const temperature: number[] = [];
    const stoolTypes: Record<BristolStoolType, number> = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0,
    };

    for (const date of dates) {
      const r = bowelMap.get(date);
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

    const bowelDiaryTrend: BowelDiaryTrend = {
      dates,
      frequency,
      stoolTypes,
      bloating,
      temperature,
    };

    // 所有Rintala评分记录
    const rintalaRows = await this.db
      .select()
      .from(rintalaRecords)
      .where(eq(rintalaRecords.childId, id))
      .orderBy(desc(rintalaRecords.completedAt));

    const rintalaRecordsList: RintalaRecord[] = rintalaRows.map((r) => ({
      id: r.id,
      childId: r.childId,
      totalScore: r.totalScore,
      level: r.level as any,
      dimensions: r.dimensions as any,
      completedAt: r.completedAt.toISOString(),
      postOpMonths: r.postOpMonths,
    }));

    // 随访备注列表
    const noteRows = await this.db
      .select()
      .from(followupNotes)
      .where(eq(followupNotes.childId, id))
      .orderBy(desc(followupNotes.createdAt));

    const followupNotesList: FollowupNote[] = noteRows.map((n) => ({
      id: n.id,
      childId: n.childId,
      doctorId: n.doctorId,
      content: n.content,
      nextFollowupDate: n.nextFollowupDate
        ? String(n.nextFollowupDate)
        : undefined,
      createdAt: n.createdAt.toISOString(),
    }));

    return {
      child: {
        id: child.id,
        name: child.name,
        surgeryDate: String(child.surgeryDate),
        diagnosisType: child.diagnosisType as DiagnosisType,
        ageMonths: calculateAgeMonths(child.birthDate as string | null),
        gender: (child.gender as 'male' | 'female') ?? undefined,
        currentRiskLevel: child.currentRiskLevel as RiskLevel,
        latestCheckDate: child.latestCheckDate
          ? String(child.latestCheckDate)
          : undefined,
        parentPhone: parent?.phone ?? '',
        parentName: parent?.name ?? '',
        postOpDays: calculatePostOpDays(String(child.surgeryDate)),
      },
      bowelDiaryTrend,
      redFlagRecords: redFlagRecordsList,
      rintalaRecords: rintalaRecordsList,
      followupNotes: followupNotesList,
    };
  }

  async getDashboard(
    doctorId: string | undefined,
  ): Promise<DashboardResponse> {
    // 各等级计数
    const allCounts = await this.db
      .select({
        riskLevel: children.currentRiskLevel,
        count: count(),
      })
      .from(children)
      .groupBy(children.currentRiskLevel);

    let redCount = 0;
    let yellowCount = 0;
    let greenCount = 0;
    for (const row of allCounts) {
      if (row.riskLevel === 'red') redCount = Number(row.count);
      else if (row.riskLevel === 'yellow') yellowCount = Number(row.count);
      else if (row.riskLevel === 'green') greenCount = Number(row.count);
    }

    const totalPatients = redCount + yellowCount + greenCount;

    const stats: DashboardStats = {
      totalPatients,
      redCount,
      yellowCount,
      greenCount,
    };

    // 最近7天红旗征趋势
    const today = new Date();
    const dates: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }

    const sevenDaysAgo = new Date(dates[0]);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const trendRows = await this.db
      .select({
        date: sql<string>`DATE(${redFlagRecords.checkedAt})`,
        riskLevel: redFlagRecords.riskLevel,
        count: count(),
      })
      .from(redFlagRecords)
      .where(gte(redFlagRecords.checkedAt, sevenDaysAgo))
      .groupBy(
        sql`DATE(${redFlagRecords.checkedAt})`,
        redFlagRecords.riskLevel,
      );

    const trendMap = new Map<string, { red: number; yellow: number; green: number }>();
    for (const date of dates) {
      trendMap.set(date, { red: 0, yellow: 0, green: 0 });
    }

    for (const row of trendRows) {
      const dateStr = String(row.date);
      const dayData = trendMap.get(dateStr);
      if (dayData) {
        const level = row.riskLevel as 'red' | 'yellow' | 'green';
        dayData[level] = Number(row.count);
      }
    }

    const redFlagTrend: RedFlagTrendItem[] = dates.map((date) => ({
      date,
      ...trendMap.get(date)!,
    }));

    // Rintala分布
    const rintalaDist = await this.db
      .select({
        level: rintalaRecords.level,
        count: count(),
      })
      .from(rintalaRecords)
      .groupBy(rintalaRecords.level);

    const rintalaDistribution: RintalaDistribution = {
      good: 0,
      fair: 0,
      poor: 0,
    };
    for (const row of rintalaDist) {
      if (row.level === 'good') rintalaDistribution.good = Number(row.count);
      else if (row.level === 'fair') rintalaDistribution.fair = Number(row.count);
      else if (row.level === 'poor') rintalaDistribution.poor = Number(row.count);
    }

    // 红色预警患儿（前5个）
    const redRows = await this.db
      .select({
        id: children.id,
        childName: children.name,
        diagnosisType: children.diagnosisType,
        surgeryDate: children.surgeryDate,
        birthDate: children.birthDate,
        gender: children.gender,
        riskLevel: children.currentRiskLevel,
        latestCheckDate: children.latestCheckDate,
        parentId: children.parentId,
        parentPhone: parentUsers.phone,
        parentName: parentUsers.name,
      })
      .from(children)
      .leftJoin(parentUsers, eq(children.parentId, parentUsers.id))
      .where(eq(children.currentRiskLevel, 'red'))
      .orderBy(desc(children.latestCheckDate))
      .limit(5);

    const redAlertPatients: PatientListItem[] = redRows.map((r) => ({
      id: r.id,
      childName: r.childName,
      diagnosisType: r.diagnosisType as DiagnosisType,
      surgeryDate: String(r.surgeryDate),
      ageMonths: calculateAgeMonths(r.birthDate as string | null),
      gender: (r.gender as 'male' | 'female') ?? undefined,
      riskLevel: 'red',
      latestCheckDate: r.latestCheckDate
        ? String(r.latestCheckDate)
        : undefined,
      parentPhone: r.parentPhone ?? '',
      parentName: r.parentName ?? undefined,
      postOpDays: calculatePostOpDays(String(r.surgeryDate)),
    }));

    return {
      stats,
      redFlagTrend,
      rintalaDistribution,
      redAlertPatients,
    };
  }

  async batchSendReminder(
    body: { childIds?: string[]; riskLevel?: string },
    doctorId: string | undefined,
  ): Promise<{ success: boolean; sentCount: number }> {
    let sentCount = 0;

    if (body.childIds && body.childIds.length > 0) {
      sentCount = body.childIds.length;
    } else if (body.riskLevel) {
      const result = await this.db
        .select({ count: count() })
        .from(children)
        .where(eq(children.currentRiskLevel, body.riskLevel));
      sentCount = Number(result[0]?.count ?? 0);
    } else {
      const result = await this.db
        .select({ count: count() })
        .from(children);
      sentCount = Number(result[0]?.count ?? 0);
    }

    return { success: true, sentCount };
  }

  async addFollowupNote(
    body: {
      childId: string;
      doctorId?: string;
      content: string;
      nextFollowupDate?: string;
    },
    doctorIdFromReq: string | undefined,
  ): Promise<FollowupNote> {
    const inserted = await this.db
      .insert(followupNotes)
      .values({
        childId: body.childId,
        doctorId: body.doctorId || doctorIdFromReq || '',
        content: body.content,
        nextFollowupDate: body.nextFollowupDate ?? null,
      })
      .returning();

    const n = inserted[0];
    return {
      id: n.id,
      childId: n.childId,
      doctorId: n.doctorId,
      content: n.content,
      nextFollowupDate: n.nextFollowupDate
        ? String(n.nextFollowupDate)
        : undefined,
      createdAt: n.createdAt.toISOString(),
    };
  }
}
