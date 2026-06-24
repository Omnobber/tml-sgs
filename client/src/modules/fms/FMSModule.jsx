import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Filler,
  Title,
  Tooltip,
  Legend
} from "chart.js";
import { Bar, Doughnut, Line, Pie } from "react-chartjs-2";
import toast, { Toaster } from "react-hot-toast";
import { useAuthStore } from "../../store/authStore";
import {
  downloadSampleFmsWorkbook,
  parseFmsImportWorkbook
} from "./importHelpers";
import { cleanText } from "./textUtils";
import {
  createFmsCallLog,
  deleteFmsCallLog,
  deleteFmsCallLogs,
  fetchFmsCallLogs,
  fetchFmsHealth,
  fetchFmsImportErrors,
  fetchFmsImportHistory,
  rollbackLastFmsImport,
  updateFmsCallLog,
  uploadFmsImportChunk
} from "./api";
import "./fms.css";
import callReportSeed from "./callReportSeed.json";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Filler, Title, Tooltip, Legend);

const ENGINEERS = [
  "RATNESH SINGH - Team Leader",
  "ADITYA SINHA",
  "ADITYA PANDEY",
  "NIHAL GUPTA",
  "RITIK GUPTA",
  "CHOTU SHARMA",
  "VIMAL PANDEY",
  "RABINDRA KARMAKAR"
];

const DIVISIONS = ["DEPARTMENTAL", "CTR", "CPS", "FRAME", "VEHICLE", "ENGINE", "FOUNDRY", "OTHER"];

const AREAS = {
  CTR: ["CTR_CENTRAL", "CTR_OFFICE", "BAY_2", "COLOUR_LINE"],
  CPS: ["BIW_LINE", "PTCED", "EDAG_LINE", "TILT_CAB"],
  FRAME: ["PRESS_5000T", "SOENEN", "KOHELAR", "LMCED"],
  VEHICLE: ["VH_LINE_1", "VH_LINE_2", "VH_LINE_3_OFFICE", "VH_LINE_1_OFFICE", "VH_LINE_3_RBT"],
  ENGINE: ["ASSEMBLY_LINE", "MACHINE_LINE", "ENGINE_CFL", "ENGINE_OFFICE", "TESTING_DISPATCH"],
  FOUNDRY: ["HPML", "SAND_PLANT", "LORAMENDI", "RAMBAUDI"],
  DEPARTMENTAL: ["N/A"],
  OTHER: ["GENERAL OFFICE", "MTC", "HOSPITAL", "AUTO GENERAL OFFICE"]
};

const ASSET_TYPES = [
  "DESKTOP PC",
  "INDUSTRIAL PC",
  "BOXER PC",
  "LAPTOP",
  "SERVER",
  "PANASONICS PDA",
  "MANAGED SWITCHED",
  "UN-MANAGED SWITCHED",
  "WIFI ACCESS POINT",
  "FIREWALL",
  "MEDIA CONVERTER",
  "FO NETWORK",
  "STP & UTP NETWORK",
  "2N NET SPEAKER",
  "IP PHONE",
  "PRINTER",
  "TOUGH BOOK",
  "UPS"
];

const ASSET_TYPES_SHORT = [
  "DESKTOP",
  "IND.PC",
  "BOXER",
  "LAPTOP",
  "SERVER",
  "PDA",
  "MGD.SW",
  "UNMGD.SW",
  "WIFI AP",
  "FWALL",
  "MEDIA",
  "FO NET",
  "STP/UTP",
  "2N SPK",
  "IP PHN",
  "PRTR",
  "T.BOOK",
  "UPS"
];

const CALL_CATEGORIES = ["NETWORK", "HARDWARE", "OPERATING SYSTEM", "INDST. APPLICATIONS"];

const ROOT_CAUSES = [
  "N/A",
  "AGEING",
  "CPU FAN",
  "OVER HEATING",
  "OVER VOLTAGE",
  "PM NOT EFFECTIVE",
  "POWER FAILURE",
  "VIRUS ATTACK",
  "PHYSICAL DAMAGE",
  "CABLE FAULT",
  "IP CONFLICT",
  "OS CORRUPTION",
  "HDD FAILURE",
  "OTHER"
];

const EQUIPMENT_LIST = [
  "N/A",
  "CMOS BATTERY",
  "RJ-45 CONNECTOR",
  "DESKTOP RAM",
  "LAPTOP RAM",
  "HDD",
  "SSD",
  "KEYBOARD",
  "MOUSE",
  "MONITOR",
  "SMPS",
  "MOTHERBOARD",
  "PROCESSOR",
  "UPS BATTERY",
  "LAN CABLE",
  "OTHER"
];

const PAGE_SIZE = 20;
const COLORS = ["#1565c0", "#00897b", "#f57c00", "#c62828", "#6a1b9a", "#2e7d32", "#ad1457", "#0277bd"];

const SAMPLE_LOG = [
  {
    incidentNo: "INC000003",
    month: "JUL-15",
    callOpenDate: "2015-07-24T14:15",
    division: "FOUNDRY",
    area: "HPML",
    machine: "Fiber Optical Cable",
    assetNo: "",
    assetNonAsset: "Non Assets",
    assetType: "FO NETWORK",
    callCategory: "NETWORK",
    equipment: "N/A",
    rootCause: "AGEING",
    repeated: "YES",
    reportedBy: "ANAND KR MANDAL",
    description: "Fiber Optic patch cord in HPML Control Room damaged & managed switch not working.",
    attendedBy: "RATNESH SINGH - Team Leader",
    attendDate: "2015-07-24T14:35",
    actionTaken: "Customer has not allowed to work on Fiber Optic patch cord",
    status: "OPEN",
    closedDate: "2015-07-24T14:50",
    pendingSide: "TML",
    remarks: ""
  },
  {
    incidentNo: "INC000475",
    month: "OCT-15",
    callOpenDate: "2015-10-16T07:05",
    division: "FOUNDRY",
    area: "SAND_PLANT",
    machine: "OLD SMC",
    assetNo: "",
    assetNonAsset: "Assets",
    assetType: "DESKTOP PC",
    callCategory: "OPERATING SYSTEM",
    equipment: "N/A",
    rootCause: "OS CORRUPTION",
    repeated: "NO",
    reportedBy: "ANAND KR MANDAL",
    description: "Virtual O/S not booting & blue dump coming",
    attendedBy: "ADITYA SINHA",
    attendDate: "2015-10-16T08:10",
    actionTaken: "Checked base O/S found malfunctioning",
    status: "HOLD",
    closedDate: "2015-10-16T08:40",
    pendingSide: "TML",
    remarks: "Capacitor damaged"
  },
  {
    incidentNo: "INC000524",
    month: "DEC-15",
    callOpenDate: "2015-12-22T10:15",
    division: "CPS",
    area: "BIW_LINE",
    machine: "WT BIW (MOP) 4",
    assetNo: "",
    assetNonAsset: "Assets",
    assetType: "INDUSTRIAL PC",
    callCategory: "NETWORK",
    equipment: "N/A",
    rootCause: "IP CONFLICT",
    repeated: "YES",
    reportedBy: "SUBRATO",
    description: "PC is not communicating with andon board.",
    attendedBy: "ADITYA PANDEY",
    attendDate: "2015-12-22T10:30",
    actionTaken: "Found IP configuration issue.",
    status: "CLOSED",
    closedDate: "2015-12-22T12:15",
    pendingSide: "TML",
    remarks: ""
  },
  {
    incidentNo: "INC000722",
    month: "FEB-16",
    callOpenDate: "2016-02-01T08:20",
    division: "ENGINE",
    area: "MACHINE_LINE",
    machine: "ZOLLER PC 02",
    assetNo: "",
    assetNonAsset: "Assets",
    assetType: "INDUSTRIAL PC",
    callCategory: "HARDWARE",
    equipment: "SMPS",
    rootCause: "AGEING",
    repeated: "NO",
    reportedBy: "MUKESH SAW",
    description: "PC is not switching on.",
    attendedBy: "NIHAL GUPTA",
    attendDate: "2016-02-01T08:30",
    actionTaken: "SMPS not working.",
    status: "HOLD",
    closedDate: "2016-02-01T11:30",
    pendingSide: "TML",
    remarks: "PC sent to TRC"
  },
  {
    incidentNo: "INC000859",
    month: "APR-16",
    callOpenDate: "2016-04-11T15:00",
    division: "FRAME",
    area: "PRESS_5000T",
    machine: "SCADA PC (5000T)",
    assetNo: "",
    assetNonAsset: "Assets",
    assetType: "INDUSTRIAL PC",
    callCategory: "OPERATING SYSTEM",
    equipment: "PROCESSOR",
    rootCause: "OVER HEATING",
    repeated: "NO",
    reportedBy: "ASHISH VERMA",
    description: "System getting restart frequently.",
    attendedBy: "RITIK GUPTA",
    attendDate: "2016-04-11T15:30",
    actionTaken: "Cleaned processor, applied paste.",
    status: "CLOSED",
    closedDate: "2016-04-11T17:00",
    pendingSide: "TML",
    remarks: ""
  }
];

const SAMPLE_ASSETS = [
  {
    division: "DEPARTMENTAL",
    line: "CTR_CENTRAL",
    subloc: "IBM SERVER",
    assetNo: "CETCSJSR0001",
    hostName: "CEDPSVHC01",
    pmFreq: "HALF YEARLY",
    sapId: ""
  },
  {
    division: "DEPARTMENTAL",
    line: "CTR_CENTRAL",
    subloc: "HP SERVER",
    assetNo: "CETCSJSR0002",
    hostName: "CEDPSVHC02",
    pmFreq: "HALF YEARLY",
    sapId: ""
  },
  {
    division: "CPS",
    line: "BIW_LINE",
    subloc: "WT BIW (MOP) 1",
    assetNo: "CETCSCPS0001",
    hostName: "CPSBIWPC01",
    pmFreq: "QUARTERLY",
    sapId: ""
  },
  {
    division: "ENGINE",
    line: "MACHINE_LINE",
    subloc: "ZOLLER PC 02",
    assetNo: "CETCSENG0002",
    hostName: "ENGMCPC02",
    pmFreq: "QUARTERLY",
    sapId: ""
  }
];

function calcMinutes(t1, t2) {
  if (!t1 || !t2) return "-";
  const diff = (new Date(t2) - new Date(t1)) / 60000;
  return Number.isNaN(diff) || diff < 0 ? "-" : Math.round(diff);
}

function fmtDT(dt) {
  if (!dt) return "";
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return dt;
  return (
    d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" }) +
    " " +
    d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false })
  );
}

function genIncNo(logData) {
  const nums = logData.map((r) => parseInt(String(r.incidentNo || "").replace(/\D/g, ""), 10) || 0);
  const max = nums.length ? Math.max(...nums) : 0;
  return `INC${(max + 1).toString().padStart(6, "0")}`;
}

function normalizeComparable(value) {
  return cleanText(value).toLowerCase();
}

function sameValue(left, right) {
  return normalizeComparable(left) === normalizeComparable(right);
}

function parseNumber(value) {
  const text = cleanText(value);
  if (!text) return null;
  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}

function excelSerialToIso(value) {
  const serial = parseNumber(value);
  if (serial === null) return cleanText(value);
  const base = new Date(Date.UTC(1899, 11, 30));
  const result = new Date(base.getTime() + serial * 24 * 60 * 60 * 1000);
  return result.toISOString().slice(0, 16);
}

function normalizeDateValue(value) {
  const text = cleanText(value);
  if (!text) return "";
  if (/^\d+(\.\d+)?$/.test(text)) return excelSerialToIso(text);
  return text;
}

function normalizeStatus(value) {
  return cleanText(value).toUpperCase();
}

function uniqueValues(records, key) {
  const seen = new Set();
  const values = [];
  records.forEach((record) => {
    const value = cleanText(record[key]);
    if (!value) return;
    const normalized = normalizeComparable(value);
    if (seen.has(normalized)) return;
    seen.add(normalized);
    values.push(value);
  });
  return values.sort((left, right) => left.localeCompare(right, undefined, { sensitivity: "base" }));
}

const DASHBOARD_TIME_RANGE_OPTIONS = [
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "yearly", label: "Yearly" }
];

