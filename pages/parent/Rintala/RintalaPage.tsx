import { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  ArrowLeft,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Minus,
  Award,
  CalendarClock,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@client/src/hooks/useAuth';
import { rintalaApi, childrenApi } from '@client/src/api';
import {
  RINTALA_DIMENSIONS,
  RINTALA_DIMENSION_LABELS,
  RINTALA_DIMENSION_MAX_SCORES,
  RINTALA_LEVEL_LABELS,
} from '@shared/api.interface';
import type {
  RintalaDimension,
  RintalaRecord,
  ChildInfo,
} from '@shared/api.interface';

// 每个维度的选项定义
const DIMENSION_OPTIONS: Record<RintalaDimension, Array<{ label: string; score: number }>> = {
  control: [
    { label: '完全不能控制', score: 0 },
    { label: '偶尔能控制', score: 1 },
    { label: '基本能控制', score: 2 },
    { label: '完全能控制', score: 3 },
  ],
  sensation: [
    { label: '完全无感知', score: 0 },
    { label: '偶尔有感知', score: 1 },
    { label: '经常有感知', score: 2 },
    { label: '完全有感知', score: 3 },
  ],
  frequency: [
    { label: '每天＞4次', score: 0 },
    { label: '每天3-4次', score: 1 },
    { label: '每天1-2次', score: 2 },
    { label: '每1-2天1次', score: 3 },
  ],
  soiling: [
    { label: '每天都有污粪', score: 0 },
    { label: '每周数次污粪', score: 1 },
    { label: '偶尔污粪', score: 2 },
    { label: '无污粪', score: 3 },
  ],
  accidental: [
    { label: '每周＞3次', score: 0 },
    { label: '每周1-3次', score: 1 },
    { label: '每月1-3次', score: 2 },
    { label: '无意外排便', score: 3 },
  ],
  constipation: [
    { label: '严重便秘', score: 0 },
    { label: '中度便秘', score: 1 },
    { label: '轻度便秘', score: 2 },
    { label: '无便秘', score: 3 },
  ],
  social: [
    { label: '严重影响社交', score: 0 },
    { label: '中度影响社交', score: 1 },
    { label: '不影响社交', score: 2 },
  ],
};

const ParentRintalaPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [childInfo, setChildInfo] = useState<ChildInfo | null>(null);
  const [records, setRecords] = useState<RintalaRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [result, setResult] = useState<RintalaRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      try {
        const [child, recs] = await Promise.all([
          childrenApi.getMyChild(user.id).catch(() => null),
          user.childId
            ? rintalaApi.getRintalaRecords(user.childId).catch(() => [])
            : [],
        ]);
        setChildInfo(child as ChildInfo | null);
        setRecords(recs as RintalaRecord[]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  // 计算总分
  const totalScore = RINTALA_DIMENSIONS.reduce(
    (sum, dim) => sum + (scores[dim] ?? 0),
    0,
  );
  const maxScore = RINTALA_DIMENSIONS.reduce(
    (sum, dim) => sum + RINTALA_DIMENSION_MAX_SCORES[dim],
    0,
  );

  const allAnswered = RINTALA_DIMENSIONS.every((dim) => scores[dim] !== undefined);

  const handleSelectScore = (dimension: string, score: number) => {
    setScores({ ...scores, [dimension]: score });
  };

  const handleSubmit = async () => {
    if (!allAnswered) return;
    setSubmitting(true);
    try {
      const data = await rintalaApi.submitRintala(user!.childId!, scores);
      setResult(data as RintalaRecord);
    } catch {
      // 本地计算兜底
      const dimensions = {} as Record<RintalaDimension, number>;
      RINTALA_DIMENSIONS.forEach((dim) => {
        dimensions[dim] = scores[dim] ?? 0;
      });

      let level: 'good' | 'fair' | 'poor' = 'poor';
      if (totalScore >= 17) level = 'good';
      else if (totalScore >= 11) level = 'fair';

      const mockRecord: RintalaRecord = {
        id: 'local',
        childId: '',
        totalScore,
        level,
        dimensions,
        completedAt: new Date().toISOString(),
        postOpMonths: childInfo
          ? Math.floor(
              (Date.now() - new Date(childInfo.surgeryDate).getTime()) /
                (30 * 24 * 60 * 60 * 1000),
            )
          : 0,
        declineFromLast: records.length > 0 ? totalScore - records[0].totalScore : undefined,
      };
      setResult(mockRecord);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setScores({});
    setResult(null);
  };

  // 上次评分距今
  const daysSinceLast = records.length > 0
    ? Math.floor(
        (Date.now() - new Date(records[0].completedAt).getTime()) /
          (24 * 60 * 60 * 1000),
      )
    : null;

  // 术后月数
  const postOpMonths = childInfo
    ? Math.floor(
        (Date.now() - new Date(childInfo.surgeryDate).getTime()) /
          (30 * 24 * 60 * 60 * 1000),
      )
    : 0;

  // 雷达图配置
  const getRadarOption = (record: RintalaRecord) => ({
    radar: {
      indicator: RINTALA_DIMENSIONS.map((dim) => ({
        name: RINTALA_DIMENSION_LABELS[dim],
        max: RINTALA_DIMENSION_MAX_SCORES[dim],
      })),
      radius: 65,
      axisName: { fontSize: 10, color: '#64748b' },
      splitArea: {
        areaStyle: {
          color: ['rgba(210, 100%, 45%, 0.02)', 'rgba(210, 100%, 45%, 0.05)'],
        },
      },
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      splitLine: { lineStyle: { color: '#e2e8f0' } },
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: RINTALA_DIMENSIONS.map(
              (dim) => record.dimensions[dim] ?? 0,
            ),
            name: '本次评分',
            areaStyle: {
              color: 'hsla(210, 100%, 45%, 0.25)',
            },
            lineStyle: {
              color: 'hsl(210 100% 45%)',
              width: 2,
            },
            itemStyle: {
              color: 'hsl(210 100% 45%)',
            },
          },
        ],
      },
    ],
  });

  // 历史折线图配置
  const getHistoryOption = () => {
    const sorted = [...records].sort(
      (a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime(),
    );
    if (result) {
      sorted.push(result);
    }
    return {
      grid: { left: 40, right: 20, top: 20, bottom: 30 },
      xAxis: {
        type: 'category',
        data: sorted.map((r, i) => `第${i + 1}次`),
        axisLabel: { fontSize: 10, color: '#94a3b8' },
        axisLine: { lineStyle: { color: '#e2e8f0' } },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 20,
        interval: 5,
        axisLabel: { fontSize: 10, color: '#94a3b8' },
        splitLine: { lineStyle: { color: '#f1f5f9' } },
      },
      series: [
        {
          data: sorted.map((r) => r.totalScore),
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { color: 'hsl(142 76% 36%)', width: 2 },
          itemStyle: { color: 'hsl(142 76% 36%)' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'hsla(142, 76%, 36%, 0.2)' },
                { offset: 1, color: 'hsla(142, 76%, 36%, 0.02)' },
              ],
            },
          },
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: { color: 'hsl(0 84% 60%)', type: 'dashed', width: 1 },
            data: [
              { yAxis: 17, label: { formatter: '良好线', fontSize: 9, color: 'hsl(142 76% 36%)' } },
            ],
          },
        },
      ],
      tooltip: {
        trigger: 'axis',
        formatter: (params: Array<{ name: string; value: number }>) => {
          const p = params[0];
          return `${p.name}<br/>总分: ${p.value} / ${maxScore}`;
        },
      },
    };
  };

  // 结果页
  if (result) {
    const levelColor =
      result.level === 'good'
        ? 'text-success'
        : result.level === 'fair'
          ? 'text-warning'
          : 'text-danger';
    const levelBg =
      result.level === 'good'
        ? 'from-success to-success/80'
        : result.level === 'fair'
          ? 'from-warning to-warning/80'
          : 'from-danger to-danger/80';

    return (
      <div>
        <header className="sticky top-0 bg-card/80 backdrop-blur-sm border-b border-border z-10">
          <div className="px-4 h-14 flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              aria-label="返回"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-base font-semibold">评分结果</h1>
          </div>
        </header>

        <div className="p-4 space-y-4">
          {/* 总分卡片 */}
          <div
            className={`bg-gradient-to-br ${levelBg} rounded-2xl p-6 text-center text-white shadow-md`}
          >
            <div className="w-16 h-16 mx-auto rounded-full bg-white/20 flex items-center justify-center mb-3">
              <Award size={32} />
            </div>
            <div className="text-5xl font-bold mb-1">
              {result.totalScore}
              <span className="text-xl font-normal opacity-80">
                /{maxScore}
              </span>
            </div>
            <p className="text-lg font-semibold mt-2">
              {RINTALA_LEVEL_LABELS[result.level]}
            </p>
            <p className="text-sm opacity-80 mt-1">
              术后第 {result.postOpMonths} 月
            </p>
          </div>

          {/* 与上次对比 */}
          {result.declineFromLast !== undefined && records.length > 0 && (
            <div
              className={`flex items-center justify-center gap-2 py-3 rounded-xl font-medium ${
                result.declineFromLast >= 0
                  ? 'bg-success/10 text-success'
                  : 'bg-danger/10 text-danger'
              }`}
            >
              {result.declineFromLast >= 0 ? (
                <TrendingUp size={20} />
              ) : (
                <TrendingDown size={20} />
              )}
              <span>
                较上次{result.declineFromLast >= 0 ? '上升' : '下降'}{' '}
                {Math.abs(result.declineFromLast)} 分
              </span>
            </div>
          )}

          {/* 雷达图 */}
          <div className="bg-card rounded-xl p-4 border border-border">
            <h3 className="text-base font-semibold mb-2">七维度分析</h3>
            <ReactECharts
              option={getRadarOption(result)}
              style={{ height: 280 }}
              opts={{ renderer: 'svg' }}
            />
          </div>

          {/* 各维度得分明细 */}
          <div className="bg-card rounded-xl p-4 border border-border">
            <h3 className="text-base font-semibold mb-3">各维度得分</h3>
            <div className="space-y-2.5">
              {RINTALA_DIMENSIONS.map((dim) => {
                const score = result.dimensions[dim] ?? 0;
                const max = RINTALA_DIMENSION_MAX_SCORES[dim];
                const percent = (score / max) * 100;
                return (
                  <div key={dim}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-foreground/80">
                        {RINTALA_DIMENSION_LABELS[dim]}
                      </span>
                      <span className="font-medium">
                        {score}/{max}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 历史趋势 */}
          {(records.length > 0 || result) && (
            <div className="bg-card rounded-xl p-4 border border-border">
              <h3 className="text-base font-semibold mb-2">历次评分趋势</h3>
              <ReactECharts
                option={getHistoryOption()}
                style={{ height: 200 }}
                opts={{ renderer: 'svg' }}
              />
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={resetForm}
              className="flex-1 bg-card border border-border rounded-xl py-3.5 text-sm font-medium hover:bg-muted/50 transition-colors"
            >
              重新评分
            </button>
            <button
              onClick={() => navigate('/parent/home')}
              className="flex-1 bg-primary text-white rounded-xl py-3.5 text-sm font-medium active:scale-[0.98] transition-transform"
            >
              返回首页
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <header className="sticky top-0 bg-card/80 backdrop-blur-sm border-b border-border z-10">
        <div className="px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            aria-label="返回"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-base font-semibold">Rintala随访问卷</h1>
        </div>
      </header>

      <div className="p-4 space-y-4 pb-28">
        {/* 顶部信息卡片 */}
        <div className="bg-gradient-to-r from-primary/10 to-success/10 rounded-xl p-4 border border-primary/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm">
              <CalendarClock className="text-primary" size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground">
                术后第 <span className="font-bold text-primary text-lg">{postOpMonths}</span> 月
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {daysSinceLast !== null
                  ? `距离上次评分 ${daysSinceLast} 天`
                  : '尚未进行过评分'}
              </p>
            </div>
          </div>
        </div>

        {/* 7个维度评分题 */}
        {RINTALA_DIMENSIONS.map((dim, dimIndex) => (
          <div
            key={dim}
            className="bg-card rounded-xl p-4 border border-border"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                  {dimIndex + 1}
                </span>
                <h3 className="text-sm font-semibold">
                  {RINTALA_DIMENSION_LABELS[dim]}
                </h3>
              </div>
              <span className="text-xs text-muted-foreground">
                满分 {RINTALA_DIMENSION_MAX_SCORES[dim]} 分
              </span>
            </div>
            <div className="space-y-2">
              {DIMENSION_OPTIONS[dim].map((opt) => (
                <button
                  key={opt.score}
                  onClick={() => handleSelectScore(dim, opt.score)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all text-sm ${
                    scores[dim] === opt.score
                      ? 'border-primary bg-primary/5 font-medium text-primary'
                      : 'border-border bg-muted/30 hover:bg-muted/60 text-foreground/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{opt.label}</span>
                    <span
                      className={`text-xs font-bold ${
                        scores[dim] === opt.score
                          ? 'text-primary'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {opt.score}分
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* 历史记录入口 */}
        {records.length > 0 && (
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full bg-card rounded-xl p-4 border border-border text-left flex items-center justify-between"
          >
            <span className="text-sm font-medium">历史评分记录</span>
            <span className="text-xs text-muted-foreground">
              共 {records.length} 次 {showHistory ? '▲' : '▼'}
            </span>
          </button>
        )}

        {showHistory && records.length > 0 && (
          <div className="bg-card rounded-xl border border-border overflow-hidden -mt-2">
            {records.map((r, index) => (
              <div
                key={r.id}
                className={`flex items-center justify-between px-4 py-3 ${
                  index !== records.length - 1 ? 'border-b border-border' : ''
                }`}
              >
                <div>
                  <p className="text-sm font-medium">
                    第 {records.length - index} 次评分
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(r.completedAt).toLocaleDateString('zh-CN')} · 术后第{r.postOpMonths}月
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`text-base font-bold ${
                      r.level === 'good'
                        ? 'text-success'
                        : r.level === 'fair'
                          ? 'text-warning'
                          : 'text-danger'
                    }`}
                  >
                    {r.totalScore}分
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {RINTALA_LEVEL_LABELS[r.level]}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 底部固定提交栏 */}
      <div className="fixed bottom-16 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-card/95 backdrop-blur-sm border-t border-border px-4 py-3 z-40 safe-area-bottom">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="text-xs text-muted-foreground">当前总分</div>
            <div className="text-xl font-bold text-primary">
              {totalScore}
              <span className="text-sm font-normal text-muted-foreground">
                /{maxScore}
              </span>
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={!allAnswered || submitting}
            className={`px-8 py-3 rounded-xl font-semibold text-base transition-all flex items-center gap-2 ${
              allAnswered && !submitting
                ? 'bg-primary text-white active:scale-[0.98]'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
          >
            {submitting ? (
              '提交中...'
            ) : (
              <>
                <CheckCircle2 size={18} />
                提交评分
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ParentRintalaPage;
