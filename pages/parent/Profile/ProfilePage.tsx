import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@client/src/hooks/useAuth';
import { childrenApi } from '@client/src/api';
import {
  LogOut,
  User,
  Calendar,
  Info,
  ChevronRight,
  Baby,
  Stethoscope,
} from 'lucide-react';
import type { ChildInfo } from '@shared/api.interface';
import { DIAGNOSIS_TYPES } from '@shared/api.interface';

const ParentProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [childInfo, setChildInfo] = useState<ChildInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const loadChild = async () => {
      try {
        const data = await childrenApi.getMyChild(user.id);
        setChildInfo(data as ChildInfo);
      } catch {
        // 忽略加载失败
      } finally {
        setLoading(false);
      }
    };
    loadChild();
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const diagnosisType = childInfo?.diagnosisType || '常见型';

  const menuItems = [
    {
      icon: Baby,
      label: '患儿姓名',
      value: childInfo?.name || user?.childName || '未设置',
    },
    {
      icon: Calendar,
      label: '手术日期',
      value: childInfo?.surgeryDate
        ? new Date(childInfo.surgeryDate).toLocaleDateString('zh-CN')
        : '未设置',
    },
    {
      icon: Stethoscope,
      label: '诊断类型',
      value: diagnosisType,
    },
    {
      icon: User,
      label: '月龄',
      value: childInfo ? `${childInfo.ageMonths} 个月` : '未设置',
    },
  ];

  return (
    <div className="p-4 space-y-4">
      {/* 用户信息卡片 */}
      <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-5 text-white shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
            <User size={28} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold truncate">
              {user?.name || '家长'}
            </h2>
            <p className="text-sm opacity-80 mt-0.5">{user?.phone || ''}</p>
          </div>
        </div>
      </div>

      {/* 患儿信息卡片 */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-3 bg-muted/30 border-b border-border">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Baby size={16} className="text-primary" />
            患儿信息
          </h3>
        </div>
        {loading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            加载中...
          </div>
        ) : (
          <div>
            {menuItems.map((item, index) => (
              <div
                key={item.label}
                className={`flex items-center justify-between px-4 py-3.5 ${
                  index !== menuItems.length - 1 ? 'border-b border-border' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={18} className="text-muted-foreground" />
                  <span className="text-sm">{item.label}</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-foreground/80">
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 关于系统 */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <button
          onClick={() => navigate('/about')}
          className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Info size={18} className="text-muted-foreground" />
            <span className="text-sm">关于本系统</span>
          </div>
          <ChevronRight size={16} className="text-muted-foreground" />
        </button>
      </div>

      {/* 退出登录 */}
      <button
        onClick={handleLogout}
        className="w-full bg-card rounded-xl border border-border py-3.5 text-sm text-danger font-medium hover:bg-destructive/5 transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
      >
        <LogOut size={18} />
        退出登录
      </button>

      {/* 版本信息 */}
      <div className="text-center text-xs text-muted-foreground pt-2 pb-4">
        HD术后随访系统 v1.0.0
      </div>
    </div>
  );
};

export default ParentProfilePage;