function parseDashboardDate(value) {
  const text = cleanText(value);
  if (!text) return null;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function startOfWeek(date) {
  const next = startOfDay(date);
  const dayIndex = next.getDay();
  const offset = (dayIndex + 6) % 7;
  next.setDate(next.getDate() - offset);
  return next;
}

function startOfMonth(date) {
  const next = startOfDay(date);
  next.setDate(1);
  return next;
}

function startOfYear(date) {
  const next = startOfDay(date);
  next.setMonth(0, 1);
  return next;
}

function getDashboardDate(record) {
  return parseDashboardDate(record.callOpenDate) || parseDashboardDate(record.closedDate);
}

function getLatestDashboardDate(records) {
  const dates = records
    .map((record) => getDashboardDate(record))
    .filter((date) => date instanceof Date && !Number.isNaN(date.getTime()))
    .sort((left, right) => right.getTime() - left.getTime());
  return dates[0] || null;
}

function isRecordWithinDashboardRange(record, range, referenceDate) {
  const date = getDashboardDate(record);
  if (!date) return false;

  const now = referenceDate instanceof Date && !Number.isNaN(referenceDate.getTime()) ? referenceDate : new Date();
  if (range === "weekly") return date >= startOfWeek(now) && date <= now;
  if (range === "yearly") return date >= startOfYear(now) && date <= now;
  return date >= startOfMonth(now) && date <= now;
}

function buildDashboardTrendSeries(records, range, referenceDate) {
  const now = referenceDate instanceof Date && !Number.isNaN(referenceDate.getTime()) ? referenceDate : new Date();

  if (range === "weekly") {
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const counts = Object.fromEntries(labels.map((label) => [label, 0]));
    records.forEach((record) => {
      const date = getDashboardDate(record);
      if (!date) return;
      const label = labels[(date.getDay() + 6) % 7];
      counts[label] += 1;
    });
    return labels.map((label) => ({ label, value: counts[label] }));
  }

  if (range === "yearly") {
    const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const counts = Object.fromEntries(labels.map((label) => [label, 0]));
    records.forEach((record) => {
      const date = getDashboardDate(record);
      if (!date || date.getFullYear() !== now.getFullYear()) return;
      const label = labels[date.getMonth()];
      counts[label] += 1;
    });
    return labels.map((label) => ({ label, value: counts[label] }));
  }

  const dayCount = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const labels = Array.from({ length: dayCount }, (_, index) => String(index + 1).padStart(2, "0"));
  const counts = Object.fromEntries(labels.map((label) => [label, 0]));
  records.forEach((record) => {
    const date = getDashboardDate(record);
    if (!date || date.getFullYear() !== now.getFullYear() || date.getMonth() !== now.getMonth()) return;
    const label = String(date.getDate()).padStart(2, "0");
    counts[label] += 1;
  });
  return labels.map((label) => ({ label, value: counts[label] }));
}

function normalizeLogRecord(record = {}, options = {}) {
  const defaultSyncStatus = options.defaultSyncStatus || "synced";
  const normalized = {
    ...record,
    incidentNo: cleanText(record.incidentNo),
    clientRequestId: cleanText(record.clientRequestId || record.client_request_id),
    month: cleanText(record.month),
    callOpenDate: normalizeDateValue(record.callOpenDate),
    division: cleanText(record.division),
    area: cleanText(record.area),
    machine: cleanText(record.machine),
    assetNo: cleanText(record.assetNo),
    equipmentName: cleanText(record.equipmentName),
    assetNonAsset: cleanText(record.assetNonAsset) || "Assets",
    natureOfCall: cleanText(record.natureOfCall),
    assetType: cleanText(record.assetType),
    callCategory: cleanText(record.callCategory),
    equipment: cleanText(record.equipment) || "N/A",
    repeated: normalizeStatus(record.repeated) || "NO",
    reportedBy: cleanText(record.reportedBy),
    description: cleanText(record.description),
    attendedBy: cleanText(record.attendedBy),
    attendDate: normalizeDateValue(record.attendDate),
    actionTaken: cleanText(record.actionTaken),
    status: normalizeStatus(record.status) || "OPEN",
    closedDate: normalizeDateValue(record.closedDate),
    responseMinutes: parseNumber(record.responseMinutes),
    resolutionMinutes: parseNumber(record.resolutionMinutes),
    downtimeMinutes: parseNumber(record.downtimeMinutes),
    pendingSide: cleanText(record.pendingSide),
    remarks: cleanText(record.remarks),
    syncStatus: cleanText(record.syncStatus) || (cleanText(record.clientRequestId || record.client_request_id) ? "pending" : defaultSyncStatus),
    syncError: cleanText(record.syncError),
    syncAction: cleanText(record.syncAction) || (cleanText(record.id) ? "synced" : "")
  };

  if (normalized.responseMinutes === null) {
    const computed = calcMinutes(normalized.callOpenDate, normalized.attendDate);
    normalized.responseMinutes = computed === "-" ? null : computed;
  }

  if (normalized.resolutionMinutes === null) {
    const computed = calcMinutes(normalized.attendDate, normalized.closedDate);
    normalized.resolutionMinutes = computed === "-" ? null : computed;
  }

  if (normalized.downtimeMinutes === null) {
    const computed = calcMinutes(normalized.callOpenDate, normalized.closedDate);
    normalized.downtimeMinutes = computed === "-" ? null : computed;
  }

  return normalized;
}

function normalizeLogData(records = [], options = {}) {
  return Array.isArray(records) ? records.map((record) => normalizeLogRecord(record, options)) : [];
}

function getTimingValue(record, timingKey, startKey, endKey) {
  const direct = record[timingKey];
  if (direct !== undefined && direct !== null && direct !== "") return direct;
  const computed = calcMinutes(record[startKey], record[endKey]);
  return computed === "-" ? "" : computed;
}

function getTimingNumber(record, timingKey, startKey, endKey) {
  const direct = record[timingKey];
  if (direct !== undefined && direct !== null && direct !== "") {
    const number = Number(direct);
    return Number.isFinite(number) ? number : null;
  }
  const computed = calcMinutes(record[startKey], record[endKey]);
  return computed === "-" ? null : computed;
}

function countMatches(records, key, value) {
  return records.filter((record) => sameValue(record[key], value)).length;
}

const memoryStorage = new Map();

function load(key, def) {
  try {
    const raw = localStorage.getItem(key);
    if (raw !== null) return JSON.parse(raw);
  } catch {
    // Fall back to the in-memory cache or the provided default.
  }
  if (memoryStorage.has(key)) {
    try {
      return JSON.parse(memoryStorage.get(key));
    } catch {
      return def;
    }
  }
  return def;
}

function save(key, val) {
  const serialized = JSON.stringify(val);
  try {
    localStorage.setItem(key, serialized);
    memoryStorage.delete(key);
    return true;
  } catch (error) {
    memoryStorage.set(key, serialized);
    console.warn(`Unable to persist ${key} to localStorage; keeping it in memory for this session.`, error);
    return false;
  }
}

function getVisiblePages(totalPages, currentPage) {
  const pages = [];
  for (let i = 1; i <= totalPages; i += 1) {
    if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
      pages.push(i);
    } else if (Math.abs(i - currentPage) === 2) {
      pages.push("...");
    }
  }
  return pages;
}

function Pagination({ total, currentPage, onPageChange }) {
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;
  const start = (currentPage - 1) * PAGE_SIZE + 1;
  const end = Math.min(currentPage * PAGE_SIZE, total);
  const pages = getVisiblePages(totalPages, currentPage);

  return (
    <div className="pagination">
      <span className="pagination-info">
        Showing {total ? start : 0}-{end} of {total} records
      </span>
      <div className="page-btns">
        {pages.map((p, idx) =>
          p === "..." ? (
            <span key={`${p}-${idx}`} style={{ padding: "0 4px", fontSize: 12, color: "var(--text3)" }}>
              ...
            </span>
          ) : (
            <button
              key={p}
              type="button"
              className={`page-btn ${p === currentPage ? "active" : ""}`}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          )
        )}
      </div>
    </div>
  );
}

function Modal({ open, title, maxWidth, onClose, children, footer }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={(e) => (e.target === e.currentTarget ? onClose() : undefined)} role="presentation">
      <div className="modal" style={maxWidth ? { maxWidth } : undefined}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button type="button" className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">{children}</div>
        <div className="modal-footer">{footer}</div>
      </div>
    </div>
  );
}

function statusBadgeClass(status) {
  if (status === "OPEN") return "badge-open";
  if (status === "CLOSED") return "badge-closed";
  if (status === "HOLD") return "badge-hold";
  return "badge-na";
}

function doneBadgeClass(status) {
  if (status === "Done") return "badge-done";
  if (status === "Not Done") return "badge-notdone";
  return "badge-na";
}

function pmStatusClass(status) {
  if (status === "Done") return "badge-done";
  if (status === "Not Done") return "badge-notdone";
  if (status === "Late PM") return "badge-late";
  if (status === "Advanced PM") return "badge-advanced";
  return "badge-na";
}

function dustBadgeClass(level) {
  if (level === "HIGH") return "badge-high";
  if (level === "AVERAGE") return "badge-avg";
  if (level === "LOW") return "badge-low";
  return "badge-na";
}

const defaultLogForm = {
  incidentNo: "",
  month: "",
  callOpenDate: "",
  division: "",
  area: "",
  machine: "",
  assetNo: "",
  equipmentName: "",
  assetNonAsset: "Assets",
  natureOfCall: "",
  assetType: "",
  callCategory: "",
  equipment: "N/A",
  rootCause: "N/A",
  repeated: "NO",
  reportedBy: "",
  description: "",
  attendedBy: "",
  attendDate: "",
  actionTaken: "",
  status: "OPEN",
  closedDate: "",
  pendingSide: "TML",
  remarks: ""
};

const INITIAL_LOG_DATA = normalizeLogData(callReportSeed, { defaultSyncStatus: "seeded" });

const defaultPMForm = {
  month: "",
  division: "",
  area: "",
  machine: "",
  assetNo: "",
  pmFreq: "MONTHLY",
  equipId: "",
  scheduledDate: "",
  actualDate: "",
  doneBy: "",
  pmStatus: "Done",
  dustLevel: "",
  remarks: ""
};

const defaultIBForm = {
  month: "",
  division: "",
  area: "",
  machine: "",
  assetNo: "",
  backupDate: "",
  doneBy: "",
  status: "Done",
  remarks: ""
};

const defaultAVForm = {
  month: "",
  division: "",
  area: "",
  machine: "",
  assetNo: "",
  scheduledDate: "",
  avName: "Quick Heal",
  updateDate: "",
  updatedBy: "",
  status: "Done",
  remarks: ""
};

const defaultAssetForm = {
  division: "",
  line: "",
  subloc: "",
  assetNo: "",
  hostName: "",
  pmFreq: "MONTHLY",
  sapId: ""
};

const FMS_SYNC_RETRY_DELAYS_MS = [350, 1000, 2200];

