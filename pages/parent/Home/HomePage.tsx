import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@client/src/hooks/useAuth';
import {
  AlertTriangle,
  ClipboardList,
  HeartPulse,
  Calendar,
  ChevronRight,
  Thermometer,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import { childrenApi, redFlagApi, healthApi } from '@client/src/api';
import type { ChildInfo, RedFlagRecord, HealthArticle } from '@shared/api.interface';
import { RISK_LEVEL_LABELS } from '@shared/api.interface';

const ParentHomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [childInfo, setChildInfo] = useState<ChildInfo | null>(null);
  const [latestRecord, setLatestRecord] = useState<RedFlagRecord | null>(null);
  const [latestArticle, setLatestArticle] = useState<HealthArticle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      try {
        const [child, records, articles] = await Promise.all([
          childrenApi.getMyChild(user.id).catch(() => null),
          user.childId
            ? redFlagApi.getRedFlagRecords(user.childId).catch(() => [])
            : [],
          healthApi.getHealthArticles({ limit: 1 }).catch(() => []),
        ]);
        setChildInfo(child as ChildInfo | null);
        const recordList = records as RedFlagRecord[];
        if (recordList && recordList.length > 0) {
          setLatestRecord(recordList[0]);
        }
        const articleList = articles as HealthArticle[];
        if (articleList && articleList.length > 0) {
          setLatestArticle(articleList[0]);
        }
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  const quickActions = [
    {
      label: '每日红旗征自查',
      icon: AlertTriangle,
      color: 'bg-danger/10 text-danger',
      path: '/parent/red-flag',
    },
    {
      label: '排便日记',
      icon: ClipboardList,
      color: 'bg-primary/10 text-primary',
      path: '/parent/diary',
    },
    {
      label: 'Rintala评分',
      icon: HeartPulse,
      color: 'bg-success/10 text-success',
      path: '/parent/rintala',
    },
    {
      label: '复诊提醒',
      icon: Calendar,
      color: 'bg-warning/10 text-warning',
      path: '/parent/reminder',
    },
  ];

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'red':
        return <XCircle className="text-danger" size={20} />;
      case 'yellow':
        return <AlertCircle className="text-warning" size={20} />;
      default:
        return <CheckCircle2 className="text-success" size={20} />;
    }
  };

  const getRiskBgClass = (level: string) => {
    switch (level) {
      case 'red':
        return 'bg-danger/10 text-danger';
      case 'yellow':
        return 'bg-warning/10 text-warning';
      default:
        return 'bg-success/10 text-success';
    }
  };

  const displayRiskLevel = childInfo?.currentRiskLevel ?? 'green';

  return (
    <div className="p-4 space-y-4">
      {/* 顶部欢迎卡片 */}
      <div className="bg-gradient-to-br from-primary to-primary/70 rounded-2xl p-5 text-white shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm opacity-90">
              您好，{user?.name || '家长'}
            </p>
            <h2 className="text-xl font-bold mt-1">
              {childInfo?.name || user?.childName || '宝宝'} 今日状态
            </h2>
          </div>
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <Thermometer size={24} />
          </div>
        </div>
        <div
          className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium ${
            displayRiskLevel === 'red'
              ? 'bg-danger/20 text-white'
              : displayRiskLevel === 'yellow'
                ? 'bg-warning/30 text-white'
                : 'bg-white/20 text-white'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
          <span>
            {RISK_LEVEL_LABELS[displayRiskLevel as keyof typeof RISK_LEVEL_LABELS]}
          </span>
        </div>
      </div>

      {/* 快捷入口 */}
      <div className="grid grid-cols-2 gap-3">
        {quickActions.map((action) => (
          <button
            key={action.label}
            onClick={() => navigate(action.path)}
            className="bg-card rounded-xl p-4 border border-border hover:border-primary/30 active:scale-[0.98] transition-all text-left"
          >
            <div
              className={`w-11 h-11 rounded-xl ${action.color} flex items-center justify-center mb-3`}
            >
              <action.icon size={22} />
            </div>
            <div className="text-sm font-semibold">{action.label}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              立即记录 <ChevronRight size={14} />
            </div>
          </button>
        ))}
      </div>

      {/* 最近一次红旗征记录 */}
      {!loading && latestRecord && (
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold">最近自查记录</h3>
            <button
              className="text-xs text-primary flex items-center"
              onClick={() => navigate('/parent/red-flag')}
            >
              查看更多 <ChevronRight size={14} />
            </button>
          </div>
          <div
            className={`flex items-center gap-3 rounded-xl p-3 ${getRiskBgClass(
              latestRecord.riskLevel,
            )}`}
          >
            {getRiskIcon(latestRecord.riskLevel)}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">
                {RISK_LEVEL_LABELS[latestRecord.riskLevel]}
              </p>
              <p className="text-xs opacity-70 mt-0.5">
                {new Date(latestRecord.checkedAt).toLocaleDateString('zh-CN')} 检查
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 今日健康知识 */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold">今日健康知识</h3>
          <button
            className="text-xs text-primary"
            onClick={() => navigate('/parent/health')}
          >
            更多
          </button>
        </div>
        {loading ? (
          <div className="text-sm text-muted-foreground py-4 text-center">
            加载中...
          </div>
        ) : latestArticle ? (
          <div
            className="cursor-pointer hover:bg-muted/50 -mx-2 px-2 py-2 rounded-lg transition-colors"
            onClick={() => navigate('/parent/health')}
          >
            <div className="flex items-start gap-1 mb-1">
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {latestArticle.category}
              </span>
            </div>
            <h4 className="text-sm font-semibold mt-2">{latestArticle.title}</h4>
            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
              {latestArticle.summary}
            </p>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground py-4 text-center">
            暂无健康知识
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentHomePage;
