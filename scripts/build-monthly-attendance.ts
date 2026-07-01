/**
 * build-monthly-attendance.ts
 *
 * Phase 2 — Monthly Attendance Management / 月度考勤管理
 *
 * Reads rawAttendanceRecords.json, rawBusinessTripRecords.json, rawLeaveRecords.json
 * and attendanceRules.ts, then generates:
 *   - public/data/dailyAttendanceRecords.json
 *   - public/data/employeeMonthlySummary.json
 */

import * as fs from "fs";
import * as path from "path";
import {
  workHoursConfig,
  exceptionRules,
} from "../src/config/attendanceRules";

// ================================================================
// Types
// ================================================================

interface RawAttendance {
  rowIndex: number;
  employeeId: string | null;
  name: string | null;
  department: string | null;
  date: string | null;
  checkInTime: string | null;
  checkOutTime: string | null;
  lunchBreak: string | null;
  workHours: string | null;
  managerEmail: string | null;
}

interface RawBusinessTrip {
  rowIndex: number;
  employeeId: string | null;
  name: string | null;
  startDate: string | null;
  endDate: string | null;
  approvalStatusRaw: string | null;
  approvalStatusTrimmed: string | null;
  isApproved: boolean;
  workDays: number | null;
}

interface RawLeave {
  rowIndex: number;
  employeeId: string | null;
  name: string | null;
  startDate: string | null;
  endDate: string | null;
  dayOfWeek: string | null;
  leaveDays: number | null;
}

interface DailyAttendanceRecord {
  employeeId: string;
  name: string;
  department: string;
  date: string;
  dayOfWeek: string;
  checkIn: string | null;
  checkOut: string | null;
  standardWorkHours: number;
  creditedWorkHours: number;
  isBusinessTrip: boolean;
  isOnLeave: boolean;
  attendanceStatus: string;
  processStatus: string;
  exceptionTypes: string[];
  riskLevel: string;
  managerEmail: string | null;
  sourceTypes: string[];
  ruleExplanation: string;
}

interface EmployeeMonthlySummary {
  employeeId: string;
  name: string;
  department: string;
  totalRecordDays: number;
  normalAttendanceDays: number;
  businessTripDays: number;
  leaveDays: number;
  anomalyDays: number;
  pendingReviewDays: number;
  highRiskDays: number;
  totalCreditedWorkHours: number;
  standardWorkHoursPerDay: number;
  managerEmail: string | null;
  latestAttendanceStatus: string;
  latestRecordDate: string;
}

// ================================================================
// Utilities
// ================================================================

const DATA_DIR = path.join(process.cwd(), "public", "data");

