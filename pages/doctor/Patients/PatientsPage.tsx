import { useState, useEffect, useMemo } from 'react';
import { Search, Eye, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getDoctorPatients, batchSendReminder } from '@client/src/api/doctor';
import type { PatientListItem, RiskLevel } from '@shared/api.interface';
import {
  RISK_LEVEL_LABELS,
  DIAGNOSIS_TYPES,
} from '@shared/api.interface';

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

const riskSortOrder: Record<RiskLevel, number> = {
  red: 0,
  yellow: 1,
  green: 2,
};

type RiskFilter = 'all' | RiskLevel;

const DoctorPatientsPage = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all');
  const [diagnosisFilter, setDiagnosisFilter] = useState<string>('all');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchMessage, setBatchMessage] = useState('');
  const [batchTemplate, setBatchTemplate] = useState('review');
  const [batchSending, setBatchSending] = useState(false);
  const [batchResult, setBatchResult] = useState<{
    success: number;
    failed: number;
  } | null>(null);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const result = await getDoctorPatients({
        riskLevel: riskFilter === 'all' ? undefined : riskFilter,
        diagnosisType: diagnosisFilter === 'all' ? undefined : diagnosisFilter,
        keyword: keyword || undefined,
        page,
        pageSize,
      });
      setPatients(result.items || []);
      setTotal(result.total || 0);
    } catch {
      setPatients([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchPatients();
  }, [riskFilter, diagnosisFilter, keyword, page]);

  const sortedPatients = useMemo(() => {
    return [...patients].sort((a, b) => {
      const orderA = riskSortOrder[a.riskLevel];
      const orderB = riskSortOrder[b.riskLevel];
      if (orderA !== orderB) return orderA - orderB;
      const dateA = a.latestCheckDate ? new Date(a.latestCheckDate).getTime() : 0;
      const dateB = b.latestCheckDate ? new Date(b.latestCheckDate).getTime() : 0;
      return dateB - dateA;
    });
  }, [patients]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const riskButtons: { key: RiskFilter; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'red', label: '红色预警' },
    { key: 'yellow', label: '黄色预警' },
    { key: 'green', label: '绿色稳定' },
  ];

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === sortedPatients.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedPatients.map((p) => p.id)));
    }
  };

  const templates: Record<string, { name: string; content: string }> = {
    review: {
      name: '复诊提醒',
      content:
        '您好，您家患儿的术后随访时间已到，请及时到医院复诊。如有任何不适，请随时联系医生。',
    },
    score: {
      name: '评分提醒',
      content:
        '您好，请及时完成本次Rintala随访问卷评分，以便医生了解患儿术后恢复情况。',
    },
    greeting: {
      name: '常规问候',
      content:
        '您好，近期患儿恢复情况如何？如有任何疑问或不适，请及时与医生沟通。祝早日康复！',
    },
  };

  const handleTemplateChange = (tpl: string) => {
    setBatchTemplate(tpl);
    setBatchMessage(templates[tpl]?.content || '');
  };

  const handleBatchSend = async () => {
    if (selectedIds.size === 0 || !batchMessage.trim()) return;
    try {
      setBatchSending(true);
      const result = await batchSendReminder({
        patientIds: Array.from(selectedIds),
        template: batchTemplate,
        message: batchMessage,
      });
      setBatchResult(result);
    } catch {
      setBatchResult({ success: 0, failed: selectedIds.size });
    } finally {
      setBatchSending(false);
    }
  };

  const closeBatchModal = () => {
    setShowBatchModal(false);
    setBatchResult(null);
    setSelectedIds(new Set());
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">患者管理</h1>
          <p className="text-sm text-muted-foreground mt-1">
            按风险等级分组查看所有随访患儿，共 {total} 位
          </p>
        </div>
        <button
          onClick={() => {
            if (selectedIds.size > 0) {
              setShowBatchModal(true);
              handleTemplateChange(batchTemplate);
            }
          }}
          disabled={selectedIds.size === 0}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedIds.size > 0
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
        >
          <Send size={16} />
          批量发送提醒
          {selectedIds.size > 0 && (
            <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs">
              {selectedIds.size}
            </span>
          )}
        </button>
      </div>

      <div className="bg-card rounded-xl border border-border p-4 mb-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            {riskButtons.map((btn) => (
              <button
                key={btn.key}
                onClick={() => {
                  setRiskFilter(btn.key);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  riskFilter === btn.key
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="搜索患儿姓名"
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setPage(1);
              }}
              className="pl-9 pr-4 py-2 rounded-lg border border-border bg-card text-sm w-56 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">诊断类型：</span>
            <select
              value={diagnosisFilter}
              onChange={(e) => {
                setDiagnosisFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              <option value="all">全部</option>
              {DIAGNOSIS_TYPES.map((dt) => (
                <option key={dt} value={dt}>
                  {dt}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 text-muted-foreground">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={
                      sortedPatients.length > 0 &&
                      selectedIds.size === sortedPatients.length
                    }
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                  />
                </th>
                <th className="text-left px-4 py-3 font-medium">患儿姓名</th>
                <th className="text-left px-4 py-3 font-medium">性别</th>
                <th className="text-left px-4 py-3 font-medium">年龄</th>
                <th className="text-left px-4 py-3 font-medium">诊断类型</th>
                <th className="text-left px-4 py-3 font-medium">术后天数</th>
                <th className="text-left px-4 py-3 font-medium">风险等级</th>
                <th className="text-left px-4 py-3 font-medium">最近自查</th>
                <th className="text-left px-4 py-3 font-medium">最近Rintala评分</th>
                <th className="text-left px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    加载中...
                  </td>
                </tr>
              ) : sortedPatients.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    暂无符合条件的患者
                  </td>
                </tr>
              ) : (
                sortedPatients.map((patient) => (
                  <tr
                    key={patient.id}
                    className="border-t border-border hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(patient.id)}
                        onChange={() => toggleSelect(patient.id)}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium">{patient.childName}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {patient.gender === 'male' ? '男' : patient.gender === 'female' ? '女' : '-'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {patient.ageMonths} 个月
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {patient.diagnosisType}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {patient.postOpDays} 天
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${riskBadgeClass(
                          patient.riskLevel,
                        )}`}
                      >
                        {RISK_LEVEL_LABELS[patient.riskLevel]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {patient.latestCheckDate || '-'}
                    </td>
                    <td className="px-4 py-3">
                      {patient.latestRintalaScore !== undefined
                        ? `${patient.latestRintalaScore} 分`
                        : '-'}
                    </td>
                    <td className="px-4 py-3">
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
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-sm text-muted-foreground">
              共 {total} 条，第 {page} / {totalPages} 页
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-md text-sm border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一页
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 rounded-md text-sm ${
                      page === pageNum
                        ? 'bg-primary text-primary-foreground'
                        : 'border border-border hover:bg-muted'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-md text-sm border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>

      {showBatchModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl w-[480px] max-h-[80vh] overflow-auto shadow-xl">
            <div className="p-5 border-b border-border">
              <h3 className="font-semibold text-lg">批量发送随访提醒</h3>
              <p className="text-sm text-muted-foreground mt-1">
                已选择 {selectedIds.size} 位患儿
              </p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">消息模板</label>
                <select
                  value={batchTemplate}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                >
                  {Object.entries(templates).map(([key, tpl]) => (
                    <option key={key} value={key}>
                      {tpl.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">消息内容</label>
                <textarea
                  value={batchMessage}
                  onChange={(e) => setBatchMessage(e.target.value)}
                  rows={5}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                  placeholder="请输入消息内容"
                />
              </div>
              {batchResult && (
                <div
                  className={`p-3 rounded-lg text-sm ${
                    batchResult.failed === 0
                      ? 'bg-success/10 text-success'
                      : 'bg-warning/10 text-warning'
                  }`}
                >
                  发送完成：成功 {batchResult.success} 条，失败 {batchResult.failed} 条
                </div>
              )}
            </div>
            <div className="p-5 border-t border-border flex justify-end gap-3">
              <button
                onClick={closeBatchModal}
                className="px-4 py-2 rounded-lg text-sm border border-border hover:bg-muted"
              >
                {batchResult ? '关闭' : '取消'}
              </button>
              {!batchResult && (
                <button
                  onClick={handleBatchSend}
                  disabled={batchSending || !batchMessage.trim()}
                  className="px-4 py-2 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {batchSending ? '发送中...' : '发送提醒'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorPatientsPage;
