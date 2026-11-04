import { ArrowLeft, BookOpen, FileText, Award, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const references = [
  {
    title: '2017年中华医学会小儿外科学分会HAEC专家共识',
    desc: '国内权威HAEC诊断与治疗指南，确立腹胀、发热、腹泻为核心三联征',
  },
  {
    title: 'Gosain et al. (2019) 国际HAEC诊断指南',
    desc: '国际小肠结肠炎诊断标准，红旗征分级预警体系的核心依据',
  },
  {
    title: 'Rintala排便功能评分系统',
    desc: '7维度评估（排便控制、感知、频率、污粪、意外排便、便秘、社交问题），满分20分',
  },
  {
    title: '谢川平等(2024) Rintala评分在Soave术后患儿中的验证研究',
    desc: '中国人群中的Rintala评分信效度验证研究',
  },
  {
    title: '叶琳等(2022) 儿童过敏性鼻炎-哮喘综合征移动端随访研究',
    desc: '移动端随访模式在儿童慢性病管理中的应用效果研究',
  },
];

const AboutPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 bg-card/80 backdrop-blur-sm border-b border-border z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            aria-label="返回"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-base font-semibold">关于本系统</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-card rounded-xl p-5 border border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="text-primary" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-semibold">HD术后随访系统</h2>
              <p className="text-sm text-muted-foreground">先天性巨结肠术后管理平台 v1.0</p>
            </div>
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed">
            本系统针对先天性巨结肠(HD)术后患儿的随访需求，将HAEC红旗征识别标准转化为家长可操作的每日自查流程，
            通过分级预警帮助家长早期识别并发症风险；同时将Rintala排便功能评分电子化，实现术后长期随访管理。
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <BookOpen size={18} className="text-primary" />
            临床依据溯源
          </h3>
          <div className="space-y-3">
            {references.map((ref, index) => (
              <div key={index} className="bg-card rounded-xl p-4 border border-border">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-foreground">{ref.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{ref.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
          <div className="flex items-start gap-3">
            <FileText size={20} className="text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-primary mb-1">免责声明</h4>
              <p className="text-xs text-foreground/70 leading-relaxed">
                本系统为健康随访辅助工具，不构成医疗诊断建议。红旗征预警结果仅供参考，
                不能替代专业医生的诊断。如患儿出现异常症状，请及时就医。
              </p>
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-muted-foreground py-4">
          <p>© 2024 HD术后随访系统</p>
          <p className="mt-1">基于临床循证医学证据开发</p>
        </div>
      </main>
    </div>
  );
};

export default AboutPage;