function loadJson<T>(filename: string): T {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.error(`Missing input file: ${filename}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
}

function writeJson(filename: string, data: unknown): void {
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  const kb = (Buffer.byteLength(JSON.stringify(data, null, 2)) / 1024).toFixed(1);
  console.log(`✅ Written: ${filename} (${kb} KB)`);
}

/** Get Chinese day-of-week from yyyy-MM-dd */
function getDayOfWeek(dateStr: string): string {
  const map = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const d = new Date(dateStr + "T00:00:00");
  return map[d.getDay()];
}

function isWeekend(dateStr: string): boolean {
  const d = new Date(dateStr + "T00:00:00");
  return d.getDay() === 0 || d.getDay() === 6;
}

/** Parse "HH:mm" to total minutes since midnight */
function timeToMinutes(t: string | null): number | null {
  if (!t) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(t);
  if (!m) return null;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

/** Expand a date range [start, end] inclusive into individual date strings */
function expandDateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  const cur = new Date(s);
  while (cur <= e) {
    dates.push(formatDate(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Build a risk-level lookup from exception type name */
function buildRiskMap(): Map<string, string> {
  const m = new Map<string, string>();
  for (const rule of exceptionRules) {
    m.set(rule.type, rule.riskLevel);
  }
  return m;
}

/** Pick the highest risk from a list of exception types */
function highestRisk(
  types: string[],
  riskMap: Map<string, string>
): string {
  const order = ["High", "Medium", "Low", "Normal"];
  let best = "Normal";
  for (const t of types) {
    const r = riskMap.get(t) || "Normal";
    if (order.indexOf(r) < order.indexOf(best)) best = r;
  }
  return best;
}

// ================================================================
// Main Pipeline
// ================================================================

function main() {
  console.log("=".repeat(60));
  console.log("Phase 2 — Monthly Attendance Management / 月度考勤管理");
  console.log("=".repeat(60));

  // ---- Load data ----
  const attendances = loadJson<RawAttendance[]>("rawAttendanceRecords.json");
  const trips = loadJson<RawBusinessTrip[]>("rawBusinessTripRecords.json");
  const leaves = loadJson<RawLeave[]>("rawLeaveRecords.json");

  const STD = workHoursConfig.standardWorkHours;        // 8
  const CHECK_IN = workHoursConfig.standardCheckIn;      // "09:30"
  const CHECK_OUT = workHoursConfig.standardCheckOut;    // "18:30"
  const SERIOUS_LATE = workHoursConfig.seriousLateAfter; // "10:30"
  const LUNCH = workHoursConfig.lunchBreakHours;         // 1
  const OT_THRESHOLD = workHoursConfig.overtimeThresholdHours; // 12

  const checkInMin = timeToMinutes(CHECK_IN)!;   // 570
  const seriousMin = timeToMinutes(SERIOUS_LATE)!; // 630
  const checkOutMin = timeToMinutes(CHECK_OUT)!;   // 1110

  const riskMap = buildRiskMap();

  // ---- Index: employeeId+date → data ----
  // attendance map
  const attMap = new Map<string, RawAttendance[]>();
  for (const a of attendances) {
    if (!a.employeeId || !a.date) continue;
    const key = `${a.employeeId}|${a.date}`;
    if (!attMap.has(key)) attMap.set(key, []);
    attMap.get(key)!.push(a);
  }

  // trip date expansion: employeeId+date → trip records
  const tripDateMap = new Map<string, RawBusinessTrip[]>();
  for (const t of trips) {
    if (!t.employeeId || !t.startDate || !t.endDate) continue;
    const dates = expandDateRange(t.startDate, t.endDate);
    for (const d of dates) {
      const key = `${t.employeeId}|${d}`;
      if (!tripDateMap.has(key)) tripDateMap.set(key, []);
      tripDateMap.get(key)!.push(t);
    }
  }

  // leave date expansion: employeeId+date → leave records
  const leaveDateMap = new Map<string, RawLeave[]>();
  for (const lv of leaves) {
    if (!lv.employeeId || !lv.startDate || !lv.endDate) continue;
    const dates = expandDateRange(lv.startDate, lv.endDate);
    for (const d of dates) {
      const key = `${lv.employeeId}|${d}`;
      if (!leaveDateMap.has(key)) leaveDateMap.set(key, []);
      leaveDateMap.get(key)!.push(lv);
    }
  }

  // Build complete key set (employeeId|date)
  const allKeys = new Set<string>();
  for (const k of attMap.keys()) allKeys.add(k);
  for (const k of tripDateMap.keys()) allKeys.add(k);
  for (const k of leaveDateMap.keys()) allKeys.add(k);

  console.log(`\nInput: ${attendances.length} attendance, ${trips.length} trips, ${leaves.length} leaves`);
  console.log(`Unique (employee, date) combinations: ${allKeys.size}`);

  // ---- Process each key ----
  const dailyRecords: DailyAttendanceRecord[] = [];

  for (const key of allKeys) {
    const [employeeId, date] = key.split("|");
    const attRows = attMap.get(key) || [];
    const tripRows = tripDateMap.get(key) || [];
    const leaveRows = leaveDateMap.get(key) || [];

    // Determine if there's an approved trip
    const hasApprovedTrip = tripRows.some((t) => t.isApproved);
    const hasUnapprovedTrip = tripRows.some((t) => !t.isApproved);
    const hasAnyTrip = tripRows.length > 0;
    const hasLeave = leaveRows.length > 0;
    const hasAttendance = attRows.length > 0;

    // Source types
    const sourceTypes: string[] = [];
    if (hasAttendance) sourceTypes.push("考勤表");
    if (hasAnyTrip) sourceTypes.push("出差记录表");
    if (hasLeave) sourceTypes.push("休假记录表");

    // Get primary attendance row (first non-null)
    const primaryAtt = attRows[0] || null;
    const department = primaryAtt?.department || tripRows[0]?.name ? primaryAtt?.department || "—" : "—";
    // Use name from any source
    const name =
      primaryAtt?.name ||
      tripRows.find((t) => t.name)?.name ||
      leaveRows.find((l) => l.name)?.name ||
      "—";

    // Check for duplicate attendance records
    const hasDuplicateAtt = attRows.length > 1;

    // Check for missing manager email (only from attendance)
    const managerEmailMissing =
      hasAttendance && (!primaryAtt?.managerEmail);

    // ---- Determine attendance status (priority chain) ----

    const exceptionTypes: string[] = [];
    let attendanceStatus = "";
    const weekend = isWeekend(date);
    const dow = getDayOfWeek(date);

    // Raw checkIn/checkOut
    const rawCheckIn = primaryAtt?.checkInTime || null;
    const rawCheckOut = primaryAtt?.checkOutTime || null;
    const ciMin = timeToMinutes(rawCheckIn);
    const coMin = timeToMinutes(rawCheckOut);
    const hasCheckIn = ciMin !== null;
    const hasCheckOut = coMin !== null;
    const hasBothPunches = hasCheckIn && hasCheckOut;

    // --- Data quality flags (always checked) ---
    const dataQualityFlags: string[] = [];
    if (hasDuplicateAtt) dataQualityFlags.push("重复记录");
    if (managerEmailMissing) dataQualityFlags.push("经理邮箱缺失");

    // --- Priority 1: 数据异常 ---
    let isDataAnomaly = false;
    if (!employeeId || employeeId.trim() === "") isDataAnomaly = true;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) isDataAnomaly = true;

    if (isDataAnomaly) {
      attendanceStatus = "数据异常";
      exceptionTypes.push("数据异常");
      exceptionTypes.push(...dataQualityFlags);
    }

    // --- Priority 2: 审批冲突 ---
    if (attendanceStatus === "" && hasAnyTrip && hasLeave) {
      attendanceStatus = "审批冲突";
      exceptionTypes.push("审批冲突");
      exceptionTypes.push(...dataQualityFlags);
    }

    // --- Priority 3: 已休假 ---
    if (attendanceStatus === "" && hasLeave) {
      attendanceStatus = "已休假";
      // Leave is normal — no punch anomalies
      exceptionTypes.push(...dataQualityFlags);
      if (weekend) exceptionTypes.push("周末有记录");
    }

    // --- Priority 4: 已出差 ---
    if (attendanceStatus === "" && hasApprovedTrip) {
      attendanceStatus = "已出差";
      // Approved trip is normal — no punch anomalies
      exceptionTypes.push(...dataQualityFlags);
      if (weekend) exceptionTypes.push("周末有记录");
    }

    // --- Remaining cases: evaluate punch anomalies ---
    if (attendanceStatus === "") {
      // Check for unapproved trip (can't explain anomalies)
      if (hasUnapprovedTrip) {
        exceptionTypes.push("出差未审批");
      }

      // Punch anomaly detection
      const punchAnomalies: string[] = [];

      if (hasBothPunches) {
        // Check late / serious late
        if (ciMin! > seriousMin) {
          punchAnomalies.push("严重迟到"); // serious late, don't also flag "迟到"
        } else if (ciMin! > checkInMin) {
          punchAnomalies.push("迟到");
        }

        // Check early leave
        if (coMin! < checkOutMin) {
          punchAnomalies.push("早退");
        }

        // Check single punch (same time)
        if (rawCheckIn === rawCheckOut && rawCheckIn !== null) {
          punchAnomalies.push("单次打卡");
        }

        // Calculate effective work hours
        const effectiveMin = coMin! - ciMin! - LUNCH * 60;
        const effectiveHours = effectiveMin / 60;

        if (effectiveHours < STD && rawCheckIn !== rawCheckOut) {
          // Don't flag 工时不足 if it's a single punch (单次打卡 already covers it)
          punchAnomalies.push("工时不足");
        }
        if (effectiveHours > OT_THRESHOLD) {
          punchAnomalies.push("工时异常过长");
        }
      } else {
        // Missing punches
        if (!hasCheckIn && hasCheckOut) {
          punchAnomalies.push("上班缺卡");
        }
        if (hasCheckIn && !hasCheckOut) {
          punchAnomalies.push("下班缺卡");
        }
      }

      if (punchAnomalies.length > 0) {
        attendanceStatus = "考勤异常";
        exceptionTypes.push(...punchAnomalies);
        exceptionTypes.push(...dataQualityFlags);
        if (weekend) exceptionTypes.push("周末有记录");
      } else if (hasAttendance) {
        // Has attendance punches, no anomalies
        attendanceStatus = "正常出勤";
        exceptionTypes.push(...dataQualityFlags);
        if (weekend) exceptionTypes.push("周末有记录");
      } else {
        // No attendance, no trip, no leave
        if (weekend) {
          // Weekend with records (trip/leave already handled above)
          // Weekend with no records at all → shouldn't be in the key set
          // But if we're here, it means there were trip/leave but they were already handled
          attendanceStatus = "正常出勤";
          exceptionTypes.push(...dataQualityFlags);
          exceptionTypes.push("周末有记录");
        } else {
          // Workday, no punch, no trip, no leave → 疑似旷工
          attendanceStatus = "疑似旷工";
          exceptionTypes.push("疑似旷工");
          exceptionTypes.push(...dataQualityFlags);
        }
      }
    }

    // ---- Deduplicate exception types ----
    const uniqueExceptions = [...new Set(exceptionTypes)];

    // ---- Determine risk level ----
    const riskLevel = highestRisk(uniqueExceptions, riskMap);

    // ---- Determine process status ----
    let processStatus = "无需处理";
    if (
      attendanceStatus === "考勤异常" ||
      attendanceStatus === "疑似旷工" ||
      attendanceStatus === "审批冲突" ||
      attendanceStatus === "数据异常"
    ) {
      processStatus = "待确认";
    }
    // 出差未审批 alone with no punch anomalies means the attendance itself is not abnormal,
    // but the trip data quality is flagged — still mark as 待确认 if it's the only flag
    if (
      attendanceStatus === "正常出勤" &&
      uniqueExceptions.some((e) => e === "出差未审批" || e === "重复记录")
    ) {
      processStatus = "待确认";
    }

    // ---- Determine credited work hours ----
    let creditedWorkHours = 0;
    if (attendanceStatus === "正常出勤") creditedWorkHours = STD;
    if (attendanceStatus === "已出差") creditedWorkHours = STD;
    // 已休假, 考勤异常, 疑似旷工, 审批冲突, 数据异常 → 0

    // ---- Build rule explanation ----
    const explanationParts: string[] = [];
    if (attendanceStatus === "正常出勤") explanationParts.push("正常出勤，计入标准工时");
    if (attendanceStatus === "已出差") explanationParts.push("匹配 Approved 出差记录，不计入异常");
    if (attendanceStatus === "已休假") explanationParts.push("匹配休假记录，不计入异常");
    if (attendanceStatus === "考勤异常") explanationParts.push("存在考勤异常：" + uniqueExceptions.filter((e) => !dataQualityFlags.includes(e) && e !== "出差未审批" && e !== "周末有记录").join("、"));
    if (attendanceStatus === "疑似旷工") explanationParts.push("工作日无打卡且无出差/休假记录");
    if (attendanceStatus === "审批冲突") explanationParts.push("同一天既有出差又有休假记录，需 HR 核实");
    if (attendanceStatus === "数据异常") explanationParts.push("原始数据格式异常，影响考勤判断");
    if (hasUnapprovedTrip && attendanceStatus !== "已出差")
      explanationParts.push("出差审批未通过，不直接解释考勤异常");
    if (weekend && uniqueExceptions.includes("周末有记录"))
      explanationParts.push("周末有记录，默认不判旷工");
    if (hasDuplicateAtt) explanationParts.push("存在重复考勤记录");
    if (managerEmailMissing) explanationParts.push("经理邮箱缺失");

    const ruleExplanation = explanationParts.join("；") || "—";

    dailyRecords.push({
      employeeId,
      name,
      department,
      date,
      dayOfWeek: dow,
      checkIn: rawCheckIn,
      checkOut: rawCheckOut,
      standardWorkHours: STD,
      creditedWorkHours,
      isBusinessTrip: hasApprovedTrip,
      isOnLeave: hasLeave,
      attendanceStatus,
      processStatus,
      exceptionTypes: uniqueExceptions,
      riskLevel,
      managerEmail: primaryAtt?.managerEmail || null,
      sourceTypes,
      ruleExplanation,
    });
  }

  // Sort by date, then employee
  dailyRecords.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.employeeId.localeCompare(b.employeeId);
  });

  // ---- Build employee monthly summaries ----
  const empMap = new Map<string, DailyAttendanceRecord[]>();
  for (const r of dailyRecords) {
    if (!empMap.has(r.employeeId)) empMap.set(r.employeeId, []);
    empMap.get(r.employeeId)!.push(r);
  }

  const summaries: EmployeeMonthlySummary[] = [];
  for (const [empId, records] of empMap) {
    const sorted = records.sort((a, b) => a.date.localeCompare(b.date));
    const latest = sorted[sorted.length - 1];
    const first = sorted[0];

    const normalDays = sorted.filter((r) => r.attendanceStatus === "正常出勤").length;
    const tripDays = sorted.filter((r) => r.isBusinessTrip).length;
    const lvDays = sorted.filter((r) => r.isOnLeave).length;
    const anomalyDays = sorted.filter(
      (r) => r.attendanceStatus !== "正常出勤" && r.attendanceStatus !== "已出差" && r.attendanceStatus !== "已休假"
    ).length;
    const pendingDays = sorted.filter((r) => r.processStatus === "待确认").length;
    const highRiskDays = sorted.filter((r) => r.riskLevel === "High").length;
    const totalCredited = sorted.reduce((sum, r) => sum + r.creditedWorkHours, 0);

    summaries.push({
      employeeId: empId,
      name: first.name,
      department: first.department,
      totalRecordDays: sorted.length,
      normalAttendanceDays: normalDays,
      businessTripDays: tripDays,
      leaveDays: lvDays,
      anomalyDays,
      pendingReviewDays: pendingDays,
      highRiskDays,
      totalCreditedWorkHours: totalCredited,
      standardWorkHoursPerDay: STD,
      managerEmail: latest.managerEmail,
      latestAttendanceStatus: latest.attendanceStatus,
      latestRecordDate: latest.date,
    });
  }

  summaries.sort((a, b) => a.employeeId.localeCompare(b.employeeId));

  // ---- Write output ----
  writeJson("dailyAttendanceRecords.json", dailyRecords);
  writeJson("employeeMonthlySummary.json", summaries);

  // ---- Stats ----
  console.log(`\n--- Stats ---`);
  console.log(`Daily records: ${dailyRecords.length}`);
  console.log(`Employees: ${summaries.length}`);

  const statusCounts = new Map<string, number>();
  for (const r of dailyRecords) {
    statusCounts.set(r.attendanceStatus, (statusCounts.get(r.attendanceStatus) || 0) + 1);
  }
  console.log("Attendance status distribution:");
  for (const [s, c] of [...statusCounts].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${s}: ${c}`);
  }

  const riskCounts = new Map<string, number>();
  for (const r of dailyRecords) {
    riskCounts.set(r.riskLevel, (riskCounts.get(r.riskLevel) || 0) + 1);
  }
  console.log("Risk level distribution:");
  for (const [s, c] of [...riskCounts].sort()) {
    console.log(`  ${s}: ${c}`);
  }

  console.log(`\n✅ Phase 2 build complete.\n`);
}

main();
