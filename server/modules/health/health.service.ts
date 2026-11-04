import { Injectable, NotFoundException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { DRIZZLE_DATABASE } from '@lark-apaas/fullstack-nestjs-core';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, desc, count, ilike, and } from 'drizzle-orm';
import { healthArticles, children } from '@server/database/schema';
import type { HealthArticle } from '@shared/api.interface';

const HEALTH_TIPS = [
  '每天记录孩子的排便情况，包括次数、性状和颜色',
  '注意观察孩子的腹部是否有胀大、紧绷的情况',
  '保持规律的饮食习惯，避免暴饮暴食',
  '术后早期要特别注意体温变化，发热需及时就医',
  '按照医生指导定期扩肛，预防肛门狭窄',
  '鼓励孩子多喝水，多吃富含膳食纤维的食物',
  '注意孩子的精神状态，嗜睡或反应差需警惕',
  '保持肛周皮肤清洁干燥，预防尿布疹和皮肤破损',
];

@Injectable()
export class HealthService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async getArticles(
    page: number = 1,
    pageSize: number = 10,
    category?: string,
    keyword?: string,
  ): Promise<{ items: HealthArticle[]; total: number; page: number; pageSize: number }> {
    const conditions = [];
    if (category) {
      conditions.push(eq(healthArticles.category, category));
    }
    if (keyword) {
      conditions.push(ilike(healthArticles.title, `%${keyword}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const countQuery = this.db
      .select({ count: count() })
      .from(healthArticles);
    const countResult = whereClause
      ? countQuery.where(whereClause)
      : countQuery;
    const totalResult = await countResult;
    const total = totalResult[0]?.count ?? 0;

    const query = this.db
      .select()
      .from(healthArticles)
      .orderBy(desc(healthArticles.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    const records = whereClause ? query.where(whereClause) : query;
    const articles = await records;

    const items: HealthArticle[] = articles.map((a) => ({
      id: a.id,
      title: a.title,
      summary: a.summary ?? '',
      content: a.content,
      coverImage: a.coverImageUrl ?? undefined,
      category: a.category,
      createdAt: a.createdAt.toISOString(),
    }));

    return { items, total, page, pageSize };
  }

  async getArticleDetail(id: string): Promise<HealthArticle> {
    const results = await this.db
      .select()
      .from(healthArticles)
      .where(eq(healthArticles.id, id))
      .limit(1);

    if (results.length === 0) {
      throw new NotFoundException('文章不存在');
    }

    const a = results[0];
    return {
      id: a.id,
      title: a.title,
      summary: a.summary ?? '',
      content: a.content,
      coverImage: a.coverImageUrl ?? undefined,
      category: a.category,
      createdAt: a.createdAt.toISOString(),
    };
  }

  async getReminders(childId: string): Promise<{
    nextFollowup: { date: string; type: string } | null;
    tips: string[];
  }> {
    if (!childId) {
      return {
        nextFollowup: null,
        tips: HEALTH_TIPS.slice(0, 4),
      };
    }

    const childResults = await this.db
      .select({ surgeryDate: children.surgeryDate })
      .from(children)
      .where(eq(children.id, childId))
      .limit(1);

    let nextFollowup: { date: string; type: string } | null = null;

    if (childResults.length > 0) {
      const surgeryDate = new Date(String(childResults[0].surgeryDate));
      const now = new Date();

      // 计算下次复诊时间（术后1月、3月、6月、12月，之后每年一次）
      const followupMonths = [1, 3, 6, 12, 24, 36];
      for (const months of followupMonths) {
        const followupDate = new Date(surgeryDate);
        followupDate.setMonth(surgeryDate.getMonth() + months);
        if (followupDate > now) {
          const daysUntil = Math.ceil(
            (followupDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
          );
          const typeLabel =
            months <= 12
              ? `术后${months}个月复查`
              : `术后${Math.floor(months / 12)}年复查`;
          nextFollowup = {
            date: followupDate.toISOString().split('T')[0],
            type: typeLabel,
          };
          break;
        }
      }

      if (!nextFollowup) {
        // 超过3年后，每年一次
        const yearsSince = Math.floor(
          (now.getTime() - surgeryDate.getTime()) / (1000 * 60 * 60 * 24 * 365),
        );
        const nextYear = yearsSince + 1;
        const followupDate = new Date(surgeryDate);
        followupDate.setFullYear(surgeryDate.getFullYear() + nextYear);
        nextFollowup = {
          date: followupDate.toISOString().split('T')[0],
          type: `术后${nextYear}年复查`,
        };
      }
    }

    // 随机返回4条小贴士（演示用）
    const shuffled = [...HEALTH_TIPS].sort(() => Math.random() - 0.5);
    const tips = shuffled.slice(0, 4);

    return { nextFollowup, tips };
  }
}
