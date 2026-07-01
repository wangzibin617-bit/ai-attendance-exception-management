/**
 * import-raw-data.ts
 *
 * Phase 1 — Data Import: 读取三张原始 Excel，完成字段识别、基础校验和格式标准化。
 * 不做异常识别，不做月度考勤底表，不做 Dashboard，不做报表，不做经理通知，不接 AI。
 *
 * 输出 4 个 JSON 文件至 public/data/：
 *   - dataSourceSummary.json
 *   - rawAttendanceRecords.json
 *   - rawBusinessTripRecords.json
 *   - rawLeaveRecords.json
 */

import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";

// ================================================================
// Types
// ================================================================

interface RawAttendanceRecord {
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

interface RawBusinessTripRecord {
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

interface RawLeaveRecord {
  rowIndex: number;
  employeeId: string | null;
  name: string | null;
  startDate: string | null;
  endDate: string | null;
  dayOfWeek: string | null;
  leaveDays: number | null;
}

interface FieldInfo {
  index: number;
  name: string;
  type: "string" | "number" | "date" | "time" | "mixed";
}

interface SourceValidation {
  source: string;
  fileName: string;
  sheetName: string;
  rawRowCount: number; // excluding header
  fields: FieldInfo[];
  requiredFields: string[];
  missingRequiredFields: string[];
  validationPassed: boolean;
  issues: string[];
}

interface DataSourceSummary {
  generatedAt: string;
  phase: string;
  sources: SourceValidation[];
}

// ================================================================
// Utilities
// ================================================================

/** Convert Excel date serial number to yyyy-MM-dd string */
function serialToDate(serial: number): string {
  // Excel serial: days since 1899-12-30
  const jsDate = new Date((serial - 25569) * 86400000);
  const yyyy = jsDate.getFullYear();
  const mm = String(jsDate.getMonth() + 1).padStart(2, "0");
  const dd = String(jsDate.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** Convert Excel time decimal (fraction of 24h) to HH:mm string */
function decimalToTime(decimal: number): string {
  if (decimal == null || isNaN(decimal)) return "";
  const totalMinutes = Math.round(decimal * 1440);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/** Normalize a cell value: null/undefined/NaN → null, strings trimmed */
function nullify(val: unknown): string | null {
  if (val === undefined || val === null) return null;
  if (typeof val === "number" && isNaN(val)) return null;
  if (typeof val === "string") {
    const trimmed = val.trim();
    return trimmed === "" ? null : trimmed;
  }
  return String(val);
}

/** Detect if a value looks like an Excel date serial number */
function isExcelDateSerial(val: unknown): val is number {
  return typeof val === "number" && val > 40000 && val < 60000;
}

/** Detect if a value looks like an Excel time decimal (0–1 range) */
function isExcelTimeDecimal(val: unknown): val is number {
  return typeof val === "number" && val >= 0 && val < 1 && !isNaN(val);
}

/** Infer field type from sample values */
function inferFieldType(name: string, samples: unknown[]): FieldInfo["type"] {
  const nameLower = name.toLowerCase();
  if (nameLower.includes("时间") || nameLower.includes("打卡") || nameLower.includes("time"))
    return "time";
  if (nameLower.includes("日期") || nameLower.includes("date")) return "date";
  if (nameLower.includes("天数") || nameLower.includes("小时") || nameLower.includes("day"))
    return "number";

  const nonNull = samples.filter((v) => v != null);
  if (nonNull.length === 0) return "string";
  const allNum = nonNull.every((v) => typeof v === "number");
  if (allNum && nonNull.some((v) => isExcelDateSerial(v))) return "date";
  if (allNum && nonNull.some((v) => isExcelTimeDecimal(v))) return "time";
  return "string";
}

// ================================================================
// Data Readers
// ================================================================

const DATA_DIR = path.join(process.cwd(), "public", "data");

function readAttendance(): {
  records: RawAttendanceRecord[];
  summary: SourceValidation;
} {
  const filePath = path.join(DATA_DIR, "attendance.xlsx");
  const wb = XLSX.readFile(filePath);
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const raw = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1 });

  const headers = (raw[0] as string[]).map((h) => String(h ?? "").trim());
  const rows = raw.slice(1) as unknown[][];

  const issues: string[] = [];
  const requiredFields = ["员工工号", "日期"];

  // Check required fields exist in headers
  const missingRequired = requiredFields.filter(
    (rf) => !headers.some((h) => h.includes(rf))
  );

  // Infer field types
  const fieldTypes: FieldInfo[] = headers.map((name, i) => ({
    index: i,
    name,
    type: inferFieldType(name, rows.map((r) => r[i])),
  }));

  const records: RawAttendanceRecord[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    // Skip empty rows
    if (!row || row.length === 0 || (row.length === 1 && !row[0])) continue;

    const employeeId = nullify(row[0]);
    const name = nullify(row[1]);
    const department = nullify(row[2]);
    const dateRaw = row[3];

    // Standardize date
    let date: string | null = null;
    if (dateRaw != null && dateRaw !== "") {
      if (typeof dateRaw === "number") {
        date = serialToDate(dateRaw);
      } else {
        const s = String(dateRaw).trim();
        // Already looks like yyyy-MM-dd
        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
          date = s;
        } else {
          date = s; // Keep as-is, flag issue
          issues.push(`Row ${i + 2}: 日期格式异常 "${s}"`);
        }
      }
    }

    // Standardize times
    let checkInTime: string | null = null;
    const checkInRaw = row[4];
    if (checkInRaw != null && checkInRaw !== "" && !isNaN(Number(checkInRaw))) {
      checkInTime = decimalToTime(Number(checkInRaw));
    } else if (checkInRaw != null) {
      const s = nullify(checkInRaw);
      if (s && /^\d{1,2}:\d{2}$/.test(s)) checkInTime = s;
      else if (s) {
        checkInTime = s;
        issues.push(`Row ${i + 2}: 上班打卡时间格式异常 "${s}"`);
      }
    }

    let checkOutTime: string | null = null;
    const checkOutRaw = row[5];
    if (checkOutRaw != null && checkOutRaw !== "" && !isNaN(Number(checkOutRaw))) {
      checkOutTime = decimalToTime(Number(checkOutRaw));
    } else if (checkOutRaw != null) {
      const s = nullify(checkOutRaw);
      if (s && /^\d{1,2}:\d{2}$/.test(s)) checkOutTime = s;
      else if (s) {
        checkOutTime = s;
        issues.push(`Row ${i + 2}: 下班打卡时间格式异常 "${s}"`);
      }
    }

    // Lunch break (col 6) and work hours (col 7) — standardize if present
    let lunchBreak: string | null = null;
    const lunchRaw = row[6];
    if (lunchRaw != null && lunchRaw !== "" && !isNaN(Number(lunchRaw))) {
      lunchBreak = decimalToTime(Number(lunchRaw));
    }

    let workHours: string | null = null;
    const workRaw = row[7];
    if (workRaw != null && workRaw !== "" && !isNaN(Number(workRaw))) {
      workHours = decimalToTime(Number(workRaw));
    }

    const managerEmail = nullify(row[8]);

    // Validate required fields
    if (!employeeId) {
      issues.push(`Row ${i + 2}: 缺少员工工号`);
    }
    if (!date) {
      issues.push(`Row ${i + 2}: 缺少日期`);
    }

    records.push({
      rowIndex: i,
      employeeId,
      name,
      department,
      date,
      checkInTime,
      checkOutTime,
      lunchBreak,
      workHours,
      managerEmail,
    });
  }

  return {
    records,
    summary: {
      source: "考勤表",
      fileName: "attendance.xlsx",
      sheetName,
      rawRowCount: records.length,
      fields: fieldTypes,
      requiredFields,
      missingRequiredFields: missingRequired,
      validationPassed: missingRequired.length === 0 && issues.length === 0,
      issues,
    },
  };
}

function readBusinessTrip(): {
  records: RawBusinessTripRecord[];
  summary: SourceValidation;
} {
  const filePath = path.join(DATA_DIR, "business_trip.xlsx");
  const wb = XLSX.readFile(filePath);
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const raw = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1 });

