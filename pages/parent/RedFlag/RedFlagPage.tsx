import { useState, useEffect } from 'react';
import { ArrowLeft, Phone, CheckCircle2, AlertCircle, XCircle, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@client/src/hooks/useAuth';
import { redFlagApi } from '@client/src/api';
import { RED_FLAG_QUESTIONS, RISK_LEVEL_LABELS } from '@shared/api.interface';
import type { RedFlagRecord, RedFlagQuestionId, RiskLevel } from '@shared/api.interface';
import { UniversalLink } from '@lark-apaas/client-toolkit/components/UniversalLink';


const QUESTION_EMOJIS: Record<string, string> = {
  bloating: '🤰',
  fever: '🌡️',
  diarrhea: '💧',
  blood: '🩸',
  vomit: '🤮',
  lethargy: '😴',
};

const ParentRedFlagPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [result, setResult] = useState<RedFlagRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showRedAlert, setShowRedAlert] = useState(false);
  const [records, setRecords] = useState<RedFlagRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(true);

  useEffect(() => {
    if (!user?.childId) return;
    const loadRecords = async () => {
      try {
        const data = await redFlagApi.getRedFlagRecords(user.childId!);
        setRecords(data as RedFlagRecord[]);
      } catch {
        // 忽略加载失败
      } finally {
        setLoadingRecords(false);
      }
    };
    loadRecords();
  }, [user?.childId]);

  const totalQuestions = RED_FLAG_QUESTIONS.length;
  const currentQuestion = RED_FLAG_QUESTIONS[currentIndex];

  const handleAnswer = (yes: boolean) => {
    const newAnswers = { ...answers, [currentQuestion.id]: yes };
    setAnswers(newAnswers);

    if (currentIndex < totalQuestions - 1) {
      setTimeout(() => setCurrentIndex(currentIndex + 1), 150);
    } else {
      // 最后一题，提交
      handleSubmit(newAnswers);
    }
  };

  const handleSubmit = async (finalAnswers: Record<string, boolean>) => {
    setSubmitting(true);
    try {
      const data = await redFlagApi.submitRedFlag(user!.childId!, finalAnswers);
      const record = data as RedFlagRecord;
      setResult(record);
      if (record.riskLevel === 'red') {
        setShowRedAlert(true);
      }
    } catch {
      // 后端还没好时，用本地计算兜底
      const positiveCount = Object.values(finalAnswers).filter(Boolean).length;
      let riskLevel: RiskLevel = 'green';
      let advice = '宝宝状态良好，继续保持日常观察即可。';
      if (positiveCount >= 3) {
        riskLevel = 'red';
        advice = '多项红旗征阳性，高度警惕小肠结肠炎可能，请立即就医！';
      } else if (positiveCount >= 1) {
        riskLevel = 'yellow';
        advice = '存在异常体征，建议密切观察，如有加重及时门诊就诊。';
      }
      const mockRecord: RedFlagRecord = {
        id: 'local',
        childId: '',
        answers: finalAnswers as Record<RedFlagQuestionId, boolean>,
        riskLevel,
        advice,
        checkedAt: new Date().toISOString(),
        postOpDays: 0,
      };
      setResult(mockRecord);
      if (riskLevel === 'red') {
        setShowRedAlert(true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const resetQuiz = () => {
    setCurrentIndex(0);
    setAnswers({});
    setResult(null);
    setShowRedAlert(false);
  };

  // 结果页
  if (result) {
    const isRed = result.riskLevel === 'red';
    const isYellow = result.riskLevel === 'yellow';

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
            <h1 className="text-base font-semibold">自查结果</h1>
          </div>
        </header>

        <div className="p-4 space-y-4">
          {/* 风险等级大卡片 */}
          <div
            className={`rounded-2xl p-6 text-center shadow-md ${
              isRed
                ? 'bg-gradient-to-br from-danger to-danger/80 text-white'
                : isYellow
                  ? 'bg-gradient-to-br from-warning to-warning/80 text-white'
                  : 'bg-gradient-to-br from-success to-success/80 text-white'
            }`}
          >
            <div className="w-20 h-20 mx-auto rounded-full bg-white/20 flex items-center justify-center mb-4">
              {isRed ? (
                <XCircle size={48} />
              ) : isYellow ? (
                <AlertCircle size={48} />
              ) : (
                <CheckCircle2 size={48} />
              )}
            </div>
            <h2 className="text-2xl font-bold mb-2">
              {RISK_LEVEL_LABELS[result.riskLevel]}
            </h2>
            <p className="text-sm opacity-90">
              {new Date(result.checkedAt).toLocaleString('zh-CN')}
            </p>
          </div>

          {/* 处置建议 */}
          <div className="bg-card rounded-xl p-5 border border-border">
            <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
              <span
                className={`w-1.5 h-5 rounded-full ${
                  isRed ? 'bg-danger' : isYellow ? 'bg-warning' : 'bg-success'
                }`}
              />
              处置建议
            </h3>
            <p className="text-sm text-foreground leading-relaxed">
              {result.advice}
            </p>

            {isRed && (
              <div className="mt-4 p-3 bg-danger/10 rounded-xl border border-danger/20">
                <p className="text-sm text-danger font-medium mb-2">
                  ⚠️ 紧急提示
                </p>
                <p className="text-xs text-danger/80 leading-relaxed">
                  小肠结肠炎（HAEC）是HD术后最严重的并发症，如不及时治疗可能危及生命。请立即前往医院急诊就诊！
                </p>
                <UniversalLink
                  to="tel:120"
                  className="mt-3 w-full flex items-center justify-center gap-2 bg-danger text-white py-3 rounded-xl font-semibold text-base active:scale-[0.98] transition-transform"
                >
                  <Phone size={20} />
                  拨打120急救
                </UniversalLink>
              </div>
            )}

            {isYellow && (
              <div className="mt-4 p-3 bg-warning/10 rounded-xl border border-warning/20">
                <p className="text-sm text-warning/90 font-medium mb-2">
                  📋 门诊建议
                </p>
                <ul className="text-xs text-foreground/80 space-y-1.5 leading-relaxed">
                  <li>• 密切观察症状变化，记录发展趋势</li>
                  <li>• 如症状加重或持续超过24小时，请及时就诊</li>
                  <li>• 可联系主治医生咨询具体处理方案</li>
                  <li>• 继续每日红旗征自查监测</li>
                </ul>
              </div>
            )}

            {!isRed && !isYellow && (
              <div className="mt-4 p-3 bg-success/10 rounded-xl border border-success/20">
                <p className="text-sm text-success font-medium mb-2">
                  💚 居家小贴士
                </p>
                <p className="text-xs text-foreground/80 leading-relaxed">
                  宝宝目前状态良好。建议保持规律喂养，注意腹部保暖，每日坚持做排气操和腹部按摩，预防腹胀便秘。
                </p>
              </div>
            )}
          </div>

          {/* 答题详情 */}
          <div className="bg-card rounded-xl p-5 border border-border">
            <h3 className="text-base font-semibold mb-3">答题详情</h3>
            <div className="space-y-2.5">
              {RED_FLAG_QUESTIONS.map((q) => (
                <div
                  key={q.id}
                  className="flex items-center justify-between text-sm py-1"
                >
                  <span className="text-foreground/80">{q.title}</span>
                  <span
                    className={
                      result.answers[q.id]
                        ? 'text-danger font-medium'
                        : 'text-success font-medium'
                    }
                  >
                    {result.answers[q.id] ? '是' : '否'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={resetQuiz}
              className="flex-1 bg-card border border-border rounded-xl py-3.5 text-sm font-medium hover:bg-muted/50 transition-colors"
            >
              重新自测
            </button>
            <button
              onClick={() => navigate('/parent/home')}
              className="flex-1 bg-primary text-white rounded-xl py-3.5 text-sm font-medium active:scale-[0.98] transition-transform flex items-center justify-center gap-1.5"
            >
              <Home size={18} />
              返回首页
            </button>
          </div>

          {/* 历史记录 */}
          {!loadingRecords && records.length > 0 && (
            <div className="bg-card rounded-xl p-5 border border-border">
              <h3 className="text-base font-semibold mb-3">近期记录</h3>
              <div className="space-y-2">
                {records.slice(0, 5).map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                  >
                    <span className="text-sm text-muted-foreground">
                      {new Date(r.checkedAt).toLocaleDateString('zh-CN')}
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        r.riskLevel === 'red'
                          ? 'text-danger'
                          : r.riskLevel === 'yellow'
                            ? 'text-warning'
                            : 'text-success'
                      }`}
                    >
                      {RISK_LEVEL_LABELS[r.riskLevel]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 红色预警全屏弹窗 */}
        {showRedAlert && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-card w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl p-6 animate-bounce">
              <div className="w-24 h-24 mx-auto rounded-full bg-danger/10 flex items-center justify-center mb-4">
                <XCircle className="text-danger" size={56} />
              </div>
              <h3 className="text-xl font-bold text-center text-danger mb-2">
                红色预警！
              </h3>
              <p className="text-center text-foreground/80 text-sm mb-4">
                检测到多项红旗征阳性，可能存在小肠结肠炎风险
              </p>
              <div className="bg-danger/10 rounded-xl p-3 mb-5">
                <p className="text-xs text-danger text-center leading-relaxed">
                  ⚠️ 请立即带宝宝前往医院急诊就诊！
                  <br />
                  小肠结肠炎是HD术后最严重的并发症，延误治疗可能危及生命。
                </p>
              </div>
              <UniversalLink
                to="tel:120"
                className="w-full flex items-center justify-center gap-2 bg-danger text-white py-4 rounded-xl font-bold text-base active:scale-[0.98] transition-transform mb-3"
              >
                <Phone size={22} />
                拨打 120 急救电话
              </UniversalLink>
              <button
                onClick={() => setShowRedAlert(false)}
                className="w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                已知晓，我会立即就医
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 答题页
  return (
    <div>
      <header className="sticky top-0 bg-card/80 backdrop-blur-sm border-b border-border z-10">
        <div className="px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => {
              if (currentIndex > 0) {
                setCurrentIndex(currentIndex - 1);
              } else {
                navigate(-1);
              }
            }}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            aria-label="返回"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-base font-semibold">每日红旗征自查</h1>
        </div>
      </header>

      {/* 进度条 */}
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground/80">
            第 {currentIndex + 1} 题 / 共 {totalQuestions} 题
          </span>
          <span className="text-xs text-muted-foreground">
            约 {totalQuestions - currentIndex} 秒完成
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 rounded-full"
            style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* 题目卡片 */}
      <div className="p-4">
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          {/* 插图区域 */}
          <div className="bg-gradient-to-b from-primary/5 to-transparent py-10 flex items-center justify-center">
            <div className="text-7xl select-none" role="img" aria-label={currentQuestion.title}>
              {QUESTION_EMOJIS[currentQuestion.id] || '🩺'}
            </div>
          </div>

          {/* 题目文字 */}
          <div className="p-6 pb-5">
            <h2 className="text-xl font-bold mb-2 text-foreground">
              {currentQuestion.title}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {currentQuestion.description}
            </p>
          </div>

          {/* 答案按钮 */}
          <div className="px-6 pb-6 flex gap-3">
            <button
              onClick={() => handleAnswer(true)}
              disabled={submitting}
              className="flex-1 py-4 rounded-xl bg-danger text-white font-semibold text-base active:scale-[0.98] transition-all disabled:opacity-50"
            >
              是
            </button>
            <button
              onClick={() => handleAnswer(false)}
              disabled={submitting}
              className="flex-1 py-4 rounded-xl bg-success text-white font-semibold text-base active:scale-[0.98] transition-all disabled:opacity-50"
            >
              否
            </button>
          </div>
        </div>

        {/* 提示语 */}
        <p className="text-center text-xs text-muted-foreground mt-4 px-4">
          💡 如不确定，请选择最接近的情况；症状严重时请直接就医
        </p>
      </div>
    </div>
  );
};

export default ParentRedFlagPage;
