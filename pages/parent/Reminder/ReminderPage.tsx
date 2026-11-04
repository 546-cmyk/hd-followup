import { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  ChevronRight,
  Bell,
  BookOpen,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@client/src/hooks/useAuth';
import { healthApi, childrenApi } from '@client/src/api';
import type { ChildInfo, HealthArticle } from '@shared/api.interface';

interface FollowupNode {
  month: number;
  label: string;
  items: string[];
}

const FOLLOWUP_NODES: FollowupNode[] = [
  { month: 1, label: '术后1月', items: ['肛门指检', '排便功能评估', '体重增长评估'] },
  { month: 3, label: '术后3月', items: ['肛门指检', '钡剂灌肠造影', 'Rintala评分'] },
  { month: 6, label: '术后6月', items: ['全面体检', '肠镜检查', 'Rintala评分', '营养评估'] },
  { month: 12, label: '术后12月', items: ['全面体检', '肠镜检查', 'Rintala评分', '生活质量评估'] },
  { month: 24, label: '术后2年', items: ['全面复查', '长期功能评估', 'Rintala评分'] },
  { month: 999, label: '每年随访', items: ['年度体检', '排便功能评估', '生长发育监测'] },
];

const ParentReminderPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [childInfo, setChildInfo] = useState<ChildInfo | null>(null);
  const [reminders, setReminders] = useState<HealthArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      try {
        const [child, rem] = await Promise.all([
          childrenApi.getMyChild(user.id).catch(() => null),
          healthApi.getHealthReminders().catch(() => []),
        ]);
        setChildInfo(child as ChildInfo | null);
        setReminders(rem as HealthArticle[]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  // 计算术后月数
  const postOpMonths = childInfo
    ? Math.max(
        0,
        Math.floor(
          (Date.now() - new Date(childInfo.surgeryDate).getTime()) /
            (30 * 24 * 60 * 60 * 1000),
        ),
      )
    : 0;

  // 找到当前节点和下一个节点
  const getCurrentNodeIndex = () => {
    for (let i = FOLLOWUP_NODES.length - 1; i >= 0; i--) {
      if (postOpMonths >= FOLLOWUP_NODES[i].month) {
        return i;
      }
    }
    return -1;
  };

  const currentIndex = getCurrentNodeIndex();
  const nextNode = FOLLOWUP_NODES[currentIndex + 1] || null;

  // 计算距离下次复诊还有多少天
  const getDaysUntilNext = () => {
    if (!childInfo || !nextNode || nextNode.month === 999) return null;
    const surgeryDate = new Date(childInfo.surgeryDate).getTime();
    const nextDate = surgeryDate + nextNode.month * 30 * 24 * 60 * 60 * 1000;
    const diff = Math.ceil((nextDate - Date.now()) / (24 * 60 * 60 * 1000));
    return diff;
  };

  const daysUntilNext = getDaysUntilNext();

  return (
    <div className="p-4 space-y-4 pb-6">
      {/* 下次复诊倒计时大卡片 */}
      <div className="bg-gradient-to-br from-warning to-warning/80 rounded-2xl p-5 text-white shadow-md">
        <div className="flex items-center gap-2 mb-3">
          <Bell size={18} />
          <span className="text-sm font-medium">下次复诊提醒</span>
        </div>
        {nextNode ? (
          <>
            <div className="text-5xl font-bold mb-1">
              {daysUntilNext !== null && daysUntilNext > 0
                ? daysUntilNext
                : 0}
              <span className="text-lg font-normal ml-1">天</span>
            </div>
            <p className="text-base font-semibold mt-1">{nextNode.label}复诊</p>
            {childInfo && daysUntilNext !== null && (
              <p className="text-sm opacity-80 mt-1">
                预计日期：
                {new Date(
                  new Date(childInfo.surgeryDate).getTime() +
                    nextNode.month * 30 * 24 * 60 * 60 * 1000,
                ).toLocaleDateString('zh-CN')}
              </p>
            )}
            {daysUntilNext !== null && daysUntilNext <= 7 && daysUntilNext > 0 && (
              <div className="mt-3 bg-white/20 rounded-lg px-3 py-2 text-sm">
                ⚠️ 即将到来，请提前预约挂号
              </div>
            )}
            {daysUntilNext !== null && daysUntilNext < 0 && (
              <div className="mt-3 bg-white/20 rounded-lg px-3 py-2 text-sm">
                ⚠️ 已逾期 {Math.abs(daysUntilNext)} 天，请尽快就诊
              </div>
            )}
          </>
        ) : (
          <p className="text-base">进入年度随访阶段，每年复查一次</p>
        )}
      </div>

      {/* 复诊节点时间线 */}
      <div className="bg-card rounded-xl p-5 border border-border">
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Calendar size={18} className="text-primary" />
          复诊时间线
        </h3>
        <div className="relative">
          {FOLLOWUP_NODES.map((node, index) => {
            const isCompleted = postOpMonths >= node.month;
            const isCurrent =
              !isCompleted &&
              (index === 0 || postOpMonths >= FOLLOWUP_NODES[index - 1].month);
            const isNext = node === nextNode;

            return (
              <div
                key={node.month}
                className={`relative pl-8 pb-5 ${
                  index === FOLLOWUP_NODES.length - 1 ? 'pb-0' : ''
                }`}
              >
                {/* 连接线 */}
                {index < FOLLOWUP_NODES.length - 1 && (
                  <div
                    className={`absolute left-[11px] top-6 w-0.5 h-full ${
                      isCompleted ? 'bg-success' : 'bg-border'
                    }`}
                  />
                )}

                {/* 节点圆点 */}
                <div
                  className={`absolute left-0 top-0 w-6 h-6 rounded-full flex items-center justify-center z-10 ${
                    isCompleted
                      ? 'bg-success text-white'
                      : isNext
                        ? 'bg-warning text-white ring-4 ring-warning/20 animate-pulse'
                        : 'bg-muted border-2 border-border'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 size={14} />
                  ) : (
                    <Clock size={12} className={isNext ? 'text-white' : 'text-muted-foreground'} />
                  )}
                </div>

                {/* 节点内容 */}
                <div
                  className={`rounded-xl p-3 ${
                    isNext
                      ? 'bg-warning/10 border border-warning/30'
                      : isCompleted
                        ? 'bg-muted/30'
                        : 'bg-muted/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-sm font-semibold ${
                        isCompleted
                          ? 'text-foreground'
                          : isNext
                            ? 'text-warning'
                            : 'text-muted-foreground'
                      }`}
                    >
                      {node.label}
                    </span>
                    {isCompleted && (
                      <span className="text-xs text-success font-medium">已完成</span>
                    )}
                    {isNext && (
                      <span className="text-xs text-warning font-medium">下次</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {node.items.map((item) => (
                      <span
                        key={item}
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          isCompleted
                            ? 'bg-success/10 text-success'
                            : isNext
                              ? 'bg-warning/20 text-warning/90'
                              : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 健康教育推送 */}
      <div className="bg-card rounded-xl p-5 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <BookOpen size={18} className="text-primary" />
            健康提醒
          </h3>
          <button
            className="text-xs text-primary flex items-center"
            onClick={() => navigate('/parent/health')}
          >
            更多 <ChevronRight size={14} />
          </button>
        </div>

        {loading ? (
          <div className="text-sm text-muted-foreground py-4 text-center">
            加载中...
          </div>
        ) : reminders.length > 0 ? (
          <div className="space-y-3">
            {reminders.slice(0, 3).map((article) => (
              <div
                key={article.id}
                className="flex gap-3 p-3 rounded-xl hover:bg-muted/50 cursor-pointer transition-colors -mx-2"
                onClick={() => navigate('/parent/health')}
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 text-2xl">
                  📖
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium line-clamp-1">
                    {article.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {article.summary}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground py-4 text-center">
            暂无健康提醒
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentReminderPage;
