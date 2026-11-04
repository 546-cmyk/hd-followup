import { useState, useEffect, useMemo } from 'react';
import { Send, Users, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { getDoctorPatients, batchSendReminder } from '@client/src/api/doctor';
import type { PatientListItem, RiskLevel } from '@shared/api.interface';
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

const templates: Record<string, { name: string; content: string }> = {
  review: {
    name: '复诊提醒',
    content:
      '您好，您家患儿的术后随访时间已到，请及时到医院复诊。复诊前请准备好近期的排便日记和红旗征自查记录。如有任何不适，请随时联系医生。',
  },
  score: {
    name: '评分提醒',
    content:
      '您好，请及时完成本次Rintala随访问卷评分，以便医生了解患儿术后恢复情况。评分大约需要5-10分钟，请根据实际情况如实填写。',
  },
  greeting: {
    name: '常规问候',
    content:
      '您好，近期患儿恢复情况如何？请坚持每日记录排便日记和红旗征自查。如有任何疑问或不适，请及时与医生沟通。祝早日康复！',
  },
};

const DoctorFollowupPage = () => {
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedTemplate, setSelectedTemplate] = useState('review');
  const [message, setMessage] = useState(templates.review.content);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{
    success: number;
    failed: number;
  } | null>(null);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        const result = await getDoctorPatients({ pageSize: 100 });
        setPatients(result.items || []);
      } catch {
        setPatients([]);
      } finally {
        setLoading(false);
      }
    };
    void fetchPatients();
  }, []);

  const groupedPatients = useMemo(() => {
    const groups: Record<RiskLevel, PatientListItem[]> = {
      red: [],
      yellow: [],
      green: [],
    };
    for (const p of patients) {
      groups[p.riskLevel].push(p);
    }
    // 每组内按最近自查时间倒序
    (Object.keys(groups) as RiskLevel[]).forEach((level) => {
      groups[level].sort((a, b) => {
        const da = a.latestCheckDate ? new Date(a.latestCheckDate).getTime() : 0;
        const db = b.latestCheckDate ? new Date(b.latestCheckDate).getTime() : 0;
        return db - da;
      });
    });
    return groups;
  }, [patients]);

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

  const selectAllInLevel = (level: RiskLevel) => {
    const levelIds = groupedPatients[level].map((p) => p.id);
    const allSelected = levelIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        levelIds.forEach((id) => next.delete(id));
      } else {
        levelIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const handleTemplateChange = (tplKey: string) => {
    setSelectedTemplate(tplKey);
    setMessage(templates[tplKey]?.content || '');
  };

  const handleSend = async () => {
    if (selectedIds.size === 0 || !message.trim()) return;
    try {
      setSending(true);
      setSendResult(null);
      const result = await batchSendReminder({
        patientIds: Array.from(selectedIds),
        template: selectedTemplate,
        message,
      });
      setSendResult(result);
    } catch {
      setSendResult({ success: 0, failed: selectedIds.size });
    } finally {
      setSending(false);
    }
  };

  const selectedPatients = patients.filter((p) => selectedIds.has(p.id));

  const groupConfigs: { level: RiskLevel; title: string; iconBg: string }[] = [
    { level: 'red', title: '红色预警', iconBg: 'bg-danger/10 text-danger' },
    { level: 'yellow', title: '黄色预警', iconBg: 'bg-warning/10 text-warning' },
    { level: 'green', title: '绿色稳定', iconBg: 'bg-success/10 text-success' },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">随访管理</h1>
          <p className="text-sm text-muted-foreground mt-1">
            批量发送随访提醒，高效管理术后患儿
          </p>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4 h-[calc(100vh-180px)]">
        {/* 左侧：患儿列表 */}
        <div className="col-span-2 bg-card rounded-xl border border-border flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm">待随访患儿</h3>
              <span className="text-xs text-muted-foreground">
                已选 {selectedIds.size} / {patients.length}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              按风险等级分组，点击勾选需要发送提醒的患儿
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                加载中...
              </div>
            ) : (
              <div className="p-2 space-y-3">
                {groupConfigs.map((group) => {
                  const list = groupedPatients[group.level];
                  const allSelected =
                    list.length > 0 && list.every((p) => selectedIds.has(p.id));
                  return (
                    <div key={group.level}>
                      <div className="flex items-center justify-between px-2 py-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={() => selectAllInLevel(group.level)}
                            className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary"
                          />
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${riskBadgeClass(
                              group.level,
                            )}`}
                          >
                            {group.title}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {list.length} 人
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        {list.map((patient) => (
                          <label
                            key={patient.id}
                            className={`flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer transition-colors ${
                              selectedIds.has(patient.id)
                                ? 'bg-primary/5'
                                : 'hover:bg-muted/50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedIds.has(patient.id)}
                              onChange={() => toggleSelect(patient.id)}
                              className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">
                                {patient.childName}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                上次自查：{patient.latestCheckDate || '暂无记录'}
                              </div>
                            </div>
                          </label>
                        ))}
                        {list.length === 0 && (
                          <div className="px-2 py-2 text-xs text-muted-foreground">
                            暂无该等级患儿
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 右侧：随访操作区 */}
        <div className="col-span-3 bg-card rounded-xl border border-border flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-sm">发送随访提醒</h3>
            <p className="text-xs text-muted-foreground mt-1">
              选择消息模板，编辑内容后批量发送
            </p>
          </div>

          <div className="flex-1 overflow-auto p-4 space-y-4">
            {/* 已选患儿 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">
                  已选择 <span className="text-primary">{selectedIds.size}</span> 位患儿
                </label>
                {selectedIds.size > 0 && (
                  <button
                    onClick={() => setSelectedIds(new Set())}
                    className="text-xs text-muted-foreground hover:text-danger"
                  >
                    清空选择
                  </button>
                )}
              </div>
              <div className="bg-background rounded-lg border border-border p-3 min-h-[60px] max-h-[120px] overflow-auto">
                {selectedPatients.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    <Users size={20} className="mx-auto mb-1 opacity-50" />
                    请从左侧选择要发送提醒的患儿
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedPatients.map((p) => (
                      <span
                        key={p.id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full"
                      >
                        {p.childName}
                        <button
                          onClick={() => toggleSelect(p.id)}
                          className="hover:text-danger"
                          aria-label={`移除${p.childName}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 消息模板 */}
            <div>
              <label className="block text-sm font-medium mb-2">消息模板</label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(templates).map(([key, tpl]) => (
                  <button
                    key={key}
                    onClick={() => handleTemplateChange(key)}
                    className={`p-2.5 rounded-lg border text-sm text-center transition-colors ${
                      selectedTemplate === key
                        ? 'border-primary bg-primary/5 text-primary font-medium'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {tpl.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 消息内容 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">消息内容</label>
                <span className="text-xs text-muted-foreground">
                  {message.length} 字
                </span>
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={8}
                placeholder="请输入消息内容..."
                className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
              />
            </div>

            {/* 发送结果 */}
            {sendResult && (
              <div
                className={`p-3 rounded-lg border flex items-center gap-3 ${
                  sendResult.failed === 0
                    ? 'bg-success/5 border-success/20'
                    : 'bg-warning/5 border-warning/20'
                }`}
              >
                {sendResult.failed === 0 ? (
                  <CheckCircle size={20} className="text-success flex-shrink-0" />
                ) : (
                  <XCircle size={20} className="text-warning flex-shrink-0" />
                )}
                <div>
                  <div className="text-sm font-medium">
                    {sendResult.failed === 0 ? '全部发送成功' : '部分发送失败'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    成功 {sendResult.success} 条，失败 {sendResult.failed} 条
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-border">
            <button
              onClick={handleSend}
              disabled={sending || selectedIds.size === 0 || !message.trim()}
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <Send size={16} />
              {sending ? '发送中...' : `发送提醒 (${selectedIds.size})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorFollowupPage;
