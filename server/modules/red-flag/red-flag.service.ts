import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { DRIZZLE_DATABASE } from '@lark-apaas/fullstack-nestjs-core';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, desc, and, count, sql } from 'drizzle-orm';
import { redFlagRecords, children } from '@server/database/schema';
import {
  RED_FLAG_QUESTIONS,
  type RiskLevel,
  type RedFlagRecord,
} from '@shared/api.interface';

const RISK_ADVICE: Record<RiskLevel, string> = {
  red: '⚠️ 红色预警：请立即前往医院急诊就诊！孩子可能存在术后严重并发症，切勿延误治疗。',
  yellow: '⚠️ 黄色预警：建议24小时内到医院门诊复查。请密切观察孩子的症状变化，如有加重请立即就医。',
  green: '✅ 绿色稳定：目前孩子情况良好，请继续保持良好的术后护理习惯，定期按计划随访。',
};

function calculatePostOpDays(surgeryDate: string): number {
  const surgery = new Date(surgeryDate);
  const now = new Date();
  const diffMs = now.getTime() - surgery.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

interface RedFlagAnswers {
  bloating: boolean;
  fever: boolean;
  diarrhea: boolean;
  blood: boolean;
  vomit: boolean;
  lethargy: boolean;
}

function evaluateRisk(answers: RedFlagAnswers, postOpDays: number): { riskLevel: RiskLevel; advice: string } {
  const positiveCount = Object.values(answers).filter(Boolean).length;

  // 红色预警条件1：腹胀加重 + 发热 + 腥臭味稀水便（3项）
  const redCombo1 = answers.bloating && answers.fever && answers.diarrhea;

  // 红色预警条件2：腹胀加重 + 血便 + 精神萎靡（3项）
  const redCombo2 = answers.bloating && answers.blood && answers.lethargy;

  // 红色预警条件3：术后早期1个月内出现任意2项红旗征
  const redCombo3 = postOpDays < 30 && positiveCount >= 2;

  if (redCombo1 || redCombo2 || redCombo3) {
    return { riskLevel: 'red', advice: RISK_ADVICE.red };
  }

  // 黄色预警：单项红旗征阳性
  if (positiveCount === 1) {
    return { riskLevel: 'yellow', advice: RISK_ADVICE.yellow };
  }

  // 绿色稳定：无阳性
  return { riskLevel: 'green', advice: RISK_ADVICE.green };
}

@Injectable()
export class RedFlagService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  getQuestions() {
    return RED_FLAG_QUESTIONS.map((q) => ({
      id: q.id,
      title: q.title,
      description: q.description,
    }));
  }

  async submitCheck(
    answers: RedFlagAnswers,
    childId: string,
  ): Promise<RedFlagRecord> {
    // 查找患儿信息获取手术日期
    const childResults = await this.db
      .select({
        id: children.id,
        surgeryDate: children.surgeryDate,
      })
      .from(children)
      .where(eq(children.id, childId))
      .limit(1);

    if (childResults.length === 0) {
      throw new NotFoundException('患儿不存在');
    }

    const child = childResults[0];
    const surgeryDateStr = String(child.surgeryDate);
    const postOpDays = calculatePostOpDays(surgeryDateStr);

    const { riskLevel, advice } = evaluateRisk(answers, postOpDays);

    const todayStr = new Date().toISOString().split('T')[0];

    const inserted = await this.db.transaction(async (tx) => {
      const records = await tx
        .insert(redFlagRecords)
        .values({
          childId,
          answers: answers as any,
          riskLevel,
          advice,
          postOpDays,
        })
        .returning();

      // 更新children表的current_risk_level和latest_check_date
      await tx
        .update(children)
        .set({
          currentRiskLevel: riskLevel,
          latestCheckDate: todayStr,
        })
        .where(eq(children.id, childId));

      return records[0];
    });

    return {
      id: inserted.id,
      childId: inserted.childId,
      answers: inserted.answers as any,
      riskLevel: inserted.riskLevel as any,
      advice: inserted.advice,
      checkedAt: inserted.checkedAt.toISOString(),
      postOpDays: inserted.postOpDays,
    };
  }

  async getRecords(
    childId: string,
    page: number = 1,
    pageSize: number = 10,
  ): Promise<{ items: RedFlagRecord[]; total: number; page: number; pageSize: number }> {
    const countResult = await this.db
      .select({ count: count() })
      .from(redFlagRecords)
      .where(eq(redFlagRecords.childId, childId));

    const total = countResult[0]?.count ?? 0;

    const records = await this.db
      .select()
      .from(redFlagRecords)
      .where(eq(redFlagRecords.childId, childId))
      .orderBy(desc(redFlagRecords.checkedAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    const items: RedFlagRecord[] = records.map((r) => ({
      id: r.id,
      childId: r.childId,
      answers: r.answers as any,
      riskLevel: r.riskLevel as any,
      advice: r.advice,
      checkedAt: r.checkedAt.toISOString(),
      postOpDays: r.postOpDays,
    }));

    return { items, total, page, pageSize };
  }
}
