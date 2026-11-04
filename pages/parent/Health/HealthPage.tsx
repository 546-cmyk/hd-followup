import { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, Clock, Tag, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { healthApi } from '@client/src/api';
import type { HealthArticle } from '@shared/api.interface';

const ParentHealthPage = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<HealthArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<HealthArticle | null>(null);
  const [articleDetail, setArticleDetail] = useState<HealthArticle | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    setLoading(true);
    try {
      const data = await healthApi.getHealthArticles();
      setArticles(data.items || data || []);
    } catch {
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleArticleClick = async (article: HealthArticle) => {
    setSelectedArticle(article);
    setLoadingDetail(true);
    setArticleDetail(null);
    try {
      const detail = await healthApi.getHealthArticleDetail(article.id);
      setArticleDetail(detail as HealthArticle);
    } catch {
      // 用列表数据兜底
      setArticleDetail(article);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleBackToList = () => {
    setSelectedArticle(null);
    setArticleDetail(null);
  };

  // 详情页
  if (selectedArticle) {
    const content = articleDetail?.content || selectedArticle.content;

    return (
      <div>
        <header className="sticky top-0 bg-card/80 backdrop-blur-sm border-b border-border z-10">
          <div className="px-4 h-14 flex items-center gap-3">
            <button
              onClick={handleBackToList}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              aria-label="返回"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-base font-semibold truncate flex-1">
              {articleDetail?.title || selectedArticle.title}
            </h1>
          </div>
        </header>

        <div className="p-4 pb-8">
          {loadingDetail ? (
            <div className="text-center py-20 text-muted-foreground text-sm">
              加载中...
            </div>
          ) : (
            <article>
              {/* 文章头图 */}
              <div className="h-40 rounded-xl bg-gradient-to-br from-primary/20 to-success/20 mb-4 flex items-center justify-center">
                <BookOpen size={48} className="text-primary/40" />
              </div>

              {/* 文章标题 */}
              <h1 className="text-xl font-bold mb-2 leading-tight">
                {articleDetail?.title || selectedArticle.title}
              </h1>

              {/* 文章元信息 */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {new Date(
                    (articleDetail?.createdAt || selectedArticle.createdAt),
                  ).toLocaleDateString('zh-CN')}
                </span>
                <span className="flex items-center gap-1">
                  <Tag size={12} />
                  {articleDetail?.category || selectedArticle.category}
                </span>
              </div>

              {/* 文章内容 - 简单的换行渲染 */}
              <div className="prose prose-sm max-w-none text-foreground/90 leading-relaxed">
                {content.split('\n').map((paragraph, index) =>
                  paragraph.trim() ? (
                    <p key={index} className="mb-3">
                      {paragraph}
                    </p>
                  ) : null,
                )}
              </div>

              {/* 相关推荐 */}
              {articles.length > 1 && (
                <div className="mt-8 pt-4 border-t border-border">
                  <h3 className="text-sm font-semibold mb-3">推荐阅读</h3>
                  <div className="space-y-2">
                    {articles
                      .filter((a) => a.id !== selectedArticle.id)
                      .slice(0, 3)
                      .map((article) => (
                        <button
                          key={article.id}
                          onClick={() => handleArticleClick(article)}
                          className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors text-left"
                        >
                          <span className="text-sm line-clamp-1 flex-1">
                            {article.title}
                          </span>
                          <ChevronRight size={16} className="text-muted-foreground flex-shrink-0 ml-2" />
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </article>
          )}
        </div>
      </div>
    );
  }

  // 列表页
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
          <h1 className="text-base font-semibold">健康教育</h1>
        </div>
      </header>

      <div className="p-4 space-y-3 pb-6">
        {loading ? (
          <div className="text-center py-20 text-muted-foreground text-sm">
            加载中...
          </div>
        ) : articles.length > 0 ? (
          articles.map((article) => (
            <div
              key={article.id}
              onClick={() => handleArticleClick(article)}
              className="bg-card rounded-xl border border-border overflow-hidden cursor-pointer hover:shadow-md active:scale-[0.99] transition-all"
            >
              {/* 文章封面区 */}
              <div className="h-28 bg-gradient-to-br from-primary/15 to-success/15 flex items-center justify-center">
                <BookOpen size={36} className="text-primary/30" />
              </div>

              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                    {article.category}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock size={11} />
                    {new Date(article.createdAt).toLocaleDateString('zh-CN')}
                  </span>
                </div>
                <h3 className="text-base font-semibold line-clamp-2 leading-snug mb-2">
                  {article.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                  {article.summary}
                </p>
                <div className="flex items-center justify-end mt-3">
                  <span className="text-xs text-primary flex items-center font-medium">
                    阅读全文 <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-3">
              <BookOpen size={28} className="text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">暂无健康科普文章</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentHealthPage;
