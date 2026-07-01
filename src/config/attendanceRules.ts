// ============================================================
// Attendance Rule Engine Configuration
// 考勤异常规则引擎配置
// ============================================================

// ---- 1. 基础工时规则 / Standard Work Hours ----

export interface WorkHoursConfig {
  standardWorkHours: number;
  standardCheckIn: string;
  standardCheckOut: string;
  seriousLateAfter: string;
  lunchBreakHours: number;
  overtimeThresholdHours: number;
  workdays: string[];
  weekendPolicy: string;
  holidayPolicy: string;
  schedulePolicy: string;
}

export const workHoursConfig: WorkHoursConfig = {
  standardWorkHours: 8,
  standardCheckIn: "09:30",
  standardCheckOut: "18:30",
  seriousLateAfter: "10:30",
  lunchBreakHours: 1,
  overtimeThresholdHours: 12,
  workdays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  weekendPolicy: "周末默认不判定旷工，除非存在考勤、出差或休假原始记录",
  holidayPolicy: "当前 Demo 未接入节假日表，后续可扩展",
  schedulePolicy: "当前 Demo 未接入排班表，后续可扩展",
};

// ---- 2. 状态判断优先级 / Status Judgment Priority ----

export const statusPriority: string[] = [
  "数据异常",
  "审批冲突",
  "已休假",
  "已出差",
  "正常出勤",
  "考勤异常",
  "疑似旷工",
];

// ---- 3. 处理状态 / Processing Status ----

export type ProcessingStatus = "待确认" | "已通知经理" | "已确认" | "已忽略";

export const processingStatuses: ProcessingStatus[] = [
  "待确认",
  "已通知经理",
  "已确认",
  "已忽略",
];

export const processingStatusDescription =
  "处理状态用于异常闭环管理，不等同于员工当天考勤状态。";

// ---- 4. 风险等级 / Risk Levels ----

export type SingleDayRisk = "High" | "Medium" | "Low" | "Normal";

export interface RiskLevelConfig {
  level: SingleDayRisk;
  label: string;
  labelZh: string;
  color: string; // Tailwind badge classes
}