  const headers = (raw[0] as string[]).map((h) => String(h ?? "").trim());
  const rows = raw.slice(1) as unknown[][];

  const issues: string[] = [];
  const requiredFields = ["员工工号", "开始时间", "结束时间", "审批状态"];

  const missingRequired = requiredFields.filter(
    (rf) => !headers.some((h) => h.includes(rf))
  );

  const fieldTypes: FieldInfo[] = headers.map((name, i) => ({
    index: i,
    name,
    type: inferFieldType(name, rows.map((r) => r[i])),
  }));

  const records: RawBusinessTripRecord[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0 || (row.length === 1 && !row[0])) continue;

    const employeeId = nullify(row[0]);
    const name = nullify(row[1]);
    const startRaw = row[2];
    const endRaw = row[3];
    const approvalStatusRaw = nullify(row[4]);
    const workDaysRaw = row[5];

    // Standardize dates (Excel serial → yyyy-MM-dd)
    let startDate: string | null = null;
    if (typeof startRaw === "number" && !isNaN(startRaw)) {
      startDate = serialToDate(startRaw);
    } else if (startRaw != null) {
      const s = String(startRaw).trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) startDate = s;
      else if (s !== "") {
        startDate = s;
        issues.push(`Row ${i + 2}: 开始时间格式异常 "${s}"`);
      }
    }

    let endDate: string | null = null;
    if (typeof endRaw === "number" && !isNaN(endRaw)) {
      endDate = serialToDate(endRaw);
    } else if (endRaw != null) {
      const s = String(endRaw).trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) endDate = s;
      else if (s !== "") {
        endDate = s;
        issues.push(`Row ${i + 2}: 结束时间格式异常 "${s}"`);
      }
    }

    // ★ Business trip: trim approvalStatus, check === "Approved"
    const approvalStatusTrimmed = approvalStatusRaw ? approvalStatusRaw.trim() : null;
    const isApproved = approvalStatusTrimmed === "Approved";

    let workDays: number | null = null;
    if (workDaysRaw != null && workDaysRaw !== "" && !isNaN(Number(workDaysRaw))) {
      workDays = Number(workDaysRaw);
    }

    // Validate required fields
    if (!employeeId) issues.push(`Row ${i + 2}: 缺少员工工号`);
    if (!startDate) issues.push(`Row ${i + 2}: 缺少开始时间`);
    if (!endDate) issues.push(`Row ${i + 2}: 缺少结束时间`);
    if (!approvalStatusTrimmed) issues.push(`Row ${i + 2}: 缺少审批状态`);

    records.push({
      rowIndex: i,
      employeeId,
      name,
      startDate,
      endDate,
      approvalStatusRaw,
      approvalStatusTrimmed,
      isApproved,
      workDays,
    });
  }

  return {
    records,
    summary: {
      source: "出差记录表",
      fileName: "business_trip.xlsx",
      sheetName,
      rawRowCount: records.length,
      fields: fieldTypes,
      requiredFields,
      missingRequiredFields: missingRequired,
      validationPassed: missingRequired.length === 0 && issues.length === 0,
      issues,
    },
  };
}

