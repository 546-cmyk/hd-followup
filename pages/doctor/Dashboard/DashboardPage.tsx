import { useState, useEffect } from 'react';
import { Users, AlertTriangle, Activity, TrendingUp, Eye } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { useNavigate } from 'react-router-dom';
import { getDoctorDashboard } from '@client/src/api/doctor';
import type { DashboardResponse, RiskLevel } from '@shared/api.interface';
import { RISK_LEVEL_LABELS } from '@shared/api.interface';

const riskBadgeClass = (level: RiskLevel): string => {
  switch (level) {
    case 'red':
      return 'bg-danger/10 text-danger border-danger/20';
    case 'yellow':
      return 'bg-warning/10 text-warning border-warning/20';
    case 'green':
      return 'bg-success/10 text-success border-success/20';
  }
};

const DoctorDashboardPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getDoctorDashboard();
        setData(result);
      } catch (err) {
        setError('数据加载失败');
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, []);

  const trendOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: {
      data: ['红色预警', '黄色预警', '绿色稳定'],
      right: 10,
      top: 0,
      textStyle: { fontSize: 12, color: 'hsl(215 16% 47%)' },
    },
    grid: { left: 40, right: 20, top: 40, bottom: 30 },
    xAxis: {
      type: 'category',
      data: data?.redFlagTrend.map((d) => d.date.slice(5)) || [],
      axisLine: { lineStyle: { color: 'hsl(214 32% 91%)' } },
      axisLabel: { color: 'hsl(215 16% 47%)', fontSize: 12 },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: 'hsl(214 32% 91%)', type: 'dashed' } },
      axisLabel: { color: 'hsl(215 16% 47%)', fontSize: 12 },
    },
    series: [
      {
        name: '红色预警',
        type: 'bar',
        stack: 'total',
        data: data?.redFlagTrend.map((d) => d.red) || [],
        itemStyle: { color: 'hsl(0 84% 60%)' },
        barWidth: 24,
      },
      {
        name: '黄色预警',
        type: 'bar',
        stack: 'total',
        data: data?.redFlagTrend.map((d) => d.yellow) || [],
        itemStyle: { color: 'hsl(38 92% 50%)' },
      },
      {
        name: '绿色稳定',
        type: 'bar',
        stack: 'total',
        data: data?.redFlagTrend.map((d) => d.green) || [],
        itemStyle: { color: 'hsl(142 76% 36%)' },
      },
    ],
  };

  const pieOption = {
    tooltip: { trigger: 'item' },
    legend: {
      orient: 'vertical',
      right: 20,
      top: 'center',
      textStyle: { fontSize: 12, color: 'hsl(215 16% 47%)' },
    },
    series: [
      {
        name: 'Rintala评分',
        type: 'pie',
        radius: ['50%', '75%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 14, fontWeight: 'bold' },
        },
        data: [
          {
            value: data?.rintalaDistribution.good || 0,
            name: '功能良好',
            itemStyle: { color: 'hsl(142 76% 36%)' },
          },
          {
            value: data?.rintalaDistribution.fair || 0,
            name: '功能一般',
            itemStyle: { color: 'hsl(38 92% 50%)' },
          },
          {
            value: data?.rintalaDistribution.poor || 0,
            name: '功能不良',
            itemStyle: { color: 'hsl(0 84% 60%)' },
          },
        ],
      },
    ],
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-96 text-muted-foreground">
          加载中...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-96 text-danger">{error}</div>
      </div>
    );
  }

  const stats = [
    {
      label: '总患者数',
      value: data?.stats.totalPatients ?? 0,
      icon: Users,
      color: 'text-primary bg-primary/10',
    },
    {
      label: '红色预警',
      value: data?.stats.redCount ?? 0,
      icon: AlertTriangle,
      color: 'text-danger bg-danger/10',
    },
    {
      label: '黄色预警',
      value: data?.stats.yellowCount ?? 0,
      icon: Activity,
      color: 'text-warning bg-warning/10',
    },
    {
      label: '绿色稳定',
      value: data?.stats.greenCount ?? 0,
      icon: TrendingUp,
      color: 'text-success bg-success/10',
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold">数据看板</h1>
        <p className="text-sm text-muted-foreground mt-1">HD术后患儿总体随访情况</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6" data-ai-section-type="card-stat">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-card rounded-xl p-5 border border-border hover:shadow-md transition-shadow"
          >
            <div
              className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center mb-3`}
            >
              <stat.icon size={20} />
            </div>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-card rounded-xl p-5 border border-border">
          <h3 className="font-semibold mb-4">近7天红旗征趋势</h3>
          <ReactECharts option={trendOption} style={{ height: 280 }} lazyUpdate />
        </div>
        <div className="bg-card rounded-xl p-5 border border-border">
          <h3 className="font-semibold mb-4">Rintala评分分布</h3>
          <ReactECharts option={pieOption} style={{ height: 280 }} lazyUpdate />
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold">异常患儿速览</h3>
          <span className="text-xs text-muted-foreground">
            红色预警患儿共 {data?.redAlertPatients.length ?? 0} 位
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 text-muted-foreground">
                <th className="text-left px-5 py-3 font-medium">患儿姓名</th>
                <th className="text-left px-5 py-3 font-medium">风险等级</th>
                <th className="text-left px-5 py-3 font-medium">诊断类型</th>
                <th className="text-left px-5 py-3 font-medium">最近自查</th>
                <th className="text-left px-5 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {data && data.redAlertPatients.length > 0 ? (
                data.redAlertPatients.map((patient) => (
                  <tr
                    key={patient.id}
                    className="border-t border-border hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-5 py-3 font-medium">{patient.childName}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${riskBadgeClass(
                          patient.riskLevel,
                        )}`}
                      >
                        {RISK_LEVEL_LABELS[patient.riskLevel]}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {patient.diagnosisType}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {patient.latestCheckDate || '-'}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => navigate(`/doctor/patients/${patient.id}`)}
                        className="inline-flex items-center gap-1 text-primary hover:text-primary/80 text-sm font-medium"
                      >
                        <Eye size={14} />
                        查看详情
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-8 text-center text-muted-foreground text-sm"
                  >
                    暂无红色预警患儿
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboardPage;
