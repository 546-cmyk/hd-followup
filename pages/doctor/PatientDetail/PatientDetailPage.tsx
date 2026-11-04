import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Calendar, User, Plus } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import {
  getDoctorPatientDetail,
  addFollowupNote,
} from '@client/src/api/doctor';
import type {
  PatientDetailResponse,
  RiskLevel,
  RedFlagRecord,
  RintalaRecord,
  FollowupNote,
  BristolStoolType,
  BloatingLevel,
} from '@shared/api.interface';
import {
  RISK_LEVEL_LABELS,
  RED_FLAG_QUESTIONS,
  BRISTOL_LABELS,
  BLOATING_LABELS,
  RINTALA_DIMENSION_LABELS,
  RINTALA_LEVEL_LABELS,
} from '@shared/api.interface';

const riskBadgeClass = (level: RiskLevel): string => {
  switch (level) {
    case 'red':
      return 'bg-danger/10 text-danger border-danger/30';
    case 'yellow':
      return 'bg-warning/10 text-warning border-warning/30';
    case 'green':
      return 'bg-success/10 text-success border-success/30';
  }
};

const riskLargeBadgeClass = (level: RiskLevel): string => {
  switch (level) {
    case 'red':
      return 'bg-danger text-white';
    case 'yellow':
      return 'bg-warning text-white';
    case 'green':
      return 'bg-success text-white';
  }
};

type TabKey = 'diary' | 'redflag' | 'rintala' | 'note';

const DoctorPatientDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<PatientDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('diary');
  const [noteContent, setNoteContent] = useState('');
  const [nextDate, setNextDate] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getDoctorPatientDetail(id);
        setData(result);
      } catch {
        // 空数据处理
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, [id]);

  const handleAddNote = async () => {
    if (!id || !noteContent.trim()) return;
    try {
      setSubmittingNote(true);
      await addFollowupNote({
        childId: id,
        content: noteContent,
        nextFollowupDate: nextDate || undefined,
      });
      setNoteContent('');
      setNextDate('');
      // 重新获取数据
      const result = await getDoctorPatientDetail(id);
      setData(result);
    } catch {
      // 错误处理
    } finally {
      setSubmittingNote(false);
    }
  };

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'diary', label: '排便日记' },
    { key: 'redflag', label: '红旗征记录' },
    { key: 'rintala', label: 'Rintala评分' },
    { key: 'note', label: '随访备注' },
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-96 text-muted-foreground">
          加载中...
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/doctor/patients')}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="返回"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold">患儿详情</h1>
            <p className="text-sm text-muted-foreground mt-1">加载失败</p>
          </div>
        </div>
      </div>
    );
  }

  const { child, bowelDiaryTrend, redFlagRecords, rintalaRecords, followupNotes } = data;

  // 排便频率折线图
  const frequencyOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
    xAxis: {
      type: 'category',
      data: bowelDiaryTrend.dates.map((d) => d.slice(5)),
      axisLine: { lineStyle: { color: 'hsl(214 32% 91%)' } },
      axisLabel: { color: 'hsl(215 16% 47%)', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      name: '次数',
      nameTextStyle: { color: 'hsl(215 16% 47%)', fontSize: 11 },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: 'hsl(214 32% 91%)', type: 'dashed' } },
      axisLabel: { color: 'hsl(215 16% 47%)', fontSize: 11 },
    },
    series: [
      {
        type: 'line',
        data: bowelDiaryTrend.frequency,
        smooth: true,
        lineStyle: { color: 'hsl(210 100% 45%)', width: 2 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'hsla(210, 100%, 45%, 0.3)' },
              { offset: 1, color: 'hsla(210, 100%, 45%, 0.02)' },
            ],
          },
        },
        symbol: 'circle',
        symbolSize: 6,
        itemStyle: { color: 'hsl(210 100% 45%)' },
      },
    ],
  };

  // 体温折线图
  const tempOption = {
    tooltip: { trigger: 'axis', valueFormatter: (v: number) => `${v}℃` },
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
    xAxis: {
      type: 'category',
      data: bowelDiaryTrend.dates.map((d) => d.slice(5)),
      axisLine: { lineStyle: { color: 'hsl(214 32% 91%)' } },
      axisLabel: { color: 'hsl(215 16% 47%)', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      name: '℃',
      min: 36,
      max: 40,
      nameTextStyle: { color: 'hsl(215 16% 47%)', fontSize: 11 },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: 'hsl(214 32% 91%)', type: 'dashed' } },
      axisLabel: { color: 'hsl(215 16% 47%)', fontSize: 11 },
    },
    series: [
      {
        type: 'line',
        data: bowelDiaryTrend.temperature,
        smooth: true,
        lineStyle: { color: 'hsl(38 92% 50%)', width: 2 },
        symbol: 'circle',
        symbolSize: 6,
        itemStyle: { color: 'hsl(38 92% 50%)' },
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { color: 'hsl(0 84% 60%)', type: 'dashed' },
          data: [{ yAxis: 38.5, label: { formatter: '发热线 38.5℃', fontSize: 10, color: 'hsl(0 84% 60%)' } }],
        },
      },
    ],
  };

  // 粪便性状分布柱状图
  const stoolTypeKeys = Object.keys(bowelDiaryTrend.stoolTypes) as unknown as BristolStoolType[];
  const stoolOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 40, right: 20, top: 20, bottom: 40 },
    xAxis: {
      type: 'category',
      data: stoolTypeKeys.map((k) => BRISTOL_LABELS[k]),
      axisLine: { lineStyle: { color: 'hsl(214 32% 91%)' } },
      axisLabel: {
        color: 'hsl(215 16% 47%)',
        fontSize: 10,
        interval: 0,
        rotate: 20,
      },
    },
    yAxis: {
      type: 'value',
      name: '天数',
      nameTextStyle: { color: 'hsl(215 16% 47%)', fontSize: 11 },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: 'hsl(214 32% 91%)', type: 'dashed' } },
      axisLabel: { color: 'hsl(215 16% 47%)', fontSize: 11 },
    },
    series: [
      {
        type: 'bar',
        data: stoolTypeKeys.map((k) => bowelDiaryTrend.stoolTypes[k]),
        itemStyle: {
          color: 'hsl(210 100% 45%)',
          borderRadius: [4, 4, 0, 0],
        },
        barWidth: 20,
      },
    ],
  };

  // 腹胀程度趋势
  const bloatingValueMap: Record<BloatingLevel, number> = {
    none: 0,
    mild: 1,
    moderate: 2,
    severe: 3,
  };
  const bloatingOption = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: { dataIndex: number }[]) => {
        const idx = params[0].dataIndex;
        const level = bowelDiaryTrend.bloating[idx];
        return `${bowelDiaryTrend.dates[idx]?.slice(5) || ''}<br/>腹胀程度：${BLOATING_LABELS[level]}`;
      },
    },
    grid: { left: 50, right: 20, top: 20, bottom: 30 },
    xAxis: {
      type: 'category',
      data: bowelDiaryTrend.dates.map((d) => d.slice(5)),
      axisLine: { lineStyle: { color: 'hsl(214 32% 91%)' } },
      axisLabel: { color: 'hsl(215 16% 47%)', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 3,
      interval: 1,
      axisLine: { show: false },
      splitLine: { lineStyle: { color: 'hsl(214 32% 91%)', type: 'dashed' } },
      axisLabel: {
        color: 'hsl(215 16% 47%)',
        fontSize: 10,
        formatter: (value: number) => {
          const map: Record<number, string> = { 0: '无', 1: '轻度', 2: '中度', 3: '重度' };
          return map[value] || '';
        },
      },
    },
    series: [
      {
        type: 'line',
        data: bowelDiaryTrend.bloating.map((b) => bloatingValueMap[b]),
        step: 'end',
        lineStyle: { color: 'hsl(142 76% 36%)', width: 2 },
        areaStyle: { color: 'hsla(142, 76%, 36%, 0.1)' },
        symbol: 'circle',
        symbolSize: 6,
        itemStyle: { color: 'hsl(142 76% 36%)' },
      },
    ],
  };

  // Rintala雷达图
  const latestRintala: RintalaRecord | undefined = rintalaRecords[0];
  const radarOption = {
    tooltip: {},
    radar: {
      indicator: Object.entries(RINTALA_DIMENSION_LABELS).map(([key, label]) => ({
        name: label,
        max: key === 'social' ? 2 : 3,
      })),
      radius: '65%',
      axisName: { color: 'hsl(215 16% 47%)', fontSize: 11 },
      splitLine: { lineStyle: { color: 'hsl(214 32% 91%)' } },
      splitArea: { areaStyle: { color: ['hsl(210 40% 98%)', 'hsl(0 0% 100%)'] } },
      axisLine: { lineStyle: { color: 'hsl(214 32% 91%)' } },
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: latestRintala
              ? Object.keys(RINTALA_DIMENSION_LABELS).map(
                  (k) => latestRintala.dimensions[k as keyof typeof latestRintala.dimensions] ?? 0,
                )
              : [],
            name: '最近评分',
            areaStyle: { color: 'hsla(210, 100%, 45%, 0.3)' },
            lineStyle: { color: 'hsl(210 100% 45%)' },
            itemStyle: { color: 'hsl(210 100% 45%)' },
          },
        ],
      },
    ],
  };

  // Rintala总分趋势
  const rintalaTrendOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
    xAxis: {
      type: 'category',
      data: rintalaRecords.map((r) => r.completedAt.slice(0, 10).slice(5)),
      axisLine: { lineStyle: { color: 'hsl(214 32% 91%)' } },
      axisLabel: { color: 'hsl(215 16% 47%)', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      name: '总分',
      max: 20,
      nameTextStyle: { color: 'hsl(215 16% 47%)', fontSize: 11 },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: 'hsl(214 32% 91%)', type: 'dashed' } },
      axisLabel: { color: 'hsl(215 16% 47%)', fontSize: 11 },
    },
    series: [
      {
        type: 'line',
        data: rintalaRecords.map((r) => r.totalScore),
        smooth: true,
        lineStyle: { color: 'hsl(210 100% 45%)', width: 2 },
        symbol: 'circle',
        symbolSize: 8,
        itemStyle: { color: 'hsl(210 100% 45%)' },
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: [{ color: 'hsl(142 76% 36%)' }, { color: 'hsl(38 92% 50%)' }],
          data: [
            { yAxis: 17, label: { formatter: '良好 17+', fontSize: 10, color: 'hsl(142 76% 36%)' } },
            { yAxis: 10, label: { formatter: '一般 10+', fontSize: 10, color: 'hsl(38 92% 50%)' } },
          ],
        },
      },
    ],
  };

  const getPositiveItems = (record: RedFlagRecord): string[] => {
    return RED_FLAG_QUESTIONS.filter((q) => record.answers[q.id]).map((q) => q.title);
  };

  return (
    <div className="p-6">
      {/* 面包屑+返回 */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/doctor/patients')}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="返回"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="text-sm text-muted-foreground">
          <span className="cursor-pointer hover:text-primary" onClick={() => navigate('/doctor/patients')}>
            患者管理
          </span>
          <span className="mx-2">/</span>
          <span className="text-foreground font-medium">{child.name}</span>
        </div>
      </div>

      {/* 基本信息卡片 */}
      <div className="bg-card rounded-xl border border-border p-5 mb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
              {child.name[0]}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-bold">{child.name}</h2>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${riskLargeBadgeClass(
                    child.currentRiskLevel,
                  )}`}
                >
                  {RISK_LEVEL_LABELS[child.currentRiskLevel]}
                </span>
              </div>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User size={14} />
                  {child.gender === 'male' ? '男' : child.gender === 'female' ? '女' : '未知性别'}
                  &nbsp;·&nbsp;{child.ageMonths} 个月
                </span>
                <span className="flex items-center gap-1">
                  <Calendar size={14} />
                  {child.diagnosisType}
                </span>
                <span>手术日期：{child.surgeryDate}</span>
                <span>术后 {child.postOpDays} 天</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground mb-1">家长联系方式</div>
            <div className="flex items-center gap-2 text-base font-medium">
              <Phone size={16} className="text-primary" />
              <span>{child.parentPhone}</span>
            </div>
            <div className="text-sm text-muted-foreground mt-1">{child.parentName}</div>
          </div>
        </div>
      </div>

      {/* Tab导航 */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="border-b border-border">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-3 text-sm font-medium relative transition-colors ${
                  activeTab === tab.key
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5">
          {/* 排便日记Tab */}
          {activeTab === 'diary' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-background rounded-lg p-4 border border-border">
                  <h4 className="font-medium text-sm mb-3">近30天排便频率</h4>
                  <ReactECharts option={frequencyOption} style={{ height: 240 }} lazyUpdate />
                </div>
                <div className="bg-background rounded-lg p-4 border border-border">
                  <h4 className="font-medium text-sm mb-3">近30天体温变化</h4>
                  <ReactECharts option={tempOption} style={{ height: 240 }} lazyUpdate />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-background rounded-lg p-4 border border-border">
                  <h4 className="font-medium text-sm mb-3">粪便性状分布（近30天）</h4>
                  <ReactECharts option={stoolOption} style={{ height: 240 }} lazyUpdate />
                </div>
                <div className="bg-background rounded-lg p-4 border border-border">
                  <h4 className="font-medium text-sm mb-3">腹胀程度趋势</h4>
                  <ReactECharts option={bloatingOption} style={{ height: 240 }} lazyUpdate />
                </div>
              </div>
            </div>
          )}

          {/* 红旗征记录Tab */}
          {activeTab === 'redflag' && (
            <div className="space-y-3">
              {redFlagRecords.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  暂无红旗征自查记录
                </div>
              ) : (
                <div className="relative pl-6">
                  <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />
                  {redFlagRecords.map((record) => {
                    const positives = getPositiveItems(record);
                    const isRed = record.riskLevel === 'red';
                    return (
                      <div key={record.id} className="relative pb-5">
                        <div
                          className={`absolute -left-6 top-1.5 w-3 h-3 rounded-full border-2 border-card ${
                            isRed
                              ? 'bg-danger'
                              : record.riskLevel === 'yellow'
                              ? 'bg-warning'
                              : 'bg-success'
                          }`}
                        />
                        <div
                          className={`rounded-lg border p-4 ${
                            isRed
                              ? 'bg-danger/5 border-danger/30'
                              : 'bg-background border-border'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <span className="font-medium">{record.checkedAt.slice(0, 10)}</span>
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${riskBadgeClass(
                                  record.riskLevel,
                                )}`}
                              >
                                {RISK_LEVEL_LABELS[record.riskLevel]}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                术后 {record.postOpDays} 天
                              </span>
                            </div>
                          </div>
                          <div className="text-sm mb-2">
                            <span className="text-muted-foreground">阳性项：</span>
                            {positives.length === 0 ? (
                              <span className="text-success">无阳性体征</span>
                            ) : (
                              <span
                                className={isRed ? 'text-danger' : 'text-warning'}
                              >
                                {positives.join('、')}
                              </span>
                            )}
                          </div>
                          <div className="text-sm">
                            <span className="text-muted-foreground">处置建议：</span>
                            <span>{record.advice || '继续观察'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Rintala评分Tab */}
          {activeTab === 'rintala' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-background rounded-lg p-4 border border-border">
                  <h4 className="font-medium text-sm mb-3">
                    最近一次Rintala评分
                    {latestRintala && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {latestRintala.completedAt.slice(0, 10)} · 总分 {latestRintala.totalScore}/20
                      </span>
                    )}
                  </h4>
                  <ReactECharts option={radarOption} style={{ height: 280 }} lazyUpdate />
                </div>
                <div className="bg-background rounded-lg p-4 border border-border">
                  <h4 className="font-medium text-sm mb-3">历次评分总分趋势</h4>
                  <ReactECharts option={rintalaTrendOption} style={{ height: 280 }} lazyUpdate />
                </div>
              </div>

              <div className="bg-background rounded-lg border border-border overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                  <h4 className="font-medium text-sm">历史评分记录</h4>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/30 text-muted-foreground">
                      <th className="text-left px-4 py-2 font-medium">评估日期</th>
                      <th className="text-left px-4 py-2 font-medium">总分</th>
                      <th className="text-left px-4 py-2 font-medium">等级</th>
                      <th className="text-left px-4 py-2 font-medium">术后阶段</th>
                      <th className="text-left px-4 py-2 font-medium">较上次变化</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rintalaRecords.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-8 text-center text-muted-foreground"
                        >
                          暂无Rintala评分记录
                        </td>
                      </tr>
                    ) : (
                      rintalaRecords.map((record) => (
                        <tr key={record.id} className="border-t border-border">
                          <td className="px-4 py-2.5">{record.completedAt.slice(0, 10)}</td>
                          <td className="px-4 py-2.5 font-medium">
                            {record.totalScore} / 20
                          </td>
                          <td className="px-4 py-2.5">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                record.level === 'good'
                                  ? 'bg-success/10 text-success'
                                  : record.level === 'fair'
                                  ? 'bg-warning/10 text-warning'
                                  : 'bg-danger/10 text-danger'
                              }`}
                            >
                              {RINTALA_LEVEL_LABELS[record.level]}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-muted-foreground">
                            术后 {record.postOpMonths} 个月
                          </td>
                          <td className="px-4 py-2.5">
                            {record.declineFromLast === undefined ? (
                              <span className="text-muted-foreground">首次评估</span>
                            ) : record.declineFromLast > 0 ? (
                              <span className="text-danger">下降 {record.declineFromLast} 分</span>
                            ) : record.declineFromLast < 0 ? (
                              <span className="text-success">提升 {Math.abs(record.declineFromLast)} 分</span>
                            ) : (
                              <span className="text-muted-foreground">持平</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 随访备注Tab */}
          {activeTab === 'note' && (
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <div className="bg-background rounded-lg border border-border">
                  <div className="px-4 py-3 border-b border-border">
                    <h4 className="font-medium text-sm">历史随访备注</h4>
                  </div>
                  <div className="max-h-[500px] overflow-auto">
                    {followupNotes.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground text-sm">
                        暂无随访备注
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {followupNotes.map((note: FollowupNote) => (
                          <div key={note.id} className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">医生备注</span>
                              <span className="text-xs text-muted-foreground">
                                {note.createdAt.slice(0, 10)}
                              </span>
                            </div>
                            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                              {note.content}
                            </p>
                            {note.nextFollowupDate && (
                              <div className="mt-2 text-xs text-primary flex items-center gap-1">
                                <Calendar size={12} />
                                下次复诊：{note.nextFollowupDate}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <div className="bg-background rounded-lg border border-border p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Plus size={16} className="text-primary" />
                    <h4 className="font-medium text-sm">添加随访备注</h4>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1.5">
                        备注内容
                      </label>
                      <textarea
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        rows={6}
                        placeholder="请输入随访备注内容..."
                        className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1.5">
                        下次复诊日期
                      </label>
                      <input
                        type="date"
                        value={nextDate}
                        onChange={(e) => setNextDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      />
                    </div>
                    <button
                      onClick={handleAddNote}
                      disabled={submittingNote || !noteContent.trim()}
                      className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {submittingNote ? '提交中...' : '提交备注'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorPatientDetailPage;