function createClientRequestId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `fms-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function getRecordSyncKey(record = {}) {
  const clientRequestId = cleanText(record.clientRequestId || record.client_request_id);
  if (clientRequestId) return `request:${clientRequestId.toLowerCase()}`;

  const id = cleanText(record.id);
  if (id) return `id:${id}`;

  const incidentNo = cleanText(record.incidentNo);
  if (incidentNo) return `incident:${incidentNo.toLowerCase()}`;

  return `fallback:${cleanText(record.month).toLowerCase()}::${cleanText(record.machine).toLowerCase()}::${cleanText(record.description).toLowerCase()}`;
}

function sameLogRecord(left, right) {
  return getRecordSyncKey(left) === getRecordSyncKey(right);
}

function stripLocalMetadata(record = {}) {
  const { syncStatus, syncError, syncAction, ...payload } = record;
  return payload;
}

function getApiErrorMessage(error, fallback) {
  const responseData = error?.response?.data || {};
  const details = Array.isArray(responseData.details)
    ? responseData.details
        .map((item) => {
          if (!item) return "";
          if (typeof item === "string") return item;
          const path = item.path ? `${item.path}: ` : "";
          return `${path}${item.message || ""}`.trim();
        })
        .filter(Boolean)
    : [];
  const networkMessage = error?.request && !error?.response ? "No response from the server." : "";
  const message = responseData.message || responseData.error || error?.message || error?.code || networkMessage || fallback;
  return details.length ? `${message} (${details.join("; ")})` : message;
}

function isRetryableSyncError(error) {
  const status = error?.response?.status;
  const code = error?.code;
  return !status || [408, 425, 429, 500, 502, 503, 504].includes(status) || ["ERR_NETWORK", "ECONNABORTED", "ETIMEDOUT"].includes(code);
}

function validateLogRecord(record) {
  const requiredFields = [
    ["incidentNo", "Incident No."],
    ["month", "Month"],
    ["callOpenDate", "Call Open Date/Time"],
    ["division", "Division"],
    ["area", "Area"],
    ["machine", "Device / Machine Name"],
    ["natureOfCall", "Nature of Call"],
    ["assetType", "Type of Assets"],
    ["callCategory", "Call Category"],
    ["description", "Call Description"]
  ];

  return requiredFields.filter(([key]) => !cleanText(record[key])).map(([, label]) => label);
}

function buildSyncPayload(record = {}) {
  const payload = { ...stripLocalMetadata(record) };
  delete payload.id;
  return payload;
}

export default function FMSModule({ initialTab = "dashboard" }) {
  const userRole = useAuthStore((s) => s.user?.role || "");
  const canManage = userRole !== "client";
  const canImport = ["admin", "super_admin", "supervisor"].includes(userRole);
  const importPermissionMessage = "Only Admin and Supervisor roles can import Excel files.";

  const [activeTab, setActiveTab] = useState(initialTab);
  const [currentDate, setCurrentDate] = useState(new Date());
  const importFileRef = useRef(null);

  const [logData, setLogData] = useState(() => {
    const stored = normalizeLogData(load("sgs_log", INITIAL_LOG_DATA));
    return stored.length ? stored : INITIAL_LOG_DATA;
  });
  const [pmData, setPmData] = useState(() => load("sgs_pm", []));
  const [ibData, setIbData] = useState(() => load("sgs_ib", []));
  const [avData, setAvData] = useState(() => load("sgs_av", []));
  const [assetData, setAssetData] = useState(() => load("sgs_assets", SAMPLE_ASSETS));
  const [importHistory, setImportHistory] = useState([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importBusy, setImportBusy] = useState(false);
  const [isSavingLog, setIsSavingLog] = useState(false);
  const [isDeletingLog, setIsDeletingLog] = useState(false);
  const [isSyncingPending, setIsSyncingPending] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [serviceHealth, setServiceHealth] = useState({ status: "unknown", database: "unknown" });
  const [importMessage, setImportMessage] = useState("");
  const [dashboardTimeRange, setDashboardTimeRange] = useState("monthly");

  const [logFilter, setLogFilter] = useState({ division: "", area: "", status: "", month: "", assettype: "", category: "", search: "" });
  const [pmFilter, setPmFilter] = useState({ division: "", status: "", month: "" });
  const [ibFilter, setIbFilter] = useState({ division: "", status: "", month: "" });
  const [avFilter, setAvFilter] = useState({ division: "", avname: "", status: "", month: "" });
  const [assetSearch, setAssetSearch] = useState("");

  const [logPage, setLogPage] = useState(1);
  const [pmPage, setPmPage] = useState(1);
  const [ibPage, setIbPage] = useState(1);
  const [avPage, setAvPage] = useState(1);
  const [assetPage, setAssetPage] = useState(1);

  const [logModal, setLogModal] = useState({ open: false, idx: -1 });
  const [pmModal, setPmModal] = useState({ open: false, idx: -1 });
  const [ibModal, setIbModal] = useState({ open: false, idx: -1 });
  const [avModal, setAvModal] = useState({ open: false, idx: -1 });
  const [assetModal, setAssetModal] = useState({ open: false, idx: -1 });

  const [logForm, setLogForm] = useState(defaultLogForm);
  const [pmForm, setPMForm] = useState(defaultPMForm);
  const [ibForm, setIBForm] = useState(defaultIBForm);
  const [avForm, setAVForm] = useState(defaultAVForm);
  const [assetForm, setAssetForm] = useState(defaultAssetForm);

  const [logSort, setLogSort] = useState({ key: "", dir: 1 });
  const [busy] = useState(false);
  const [selectedLogKeys, setSelectedLogKeys] = useState([]);
  const selectAllLogRef = useRef(null);
  const logDataRef = useRef(logData);
  const latestDashboardDate = useMemo(() => getLatestDashboardDate(logData), [logData]);
  const pendingSyncCount = useMemo(() => getPendingLogRecords(logData).length, [logData]);

  useEffect(() => {
    logDataRef.current = logData;
  }, [logData]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const dashboardReferenceDate = useMemo(() => {
    if (!logData.length) return currentDate;
    const hasRangeData = logData.some((record) => isRecordWithinDashboardRange(record, dashboardTimeRange, currentDate));
    return hasRangeData ? currentDate : latestDashboardDate || currentDate;
  }, [currentDate, dashboardTimeRange, latestDashboardDate, logData]);

  const dashboardPeriodLabel = useMemo(() => {
    if (dashboardTimeRange === "monthly") {
      return dashboardReferenceDate.toLocaleString("en-IN", { month: "long", year: "numeric" });
    }
    if (dashboardTimeRange === "yearly") {
      return dashboardReferenceDate.getFullYear().toString();
    }
    return dashboardTimeRange.charAt(0).toUpperCase() + dashboardTimeRange.slice(1);
  }, [dashboardReferenceDate, dashboardTimeRange]);

  useEffect(() => {
    let cancelled = false;

    const syncRemoteCalls = async () => {
      try {
        const remoteCalls = await fetchFmsCallLogs();
        if (cancelled || !Array.isArray(remoteCalls) || !remoteCalls.length) return;

        setLogData((current) => {
          const merged = mergeLogRecords(current, remoteCalls);
          save("sgs_log", merged);
          return merged;
        });
      } catch {
        // Keep the seeded/local dataset when the API is unavailable.
      }
    };

    const syncImportHistory = async () => {
      try {
        const history = await fetchFmsImportHistory();
        if (!cancelled) {
          setImportHistory(Array.isArray(history) ? history : []);
        }
      } catch {
        if (!cancelled) setImportHistory([]);
      }
    };

    const handleOnline = () => {
      setIsOnline(true);
      refreshServiceHealth();
      refreshRemoteLogs();
      syncPendingCalls({ silent: true }).catch(() => {});
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    refreshServiceHealth();
    syncRemoteCalls();
    syncImportHistory();
    if (typeof navigator !== "undefined") {
      setIsOnline(navigator.onLine);
      if (navigator.onLine) {
        syncPendingCalls({ silent: true }).catch(() => {});
      }
    }
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      cancelled = true;
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [syncPendingCalls]);

  const uniqueMonths = useMemo(() => [...new Set(logData.map((r) => r.month).filter(Boolean))].sort(), [logData]);

  const logRowsWithIndex = useMemo(
    () =>
      logData.map((row, idx) => ({
        ...row,
        __idx: idx
      })),
    [logData]
  );

  const logDivisionOptions = useMemo(() => uniqueValues(logData, "division"), [logData]);
  const logAreaOptions = useMemo(
    () => uniqueValues(logData.filter((record) => !logFilter.division || sameValue(record.division, logFilter.division)), "area"),
    [logData, logFilter.division]
  );
  const logAssetTypeOptions = useMemo(() => uniqueValues(logData, "assetType"), [logData]);
  const logCallCategoryOptions = useMemo(() => uniqueValues(logData, "callCategory"), [logData]);
  const logNatureOptions = useMemo(() => uniqueValues(logData, "natureOfCall"), [logData]);
  const logAttendedByOptions = useMemo(() => uniqueValues(logData, "attendedBy"), [logData]);
  const logReportedByOptions = useMemo(() => uniqueValues(logData, "reportedBy"), [logData]);
  const logPendingSideOptions = useMemo(() => uniqueValues(logData, "pendingSide"), [logData]);

  useEffect(() => {
    if (logFilter.area && !logAreaOptions.some((option) => sameValue(option, logFilter.area))) {
      setLogFilter((prev) => ({ ...prev, area: "" }));
    }
  }, [logAreaOptions, logFilter.area]);

  const logFiltered = useMemo(() => {
    const search = logFilter.search.trim().toLowerCase();
    const filtered = logRowsWithIndex.filter(
      (r) =>
        (!logFilter.division || sameValue(r.division, logFilter.division)) &&
        (!logFilter.area || sameValue(r.area, logFilter.area)) &&
        (!logFilter.status || sameValue(r.status, logFilter.status)) &&
        (!logFilter.month || sameValue(r.month, logFilter.month)) &&
        (!logFilter.assettype || sameValue(r.assetType, logFilter.assettype)) &&
        (!logFilter.category || sameValue(r.callCategory, logFilter.category)) &&
        (!search ||
          (r.incidentNo || "").toLowerCase().includes(search) ||
          (r.machine || "").toLowerCase().includes(search) ||
          (r.equipmentName || "").toLowerCase().includes(search) ||
          (r.natureOfCall || "").toLowerCase().includes(search) ||
          (r.description || "").toLowerCase().includes(search) ||
          (r.reportedBy || "").toLowerCase().includes(search) ||
          (r.attendedBy || "").toLowerCase().includes(search))
    );
    if (!logSort.key) return filtered;
    return [...filtered].sort((a, b) => {
      const av = a[logSort.key] || "";
      const bv = b[logSort.key] || "";
      if (av < bv) return -logSort.dir;
      if (av > bv) return logSort.dir;
      return 0;
    });
  }, [logRowsWithIndex, logFilter, logSort]);

  const dashboardFilteredLogs = useMemo(
    () => logData.filter((record) => isRecordWithinDashboardRange(record, dashboardTimeRange, dashboardReferenceDate)),
    [dashboardReferenceDate, dashboardTimeRange, logData]
  );

  const dashboardDivisionOptions = useMemo(() => uniqueValues(dashboardFilteredLogs, "division"), [dashboardFilteredLogs]);
  const dashboardAssetTypeOptions = useMemo(() => uniqueValues(dashboardFilteredLogs, "assetType"), [dashboardFilteredLogs]);
  const dashboardCallCategoryOptions = useMemo(() => uniqueValues(dashboardFilteredLogs, "callCategory"), [dashboardFilteredLogs]);
  const dashboardNatureOptions = useMemo(() => uniqueValues(dashboardFilteredLogs, "natureOfCall"), [dashboardFilteredLogs]);
  const dashboardAttendedByOptions = useMemo(() => uniqueValues(dashboardFilteredLogs, "attendedBy"), [dashboardFilteredLogs]);
  const dashboardReportedByOptions = useMemo(() => uniqueValues(dashboardFilteredLogs, "reportedBy"), [dashboardFilteredLogs]);
  const dashboardPendingSideOptions = useMemo(() => uniqueValues(dashboardFilteredLogs, "pendingSide"), [dashboardFilteredLogs]);

  const dashboardTotalDownMinutes = useMemo(
    () =>
      dashboardFilteredLogs
        .map((record) => getTimingNumber(record, "downtimeMinutes", "callOpenDate", "closedDate"))
        .filter((value) => value !== null)
        .reduce((sum, value) => sum + value, 0),
    [dashboardFilteredLogs]
  );

  const dashboardDownList = useMemo(
    () => dashboardFilteredLogs.map((record) => getTimingNumber(record, "downtimeMinutes", "callOpenDate", "closedDate")).filter((value) => value !== null),
    [dashboardFilteredLogs]
  );

  const dashboardAvgMTTR = dashboardDownList.length ? Math.round(dashboardTotalDownMinutes / dashboardDownList.length) : 0;
  const dashboardOpenCalls = dashboardFilteredLogs.filter((record) => sameValue(record.status, "OPEN")).length;
  const dashboardClosedCalls = dashboardFilteredLogs.filter((record) => sameValue(record.status, "CLOSED")).length;
  const dashboardHoldCalls = dashboardFilteredLogs.filter((record) => sameValue(record.status, "HOLD")).length;

  const dashboardDivisionCounts = useMemo(() => {
    const result = {};
    dashboardDivisionOptions.forEach((division) => {
      result[division] = countMatches(dashboardFilteredLogs, "division", division);
    });
    return result;
  }, [dashboardDivisionOptions, dashboardFilteredLogs]);

  const dashboardDivisionDowntime = useMemo(() => {
    const result = {};
    dashboardDivisionOptions.forEach((division) => {
      result[division] = dashboardFilteredLogs
        .filter((record) => sameValue(record.division, division))
        .map((record) => getTimingNumber(record, "downtimeMinutes", "callOpenDate", "closedDate"))
        .filter((value) => value !== null)
        .reduce((sum, value) => sum + value, 0);
    });
    return result;
  }, [dashboardDivisionOptions, dashboardFilteredLogs]);

  const dashboardDivisionAvgDown = useMemo(() => {
    const result = {};
    dashboardDivisionOptions.forEach((division) => {
      result[division] = dashboardDivisionCounts[division] ? Math.round(dashboardDivisionDowntime[division] / dashboardDivisionCounts[division]) : 0;
    });
    return result;
  }, [dashboardDivisionCounts, dashboardDivisionDowntime, dashboardDivisionOptions]);

  const dashboardAssetTypeCounts = dashboardAssetTypeOptions.map((assetType) => countMatches(dashboardFilteredLogs, "assetType", assetType));
  const dashboardAssetTypeFiltered = dashboardAssetTypeOptions.map((assetType, index) => ({ t: assetType, c: dashboardAssetTypeCounts[index] })).filter((item) => item.c > 0);
  const dashboardNatureCounts = dashboardNatureOptions.map((nature) => countMatches(dashboardFilteredLogs, "natureOfCall", nature));
  const dashboardCallCategoryCounts = dashboardCallCategoryOptions.map((category) => countMatches(dashboardFilteredLogs, "callCategory", category));

  const dashboardStatusByDivision = {
    OPEN: dashboardDivisionOptions.map((division) => dashboardFilteredLogs.filter((record) => sameValue(record.division, division) && sameValue(record.status, "OPEN")).length),
    CLOSED: dashboardDivisionOptions.map((division) => dashboardFilteredLogs.filter((record) => sameValue(record.division, division) && sameValue(record.status, "CLOSED")).length),
    HOLD: dashboardDivisionOptions.map((division) => dashboardFilteredLogs.filter((record) => sameValue(record.division, division) && sameValue(record.status, "HOLD")).length)
  };

  const dashboardMonthSeries = useMemo(
    () => buildDashboardTrendSeries(dashboardFilteredLogs, dashboardTimeRange, dashboardReferenceDate),
    [dashboardReferenceDate, dashboardFilteredLogs, dashboardTimeRange]
  );

  const pmFiltered = useMemo(
    () =>
      pmData
        .map((row, idx) => ({ ...row, __idx: idx }))
        .filter((r) => (!pmFilter.division || r.division === pmFilter.division) && (!pmFilter.status || r.pmStatus === pmFilter.status) && (!pmFilter.month || r.month === pmFilter.month)),
    [pmData, pmFilter]
  );

  const ibFiltered = useMemo(
    () =>
      ibData
        .map((row, idx) => ({ ...row, __idx: idx }))
        .filter((r) => (!ibFilter.division || r.division === ibFilter.division) && (!ibFilter.status || r.status === ibFilter.status) && (!ibFilter.month || r.month === ibFilter.month)),
    [ibData, ibFilter]
  );

  const avFiltered = useMemo(
    () =>
      avData
        .map((row, idx) => ({ ...row, __idx: idx }))
        .filter(
          (r) =>
            (!avFilter.division || r.division === avFilter.division) &&
            (!avFilter.avname || r.avName === avFilter.avname) &&
            (!avFilter.status || r.status === avFilter.status) &&
            (!avFilter.month || r.month === avFilter.month)
        ),
    [avData, avFilter]
  );

  const assetFiltered = useMemo(() => {
    const search = assetSearch.trim().toLowerCase();
    return assetData
      .map((row, idx) => ({ ...row, __idx: idx }))
      .filter(
        (r) =>
          !search ||
          (r.assetNo || "").toLowerCase().includes(search) ||
          (r.subloc || "").toLowerCase().includes(search) ||
          (r.hostName || "").toLowerCase().includes(search)
      );
  }, [assetData, assetSearch]);

  useEffect(() => setLogPage(1), [logFilter, logSort]);
  useEffect(() => setPmPage(1), [pmFilter]);
  useEffect(() => setIbPage(1), [ibFilter]);
  useEffect(() => setAvPage(1), [avFilter]);
  useEffect(() => setAssetPage(1), [assetSearch]);

  const pagedLog = useMemo(() => logFiltered.slice((logPage - 1) * PAGE_SIZE, logPage * PAGE_SIZE), [logFiltered, logPage]);
  const pagedPM = useMemo(() => pmFiltered.slice((pmPage - 1) * PAGE_SIZE, pmPage * PAGE_SIZE), [pmFiltered, pmPage]);
  const pagedIB = useMemo(() => ibFiltered.slice((ibPage - 1) * PAGE_SIZE, ibPage * PAGE_SIZE), [ibFiltered, ibPage]);
  const pagedAV = useMemo(() => avFiltered.slice((avPage - 1) * PAGE_SIZE, avPage * PAGE_SIZE), [avFiltered, avPage]);
  const pagedAssets = useMemo(() => assetFiltered.slice((assetPage - 1) * PAGE_SIZE, assetPage * PAGE_SIZE), [assetFiltered, assetPage]);
  const logSelectionKeyForRow = (row) => String(row.clientRequestId || row.client_request_id || row.id || row.incidentNo || row.__idx);
  const selectedLogRecords = useMemo(() => {
    const keySet = new Set(selectedLogKeys);
    return logData
      .map((record, idx) => ({ record, idx, key: logSelectionKeyForRow({ ...record, __idx: idx }) }))
      .filter((entry) => keySet.has(entry.key));
  }, [logData, selectedLogKeys]);
  const selectedLogCount = selectedLogRecords.length;
  const selectedLogKeySet = useMemo(() => new Set(selectedLogKeys), [selectedLogKeys]);
  const allFilteredLogsSelected = logFiltered.length > 0 && logFiltered.every((row) => selectedLogKeySet.has(logSelectionKeyForRow(row)));
  const someFilteredLogsSelected = logFiltered.some((row) => selectedLogKeySet.has(logSelectionKeyForRow(row)));

  useEffect(() => {
    if (selectAllLogRef.current) {
      selectAllLogRef.current.indeterminate = someFilteredLogsSelected && !allFilteredLogsSelected;
    }
  }, [allFilteredLogsSelected, someFilteredLogsSelected]);

  useEffect(() => {
    setSelectedLogKeys((current) => {
      const validKeys = new Set(logRowsWithIndex.map((row) => logSelectionKeyForRow(row)));
      const next = current.filter((key) => validKeys.has(key));
      return next.length === current.length ? current : next;
    });
  }, [logRowsWithIndex]);

  const totalDownMinutes = useMemo(
    () =>
      logData
        .map((r) => getTimingNumber(r, "downtimeMinutes", "callOpenDate", "closedDate"))
        .filter((v) => v !== null)
        .reduce((a, b) => a + b, 0),
    [logData]
  );
  const downList = useMemo(
    () => logData.map((r) => getTimingNumber(r, "downtimeMinutes", "callOpenDate", "closedDate")).filter((v) => v !== null),
    [logData]
  );
  const avgMTTR = downList.length ? Math.round(totalDownMinutes / downList.length) : 0;
  const openCalls = logData.filter((r) => sameValue(r.status, "OPEN")).length;
  const closedCalls = logData.filter((r) => sameValue(r.status, "CLOSED")).length;
  const holdCalls = logData.filter((r) => sameValue(r.status, "HOLD")).length;

  const divisionCounts = useMemo(() => {
    const result = {};
    logDivisionOptions.forEach((division) => {
      result[division] = countMatches(logData, "division", division);
    });
    return result;
  }, [logData, logDivisionOptions]);

  const divisionDowntime = useMemo(() => {
    const result = {};
    logDivisionOptions.forEach((division) => {
      result[division] = logData
        .filter((record) => sameValue(record.division, division))
        .map((record) => getTimingNumber(record, "downtimeMinutes", "callOpenDate", "closedDate"))
        .filter((value) => value !== null)
        .reduce((sum, value) => sum + value, 0);
    });
    return result;
  }, [logData, logDivisionOptions]);

  const divisionAvgDown = useMemo(() => {
    const result = {};
    logDivisionOptions.forEach((division) => {
      result[division] = divisionCounts[division] ? Math.round(divisionDowntime[division] / divisionCounts[division]) : 0;
    });
    return result;
  }, [divisionCounts, divisionDowntime, logDivisionOptions]);

  const monthMap = useMemo(() => {
    const result = {};
    logData.forEach((r) => {
      if (r.month) result[r.month] = (result[r.month] || 0) + 1;
    });
    return result;
  }, [logData]);

  const monthLabels = useMemo(() => Object.keys(monthMap).sort(), [monthMap]);
  const assetTypeCounts = logAssetTypeOptions.map((assetType) => countMatches(logData, "assetType", assetType));
  const assetTypeFiltered = logAssetTypeOptions.map((assetType, index) => ({ t: assetType, c: assetTypeCounts[index] })).filter((x) => x.c > 0);
  const natureCounts = logNatureOptions.map((nature) => countMatches(logData, "natureOfCall", nature));
  const callCategoryCounts = logCallCategoryOptions.map((category) => countMatches(logData, "callCategory", category));
  const statusByDivision = {
    OPEN: logDivisionOptions.map((division) => logData.filter((record) => sameValue(record.division, division) && sameValue(record.status, "OPEN")).length),
    CLOSED: logDivisionOptions.map((division) => logData.filter((record) => sameValue(record.division, division) && sameValue(record.status, "CLOSED")).length),
    HOLD: logDivisionOptions.map((division) => logData.filter((record) => sameValue(record.division, division) && sameValue(record.status, "HOLD")).length)
  };

  const analysisRows = useMemo(
    () =>
      logDivisionOptions.map((division) => {
        const calls = logData.filter((record) => sameValue(record.division, division));
        const downs = calls.map((record) => getTimingNumber(record, "downtimeMinutes", "callOpenDate", "closedDate")).filter((value) => value !== null);
        const total = downs.reduce((sum, value) => sum + value, 0);
        const avg = calls.length ? Math.round(total / calls.length) : 0;
        return { division, cnt: calls.length, tot: total, avg };
      })
        .filter((r) => r.cnt > 0)
        .sort((a, b) => b.avg - a.avg)
        .map((r, idx) => ({ ...r, rank: idx + 1 })),
    [logData, logDivisionOptions]
  );

  const totalAnalysisCount = analysisRows.reduce((a, r) => a + r.cnt, 0);
  const totalAnalysisDowntime = analysisRows.reduce((a, r) => a + r.tot, 0);
  const globalAnalysisAvg = totalAnalysisCount ? Math.round(totalAnalysisDowntime / totalAnalysisCount) : 0;

  const pivotData = useMemo(() => {
    const colTotals = logAssetTypeOptions.map(() => 0);
    const rows = logDivisionOptions.map((division) => {
      const values = logAssetTypeOptions.map((type, idx) => {
        const count = logData.filter((record) => sameValue(record.division, division) && sameValue(record.assetType, type)).length;
        colTotals[idx] += count;
        return count;
      });
      const total = values.reduce((a, b) => a + b, 0);
      return { division, values, total };
    });
    return { rows, colTotals, grandTotal: colTotals.reduce((a, b) => a + b, 0) };
  }, [logData, logAssetTypeOptions, logDivisionOptions]);

  const engineerRows = useMemo(
    () =>
      logAttendedByOptions.map((eng) => {
        const calls = logData.filter((record) => sameValue(record.attendedBy, eng));
        const responses = calls.map((record) => getTimingNumber(record, "responseMinutes", "callOpenDate", "attendDate")).filter((value) => value !== null);
        const resolutions = calls.map((record) => getTimingNumber(record, "resolutionMinutes", "attendDate", "closedDate")).filter((value) => value !== null);
        const avgResponse = responses.length ? Math.round(responses.reduce((sum, value) => sum + value, 0) / responses.length) : 0;
        const avgResolution = resolutions.length ? Math.round(resolutions.reduce((sum, value) => sum + value, 0) / resolutions.length) : 0;
        const closed = calls.filter((record) => sameValue(record.status, "CLOSED")).length;
        const openHold = calls.filter((record) => !sameValue(record.status, "CLOSED")).length;
        return { eng, total: calls.length, avgResponse, avgResolution, closed, openHold };
      }),
    [logAttendedByOptions, logData]
  );

  const baseBarOptions = { responsive: true, maintainAspectRatio: false, scales: { x: { ticks: { font: { size: 9 }, maxRotation: 30 } }, y: { ticks: { font: { size: 9 } } } } };
  const pieOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "right", labels: { font: { size: 10 }, boxWidth: 12 } } } };

  function sortLog(key) {
    setLogSort((prev) => (prev.key === key ? { key, dir: -prev.dir } : { key, dir: 1 }));
  }

  function toggleLogSelection(rowKey) {
    setSelectedLogKeys((current) => (current.includes(rowKey) ? current.filter((key) => key !== rowKey) : [...current, rowKey]));
  }

  function toggleAllFilteredLogs(checked) {
    const filteredKeys = logFiltered.map((row) => logSelectionKeyForRow(row));
    setSelectedLogKeys((current) => {
      const currentSet = new Set(current);
      if (checked) {
        filteredKeys.forEach((key) => currentSet.add(key));
      } else {
        filteredKeys.forEach((key) => currentSet.delete(key));
      }
      return [...currentSet];
    });
  }

  function clearSelectedLogs() {
    setSelectedLogKeys([]);
  }

  function getSelectedLogEntries(targetKeys = selectedLogKeys) {
    const keySet = new Set(targetKeys);
    return logDataRef.current
      .map((record, idx) => ({ record, idx, key: logSelectionKeyForRow({ ...record, __idx: idx }) }))
      .filter((entry) => keySet.has(entry.key));
  }

  async function deleteLogEntries(targetKeys = selectedLogKeys) {
    const entries = getSelectedLogEntries(targetKeys);
    if (!entries.length) {
      toast.error("Select one or more call records to delete.");
      return;
    }

    const importedEntries = entries.filter(({ record }) => Boolean(record.importBatchId));
    if (importedEntries.length) {
      toast.error("Imported rows can only be removed through rollback.");
      return;
    }

    const selectionLabel =
      entries.length === 1
        ? `Delete call ${entries[0].record.incidentNo || entries[0].record.id || ""}?`
        : `Delete ${entries.length} selected call records?`;
    if (!window.confirm(selectionLabel)) {
      return;
    }

    const snapshot = logDataRef.current;
    const targetKeySet = new Set(entries.map((entry) => entry.key));
    const nextLocal = snapshot.filter((record, idx) => !targetKeySet.has(logSelectionKeyForRow({ ...record, __idx: idx })));
    const serverIds = entries.map(({ record }) => record.id).filter((id) => Number.isInteger(Number(id)) && Number(id) > 0);

    try {
      setIsDeletingLog(true);

      if (serverIds.length) {
        if (typeof navigator !== "undefined" && navigator.onLine === false) {
          throw new Error("You are offline right now.");
        }

        const health = await refreshServiceHealth();
        if (health?.database && health.database !== "ok") {
          throw new Error(health.message || "Database is temporarily unavailable.");
        }

        if (serverIds.length === 1) {
          await deleteFmsCallLog(serverIds[0]);
        } else {
          await deleteFmsCallLogs(serverIds);
        }
      }

      const normalized = normalizeLogData(nextLocal, { defaultSyncStatus: "synced" });
      setLogData(normalized);
      save("sgs_log", normalized);
      setSelectedLogKeys((current) => current.filter((key) => !targetKeySet.has(key)));
      await refreshRemoteLogs();
      toast.success(entries.length === 1 ? "Call record deleted." : `${entries.length} call records deleted.`);
    } catch (error) {
      setLogData(snapshot);
      save("sgs_log", snapshot);
      const message = getApiErrorMessage(error, "Unable to delete the selected call record(s).");
      console.error("FMS call delete failed:", {
        message,
        status: error?.response?.status,
        code: error?.code,
        selectedCount: entries.length,
        serverIds
      });
      toast.error(message);
    } finally {
      setIsDeletingLog(false);
    }
  }

  function mergeLogRecord(existing, incoming) {
    const merged = { ...(existing || {}) };
    Object.entries(incoming || {}).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      merged[key] = value;
    });
    if (existing?.clientRequestId && !merged.clientRequestId) {
      merged.clientRequestId = existing.clientRequestId;
    }
    if (existing?.syncStatus && !merged.syncStatus) {
      merged.syncStatus = existing.syncStatus;
    }
    if (existing?.syncError && !merged.syncError) {
      merged.syncError = existing.syncError;
    }
    if (existing?.syncAction && !merged.syncAction) {
      merged.syncAction = existing.syncAction;
    }
    return merged;
  }

  function mergeLogRecords(existing, incoming) {
    const map = new Map();
    existing
      .filter((record) => !record.importBatchId)
      .forEach((record) => {
        const key = getRecordSyncKey(record);
        if (!key) return;
        map.set(key, record);
      });
    incoming.forEach((record) => {
      const key = getRecordSyncKey(record);
      if (!key) return;
      map.set(key, mergeLogRecord(map.get(key), record));
    });
    return normalizeLogData([...map.values()]);
  }

  function refreshHistory() {
    return fetchFmsImportHistory()
      .then((history) => {
        setImportHistory(Array.isArray(history) ? history : []);
        return history;
      })
      .catch(() => []);
  }

  function refreshRemoteLogs() {
    return fetchFmsCallLogs()
      .then((calls) => {
        if (!Array.isArray(calls) || !calls.length) return [];
        setLogData((current) => {
          const merged = mergeLogRecords(current, calls);
          save("sgs_log", merged);
          return merged;
        });
        return calls;
      })
      .catch(() => []);
  }

  function refreshServiceHealth() {
    return fetchFmsHealth()
      .then((health) => {
        setServiceHealth({
          status: health?.status || "unknown",
          database: health?.database || "unknown"
        });
        return health;
      })
      .catch((error) => {
        const data = error?.response?.data || {};
        setServiceHealth({
          status: data.status || (error?.response?.status === 503 ? "degraded" : "unknown"),
          database: data.database || "unavailable"
        });
        return data;
      });
  }

  function getPendingLogRecords(records = logData) {
    return records.filter((record) => {
      const hasSyncIdentity = Boolean(cleanText(record.clientRequestId || record.client_request_id) || cleanText(record.id));
      return hasSyncIdentity && record.syncStatus === "pending";
    });
  }

  function applyServerRecordToLocal(records, localRecord, serverRecord, syncAction = localRecord?.syncAction || "create") {
    const nextRecord = normalizeLogRecord(
      {
        ...(localRecord || {}),
        ...(serverRecord || {}),
        id: serverRecord?.id ?? localRecord?.id ?? null,
        clientRequestId: localRecord?.clientRequestId || serverRecord?.clientRequestId || serverRecord?.client_request_id || "",
        syncStatus: "synced",
        syncError: "",
        syncAction: syncAction === "update" ? "update" : "synced"
      },
      { defaultSyncStatus: "synced" }
    );

    return records.map((record) => (sameLogRecord(record, localRecord) ? nextRecord : record));
  }

  function markRecordSyncError(records, targetRecord, message, syncStatus = "pending", syncAction = targetRecord?.syncAction || "create") {
    return records.map((record) =>
      sameLogRecord(record, targetRecord)
        ? normalizeLogRecord(
            {
              ...record,
              syncStatus,
              syncError: message,
              syncAction
            },
            { defaultSyncStatus: syncStatus }
          )
        : record
    );
  }

  async function syncSingleRecord(record) {
    const payload = buildSyncPayload(record);
    if (record?.id && record.syncAction === "update") {
      return updateFmsCallLog(record.id, payload);
    }
    return createFmsCallLog(payload);
  }

  const syncPendingCalls = useCallback(
    async ({ silent = false } = {}) => {
      const pendingRecords = getPendingLogRecords(logDataRef.current);
      if (!pendingRecords.length) {
        if (!silent) {
          toast.success("No pending FMS calls to sync.");
        }
        return { synced: 0, pending: 0 };
      }

      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        if (!silent) {
          toast.error("You are offline. Pending FMS calls will sync when the connection returns.");
        }
        return { synced: 0, pending: pendingRecords.length };
      }

      setIsSyncingPending(true);
      try {
        const health = await refreshServiceHealth();
        if (health && health.database && health.database !== "ok") {
          throw new Error(health.message || "Database is temporarily unavailable.");
        }

        let working = [...logDataRef.current];
        let synced = 0;

        for (const record of pendingRecords) {
          let lastError = null;
          let serverRecord = null;

          for (let attempt = 0; attempt <= FMS_SYNC_RETRY_DELAYS_MS.length; attempt += 1) {
            try {
              serverRecord = await syncSingleRecord(record);
              lastError = null;
              break;
            } catch (error) {
              lastError = error;
              if (attempt >= FMS_SYNC_RETRY_DELAYS_MS.length || !isRetryableSyncError(error)) {
                break;
              }
              await wait(FMS_SYNC_RETRY_DELAYS_MS[attempt]);
            }
          }

          if (serverRecord) {
            working = applyServerRecordToLocal(working, record, serverRecord, record.syncAction || "create");
            synced += 1;
          } else if (lastError) {
            const message = getApiErrorMessage(lastError, "Unable to sync pending FMS call.");
            working = markRecordSyncError(
              working,
              record,
              message,
              isRetryableSyncError(lastError) ? "pending" : "error",
              record.syncAction || "create"
            );
            if (!silent) {
              toast.error(message);
            }
          }
        }

        const normalized = normalizeLogData(working, { defaultSyncStatus: "synced" });
        setLogData(normalized);
        save("sgs_log", normalized);
        await refreshRemoteLogs();

        if (!silent && synced > 0) {
          toast.success(`Synced ${synced} pending FMS call${synced === 1 ? "" : "s"}.`);
        }

        return { synced, pending: pendingRecords.length - synced };
      } catch (error) {
        const message = getApiErrorMessage(error, "Unable to sync pending FMS calls.");
        if (!silent) {
          toast.error(message);
        }
        throw error;
      } finally {
        setIsSyncingPending(false);
      }
    },
    []
  );

  function triggerImportDialog() {
    if (importBusy) {
      return;
    }

    if (!canImport) {
      toast.error(importPermissionMessage);
      return;
    }

    const input = importFileRef.current;
    if (!input) {
      toast.error("Import file picker is not available right now.");
      return;
    }

    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }

    input.click();
  }

  async function handleImportFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!canImport) {
      toast.error(importPermissionMessage);
      return;
    }

    const name = file.name.toLowerCase();
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel"
    ];
    if (!allowedTypes.includes(file.type) && !name.endsWith(".xlsx") && !name.endsWith(".xls")) {
      toast.error("Please upload an .xlsx or .xls file.");
      return;
    }

    const maxSizeBytes = 25 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      toast.error("File is too large. Please keep it under 25 MB.");
      return;
    }

    setImportBusy(true);
    setImportProgress(0);
    setImportMessage("Reading workbook...");

    try {
      const { sheetName, rows } = await parseFmsImportWorkbook(file);
      if (!rows.length) {
        throw new Error("The uploaded sheet does not contain any records.");
      }

      const importKey = window.crypto?.randomUUID ? window.crypto.randomUUID() : `fms-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const chunkSize = 250;
      const totalChunks = Math.ceil(rows.length / chunkSize);
      let importedCount = 0;
      let skippedCount = 0;
      let failedCount = 0;

      for (let index = 0; index < totalChunks; index += 1) {
        const chunk = rows.slice(index * chunkSize, (index + 1) * chunkSize);
        setImportMessage(`Uploading ${index + 1} of ${totalChunks} chunks from ${sheetName || "Sheet1"}...`);
        const chunkResult = await uploadFmsImportChunk({
          importKey,
          fileName: file.name,
          fileSizeBytes: file.size,
          totalRows: rows.length,
          rows: chunk,
          isLast: index === totalChunks - 1
        });
        importedCount += chunkResult.importedCount || 0;
        skippedCount += chunkResult.skippedCount || 0;
        failedCount += chunkResult.failedCount || 0;
        setImportProgress(Math.round(((index + 1) / totalChunks) * 100));
      }

      await Promise.all([refreshRemoteLogs(), refreshHistory()]);
      const summaryMessage = `Imported ${importedCount} rows, skipped ${skippedCount}, failed ${failedCount}.`;
      if (failedCount > 0) {
        toast.error(summaryMessage);
      } else {
        toast.success(summaryMessage);
      }
      setImportMessage(summaryMessage);
    } catch (error) {
      await Promise.all([refreshRemoteLogs(), refreshHistory()]).catch(() => {});
      const message = error?.response?.data?.message || error?.response?.data?.error || error.message || "Import failed";
      toast.error(message);
      setImportMessage(message);
    } finally {
      setImportBusy(false);
    }
  }

  async function rollbackLastImportBatch() {
    if (!canImport) {
      toast.error("Only Admin and Supervisor roles can roll back imports.");
      return;
    }
    if (!window.confirm("Rollback the last import batch? This will remove the imported call log rows.")) {
      return;
    }

    try {
      const result = await rollbackLastFmsImport();
      await Promise.all([refreshRemoteLogs(), refreshHistory()]);
      toast.success(`Rolled back ${result.deletedRows || 0} imported records.`);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to roll back the last import.");
    }
  }

  async function downloadErrorLog(importBatch) {
    try {
      const errors = await fetchFmsImportErrors(importBatch.id);
      if (!errors.length) {
        toast("No error rows found for this batch.");
        return;
      }

      const headers = ["Row Number", "Incident No", "Error Message", "Raw Row"];
      const csvRows = [headers.join(",")];
      errors.forEach((row) => {
        csvRows.push(
          [
            row.rowNumber,
            JSON.stringify(row.incidentNo || ""),
            JSON.stringify(row.errorMessage || ""),
            JSON.stringify(row.rowData || {})
          ].join(",")
        );
      });

      const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `FMS_Import_Errors_${importBatch.id}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to download the error log.");
    }
  }

  function openLogModal(idx = -1) {
    setLogModal({ open: true, idx });
    if (idx >= 0) setLogForm({ ...defaultLogForm, ...logData[idx] });
    else setLogForm({ ...defaultLogForm, incidentNo: genIncNo(logData) });
  }

  async function saveLogRecord() {
    const normalized = normalizeLogRecord(logForm, { defaultSyncStatus: "pending" });
    const validationErrors = validateLogRecord(normalized);
    if (validationErrors.length) {
      toast.error(`Please complete: ${validationErrors.join(", ")}.`);
      return;
    }

    const existing = logModal.idx >= 0 ? logData[logModal.idx] : null;
    const clientRequestId = existing?.clientRequestId || createClientRequestId();
    const syncAction = existing?.id ? "update" : "create";
    const optimisticRecord = normalizeLogRecord(
      {
        ...normalized,
        id: existing?.id || null,
        clientRequestId,
        syncStatus: "pending",
        syncError: "",
        syncAction
      },
      { defaultSyncStatus: "pending" }
    );
    const next = [...logData];
    if (logModal.idx >= 0 && existing) {
      next[logModal.idx] = mergeLogRecord(existing, optimisticRecord);
    } else {
      next.unshift(optimisticRecord);
    }
    const normalizedLocal = normalizeLogData(next, { defaultSyncStatus: "synced" });
    setLogData(normalizedLocal);
    save("sgs_log", normalizedLocal);
    setIsSavingLog(true);

    try {
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        throw new Error("You are offline right now.");
      }
      const health = await refreshServiceHealth();
      if (health?.database && health.database !== "ok") {
        throw new Error(health.message || "Database is temporarily unavailable.");
      }

      const payload = buildSyncPayload(optimisticRecord);
      const serverCall = existing?.id ? await updateFmsCallLog(existing.id, payload) : await createFmsCallLog(payload);
      const synced = normalizeLogData(
        normalizedLocal.map((record) =>
          sameLogRecord(record, optimisticRecord)
            ? normalizeLogRecord(
                {
                  ...record,
                  ...serverCall,
                  id: serverCall?.id ?? record.id ?? null,
                  clientRequestId: record.clientRequestId || clientRequestId,
                  syncStatus: "synced",
                  syncError: "",
                  syncAction: "synced"
                },
                { defaultSyncStatus: "synced" }
              )
            : record
        ),
        { defaultSyncStatus: "synced" }
      );
      setLogData(synced);
      save("sgs_log", synced);
      await refreshRemoteLogs();
      toast.success("Call record saved to the server.");
      setLogModal({ open: false, idx: -1 });
    } catch (error) {
      const retryable = isRetryableSyncError(error);
      const message = getApiErrorMessage(error, "Unable to save the call to the server.");
      const queued = markRecordSyncError(normalizedLocal, optimisticRecord, message, retryable ? "pending" : "error", syncAction);
      setLogData(queued);
      save("sgs_log", queued);
      console.error("FMS call save failed:", {
        message,
        status: error?.response?.status,
        code: error?.code,
        retryable,
        incidentNo: optimisticRecord.incidentNo,
        clientRequestId: optimisticRecord.clientRequestId
      });
      toast.error(retryable ? `${message} The call is queued for automatic retry.` : message);
      if (retryable) {
        setLogModal({ open: false, idx: -1 });
      }
    } finally {
      setIsSavingLog(false);
    }
  }

  function removeLog(idx) {
    const record = logData[idx];
    if (!record) return;
    const key = logSelectionKeyForRow({ ...record, __idx: idx });
    deleteLogEntries([key]).catch(() => {});
  }

  function openPM(idx = -1) {
    setPmModal({ open: true, idx });
    setPMForm(idx >= 0 ? { ...defaultPMForm, ...pmData[idx] } : { ...defaultPMForm });
  }

  function savePMRecord() {
    const next = [...pmData];
    if (pmModal.idx >= 0) next[pmModal.idx] = { ...pmForm };
    else next.push({ ...pmForm });
    setPmData(next);
    save("sgs_pm", next);
    setPmModal({ open: false, idx: -1 });
  }

  function removePM(idx) {
    if (!window.confirm("Delete?")) return;
    const next = pmData.filter((_, i) => i !== idx);
    setPmData(next);
    save("sgs_pm", next);
  }

  function openIB(idx = -1) {
    setIbModal({ open: true, idx });
    setIBForm(idx >= 0 ? { ...defaultIBForm, ...ibData[idx] } : { ...defaultIBForm });
  }

  function saveIBRecord() {
    const next = [...ibData];
    if (ibModal.idx >= 0) next[ibModal.idx] = { ...ibForm };
    else next.push({ ...ibForm });
    setIbData(next);
    save("sgs_ib", next);
    setIbModal({ open: false, idx: -1 });
  }

  function removeIB(idx) {
    if (!window.confirm("Delete?")) return;
    const next = ibData.filter((_, i) => i !== idx);
    setIbData(next);
    save("sgs_ib", next);
  }

  function openAV(idx = -1) {
    setAvModal({ open: true, idx });
    setAVForm(idx >= 0 ? { ...defaultAVForm, ...avData[idx] } : { ...defaultAVForm });
  }

  function saveAVRecord() {
    const next = [...avData];
    if (avModal.idx >= 0) next[avModal.idx] = { ...avForm };
    else next.push({ ...avForm });
    setAvData(next);
    save("sgs_av", next);
    setAvModal({ open: false, idx: -1 });
  }

  function removeAV(idx) {
    if (!window.confirm("Delete?")) return;
    const next = avData.filter((_, i) => i !== idx);
    setAvData(next);
    save("sgs_av", next);
  }

  function openAsset(idx = -1) {
    setAssetModal({ open: true, idx });
    setAssetForm(idx >= 0 ? { ...defaultAssetForm, ...assetData[idx] } : { ...defaultAssetForm });
  }

  function saveAssetRecord() {
    const next = [...assetData];
    if (assetModal.idx >= 0) next[assetModal.idx] = { ...assetForm };
    else next.push({ ...assetForm });
    setAssetData(next);
    save("sgs_assets", next);
    setAssetModal({ open: false, idx: -1 });
  }

  function removeAsset(idx) {
    if (!window.confirm("Delete?")) return;
    const next = assetData.filter((_, i) => i !== idx);
    setAssetData(next);
    save("sgs_assets", next);
  }

  function exportCSV() {
    const headers = [
      "Incident No",
      "Month",
      "Call Open Date",
      "Division",
      "Area",
      "Machine",
      "Asset No",
      "Equipment Name",
      "Assets / Non Assets",
      "Nature of Call",
      "Type",
      "Category",
      "Equipment (Materials)",
      "Root Cause",
      "Repeated",
      "Reported By",
      "Description",
      "Attended By",
      "Attend Date",
      "Action Taken",
      "Status",
      "Closed Date",
      "Response(Min)",
      "Resolution(Min)",
      "Downtime(Min)",
      "Pending Side",
      "Remarks"
    ];
    const rows = logFiltered.map((r) => [
      r.incidentNo,
      r.month,
      r.callOpenDate,
      r.division,
      r.area,
      r.machine,
      r.assetNo,
      r.equipmentName,
      r.assetNonAsset,
      r.natureOfCall,
      r.assetType,
      r.callCategory,
      r.equipment,
      r.rootCause,
      r.repeated,
      r.reportedBy,
      (r.description || "").replace(/,/g, ";"),
      r.attendedBy,
      r.attendDate,
      (r.actionTaken || "").replace(/,/g, ";"),
      r.status,
      r.closedDate,
      getTimingValue(r, "responseMinutes", "callOpenDate", "attendDate"),
      getTimingValue(r, "resolutionMinutes", "attendDate", "closedDate"),
      getTimingValue(r, "downtimeMinutes", "callOpenDate", "closedDate"),
      r.pendingSide,
      r.remarks
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
    a.download = `SGS_FMS_CallLog_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  const tabButtonStyle = (key) => ({
    background: activeTab === key ? "rgba(0,180,216,0.12)" : "none",
    border: "none",
    padding: "12px 18px",
    color: activeTab === key ? "white" : "rgba(255,255,255,0.65)",
    fontFamily: "IBM Plex Sans,sans-serif",
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
    whiteSpace: "nowrap",
    borderBottom: activeTab === key ? "3px solid #00b4d8" : "3px solid transparent",
    letterSpacing: 0.5
  });

  return (
    <div className="fms-root">
      <Toaster position="top-right" />
      <input
        ref={importFileRef}
        type="file"
        accept=".xlsx,.xls"
        tabIndex={-1}
        aria-hidden="true"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clip: "rect(0, 0, 0, 0)",
          whiteSpace: "nowrap",
          border: 0
        }}
        onChange={handleImportFile}
      />
      <header
        style={{
          background: "linear-gradient(135deg,#0d1b3e 0%,#1a237e 60%,#1565c0 100%)",
          position: "sticky",
          top: 0,
          zIndex: 100,
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px 10px", borderBottom: "1px solid rgba(255,255,255,0.1)", gap: 8, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 46, height: 46, background: "linear-gradient(135deg,#00b4d8,#1976d2)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Rajdhani,sans-serif", fontWeight: 700, fontSize: 18, color: "white", letterSpacing: 1, boxShadow: "0 2px 10px rgba(0,180,216,0.4)" }}>
              SGS
            </div>
            <div>
              <h1 style={{ fontFamily: "Rajdhani,sans-serif", fontSize: 22, fontWeight: 700, color: "white", letterSpacing: 2 }}>SGS SUPPORT FMS</h1>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", letterSpacing: 1, marginTop: 1 }}>TML/SGS IT Support | ERC Call Management System</p>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "IBM Plex Mono,monospace", fontSize: 12, color: "#00b4d8", letterSpacing: 1 }}>
              {currentDate.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>Central PC Maintenance & Breakdown Report Portal</div>
          </div>
        </div>

        <nav style={{ display: "flex", background: "#1565c0", padding: "0 24px", overflowX: "auto" }}>
          {[
            { key: "dashboard", label: "📊 Dashboard" },
            { key: "logdata", label: "📋 Log Data" },
            ...(canImport ? [{ key: "imports", label: "📥 Import History" }] : []),
            { key: "pmlog", label: "🔧 PM Log" },
            { key: "imgbackup", label: "💾 Image Backup" },
            { key: "antivirus", label: "🛡️ Anti Virus" },
            { key: "assetlist", label: "🏭 Master Asset List" },
            { key: "analysis", label: "📈 Analysis & Pivot" }
          ].map((tab) => (
            <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)} style={tabButtonStyle(tab.key)}>
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <div className={`tab-content ${activeTab === "dashboard" ? "active" : ""}`}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.4, color: "#64748b", textTransform: "uppercase" }}>Dashboard time range</div>
            <div style={{ fontSize: 13, color: "#475569", marginTop: 4 }}>Showing {dashboardPeriodLabel} performance across all charts.</div>
          </div>
          <div role="tablist" aria-label="Dashboard time range" style={{ display: "inline-flex", borderRadius: 999, overflow: "hidden", border: "1px solid #dbe4f0", background: "#fff", boxShadow: "0 8px 20px rgba(15, 23, 42, 0.08)" }}>
            {DASHBOARD_TIME_RANGE_OPTIONS.map((option) => {
              const selected = dashboardTimeRange === option.key;
              return (
                <button
                  key={option.key}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setDashboardTimeRange(option.key)}
                  style={{
                    border: "none",
                    padding: "10px 16px",
                    minWidth: 96,
                    background: selected ? "linear-gradient(135deg,#1565c0,#0b57a6)" : "transparent",
                    color: selected ? "#fff" : "#334155",
                    fontFamily: "IBM Plex Sans,sans-serif",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="kpi-grid">
          <div className="kpi-card"><div className="kpi-label">Total Calls Logged</div><div className="kpi-value">{dashboardFilteredLogs.length}</div><div className="kpi-sub">{dashboardPeriodLabel} incidents</div></div>
          <div className="kpi-card red"><div className="kpi-label">Open Calls</div><div className="kpi-value" style={{ color: "var(--red)" }}>{dashboardOpenCalls}</div><div className="kpi-sub">Pending resolution</div></div>
          <div className="kpi-card green"><div className="kpi-label">Closed Calls</div><div className="kpi-value" style={{ color: "var(--green)" }}>{dashboardClosedCalls}</div><div className="kpi-sub">Resolved</div></div>
          <div className="kpi-card orange"><div className="kpi-label">Calls On Hold</div><div className="kpi-value" style={{ color: "var(--orange)" }}>{dashboardHoldCalls}</div><div className="kpi-sub">Awaiting action</div></div>
          <div className="kpi-card accent"><div className="kpi-label">Avg MTTR (Min)</div><div className="kpi-value" style={{ color: "var(--accent2)" }}>{dashboardAvgMTTR}</div><div className="kpi-sub">Mean time to repair</div></div>
          <div className="kpi-card"><div className="kpi-label">Total Downtime (Min)</div><div className="kpi-value">{dashboardTotalDownMinutes}</div><div className="kpi-sub">Cumulative downtime</div></div>
        </div>

        <div className="chart-grid">
          <div className="chart-card">
            <div className="chart-title">Pareto Analysis — Average Downtime MTTR (Min) by Division</div>
            <div className="chart-wrap">
              <Bar data={{ labels: [...dashboardDivisionOptions].sort((a, b) => (dashboardDivisionAvgDown[b] || 0) - (dashboardDivisionAvgDown[a] || 0)), datasets: [{ label: "Avg MTTR (Min)", data: [...dashboardDivisionOptions].sort((a, b) => (dashboardDivisionAvgDown[b] || 0) - (dashboardDivisionAvgDown[a] || 0)).map((division) => dashboardDivisionAvgDown[division] || 0), backgroundColor: COLORS }] }} options={baseBarOptions} />
            </div>
          </div>
          <div className="chart-card">
            <div className="chart-title">Waterfall — Number of PC Breakdowns by Division</div>
            <div className="chart-wrap">
              <Bar data={{ labels: dashboardDivisionOptions, datasets: [{ label: "Breakdowns", data: dashboardDivisionOptions.map((division) => dashboardDivisionCounts[division] || 0), backgroundColor: COLORS }] }} options={baseBarOptions} />
            </div>
          </div>
          <div className="chart-card">
            <div className="chart-title">Total PC Downtime (Min) by Division</div>
            <div className="chart-wrap">
              <Doughnut data={{ labels: dashboardDivisionOptions, datasets: [{ data: dashboardDivisionOptions.map((division) => dashboardDivisionDowntime[division] || 0), backgroundColor: COLORS }] }} options={pieOptions} />
            </div>
          </div>
          <div className="chart-card">
            <div className="chart-title">Breakdown by Call Category</div>
            <div className="chart-wrap">
              <Bar data={{ labels: dashboardCallCategoryOptions, datasets: [{ label: "Count", data: dashboardCallCategoryCounts, backgroundColor: COLORS }] }} options={baseBarOptions} />
            </div>
          </div>
          <div className="chart-card">
            <div className="chart-title">Breakdown by Type of Assets</div>
            <div className="chart-wrap">
              <Bar data={{ labels: dashboardAssetTypeFiltered.map((x) => x.t), datasets: [{ label: "Count", data: dashboardAssetTypeFiltered.map((x) => x.c), backgroundColor: COLORS }] }} options={baseBarOptions} />
            </div>
          </div>
          <div className="chart-card">
            <div className="chart-title">{dashboardPeriodLabel} Call Volume Trend</div>
            <div className="chart-wrap">
              <Line data={{ labels: dashboardMonthSeries.map((entry) => entry.label), datasets: [{ label: "Calls", data: dashboardMonthSeries.map((entry) => entry.value), borderColor: "#1565c0", backgroundColor: "rgba(21,101,192,0.1)", fill: true, tension: 0.4, pointRadius: 3 }] }} options={baseBarOptions} />
            </div>
          </div>
          <div className="chart-card" style={{ gridColumn: "1 / -1" }}>
            <div className="chart-title">Call Status (OPEN / CLOSED / HOLD) by Division</div>
            <div className="chart-wrap" style={{ height: 250 }}>
              <Bar
                data={{
                  labels: dashboardDivisionOptions,
                  datasets: [
                    { label: "OPEN", data: dashboardStatusByDivision.OPEN, backgroundColor: "#c62828" },
                    { label: "CLOSED", data: dashboardStatusByDivision.CLOSED, backgroundColor: "#2e7d32" },
                    { label: "HOLD", data: dashboardStatusByDivision.HOLD, backgroundColor: "#e65100" }
                  ]
                }}
                options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "top", labels: { font: { size: 10 }, boxWidth: 12 } } }, scales: { x: { stacked: true, ticks: { font: { size: 9 } } }, y: { stacked: true, ticks: { font: { size: 9 } } } } }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className={`tab-content ${activeTab === "logdata" ? "active" : ""}`}>
        <div className="section-title">📋 P.C. MAINT BREAK DOWN REPORT — Call Log</div>
        <div className="toolbar">
          <select value={logFilter.month} onChange={(e) => setLogFilter((p) => ({ ...p, month: e.target.value }))}><option value="">All Months</option>{uniqueMonths.map((m) => <option key={m}>{m}</option>)}</select>
          <select value={logFilter.division} onChange={(e) => setLogFilter((p) => ({ ...p, division: e.target.value }))}><option value="">All Divisions</option>{logDivisionOptions.map((division) => <option key={division}>{division}</option>)}</select>
          <select value={logFilter.area} onChange={(e) => setLogFilter((p) => ({ ...p, area: e.target.value }))}><option value="">All Areas</option>{logAreaOptions.map((area) => <option key={area}>{area}</option>)}</select>
          <select value={logFilter.status} onChange={(e) => setLogFilter((p) => ({ ...p, status: e.target.value }))}><option value="">All Status</option><option>OPEN</option><option>CLOSED</option><option>HOLD</option></select>
          <select value={logFilter.assettype} onChange={(e) => setLogFilter((p) => ({ ...p, assettype: e.target.value }))}><option value="">All Asset Types</option>{logAssetTypeOptions.map((assetType) => <option key={assetType}>{assetType}</option>)}</select>
          <select value={logFilter.category} onChange={(e) => setLogFilter((p) => ({ ...p, category: e.target.value }))}><option value="">All Categories</option>{logCallCategoryOptions.map((category) => <option key={category}>{category}</option>)}</select>
          <input type="text" value={logFilter.search} onChange={(e) => setLogFilter((p) => ({ ...p, search: e.target.value }))} placeholder="🔍 Search Incident No / Machine / Description..." />
          <span className="toolbar-spacer" />
          <button type="button" className="btn btn-success" onClick={exportCSV}>⬇ Export CSV</button>
          <button type="button" className="btn btn-outline" onClick={() => downloadSampleFmsWorkbook()}>Download Sample Excel</button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={triggerImportDialog}
            disabled={importBusy}
            title={!canImport ? importPermissionMessage : "Import an Excel workbook"}
            aria-disabled={!canImport || importBusy}
          >
            {importBusy ? "Importing..." : "Import Excel"}
          </button>
          {canImport ? (
            <button type="button" className="btn btn-outline" onClick={rollbackLastImportBatch} disabled={importBusy}>
              Rollback Last Import
            </button>
          ) : null}
          {canManage && selectedLogCount ? (
            <>
              <span style={{ fontSize: 12, color: "var(--blue2)", fontWeight: 600, padding: "6px 10px", borderRadius: 999, background: "#e8f1ff" }}>
                {selectedLogCount} selected
              </span>
              <button type="button" className="btn btn-danger" onClick={() => deleteLogEntries().catch(() => {})} disabled={isDeletingLog || isSavingLog}>
                {isDeletingLog ? "Deleting..." : `Delete Selected${selectedLogCount ? ` (${selectedLogCount})` : ""}`}
              </button>
              <button type="button" className="btn btn-outline" onClick={clearSelectedLogs} disabled={isDeletingLog || isSavingLog}>
                Clear Selection
              </button>
            </>
          ) : null}
          <span
            style={{
              fontSize: 12,
              color: isOnline ? "var(--green)" : "var(--orange)",
              fontWeight: 700,
              padding: "6px 10px",
              borderRadius: 999,
              background: isOnline ? "#e8f5e9" : "#fff3e0"
            }}
          >
            {isOnline ? `Online | DB ${serviceHealth.database === "ok" ? "ready" : "checking"}` : "Offline"}
          </span>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => syncPendingCalls().catch(() => {})}
            disabled={isSyncingPending || pendingSyncCount === 0}
          >
            {isSyncingPending ? "Syncing..." : `Sync Pending Calls${pendingSyncCount ? ` (${pendingSyncCount})` : ""}`}
          </button>
          {canManage ? <button type="button" className="btn btn-primary" onClick={() => openLogModal()}>+ Add New Call</button> : null}
        </div>
        {importBusy || importMessage ? (
          <div style={{ marginBottom: 14, padding: "10px 12px", border: "1px solid #dbeafe", borderRadius: 10, background: "#eff6ff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 8, fontSize: 12, color: "#1d4ed8", fontWeight: 600 }}>
              <span>{importMessage || "Import ready."}</span>
              <span>{importProgress}%</span>
            </div>
            <div style={{ height: 10, borderRadius: 999, background: "#dbeafe", overflow: "hidden" }}>
              <div style={{ width: `${importProgress}%`, height: "100%", borderRadius: 999, background: "linear-gradient(90deg,#1d4ed8,#10b981)", transition: "width 180ms ease" }} />
            </div>
          </div>
        ) : null}
        <div className="table-wrap">
          <div className="table-scroll">
            <table id="logTable">
              <thead>
                <tr>
                  {canManage ? (
                    <th style={{ width: 44, textAlign: "center" }}>
                      <input
                        ref={selectAllLogRef}
                        type="checkbox"
                        aria-label="Select all call logs"
                        checked={allFilteredLogsSelected}
                        onChange={(e) => toggleAllFilteredLogs(e.target.checked)}
                        style={{ width: 16, height: 16, cursor: "pointer" }}
                      />
                    </th>
                  ) : null}
                  <th onClick={() => sortLog("incidentNo")}>INC NO ↕</th><th onClick={() => sortLog("month")}>MONTH ↕</th><th onClick={() => sortLog("callOpenDate")}>CALL OPEN DATE/TIME ↕</th>
                  <th onClick={() => sortLog("division")}>DIVISION ?</th><th>AREA</th><th>MACHINE</th><th>ASSET NO</th><th>EQUIPMENT NAME</th><th>ASSET/NON-ASSET</th>
                  <th>NATURE OF CALL</th><th>TYPE OF ASSETS</th><th>CALL CATEGORY</th><th>EQUIPMENT (MAT.)</th><th>REPEATED</th><th>REPORTED BY</th><th>DESCRIPTION</th><th>ATTENDED BY</th>
                  <th>ATTEND DATE/TIME</th><th>ACTION TAKEN</th><th onClick={() => sortLog("status")}>STATUS ?</th><th>CLOSED DATE/TIME</th><th>RESPONSE(Min)</th>
                  <th>RESOLUTION(Min)</th><th>DOWNTIME(Min)</th><th>PENDING SIDE</th><th>REMARKS</th>{canManage ? <th>ACTIONS</th> : null}
                </tr>
              </thead>
              <tbody>
                {pagedLog.map((r) => (
                  <tr key={`${r.incidentNo}-${r.__idx}`}>
                    {canManage ? (
                      <td style={{ textAlign: "center" }}>
                        <input
                          type="checkbox"
                          aria-label={`Select call log ${r.incidentNo || ""}`}
                          checked={selectedLogKeySet.has(logSelectionKeyForRow(r))}
                          onChange={() => toggleLogSelection(logSelectionKeyForRow(r))}
                          style={{ width: 16, height: 16, cursor: "pointer" }}
                        />
                      </td>
                    ) : null}
                    <td><span style={{ fontFamily: "IBM Plex Mono", fontSize: 11, color: "var(--blue2)" }}>{r.incidentNo}</span></td>
                    <td>{r.month || ""}</td>
                    <td style={{ whiteSpace: "nowrap", fontSize: 11 }}>{fmtDT(r.callOpenDate)}</td>
                    <td><span style={{ fontWeight: 600, color: "var(--navy2)" }}>{r.division || ""}</span></td>
                    <td>{r.area || ""}</td>
                    <td className="td-truncate">{r.machine || ""}</td>
                    <td style={{ fontFamily: "IBM Plex Mono", fontSize: 10 }}>{r.assetNo || ""}</td>
                    <td className="td-truncate">{r.equipmentName || ""}</td>
                    <td>{r.assetNonAsset || ""}</td>
                    <td className="td-truncate">{r.natureOfCall || ""}</td>
                    <td style={{ fontSize: 10 }}>{r.assetType || ""}</td>
                    <td>{r.callCategory || ""}</td>
                    <td className="td-truncate">{r.equipment || ""}</td>
                    <td><span className={`badge ${sameValue(r.repeated, "YES") ? "badge-notdone" : "badge-done"}`}>{r.repeated || ""}</span></td>
                    <td>{r.reportedBy || ""}</td>
                    <td style={{ maxWidth: 260, whiteSpace: "normal", wordBreak: "break-word" }}>{r.description || ""}</td>
                    <td style={{ whiteSpace: "nowrap", fontSize: 11 }}>{r.attendedBy || ""}</td>
                    <td style={{ whiteSpace: "nowrap", fontSize: 11 }}>{fmtDT(r.attendDate)}</td>
                    <td style={{ maxWidth: 260, whiteSpace: "normal", wordBreak: "break-word" }}>{r.actionTaken || ""}</td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
                        <span className={`badge ${statusBadgeClass(r.status)}`}>{r.status || ""}</span>
                        {r.syncStatus === "pending" ? (
                          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, color: "var(--orange)" }}>SYNC PENDING</span>
                        ) : null}
                        {r.syncStatus === "error" ? (
                          <span title={r.syncError || ""} style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, color: "var(--red)" }}>
                            SYNC ERROR
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td style={{ whiteSpace: "nowrap", fontSize: 11 }}>{fmtDT(r.closedDate)}</td>
                    <td style={{ textAlign: "center", fontWeight: 600 }}>{getTimingValue(r, "responseMinutes", "callOpenDate", "attendDate")}</td>
                    <td style={{ textAlign: "center", fontWeight: 600 }}>{getTimingValue(r, "resolutionMinutes", "attendDate", "closedDate")}</td>
                    <td style={{ textAlign: "center", fontWeight: 600, color: "var(--red)" }}>{getTimingValue(r, "downtimeMinutes", "callOpenDate", "closedDate")}</td>
                    <td>{r.pendingSide || ""}</td>
                    <td style={{ maxWidth: 260, whiteSpace: "normal", wordBreak: "break-word" }}>{r.remarks || ""}</td>
                    {canManage ? (
                      <td style={{ whiteSpace: "nowrap" }}>
                        <button type="button" className="btn btn-outline btn-sm" onClick={() => openLogModal(r.__idx)} disabled={Boolean(r.importBatchId) || isSavingLog || isDeletingLog} title={r.importBatchId ? "Imported rows are managed through rollback" : "Edit"}>
                          ✎
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          style={{ marginLeft: 4 }}
                          onClick={() => removeLog(r.__idx)}
                          disabled={Boolean(r.importBatchId) || isSavingLog || isDeletingLog}
                          title={r.importBatchId ? "Imported rows are managed through rollback" : "Delete"}
                        >
                          🗑
                        </button>
                      </td>
                    ) : null}
                  </tr>
                ))}
                {!busy && !pagedLog.length ? <tr><td colSpan={27 + (canManage ? 1 : 0)} className="py-6 text-center text-slate-500">No call records</td></tr> : null}
              </tbody>
            </table>
          </div>
          <Pagination total={logFiltered.length} currentPage={logPage} onPageChange={setLogPage} />
        </div>
      </div>

      <div className={`tab-content ${activeTab === "imports" ? "active" : ""}`}>
        <div className="section-title">📥 Import History</div>
        <div className="toolbar">
          <span style={{ fontSize: 13, color: "var(--text3)" }}>Review uploaded files, totals, and rollback status.</span>
          <span className="toolbar-spacer" />
          <button type="button" className="btn btn-outline" onClick={refreshHistory}>Refresh</button>
          {canImport ? (
            <button type="button" className="btn btn-primary" onClick={rollbackLastImportBatch}>
              Rollback Last Import
            </button>
          ) : null}
        </div>
        <div className="table-wrap">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>UPLOADED AT</th>
                  <th>FILE NAME</th>
                  <th>UPLOADER</th>
                  <th>TOTAL</th>
                  <th>IMPORTED</th>
                  <th>SKIPPED</th>
                  <th>FAILED</th>
                  <th>STATUS</th>
                  <th>ROLLED BACK</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {importHistory.map((item) => (
                  <tr key={item.id}>
                    <td style={{ whiteSpace: "nowrap", fontSize: 11 }}>{fmtDT(item.uploadedAt)}</td>
                    <td className="td-truncate">{item.fileName}</td>
                    <td>{item.uploaderName || "-"}</td>
                    <td style={{ textAlign: "center" }}>{item.totalRows}</td>
                    <td style={{ textAlign: "center" }}>{item.importedRows}</td>
                    <td style={{ textAlign: "center" }}>{item.skippedRows}</td>
                    <td style={{ textAlign: "center" }}>{item.failedRows}</td>
                    <td><span className={`badge ${item.status === "rolled_back" ? "badge-notdone" : item.failedRows ? "badge-hold" : "badge-done"}`}>{item.status}</span></td>
                    <td>{item.rolledBackAt ? fmtDT(item.rolledBackAt) : "-"}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => downloadErrorLog(item)} disabled={!item.failedRows}>
                        Error Log
                      </button>
                    </td>
                  </tr>
                ))}
                {!importHistory.length ? (
                  <tr>
                    <td colSpan={10} className="py-6 text-center text-slate-500">No import history yet.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className={`tab-content ${activeTab === "pmlog" ? "active" : ""}`}>
        <div className="section-title">🔧 Preventive Maintenance Log</div>
        <div className="toolbar">
          <select value={pmFilter.division} onChange={(e) => setPmFilter((p) => ({ ...p, division: e.target.value }))}><option value="">All Divisions</option>{DIVISIONS.map((d) => <option key={d}>{d}</option>)}</select>
          <select value={pmFilter.status} onChange={(e) => setPmFilter((p) => ({ ...p, status: e.target.value }))}><option value="">All Status</option><option>Done</option><option>Not Done</option><option>Late PM</option><option>Advanced PM</option><option>N/A</option></select>
          <select value={pmFilter.month} onChange={(e) => setPmFilter((p) => ({ ...p, month: e.target.value }))}><option value="">All Months</option>{uniqueMonths.map((m) => <option key={m}>{m}</option>)}</select>
          <span className="toolbar-spacer" />
          {canManage ? <button type="button" className="btn btn-primary" onClick={() => openPM()}>+ Add PM Record</button> : null}
        </div>
        <div className="table-wrap">
          <div className="table-scroll">
            <table>
              <thead><tr><th>SL.NO</th><th>MONTH</th><th>DIVISION</th><th>AREA</th><th>MACHINE NAME</th><th>ASSET NO</th><th>PM FREQUENCY</th><th>SAP EQUIP ID</th><th>SCHEDULED DATE</th><th>ACTUAL PM DATE</th><th>PM DONE BY</th><th>PM STATUS</th><th>REMARKS</th><th>DUST LEVEL</th>{canManage ? <th>ACTIONS</th> : null}</tr></thead>
              <tbody>
                {pagedPM.map((r, i) => (
                  <tr key={`pm-${r.__idx}`}>
                    <td>{(pmPage - 1) * PAGE_SIZE + i + 1}</td><td>{r.month || ""}</td><td>{r.division || ""}</td><td>{r.area || ""}</td><td>{r.machine || ""}</td>
                    <td style={{ fontFamily: "IBM Plex Mono", fontSize: 10 }}>{r.assetNo || ""}</td><td>{r.pmFreq || ""}</td><td>{r.equipId || ""}</td><td>{r.scheduledDate || ""}</td><td>{r.actualDate || ""}</td>
                    <td style={{ fontSize: 11 }}>{r.doneBy || ""}</td><td><span className={`badge ${pmStatusClass(r.pmStatus)}`}>{r.pmStatus || ""}</span></td><td className="td-truncate">{r.remarks || ""}</td>
                    <td>{r.dustLevel ? <span className={`badge ${dustBadgeClass(r.dustLevel)}`}>{r.dustLevel}</span> : ""}</td>
                    {canManage ? <td><button type="button" className="btn btn-outline btn-sm" onClick={() => openPM(r.__idx)}>✎</button><button type="button" className="btn btn-danger btn-sm" style={{ marginLeft: 4 }} onClick={() => removePM(r.__idx)}>🗑</button></td> : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination total={pmFiltered.length} currentPage={pmPage} onPageChange={setPmPage} />
        </div>
      </div>

      <div className={`tab-content ${activeTab === "imgbackup" ? "active" : ""}`}>
        <div className="section-title">💾 Image Backup Log</div>
        <div className="toolbar">
          <select value={ibFilter.division} onChange={(e) => setIbFilter((p) => ({ ...p, division: e.target.value }))}><option value="">All Divisions</option>{DIVISIONS.map((d) => <option key={d}>{d}</option>)}</select>
          <select value={ibFilter.status} onChange={(e) => setIbFilter((p) => ({ ...p, status: e.target.value }))}><option value="">All Status</option><option>Done</option><option>Not Done</option><option>N/A</option></select>
          <select value={ibFilter.month} onChange={(e) => setIbFilter((p) => ({ ...p, month: e.target.value }))}><option value="">All Months</option>{uniqueMonths.map((m) => <option key={m}>{m}</option>)}</select>
          <span className="toolbar-spacer" />
          {canManage ? <button type="button" className="btn btn-primary" onClick={() => openIB()}>+ Add Backup Record</button> : null}
        </div>
        <div className="table-wrap"><div className="table-scroll"><table><thead><tr><th>SL.NO</th><th>MONTH</th><th>DIVISION</th><th>AREA</th><th>MACHINE NAME</th><th>ASSET NO</th><th>BACKUP TAKEN DATE</th><th>BACKUP DONE BY</th><th>STATUS</th><th>REMARKS</th>{canManage ? <th>ACTIONS</th> : null}</tr></thead><tbody>
          {pagedIB.map((r, i) => (
            <tr key={`ib-${r.__idx}`}>
              <td>{(ibPage - 1) * PAGE_SIZE + i + 1}</td><td>{r.month || ""}</td><td>{r.division || ""}</td><td>{r.area || ""}</td><td>{r.machine || ""}</td>
              <td style={{ fontFamily: "IBM Plex Mono", fontSize: 10 }}>{r.assetNo || ""}</td><td>{r.backupDate || ""}</td><td style={{ fontSize: 11 }}>{r.doneBy || ""}</td>
              <td><span className={`badge ${doneBadgeClass(r.status)}`}>{r.status || ""}</span></td><td className="td-truncate">{r.remarks || ""}</td>
              {canManage ? <td><button type="button" className="btn btn-outline btn-sm" onClick={() => openIB(r.__idx)}>✎</button><button type="button" className="btn btn-danger btn-sm" style={{ marginLeft: 4 }} onClick={() => removeIB(r.__idx)}>🗑</button></td> : null}
            </tr>
          ))}
        </tbody></table></div><Pagination total={ibFiltered.length} currentPage={ibPage} onPageChange={setIbPage} /></div>
      </div>

      <div className={`tab-content ${activeTab === "antivirus" ? "active" : ""}`}>
        <div className="section-title">🛡️ Anti Virus Log</div>
        <div className="toolbar">
          <select value={avFilter.division} onChange={(e) => setAvFilter((p) => ({ ...p, division: e.target.value }))}><option value="">All Divisions</option>{DIVISIONS.map((d) => <option key={d}>{d}</option>)}</select>
          <select value={avFilter.avname} onChange={(e) => setAvFilter((p) => ({ ...p, avname: e.target.value }))}><option value="">All AV Names</option><option>Quick Heal</option><option>Mcafee</option><option>Security Essentials</option><option>N/A</option></select>
          <select value={avFilter.status} onChange={(e) => setAvFilter((p) => ({ ...p, status: e.target.value }))}><option value="">All Status</option><option>Done</option><option>Not Done</option><option>N/A</option></select>
          <select value={avFilter.month} onChange={(e) => setAvFilter((p) => ({ ...p, month: e.target.value }))}><option value="">All Months</option>{uniqueMonths.map((m) => <option key={m}>{m}</option>)}</select>
          <span className="toolbar-spacer" />
          {canManage ? <button type="button" className="btn btn-primary" onClick={() => openAV()}>+ Add AV Record</button> : null}
        </div>
        <div className="table-wrap"><div className="table-scroll"><table><thead><tr><th>SL.NO</th><th>MONTH</th><th>DIVISION</th><th>AREA</th><th>MACHINE NAME</th><th>ASSET NO</th><th>SCHEDULED DATE</th><th>AV NAME</th><th>UPDATE DATE</th><th>UPDATED BY</th><th>STATUS</th><th>REMARKS</th>{canManage ? <th>ACTIONS</th> : null}</tr></thead><tbody>
          {pagedAV.map((r, i) => (
            <tr key={`av-${r.__idx}`}>
              <td>{(avPage - 1) * PAGE_SIZE + i + 1}</td><td>{r.month || ""}</td><td>{r.division || ""}</td><td>{r.area || ""}</td><td>{r.machine || ""}</td><td style={{ fontFamily: "IBM Plex Mono", fontSize: 10 }}>{r.assetNo || ""}</td>
              <td>{r.scheduledDate || ""}</td><td><strong>{r.avName || ""}</strong></td><td>{r.updateDate || ""}</td><td style={{ fontSize: 11 }}>{r.updatedBy || ""}</td><td><span className={`badge ${doneBadgeClass(r.status)}`}>{r.status || ""}</span></td><td className="td-truncate">{r.remarks || ""}</td>
              {canManage ? <td><button type="button" className="btn btn-outline btn-sm" onClick={() => openAV(r.__idx)}>✎</button><button type="button" className="btn btn-danger btn-sm" style={{ marginLeft: 4 }} onClick={() => removeAV(r.__idx)}>🗑</button></td> : null}
            </tr>
          ))}
        </tbody></table></div><Pagination total={avFiltered.length} currentPage={avPage} onPageChange={setAvPage} /></div>
      </div>

      <div className={`tab-content ${activeTab === "assetlist" ? "active" : ""}`}>
        <div className="section-title">🏭 Master Asset List</div>
        <div className="toolbar">
          <input type="text" value={assetSearch} onChange={(e) => setAssetSearch(e.target.value)} placeholder="🔍 Search Asset No / Machine / Host Name..." style={{ minWidth: 300 }} />
          <span className="toolbar-spacer" />
          {canManage ? <button type="button" className="btn btn-primary" onClick={() => openAsset()}>+ Add Asset</button> : null}
        </div>
        <div className="table-wrap"><div className="table-scroll"><table><thead><tr><th>SL.NO</th><th>LOCATION / DIVISION</th><th>LINE / MACHINE</th><th>SUB-LOCATION</th><th>ASSETS NUMBER</th><th>HOST NAME</th><th>PM FREQUENCY</th><th>SAP EQUIP ID</th>{canManage ? <th>ACTIONS</th> : null}</tr></thead><tbody>
          {pagedAssets.map((r, i) => (
            <tr key={`as-${r.__idx}`}>
              <td>{(assetPage - 1) * PAGE_SIZE + i + 1}</td><td>{r.division || ""}</td><td>{r.line || ""}</td><td>{r.subloc || ""}</td>
              <td style={{ fontFamily: "IBM Plex Mono", fontSize: 11, fontWeight: 600, color: "var(--blue2)" }}>{r.assetNo || ""}</td><td style={{ fontFamily: "IBM Plex Mono", fontSize: 11 }}>{r.hostName || ""}</td>
              <td><span className="badge badge-na">{r.pmFreq || ""}</span></td><td style={{ fontFamily: "IBM Plex Mono", fontSize: 10 }}>{r.sapId || ""}</td>
              {canManage ? <td><button type="button" className="btn btn-outline btn-sm" onClick={() => openAsset(r.__idx)}>✎</button><button type="button" className="btn btn-danger btn-sm" style={{ marginLeft: 4 }} onClick={() => removeAsset(r.__idx)}>🗑</button></td> : null}
            </tr>
          ))}
        </tbody></table></div><Pagination total={assetFiltered.length} currentPage={assetPage} onPageChange={setAssetPage} /></div>
      </div>

      <div className={`tab-content ${activeTab === "analysis" ? "active" : ""}`}>
        <div className="section-title">📈 Analysis & Pivot Report</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          <div className="chart-card"><div className="chart-title">Breakdowns per Division</div><div className="chart-wrap"><Bar data={{ labels: analysisRows.map((r) => r.division), datasets: [{ label: "Breakdowns", data: analysisRows.map((r) => r.cnt), backgroundColor: COLORS }] }} options={baseBarOptions} /></div></div>
          <div className="chart-card"><div className="chart-title">Average Downtime per Division (Pareto)</div><div className="chart-wrap"><Bar data={{ labels: [...analysisRows].sort((a, b) => b.avg - a.avg).map((r) => r.division), datasets: [{ label: "Avg Downtime (Min)", data: [...analysisRows].sort((a, b) => b.avg - a.avg).map((r) => r.avg), backgroundColor: COLORS }] }} options={baseBarOptions} /></div></div>
          <div className="chart-card"><div className="chart-title">Breakdown by Nature of Call</div><div className="chart-wrap"><Pie data={{ labels: logNatureOptions, datasets: [{ data: natureCounts, backgroundColor: COLORS }] }} options={pieOptions} /></div></div>
          <div className="chart-card"><div className="chart-title">Breakdown by Call Category</div><div className="chart-wrap"><Pie data={{ labels: logCallCategoryOptions, datasets: [{ data: callCategoryCounts, backgroundColor: COLORS }] }} options={pieOptions} /></div></div>
        </div>
        <div className="section-title">Division-wise Analysis Table</div>
        <div className="table-wrap analysis-table" style={{ marginBottom: 20 }}>
          <div className="table-scroll"><table id="analysisTable"><thead><tr><th>RANK</th><th>DIVISION</th><th>NO. OF PC BREAKDOWNS</th><th>TOTAL DOWNTIME (Min)</th><th>AVG DOWNTIME (Min)</th></tr></thead><tbody>
            {analysisRows.map((r) => (
              <tr key={`analysis-${r.division}`}>
                <td><span className={`rank-badge ${r.rank <= 3 ? `r${r.rank}` : ""}`}>{r.rank}</span></td>
                <td><strong>{r.division}</strong></td><td style={{ textAlign: "center", fontWeight: 700, color: "var(--navy2)" }}>{r.cnt}</td><td style={{ textAlign: "center" }}>{r.tot}</td><td style={{ textAlign: "center", fontWeight: 700, color: "var(--red)" }}>{r.avg}</td>
              </tr>
            ))}
          </tbody><tfoot><tr style={{ background: "#e8eaf6", fontWeight: 700 }}><td colSpan={2}>TOTAL / AVERAGE MTTR</td><td style={{ textAlign: "center" }}>{totalAnalysisCount}</td><td style={{ textAlign: "center" }}>{totalAnalysisDowntime}</td><td style={{ textAlign: "center", color: "var(--red)" }}>{globalAnalysisAvg}</td></tr></tfoot></table></div>
        </div>
        <div className="section-title">Pivot Table — Type of Assets × Division</div>
        <div className="pivot-wrap">
          <table className="pivot-table">
            <thead><tr><th>DIVISION</th>{logAssetTypeOptions.map((assetType) => <th key={assetType}>{assetType}</th>)}<th>TOTAL</th></tr></thead>
            <tbody>
              {pivotData.rows.map((row) => (
                <tr key={`pv-${row.division}`}>
                  <th>{row.division}</th>
                  {row.values.map((v, i) => <td key={`${row.division}-${logAssetTypeOptions[i]}`} className={v > 0 ? "has-val" : ""}>{v}</td>)}
                  <td style={{ fontWeight: 700, background: "#fff8e1" }}>{row.total}</td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr><td><strong>TOTAL</strong></td>{pivotData.colTotals.map((v, i) => <td key={`tot-${logAssetTypeOptions[i]}`}>{v}</td>)}<td><strong>{pivotData.grandTotal}</strong></td></tr></tfoot>
          </table>
        </div>
        <div className="section-title" style={{ marginTop: 24 }}>Engineer-wise Performance</div>
        <div className="table-wrap eng-perf" style={{ marginBottom: 20 }}>
          <div className="table-scroll"><table><thead><tr><th>ENGINEER NAME</th><th>TOTAL CALLS</th><th>AVG RESPONSE (Min)</th><th>AVG RESOLUTION (Min)</th><th>CLOSED CALLS</th><th>OPEN / HOLD CALLS</th></tr></thead><tbody>
            {engineerRows.map((r) => (
              <tr key={r.eng}><td><strong>{r.eng}</strong></td><td style={{ textAlign: "center", fontWeight: 700 }}>{r.total}</td><td style={{ textAlign: "center" }}>{r.avgResponse || "-"}</td><td style={{ textAlign: "center" }}>{r.avgResolution || "-"}</td><td style={{ textAlign: "center" }}><span className="badge badge-done">{r.closed}</span></td><td style={{ textAlign: "center" }}><span className="badge badge-hold">{r.openHold}</span></td></tr>
            ))}
          </tbody></table></div>
        </div>
      </div>

      <Modal
        open={logModal.open}
        title={logModal.idx >= 0 ? "Edit Call Record" : "Add New Call"}
        onClose={() => !isSavingLog && setLogModal({ open: false, idx: -1 })}
        footer={
          <>
            <button type="button" className="btn btn-outline" onClick={() => setLogModal({ open: false, idx: -1 })} disabled={isSavingLog}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={saveLogRecord} disabled={isSavingLog}>
              {isSavingLog ? "Saving..." : "Save Record"}
            </button>
          </>
        }
      >
        <div className="form-grid">
          <div className="form-group"><label>Incident No.</label><input type="text" value={logForm.incidentNo} readOnly /></div>
          <div className="form-group"><label>Month</label><input type="text" placeholder="e.g. JUL-17" value={logForm.month} onChange={(e) => setLogForm((p) => ({ ...p, month: e.target.value }))} /></div>
          <div className="form-group"><label>Call Open Date/Time</label><input type="datetime-local" value={logForm.callOpenDate} onChange={(e) => setLogForm((p) => ({ ...p, callOpenDate: e.target.value }))} /></div>
          <div className="form-group"><label>Division</label><input type="text" value={logForm.division} onChange={(e) => setLogForm((p) => ({ ...p, division: e.target.value }))} /></div>
          <div className="form-group"><label>Area</label><input type="text" value={logForm.area} onChange={(e) => setLogForm((p) => ({ ...p, area: e.target.value }))} /></div>
          <div className="form-group"><label>Device / Machine Name</label><input type="text" value={logForm.machine} onChange={(e) => setLogForm((p) => ({ ...p, machine: e.target.value }))} /></div>
          <div className="form-group"><label>Asset No.</label><input type="text" value={logForm.assetNo} onChange={(e) => setLogForm((p) => ({ ...p, assetNo: e.target.value }))} /></div>
          <div className="form-group"><label>Equipment Name</label><input type="text" value={logForm.equipmentName} onChange={(e) => setLogForm((p) => ({ ...p, equipmentName: e.target.value }))} /></div>
          <div className="form-group"><label>Assets / Non Assets</label><select value={logForm.assetNonAsset} onChange={(e) => setLogForm((p) => ({ ...p, assetNonAsset: e.target.value }))}><option>Assets</option><option>Non Assets</option></select></div>
          <div className="form-group"><label>Nature of Call</label><input type="text" value={logForm.natureOfCall} onChange={(e) => setLogForm((p) => ({ ...p, natureOfCall: e.target.value }))} /></div>
          <div className="form-group"><label>Type of Assets</label><input type="text" value={logForm.assetType} onChange={(e) => setLogForm((p) => ({ ...p, assetType: e.target.value }))} /></div>
          <div className="form-group"><label>Call Category</label><input type="text" value={logForm.callCategory} onChange={(e) => setLogForm((p) => ({ ...p, callCategory: e.target.value }))} /></div>
          <div className="form-group"><label>Equipment (Materials)</label><input type="text" value={logForm.equipment} onChange={(e) => setLogForm((p) => ({ ...p, equipment: e.target.value }))} /></div>
          <div className="form-group"><label>Repeated</label><select value={logForm.repeated} onChange={(e) => setLogForm((p) => ({ ...p, repeated: e.target.value }))}><option>NO</option><option>YES</option></select></div>
          <div className="form-group"><label>Problem Reported By</label><input type="text" value={logForm.reportedBy} onChange={(e) => setLogForm((p) => ({ ...p, reportedBy: e.target.value }))} /></div>
          <div className="form-group form-full"><label>Call Description</label><textarea value={logForm.description} onChange={(e) => setLogForm((p) => ({ ...p, description: e.target.value }))} /></div>
          <div className="form-group"><label>Call Attended By</label><input type="text" value={logForm.attendedBy} onChange={(e) => setLogForm((p) => ({ ...p, attendedBy: e.target.value }))} /></div>
          <div className="form-group"><label>Call Attend Date/Time</label><input type="datetime-local" value={logForm.attendDate} onChange={(e) => setLogForm((p) => ({ ...p, attendDate: e.target.value }))} /></div>
          <div className="form-group form-full"><label>Action Taken</label><textarea value={logForm.actionTaken} onChange={(e) => setLogForm((p) => ({ ...p, actionTaken: e.target.value }))} /></div>
          <div className="form-group"><label>Status</label><select value={logForm.status} onChange={(e) => setLogForm((p) => ({ ...p, status: e.target.value }))}><option>OPEN</option><option>CLOSED</option><option>HOLD</option></select></div>
          <div className="form-group"><label>Call Closed Date/Time</label><input type="datetime-local" value={logForm.closedDate} onChange={(e) => setLogForm((p) => ({ ...p, closedDate: e.target.value }))} /></div>
          <div className="form-group"><label>Call Pending Side</label><input type="text" value={logForm.pendingSide} onChange={(e) => setLogForm((p) => ({ ...p, pendingSide: e.target.value }))} /></div>
          <div className="form-group form-full"><label>Remarks</label><textarea style={{ minHeight: 50 }} value={logForm.remarks} onChange={(e) => setLogForm((p) => ({ ...p, remarks: e.target.value }))} /></div>
        </div>
      </Modal>

      <Modal open={pmModal.open} title={pmModal.idx >= 0 ? "Edit PM Record" : "Add PM Record"} maxWidth={680} onClose={() => setPmModal({ open: false, idx: -1 })} footer={<><button type="button" className="btn btn-outline" onClick={() => setPmModal({ open: false, idx: -1 })}>Cancel</button><button type="button" className="btn btn-primary" onClick={savePMRecord}>Save Record</button></>}>
        <div className="form-grid">
          <div className="form-group"><label>Month</label><input type="text" value={pmForm.month} onChange={(e) => setPMForm((p) => ({ ...p, month: e.target.value }))} /></div>
          <div className="form-group"><label>Division</label><select value={pmForm.division} onChange={(e) => setPMForm((p) => ({ ...p, division: e.target.value, area: "" }))}><option value="">Select</option>{DIVISIONS.map((d) => <option key={d}>{d}</option>)}</select></div>
          <div className="form-group"><label>Area</label><select value={pmForm.area} onChange={(e) => setPMForm((p) => ({ ...p, area: e.target.value }))}><option value="">Select Area</option>{(AREAS[pmForm.division] || []).map((a) => <option key={a}>{a}</option>)}</select></div>
          <div className="form-group"><label>Machine Name</label><input type="text" value={pmForm.machine} onChange={(e) => setPMForm((p) => ({ ...p, machine: e.target.value }))} /></div>
          <div className="form-group"><label>Asset No.</label><input type="text" value={pmForm.assetNo} onChange={(e) => setPMForm((p) => ({ ...p, assetNo: e.target.value }))} /></div>
          <div className="form-group"><label>PM Frequency</label><select value={pmForm.pmFreq} onChange={(e) => setPMForm((p) => ({ ...p, pmFreq: e.target.value }))}><option>MONTHLY</option><option>QUARTERLY</option><option>HALF YEARLY</option><option>YEARLY</option></select></div>
          <div className="form-group"><label>SAP Equipment ID</label><input type="text" value={pmForm.equipId} onChange={(e) => setPMForm((p) => ({ ...p, equipId: e.target.value }))} /></div>
          <div className="form-group"><label>Scheduled Date</label><input type="date" value={pmForm.scheduledDate} onChange={(e) => setPMForm((p) => ({ ...p, scheduledDate: e.target.value }))} /></div>
          <div className="form-group"><label>Actual PM Date</label><input type="date" value={pmForm.actualDate} onChange={(e) => setPMForm((p) => ({ ...p, actualDate: e.target.value }))} /></div>
          <div className="form-group"><label>PM Done By</label><select value={pmForm.doneBy} onChange={(e) => setPMForm((p) => ({ ...p, doneBy: e.target.value }))}><option value="">Select Engineer</option>{ENGINEERS.map((eng) => <option key={eng}>{eng}</option>)}</select></div>
          <div className="form-group"><label>PM Status</label><select value={pmForm.pmStatus} onChange={(e) => setPMForm((p) => ({ ...p, pmStatus: e.target.value }))}><option>Done</option><option>Not Done</option><option>Late PM</option><option>Advanced PM</option><option>N/A</option></select></div>
          <div className="form-group"><label>Dust Level</label><select value={pmForm.dustLevel} onChange={(e) => setPMForm((p) => ({ ...p, dustLevel: e.target.value }))}><option value="">Select</option><option>HIGH</option><option>AVERAGE</option><option>LOW</option></select></div>
          <div className="form-group form-full"><label>Remarks</label><textarea style={{ minHeight: 50 }} value={pmForm.remarks} onChange={(e) => setPMForm((p) => ({ ...p, remarks: e.target.value }))} /></div>
        </div>
      </Modal>

      <Modal open={ibModal.open} title={ibModal.idx >= 0 ? "Edit Backup Record" : "Add Backup Record"} maxWidth={580} onClose={() => setIbModal({ open: false, idx: -1 })} footer={<><button type="button" className="btn btn-outline" onClick={() => setIbModal({ open: false, idx: -1 })}>Cancel</button><button type="button" className="btn btn-primary" onClick={saveIBRecord}>Save Record</button></>}>
        <div className="form-grid">
          <div className="form-group"><label>Month</label><input type="text" value={ibForm.month} onChange={(e) => setIBForm((p) => ({ ...p, month: e.target.value }))} /></div>
          <div className="form-group"><label>Division</label><select value={ibForm.division} onChange={(e) => setIBForm((p) => ({ ...p, division: e.target.value, area: "" }))}><option value="">Select</option>{DIVISIONS.map((d) => <option key={d}>{d}</option>)}</select></div>
          <div className="form-group"><label>Area</label><select value={ibForm.area} onChange={(e) => setIBForm((p) => ({ ...p, area: e.target.value }))}><option value="">Select Area</option>{(AREAS[ibForm.division] || []).map((a) => <option key={a}>{a}</option>)}</select></div>
          <div className="form-group"><label>Machine Name</label><input type="text" value={ibForm.machine} onChange={(e) => setIBForm((p) => ({ ...p, machine: e.target.value }))} /></div>
          <div className="form-group"><label>Asset No.</label><input type="text" value={ibForm.assetNo} onChange={(e) => setIBForm((p) => ({ ...p, assetNo: e.target.value }))} /></div>
          <div className="form-group"><label>Backup Taken Date</label><input type="date" value={ibForm.backupDate} onChange={(e) => setIBForm((p) => ({ ...p, backupDate: e.target.value }))} /></div>
          <div className="form-group"><label>Backup Done By</label><select value={ibForm.doneBy} onChange={(e) => setIBForm((p) => ({ ...p, doneBy: e.target.value }))}><option value="">Select Engineer</option>{ENGINEERS.map((eng) => <option key={eng}>{eng}</option>)}</select></div>
          <div className="form-group"><label>Status</label><select value={ibForm.status} onChange={(e) => setIBForm((p) => ({ ...p, status: e.target.value }))}><option>Done</option><option>Not Done</option><option>N/A</option></select></div>
          <div className="form-group form-full"><label>Remarks</label><textarea style={{ minHeight: 50 }} value={ibForm.remarks} onChange={(e) => setIBForm((p) => ({ ...p, remarks: e.target.value }))} /></div>
        </div>
      </Modal>

      <Modal open={avModal.open} title={avModal.idx >= 0 ? "Edit Anti Virus Record" : "Add Anti Virus Record"} maxWidth={640} onClose={() => setAvModal({ open: false, idx: -1 })} footer={<><button type="button" className="btn btn-outline" onClick={() => setAvModal({ open: false, idx: -1 })}>Cancel</button><button type="button" className="btn btn-primary" onClick={saveAVRecord}>Save Record</button></>}>
        <div className="form-grid">
          <div className="form-group"><label>Month</label><input type="text" value={avForm.month} onChange={(e) => setAVForm((p) => ({ ...p, month: e.target.value }))} /></div>
          <div className="form-group"><label>Division</label><select value={avForm.division} onChange={(e) => setAVForm((p) => ({ ...p, division: e.target.value, area: "" }))}><option value="">Select</option>{DIVISIONS.map((d) => <option key={d}>{d}</option>)}</select></div>
          <div className="form-group"><label>Area</label><select value={avForm.area} onChange={(e) => setAVForm((p) => ({ ...p, area: e.target.value }))}><option value="">Select Area</option>{(AREAS[avForm.division] || []).map((a) => <option key={a}>{a}</option>)}</select></div>
          <div className="form-group"><label>Machine Name</label><input type="text" value={avForm.machine} onChange={(e) => setAVForm((p) => ({ ...p, machine: e.target.value }))} /></div>
          <div className="form-group"><label>Asset No.</label><input type="text" value={avForm.assetNo} onChange={(e) => setAVForm((p) => ({ ...p, assetNo: e.target.value }))} /></div>
          <div className="form-group"><label>Scheduled Date</label><input type="date" value={avForm.scheduledDate} onChange={(e) => setAVForm((p) => ({ ...p, scheduledDate: e.target.value }))} /></div>
          <div className="form-group"><label>AV Name</label><select value={avForm.avName} onChange={(e) => setAVForm((p) => ({ ...p, avName: e.target.value }))}><option>Quick Heal</option><option>Mcafee</option><option>Security Essentials</option><option>N/A</option></select></div>
          <div className="form-group"><label>AV Update Date</label><input type="date" value={avForm.updateDate} onChange={(e) => setAVForm((p) => ({ ...p, updateDate: e.target.value }))} /></div>
          <div className="form-group"><label>Updated By</label><select value={avForm.updatedBy} onChange={(e) => setAVForm((p) => ({ ...p, updatedBy: e.target.value }))}><option value="">Select Engineer</option>{ENGINEERS.map((eng) => <option key={eng}>{eng}</option>)}</select></div>
          <div className="form-group"><label>Status</label><select value={avForm.status} onChange={(e) => setAVForm((p) => ({ ...p, status: e.target.value }))}><option>Done</option><option>Not Done</option><option>N/A</option></select></div>
          <div className="form-group form-full"><label>Remarks</label><textarea style={{ minHeight: 50 }} value={avForm.remarks} onChange={(e) => setAVForm((p) => ({ ...p, remarks: e.target.value }))} /></div>
        </div>
      </Modal>

      <Modal open={assetModal.open} title={assetModal.idx >= 0 ? "Edit Asset" : "Add Asset"} maxWidth={640} onClose={() => setAssetModal({ open: false, idx: -1 })} footer={<><button type="button" className="btn btn-outline" onClick={() => setAssetModal({ open: false, idx: -1 })}>Cancel</button><button type="button" className="btn btn-primary" onClick={saveAssetRecord}>Save Asset</button></>}>
        <div className="form-grid">
          <div className="form-group"><label>Location / Division</label><select value={assetForm.division} onChange={(e) => setAssetForm((p) => ({ ...p, division: e.target.value }))}><option value="">Select</option>{DIVISIONS.map((d) => <option key={d}>{d}</option>)}</select></div>
          <div className="form-group"><label>Line / Machine</label><input type="text" value={assetForm.line} onChange={(e) => setAssetForm((p) => ({ ...p, line: e.target.value }))} /></div>
          <div className="form-group"><label>Sub-Location</label><input type="text" value={assetForm.subloc} onChange={(e) => setAssetForm((p) => ({ ...p, subloc: e.target.value }))} /></div>
          <div className="form-group"><label>Assets Number</label><input type="text" value={assetForm.assetNo} onChange={(e) => setAssetForm((p) => ({ ...p, assetNo: e.target.value }))} /></div>
          <div className="form-group"><label>Host Name</label><input type="text" value={assetForm.hostName} onChange={(e) => setAssetForm((p) => ({ ...p, hostName: e.target.value }))} /></div>
          <div className="form-group"><label>PM Frequency</label><select value={assetForm.pmFreq} onChange={(e) => setAssetForm((p) => ({ ...p, pmFreq: e.target.value }))}><option>MONTHLY</option><option>QUARTERLY</option><option>HALF YEARLY</option><option>YEARLY</option></select></div>
          <div className="form-group"><label>SAP Equipment ID</label><input type="text" value={assetForm.sapId} onChange={(e) => setAssetForm((p) => ({ ...p, sapId: e.target.value }))} /></div>
        </div>
      </Modal>

      <footer style={{ textAlign: "center", padding: 14, fontSize: 11, color: "#8a9bb0", borderTop: "1px solid #dde3ea", marginTop: 30, letterSpacing: 0.5 }}>
        SGS SUPPORT FMS &nbsp;|&nbsp; TML/SGS IT Support Team &nbsp;|&nbsp; ERC Call Management System
      </footer>
    </div>
  );
}