export const singleDayRiskLevels: Record<SingleDayRisk, RiskLevelConfig> = {
  High: {
    level: "High",
    label: "High",
    labelZh: "高",
    color: "bg-red-100 text-red-700 border-red-200",
  },
  Medium: {
    level: "Medium",
    label: "Medium",
    labelZh: "中",
    color: "bg-amber-100 text-amber-700 border-amber-200",
  },
  Low: {
    level: "Low",
    label: "Low",
    labelZh: "低",
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  Normal: {
    level: "Normal",
    label: "Normal",
    labelZh: "正常",
    color: "bg-green-100 text-green-700 border-green-200",
  },
};

export interface MonthlyRiskRule {
  level: SingleDayRisk;
  labelZh: string;
  condition: string;
}

export const monthlyRiskRules: MonthlyRiskRule[] = [
  {
    level: "High",
    labelZh: "高",
    condition: "当月异常 ≥ 5 天",
  },
  {
    level: "Medium",
    labelZh: "中",
    condition: "当月异常 ≥ 3 天",
  },
  {
    level: "Low",
    labelZh: "低",
    condition: "当月异常 1–2 天",
  },
  {
    level: "Normal",
    labelZh: "正常",
    condition: "当月无异常",
  },
];

// ---- 5. 异常类型规则 / Exception Type Rules ----

export interface ExceptionRule {
  type: string; // 规则类型
  criteria: string; // 判断标准
  entersExceptionMgmt: boolean; // 是否进入异常管理
  riskLevel: SingleDayRisk; // 风险等级
  description: string; // 说明
}

export const exceptionRules: ExceptionRule[] = [
  {
    type: "迟到",
    criteria: "上班打卡晚于 09:30",
    entersExceptionMgmt: true,
    riskLevel: "Low",
    description: "单次迟到记录，用于考勤统计",
  },
  {
    type: "严重迟到",
    criteria: "上班打卡晚于 10:30",
    entersExceptionMgmt: true,
    riskLevel: "High",
    description: "超过严重迟到阈值，需重点关注",
  },
  {
    type: "早退",
    criteria: "下班打卡早于 18:30",
    entersExceptionMgmt: true,
    riskLevel: "Low",
    description: "单次早退记录，用于考勤统计",
  },
  {
    type: "上班缺卡",
    criteria: "无上班打卡，有下班打卡",
    entersExceptionMgmt: true,
    riskLevel: "Medium",
    description: "缺少上班打卡记录，需核实原因",
  },
  {
    type: "下班缺卡",
    criteria: "有上班打卡，无下班打卡",
    entersExceptionMgmt: true,
    riskLevel: "Medium",
    description: "缺少下班打卡记录，需核实原因",
  },
  {
    type: "单次打卡",
    criteria: "上班打卡 = 下班打卡（仅有一次打卡记录）",
    entersExceptionMgmt: true,
    riskLevel: "Medium",
    description: "仅有一次打卡记录，无法判断出勤情况",
  },
  {
    type: "疑似旷工",
    criteria: "工作日无打卡，且无出差 / 休假记录",
    entersExceptionMgmt: true,
    riskLevel: "High",
    description: "工作日全天无记录且无合理说明，需紧急处理",
  },
  {
    type: "工时不足",
    criteria: "有完整打卡，但有效工时 < 8 小时",
    entersExceptionMgmt: true,
    riskLevel: "Medium",
    description: "有效工时 = 下班 − 上班 − 午休 1 小时",
  },
  {
    type: "工时异常过长",
    criteria: "有效工时 > 12 小时",
    entersExceptionMgmt: true,
    riskLevel: "Medium",
    description: "超过加班阈值，需关注员工健康与合规",
  },
  {
    type: "已出差",
    criteria: "匹配 trim 后等于 Approved 的出差记录",
    entersExceptionMgmt: false,
    riskLevel: "Normal",
    description: "正常出差，不进入异常管理",
  },
  {
    type: "出差未审批",
    criteria: "出差审批状态不是 Approved",
    entersExceptionMgmt: true,
    riskLevel: "Low",
    description: "出差记录存在但审批未通过，不直接解释考勤异常",
  },
  {
    type: "已休假",
    criteria: "匹配休假记录",
    entersExceptionMgmt: false,
    riskLevel: "Normal",
    description: "正常休假，不进入异常管理",
  },
  {
    type: "审批冲突",
    criteria: "同一天既有出差又有休假记录",
    entersExceptionMgmt: true,
    riskLevel: "High",
    description: "数据冲突，需 HR 介入核实",
  },
  {
    type: "数据异常",
    criteria: "日期、工号、打卡时间格式异常",
    entersExceptionMgmt: true,
    riskLevel: "High",
    description: "原始数据质量问题，影响后续所有判断",
  },
  {
    type: "经理邮箱缺失",
    criteria: "员工记录中缺少直属经理邮箱",
    entersExceptionMgmt: true,
    riskLevel: "Medium",
    description: "影响经理通知发送，属于数据质量问题",
  },
  {
    type: "重复记录",
    criteria: "同员工同日期存在多条原始记录",
    entersExceptionMgmt: true,
    riskLevel: "Medium",
    description: "需去重或人工确认哪条为有效记录",
  },
  {
    type: "周末有记录",
    criteria: "周末存在考勤、出差或休假记录",
    entersExceptionMgmt: true,
    riskLevel: "Low",
    description: "周末不判旷工，但记录需正常展示以供审核",
  },
];

// ---- 6. 规则引擎说明 / Rule Engine Philosophy ----

export const ruleEnginePhilosophy =
  "本平台不会让大模型直接判断考勤异常，而是先通过规则引擎进行可解释判断，再由 AI Agent 生成异常解释、经理通知和报表摘要。这样既保证 HR 场景下的准确性，也保留 AI 在流程自动化中的价值。";

// ---- 7. 聚合导出 / Aggregate Export ----

export const attendanceRules = {
  workHours: workHoursConfig,
  statusPriority,
  processingStatuses,
  processingStatusDescription,
  exceptionRules,
  singleDayRiskLevels,
  monthlyRiskRules,
  ruleEnginePhilosophy,
} as const;
