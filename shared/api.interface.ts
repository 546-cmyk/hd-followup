/* 前后端共享的类型写在这里 */

export const DIAGNOSIS_TYPES = ['短段型', '常见型', '长段型', '全结肠型'] as const;
export type DiagnosisType = (typeof DIAGNOSIS_TYPES)[number];

export const RISK_LEVELS = ['green', 'yellow', 'red'] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];
export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  green: '绿色稳定',
  yellow: '黄色预警',
  red: '红色预警',
};

export const BRISTOL_STOOL_TYPES = [1, 2, 3, 4, 5, 6, 7] as const;
export type BristolStoolType = (typeof BRISTOL_STOOL_TYPES)[number];
export const BRISTOL_LABELS: Record<BristolStoolType, string> = {
  1: '硬球状',
  2: '香肠状有裂纹',
  3: '香肠状表面有裂痕',
  4: '香肠状光滑柔软',
  5: '软团状边缘清晰',
  6: '糊状边缘不齐',
  7: '水样完全无固体',
};

export const BLOATING_LEVELS = ['none', 'mild', 'moderate', 'severe'] as const;
export type BloatingLevel = (typeof BLOATING_LEVELS)[number];
export const BLOATING_LABELS: Record<BloatingLevel, string> = {
  none: '无腹胀',
  mild: '轻度腹胀',
  moderate: '中度腹胀',
  severe: '重度腹胀',
};

export const RINTALA_DIMENSIONS = [
  'control', 'sensation', 'frequency', 'soiling', 'accidental', 'constipation', 'social'
] as const;
export type RintalaDimension = (typeof RINTALA_DIMENSIONS)[number];
export const RINTALA_DIMENSION_LABELS: Record<RintalaDimension, string> = {
  control: '排便控制',
  sensation: '排便感知',
  frequency: '排便频率',
  soiling: '污粪',
  accidental: '意外排便',
  constipation: '便秘',
  social: '社交问题',
};
export const RINTALA_DIMENSION_MAX_SCORES: Record<RintalaDimension, number> = {
  control: 3, sensation: 3, frequency: 3, soiling: 3,
  accidental: 3, constipation: 3, social: 2,
};

export const RINTALA_LEVELS = ['good', 'fair', 'poor'] as const;
export type RintalaLevel = (typeof RINTALA_LEVELS)[number];
export const RINTALA_LEVEL_LABELS: Record<RintalaLevel, string> = {
  good: '功能良好',
  fair: '功能一般',
  poor: '功能不良',
};

export const RED_FLAG_QUESTIONS = [
  { id: 'bloating', title: '是否腹胀加重', description: '腹部比平时明显胀大、紧绷' },
  { id: 'fever', title: '是否发热（≥38.5℃）', description: '体温达到或超过38.5摄氏度' },
  { id: 'diarrhea', title: '大便是否为腥臭味稀水便', description: '大便呈水样、带有明显腥臭味' },
  { id: 'blood', title: '是否有血便', description: '大便中带血或出现血红色' },
  { id: 'vomit', title: '是否呕吐', description: '频繁呕吐或喷射性呕吐' },
  { id: 'lethargy', title: '精神状态是否萎靡/嗜睡', description: '反应差、嗜睡、不易唤醒' },
] as const;
export type RedFlagQuestionId = (typeof RED_FLAG_QUESTIONS)[number]['id'];

export interface ParentUser {
  id: string;
  phone: string;
  name: string;
  childId: string;
  childName: string;
  role: 'parent';
}

export interface DoctorUser {
  id: string;
  phone: string;
  name: string;
  department?: string;
  title?: string;
  role: 'doctor';
}

export interface ChildInfo {
  id: string;
  name: string;
  surgeryDate: string;
  diagnosisType: DiagnosisType;
  ageMonths: number;
  gender?: 'male' | 'female';
  currentRiskLevel: RiskLevel;
  latestCheckDate?: string;
}

export interface RedFlagRecord {
  id: string;
  childId: string;
  answers: Record<RedFlagQuestionId, boolean>;
  riskLevel: RiskLevel;
  advice: string;
  checkedAt: string;
  postOpDays: number;
}

export interface BowelDiaryRecord {
  id: string;
  childId: string;
  recordDate: string;
  bowelCount: number;
  stoolType: BristolStoolType;
  bloatingLevel: BloatingLevel;
  temperature: number;
  notes?: string;
  createdAt: string;
}

export interface BowelDiaryTrend {
  dates: string[];
  frequency: number[];
  stoolTypes: Record<BristolStoolType, number>;
  bloating: BloatingLevel[];
  temperature: number[];
}

export interface RintalaRecord {
  id: string;
  childId: string;
  totalScore: number;
  level: RintalaLevel;
  dimensions: Record<RintalaDimension, number>;
  completedAt: string;
  postOpMonths: number;
  declineFromLast?: number;
}

export interface FollowupNote {
  id: string;
  childId: string;
  doctorId: string;
  content: string;
  nextFollowupDate?: string;
  createdAt: string;
}

export interface HealthArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  coverImage?: string;
  category: string;
  createdAt: string;
}

export interface DashboardStats {
  totalPatients: number;
  redCount: number;
  yellowCount: number;
  greenCount: number;
}

export interface PatientListItem {
  id: string;
  childName: string;
  diagnosisType: DiagnosisType;
  surgeryDate: string;
  ageMonths: number;
  gender?: 'male' | 'female';
  riskLevel: RiskLevel;
  latestCheckDate?: string;
  parentPhone: string;
  parentName?: string;
  latestRintalaScore?: number;
  postOpDays: number;
}

export interface PatientListResponse {
  items: PatientListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface RedFlagTrendItem {
  date: string;
  red: number;
  yellow: number;
  green: number;
}

export interface RintalaDistribution {
  good: number;
  fair: number;
  poor: number;
}

export interface DashboardResponse {
  stats: DashboardStats;
  redFlagTrend: RedFlagTrendItem[];
  rintalaDistribution: RintalaDistribution;
  redAlertPatients: PatientListItem[];
}

export interface PatientDetailResponse {
  child: {
    id: string;
    name: string;
    surgeryDate: string;
    diagnosisType: DiagnosisType;
    ageMonths: number;
    gender?: 'male' | 'female';
    currentRiskLevel: RiskLevel;
    latestCheckDate?: string;
    parentPhone: string;
    parentName: string;
    postOpDays: number;
  };
  bowelDiaryTrend: BowelDiaryTrend;
  redFlagRecords: RedFlagRecord[];
  rintalaRecords: RintalaRecord[];
  followupNotes: FollowupNote[];
}
