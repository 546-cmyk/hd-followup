import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@client/src/hooks/useAuth';
import { Stethoscope, Baby, Phone, Lock, User, Calendar, Info } from 'lucide-react';

type TabType = 'parent' | 'doctor';

const LoginPage = () => {
  const [tab, setTab] = useState<TabType>('parent');
  const [isRegister, setIsRegister] = useState(false);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [childName, setChildName] = useState('');
  const [surgeryDate, setSurgeryDate] = useState('');
  const [diagnosisType, setDiagnosisType] = useState('短段型');
  const [contactName, setContactName] = useState('');
  const [error, setError] = useState('');
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegister && tab === 'parent') {
        await register({ phone, password, childName, surgeryDate, diagnosisType, contactName });
        navigate('/parent/home');
      } else {
        await login(phone, password, tab);
        navigate(tab === 'parent' ? '/parent/home' : '/doctor/dashboard');
      }
    } catch (err: any) {
      if (!err.response) {
        setError('网络连接异常，请检查网络后重试');
      } else if (err.response?.status === 401) {
        setError('手机号或密码错误，请重新输入');
      } else if (err.response?.status === 403) {
        setError('安全验证失败，请刷新页面后重试');
      } else {
        setError(err.response?.data?.error?.message || '登录失败，请检查账号密码');
      }
    }
  };

  const diagnosisOptions = ['短段型', '常见型', '长段型', '全结肠型'];

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-white mb-4 shadow-lg shadow-primary/20">
            <Stethoscope size={32} />
          </div>
          <h1 className="text-2xl font-bold text-foreground">HD术后随访系统</h1>
          <p className="text-sm text-muted-foreground mt-2">先天性巨结肠术后管理平台</p>
        </div>

        <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
          <div className="flex bg-muted rounded-xl p-1 mb-6">
            <button
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === 'parent' ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground'
              }`}
              onClick={() => { setTab('parent'); setIsRegister(false); }}
            >
              <Baby size={18} />
              家长入口
            </button>
            <button
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === 'doctor' ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground'
              }`}
              onClick={() => { setTab('doctor'); setIsRegister(false); }}
            >
              <Stethoscope size={18} />
              医生入口
            </button>
          </div>

          <h2 className="text-lg font-semibold mb-4">
            {isRegister ? '家长注册' : tab === 'parent' ? '家长登录' : '医生登录'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">手机号</label>
              <div className="relative">
                <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="请输入手机号"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">密码</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  required
                />
              </div>
            </div>

            {isRegister && tab === 'parent' && (
              <>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1.5">
                    患儿姓名
                  </label>
                  <div className="relative">
                    <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={childName}
                      onChange={(e) => setChildName(e.target.value)}
                      placeholder="请输入患儿姓名"
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-1.5">
                    手术日期
                  </label>
                  <div className="relative">
                    <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="date"
                      value={surgeryDate}
                      onChange={(e) => setSurgeryDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-1.5">
                    诊断类型
                  </label>
                  <div className="relative">
                    <Info size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <select
                      value={diagnosisType}
                      onChange={(e) => setDiagnosisType(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary appearance-none"
                    >
                      {diagnosisOptions.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-1.5">
                    联系人姓名
                  </label>
                  <div className="relative">
                    <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="请输入家长姓名"
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
            >
              {isRegister ? '注册并登录' : '登 录'}
            </button>
          </form>

          {tab === 'parent' && (
            <div className="mt-4 text-center text-sm text-muted-foreground">
              {isRegister ? (
                <>
                  已有账号？
                  <button
                    className="text-primary font-medium ml-1"
                    onClick={() => setIsRegister(false)}
                  >
                    去登录
                  </button>
                </>
              ) : (
                <>
                  还没有账号？
                  <button
                    className="text-primary font-medium ml-1"
                    onClick={() => setIsRegister(true)}
                  >
                    立即注册
                  </button>
                </>
              )}
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-border text-center">
            <button
              onClick={() => navigate('/about')}
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              关于本系统 · 临床依据
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          本系统仅供健康随访参考，如有紧急情况请立即就医
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