function readLeave(): {
  records: RawLeaveRecord[];
  summary: SourceValidation;
} {
  const filePath = path.join(DATA_DIR, "leave.xlsx");
  const wb = XLSX.readFile(filePath);
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const raw = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1 });

  const headers = (raw[0] as string[]).map((h) => String(h ?? "").trim());
  const rows = raw.slice(1) as unknown[][];

  const issues: string[] = [];
  const requiredFields = ["员工工号", "开始日期", "结束日期"];

  const missingRequired = requiredFields.filter(
    (rf) => !headers.some((h) => h.includes(rf))
  );

  const fieldTypes: FieldInfo[] = headers.map((name, i) => ({
    index: i,
    name,
    type: inferFieldType(name, rows.map((r) => r[i])),
  }));

  const records: RawLeaveRecord[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0 || (row.length === 1 && !row[0])) continue;

    const employeeId = nullify(row[0]);
    const name = nullify(row[1]);
    const startRaw = row[2];
    const endRaw = row[3];
    const dayOfWeek = nullify(row[4]);
    const leaveDaysRaw = row[5];

    let startDate: string | null = null;
    if (typeof startRaw === "number" && !isNaN(startRaw)) {
      startDate = serialToDate(startRaw);
    } else if (startRaw != null) {
      const s = String(startRaw).trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) startDate = s;
      else if (s !== "") {
        startDate = s;
        issues.push(`Row ${i + 2}: 开始日期格式异常 "${s}"`);
      }
    }

    let endDate: string | null = null;
    if (typeof endRaw === "number" && !isNaN(endRaw)) {
      endDate = serialToDate(endRaw);
    } else if (endRaw != null) {
      const s = String(endRaw).trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) endDate = s;
      else if (s !== "") {
        endDate = s;
        issues.push(`Row ${i + 2}: 结束日期格式异常 "${s}"`);
      }
    }

    let leaveDays: number | null = null;
    if (leaveDaysRaw != null && leaveDaysRaw !== "" && !isNaN(Number(leaveDaysRaw))) {
      leaveDays = Number(leaveDaysRaw);
    }

    if (!employeeId) issues.push(`Row ${i + 2}: 缺少员工工号`);
    if (!startDate) issues.push(`Row ${i + 2}: 缺少开始日期`);
    if (!endDate) issues.push(`Row ${i + 2}: 缺少结束日期`);

    records.push({
      rowIndex: i,
      employeeId,
      name,
      startDate,
      endDate,
      dayOfWeek,
      leaveDays,
    });
  }

  return {
    records,
    summary: {
      source: "休假记录表",
      fileName: "leave.xlsx",
      sheetName,
      rawRowCount: records.length,
      fields: fieldTypes,
      requiredFields,
      missingRequiredFields: missingRequired,
      validationPassed: missingRequired.length === 0 && issues.length === 0,
      issues,
    },
  };
}

// ================================================================
// Main
// ================================================================

function main() {
  console.log("=".repeat(60));
  console.log("Phase 1 — Data Import: 读取三张原始 Excel");
  console.log("=".repeat(60));

  // Read all three sources
  const attendance = readAttendance();
  const businessTrip = readBusinessTrip();
  const leave = readLeave();

  // Print summaries
  const allSources = [attendance.summary, businessTrip.summary, leave.summary];
  for (const src of allSources) {
    console.log(`\n📄 ${src.fileName}`);
    console.log(`   Sheet: "${src.sheetName}"`);
    console.log(`   Records: ${src.rawRowCount}`);
    console.log(`   Fields (${src.fields.length}): ${src.fields.map((f) => f.name).join(", ")}`);
    console.log(`   Required: ${src.requiredFields.join(", ")}`);
    console.log(`   Validation: ${src.validationPassed ? "✅ PASSED" : "⚠️ ISSUES"}`);
    if (src.issues.length > 0) {
      console.log(`   Issues (${src.issues.length}):`);
      for (const issue of src.issues.slice(0, 5)) {
        console.log(`     - ${issue}`);
      }
      if (src.issues.length > 5) console.log(`     ... and ${src.issues.length - 5} more`);
    }
  }

  // Build summary
  const summary: DataSourceSummary = {
    generatedAt: new Date().toISOString(),
    phase: "1-data-import",
    sources: allSources,
  };

  // Write JSON files
  const writeJson = (filename: string, data: unknown) => {
    const filePath = path.join(DATA_DIR, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    const kb = (Buffer.byteLength(JSON.stringify(data, null, 2)) / 1024).toFixed(1);
    console.log(`\n✅ Written: ${filename} (${kb} KB)`);
  };

  writeJson("dataSourceSummary.json", summary);
  writeJson("rawAttendanceRecords.json", attendance.records);
  writeJson("rawBusinessTripRecords.json", businessTrip.records);
  writeJson("rawLeaveRecords.json", leave.records);

  // Data standardization summary
  console.log("\n" + "=".repeat(60));
  console.log("Data Standardization / 数据标准化");
  console.log("=".repeat(60));
  console.log("• 日期：Excel 序列号 → yyyy-MM-dd 字符串");
  console.log("• 时间：Excel 小数 → HH:mm 字符串");
  console.log("• 空值：null / undefined / NaN / 空字符串 → null");
  console.log("• 出差审批状态：trim() 后判断 === \"Approved\"");
  console.log(
    `• 出差审批结果: ${businessTrip.records.filter((r) => r.isApproved).length}/${businessTrip.records.length} Approved`
  );

  console.log("\n✅ Phase 1 import complete.\n");
}

main();
