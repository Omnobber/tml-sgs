import { useEffect, useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";
import { Bar, Doughnut, Line, Pie } from "react-chartjs-2";
import { useAuthStore } from "../../store/authStore";
import "./fms.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

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
  const nums = logData.map((r) => parseInt((r.incidentNo || "INC000000").replace("INC", ""), 10) || 0);
  const max = nums.length ? Math.max(...nums) : 0;
  return `INC${(max + 1).toString().padStart(6, "0")}`;
}

function load(key, def) {
  try {
    return JSON.parse(localStorage.getItem(key)) || def;
  } catch {
    return def;
  }
}

function save(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
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
  assetNonAsset: "Assets",
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

export default function FMSModule() {
  const userRole = useAuthStore((s) => s.user?.role || "");
  const canManage = userRole !== "client";

  const [activeTab, setActiveTab] = useState("dashboard");
  const [currentDate, setCurrentDate] = useState(new Date());

  const [logData, setLogData] = useState(() => load("sgs_log", SAMPLE_LOG));
  const [pmData, setPmData] = useState(() => load("sgs_pm", []));
  const [ibData, setIbData] = useState(() => load("sgs_ib", []));
  const [avData, setAvData] = useState(() => load("sgs_av", []));
  const [assetData, setAssetData] = useState(() => load("sgs_assets", SAMPLE_ASSETS));

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

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!logFilter.division) {
      setLogFilter((prev) => ({ ...prev, area: "" }));
      return;
    }
    const options = AREAS[logFilter.division] || [];
    if (logFilter.area && !options.includes(logFilter.area)) {
      setLogFilter((prev) => ({ ...prev, area: "" }));
    }
  }, [logFilter.division, logFilter.area]);

  const uniqueMonths = useMemo(() => [...new Set(logData.map((r) => r.month).filter(Boolean))].sort(), [logData]);

  const logRowsWithIndex = useMemo(
    () =>
      logData.map((row, idx) => ({
        ...row,
        __idx: idx
      })),
    [logData]
  );

  const logFiltered = useMemo(() => {
    const search = logFilter.search.trim().toLowerCase();
    const filtered = logRowsWithIndex.filter(
      (r) =>
        (!logFilter.division || r.division === logFilter.division) &&
        (!logFilter.area || r.area === logFilter.area) &&
        (!logFilter.status || r.status === logFilter.status) &&
        (!logFilter.month || r.month === logFilter.month) &&
        (!logFilter.assettype || r.assetType === logFilter.assettype) &&
        (!logFilter.category || r.callCategory === logFilter.category) &&
        (!search ||
          (r.incidentNo || "").toLowerCase().includes(search) ||
          (r.machine || "").toLowerCase().includes(search) ||
          (r.description || "").toLowerCase().includes(search))
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

  const totalDownMinutes = useMemo(
    () => logData.map((r) => calcMinutes(r.callOpenDate, r.closedDate)).filter((v) => v !== "-").reduce((a, b) => a + b, 0),
    [logData]
  );
  const downList = useMemo(() => logData.map((r) => calcMinutes(r.callOpenDate, r.closedDate)).filter((v) => v !== "-"), [logData]);
  const avgMTTR = downList.length ? Math.round(totalDownMinutes / downList.length) : 0;
  const openCalls = logData.filter((r) => r.status === "OPEN").length;
  const closedCalls = logData.filter((r) => r.status === "CLOSED").length;
  const holdCalls = logData.filter((r) => r.status === "HOLD").length;

  const divisionCounts = useMemo(() => {
    const result = {};
    DIVISIONS.forEach((d) => {
      result[d] = 0;
    });
    logData.forEach((r) => {
      if (r.division) result[r.division] = (result[r.division] || 0) + 1;
    });
    return result;
  }, [logData]);

  const divisionDowntime = useMemo(() => {
    const result = {};
    DIVISIONS.forEach((d) => {
      result[d] = 0;
    });
    logData.forEach((r) => {
      if (!r.division) return;
      const d = calcMinutes(r.callOpenDate, r.closedDate);
      if (d !== "-") result[r.division] = (result[r.division] || 0) + d;
    });
    return result;
  }, [logData]);

  const divisionAvgDown = useMemo(() => {
    const result = {};
    DIVISIONS.forEach((d) => {
      result[d] = divisionCounts[d] ? Math.round(divisionDowntime[d] / divisionCounts[d]) : 0;
    });
    return result;
  }, [divisionCounts, divisionDowntime]);

  const monthMap = useMemo(() => {
    const result = {};
    logData.forEach((r) => {
      if (r.month) result[r.month] = (result[r.month] || 0) + 1;
    });
    return result;
  }, [logData]);

  const monthLabels = useMemo(() => Object.keys(monthMap).sort(), [monthMap]);
  const assetTypeCounts = ASSET_TYPES.map((t) => logData.filter((r) => r.assetType === t).length);
  const assetTypeFiltered = ASSET_TYPES.map((t, i) => ({ t, c: assetTypeCounts[i] })).filter((x) => x.c > 0);
  const statusByDivision = {
    OPEN: DIVISIONS.map((d) => logData.filter((r) => r.division === d && r.status === "OPEN").length),
    CLOSED: DIVISIONS.map((d) => logData.filter((r) => r.division === d && r.status === "CLOSED").length),
    HOLD: DIVISIONS.map((d) => logData.filter((r) => r.division === d && r.status === "HOLD").length)
  };

  const analysisRows = useMemo(
    () =>
      DIVISIONS.map((division) => {
        const calls = logData.filter((r) => r.division === division);
        const downs = calls.map((r) => calcMinutes(r.callOpenDate, r.closedDate)).filter((v) => v !== "-");
        const total = downs.reduce((a, b) => a + b, 0);
        const avg = calls.length ? Math.round(total / calls.length) : 0;
        return { division, cnt: calls.length, tot: total, avg };
      })
        .filter((r) => r.cnt > 0)
        .sort((a, b) => b.avg - a.avg)
        .map((r, idx) => ({ ...r, rank: idx + 1 })),
    [logData]
  );

  const totalAnalysisCount = analysisRows.reduce((a, r) => a + r.cnt, 0);
  const totalAnalysisDowntime = analysisRows.reduce((a, r) => a + r.tot, 0);
  const globalAnalysisAvg = totalAnalysisCount ? Math.round(totalAnalysisDowntime / totalAnalysisCount) : 0;

  const pivotData = useMemo(() => {
    const colTotals = ASSET_TYPES.map(() => 0);
    const rows = DIVISIONS.map((division) => {
      const values = ASSET_TYPES.map((type, idx) => {
        const count = logData.filter((r) => r.division === division && r.assetType === type).length;
        colTotals[idx] += count;
        return count;
      });
      const total = values.reduce((a, b) => a + b, 0);
      return { division, values, total };
    });
    return { rows, colTotals, grandTotal: colTotals.reduce((a, b) => a + b, 0) };
  }, [logData]);

  const engineerRows = useMemo(
    () =>
      ENGINEERS.map((eng) => {
        const calls = logData.filter((r) => r.attendedBy === eng);
        const responses = calls.map((r) => calcMinutes(r.callOpenDate, r.attendDate)).filter((v) => v !== "-");
        const resolutions = calls.map((r) => calcMinutes(r.attendDate, r.closedDate)).filter((v) => v !== "-");
        const avgResponse = responses.length ? Math.round(responses.reduce((a, b) => a + b, 0) / responses.length) : 0;
        const avgResolution = resolutions.length ? Math.round(resolutions.reduce((a, b) => a + b, 0) / resolutions.length) : 0;
        const closed = calls.filter((r) => r.status === "CLOSED").length;
        const openHold = calls.filter((r) => r.status !== "CLOSED").length;
        return { eng, total: calls.length, avgResponse, avgResolution, closed, openHold };
      }),
    [logData]
  );

  const baseBarOptions = { responsive: true, maintainAspectRatio: false, scales: { x: { ticks: { font: { size: 9 }, maxRotation: 30 } }, y: { ticks: { font: { size: 9 } } } } };
  const pieOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "right", labels: { font: { size: 10 }, boxWidth: 12 } } } };

  function sortLog(key) {
    setLogSort((prev) => (prev.key === key ? { key, dir: -prev.dir } : { key, dir: 1 }));
  }

  function openLogModal(idx = -1) {
    setLogModal({ open: true, idx });
    if (idx >= 0) setLogForm({ ...defaultLogForm, ...logData[idx] });
    else setLogForm({ ...defaultLogForm, incidentNo: genIncNo(logData) });
  }

  function saveLogRecord() {
    const next = [...logData];
    if (logModal.idx >= 0) next[logModal.idx] = { ...logForm };
    else next.push({ ...logForm });
    setLogData(next);
    save("sgs_log", next);
    setLogModal({ open: false, idx: -1 });
  }

  function removeLog(idx) {
    if (!window.confirm("Delete this record?")) return;
    const next = logData.filter((_, i) => i !== idx);
    setLogData(next);
    save("sgs_log", next);
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
      "Type",
      "Category",
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
      r.assetType,
      r.callCategory,
      r.rootCause,
      r.repeated,
      r.reportedBy,
      (r.description || "").replace(/,/g, ";"),
      r.attendedBy,
      r.attendDate,
      (r.actionTaken || "").replace(/,/g, ";"),
      r.status,
      r.closedDate,
      calcMinutes(r.callOpenDate, r.attendDate),
      calcMinutes(r.attendDate, r.closedDate),
      calcMinutes(r.callOpenDate, r.closedDate),
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
        <div className="kpi-grid">
          <div className="kpi-card"><div className="kpi-label">Total Calls Logged</div><div className="kpi-value">{logData.length}</div><div className="kpi-sub">All incidents</div></div>
          <div className="kpi-card red"><div className="kpi-label">Open Calls</div><div className="kpi-value" style={{ color: "var(--red)" }}>{openCalls}</div><div className="kpi-sub">Pending resolution</div></div>
          <div className="kpi-card green"><div className="kpi-label">Closed Calls</div><div className="kpi-value" style={{ color: "var(--green)" }}>{closedCalls}</div><div className="kpi-sub">Resolved</div></div>
          <div className="kpi-card orange"><div className="kpi-label">Calls On Hold</div><div className="kpi-value" style={{ color: "var(--orange)" }}>{holdCalls}</div><div className="kpi-sub">Awaiting action</div></div>
          <div className="kpi-card accent"><div className="kpi-label">Avg MTTR (Min)</div><div className="kpi-value" style={{ color: "var(--accent2)" }}>{avgMTTR}</div><div className="kpi-sub">Mean time to repair</div></div>
          <div className="kpi-card"><div className="kpi-label">Total Downtime (Min)</div><div className="kpi-value">{totalDownMinutes}</div><div className="kpi-sub">Cumulative downtime</div></div>
        </div>

        <div className="chart-grid">
          <div className="chart-card">
            <div className="chart-title">Pareto Analysis — Average Downtime MTTR (Min) by Division</div>
            <div className="chart-wrap">
              <Bar data={{ labels: [...DIVISIONS].sort((a, b) => divisionAvgDown[b] - divisionAvgDown[a]), datasets: [{ label: "Avg MTTR (Min)", data: [...DIVISIONS].sort((a, b) => divisionAvgDown[b] - divisionAvgDown[a]).map((d) => divisionAvgDown[d]), backgroundColor: COLORS }] }} options={baseBarOptions} />
            </div>
          </div>
          <div className="chart-card">
            <div className="chart-title">Waterfall — Number of PC Breakdowns by Division</div>
            <div className="chart-wrap">
              <Bar data={{ labels: DIVISIONS, datasets: [{ label: "Breakdowns", data: DIVISIONS.map((d) => divisionCounts[d]), backgroundColor: COLORS }] }} options={baseBarOptions} />
            </div>
          </div>
          <div className="chart-card">
            <div className="chart-title">Total PC Downtime (Min) by Division</div>
            <div className="chart-wrap">
              <Doughnut data={{ labels: DIVISIONS, datasets: [{ data: DIVISIONS.map((d) => divisionDowntime[d]), backgroundColor: COLORS }] }} options={pieOptions} />
            </div>
          </div>
          <div className="chart-card">
            <div className="chart-title">Breakdown by Call Category</div>
            <div className="chart-wrap">
              <Bar data={{ labels: CALL_CATEGORIES, datasets: [{ label: "Count", data: CALL_CATEGORIES.map((c) => logData.filter((r) => r.callCategory === c).length), backgroundColor: COLORS }] }} options={baseBarOptions} />
            </div>
          </div>
          <div className="chart-card">
            <div className="chart-title">Breakdown by Type of Assets</div>
            <div className="chart-wrap">
              <Bar data={{ labels: assetTypeFiltered.map((x) => x.t), datasets: [{ label: "Count", data: assetTypeFiltered.map((x) => x.c), backgroundColor: COLORS }] }} options={baseBarOptions} />
            </div>
          </div>
          <div className="chart-card">
            <div className="chart-title">Monthly Call Volume Trend</div>
            <div className="chart-wrap">
              <Line data={{ labels: monthLabels, datasets: [{ label: "Calls", data: monthLabels.map((m) => monthMap[m]), borderColor: "#1565c0", backgroundColor: "rgba(21,101,192,0.1)", fill: true, tension: 0.4, pointRadius: 3 }] }} options={baseBarOptions} />
            </div>
          </div>
          <div className="chart-card" style={{ gridColumn: "1 / -1" }}>
            <div className="chart-title">Call Status (OPEN / CLOSED / HOLD) by Division</div>
            <div className="chart-wrap" style={{ height: 250 }}>
              <Bar
                data={{
                  labels: DIVISIONS,
                  datasets: [
                    { label: "OPEN", data: statusByDivision.OPEN, backgroundColor: "#c62828" },
                    { label: "CLOSED", data: statusByDivision.CLOSED, backgroundColor: "#2e7d32" },
                    { label: "HOLD", data: statusByDivision.HOLD, backgroundColor: "#e65100" }
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
          <select value={logFilter.division} onChange={(e) => setLogFilter((p) => ({ ...p, division: e.target.value }))}><option value="">All Divisions</option>{DIVISIONS.map((d) => <option key={d}>{d}</option>)}</select>
          <select value={logFilter.area} onChange={(e) => setLogFilter((p) => ({ ...p, area: e.target.value }))}><option value="">All Areas</option>{(AREAS[logFilter.division] || []).map((a) => <option key={a}>{a}</option>)}</select>
          <select value={logFilter.status} onChange={(e) => setLogFilter((p) => ({ ...p, status: e.target.value }))}><option value="">All Status</option><option>OPEN</option><option>CLOSED</option><option>HOLD</option></select>
          <select value={logFilter.assettype} onChange={(e) => setLogFilter((p) => ({ ...p, assettype: e.target.value }))}><option value="">All Asset Types</option>{ASSET_TYPES.map((t) => <option key={t}>{t}</option>)}</select>
          <select value={logFilter.category} onChange={(e) => setLogFilter((p) => ({ ...p, category: e.target.value }))}><option value="">All Categories</option>{CALL_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
          <input type="text" value={logFilter.search} onChange={(e) => setLogFilter((p) => ({ ...p, search: e.target.value }))} placeholder="🔍 Search Incident No / Machine / Description..." />
          <span className="toolbar-spacer" />
          <button type="button" className="btn btn-success" onClick={exportCSV}>⬇ Export CSV</button>
          {canManage ? <button type="button" className="btn btn-primary" onClick={() => openLogModal()}>+ Add New Call</button> : null}
        </div>
        <div className="table-wrap">
          <div className="table-scroll">
            <table id="logTable">
              <thead>
                <tr>
                  <th onClick={() => sortLog("incidentNo")}>INC NO ↕</th><th onClick={() => sortLog("month")}>MONTH ↕</th><th onClick={() => sortLog("callOpenDate")}>CALL OPEN DATE/TIME ↕</th>
                  <th onClick={() => sortLog("division")}>DIVISION ↕</th><th>AREA</th><th>MACHINE</th><th>ASSET NO</th><th>ASSET/NON-ASSET</th>
                  <th>TYPE OF ASSETS</th><th>CALL CATEGORY</th><th>ROOT CAUSE</th><th>REPEATED</th><th>REPORTED BY</th><th>DESCRIPTION</th><th>ATTENDED BY</th>
                  <th>ATTEND DATE/TIME</th><th>ACTION TAKEN</th><th onClick={() => sortLog("status")}>STATUS ↕</th><th>CLOSED DATE/TIME</th><th>RESPONSE(Min)</th>
                  <th>RESOLUTION(Min)</th><th>DOWNTIME(Min)</th><th>PENDING SIDE</th><th>REMARKS</th>{canManage ? <th>ACTIONS</th> : null}
                </tr>
              </thead>
              <tbody>
                {pagedLog.map((r) => (
                  <tr key={`${r.incidentNo}-${r.__idx}`}>
                    <td><span style={{ fontFamily: "IBM Plex Mono", fontSize: 11, color: "var(--blue2)" }}>{r.incidentNo}</span></td>
                    <td>{r.month || ""}</td>
                    <td style={{ whiteSpace: "nowrap", fontSize: 11 }}>{fmtDT(r.callOpenDate)}</td>
                    <td><span style={{ fontWeight: 600, color: "var(--navy2)" }}>{r.division || ""}</span></td>
                    <td>{r.area || ""}</td>
                    <td className="td-truncate">{r.machine || ""}</td>
                    <td style={{ fontFamily: "IBM Plex Mono", fontSize: 10 }}>{r.assetNo || ""}</td>
                    <td>{r.assetNonAsset || ""}</td>
                    <td style={{ fontSize: 10 }}>{r.assetType || ""}</td>
                    <td>{r.callCategory || ""}</td>
                    <td>{r.rootCause || ""}</td>
                    <td><span className={`badge ${r.repeated === "YES" ? "badge-notdone" : "badge-done"}`}>{r.repeated || ""}</span></td>
                    <td>{r.reportedBy || ""}</td>
                    <td style={{ maxWidth: 260, whiteSpace: "normal", wordBreak: "break-word" }}>{r.description || ""}</td>
                    <td style={{ whiteSpace: "nowrap", fontSize: 11 }}>{r.attendedBy || ""}</td>
                    <td style={{ whiteSpace: "nowrap", fontSize: 11 }}>{fmtDT(r.attendDate)}</td>
                    <td style={{ maxWidth: 260, whiteSpace: "normal", wordBreak: "break-word" }}>{r.actionTaken || ""}</td>
                    <td><span className={`badge ${statusBadgeClass(r.status)}`}>{r.status || ""}</span></td>
                    <td style={{ whiteSpace: "nowrap", fontSize: 11 }}>{fmtDT(r.closedDate)}</td>
                    <td style={{ textAlign: "center", fontWeight: 600 }}>{calcMinutes(r.callOpenDate, r.attendDate)}</td>
                    <td style={{ textAlign: "center", fontWeight: 600 }}>{calcMinutes(r.attendDate, r.closedDate)}</td>
                    <td style={{ textAlign: "center", fontWeight: 600, color: "var(--red)" }}>{calcMinutes(r.callOpenDate, r.closedDate)}</td>
                    <td>{r.pendingSide || ""}</td>
                    <td style={{ maxWidth: 260, whiteSpace: "normal", wordBreak: "break-word" }}>{r.remarks || ""}</td>
                    {canManage ? (
                      <td style={{ whiteSpace: "nowrap" }}>
                        <button type="button" className="btn btn-outline btn-sm" onClick={() => openLogModal(r.__idx)}>✎</button>
                        <button type="button" className="btn btn-danger btn-sm" style={{ marginLeft: 4 }} onClick={() => removeLog(r.__idx)}>🗑</button>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination total={logFiltered.length} currentPage={logPage} onPageChange={setLogPage} />
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
          <div className="chart-card"><div className="chart-title">Breakdown by Root Cause</div><div className="chart-wrap"><Pie data={{ labels: ROOT_CAUSES, datasets: [{ data: ROOT_CAUSES.map((rc) => logData.filter((d) => d.rootCause === rc).length), backgroundColor: COLORS }] }} options={pieOptions} /></div></div>
          <div className="chart-card"><div className="chart-title">Breakdown by Call Category</div><div className="chart-wrap"><Pie data={{ labels: CALL_CATEGORIES, datasets: [{ data: CALL_CATEGORIES.map((c) => logData.filter((d) => d.callCategory === c).length), backgroundColor: COLORS }] }} options={pieOptions} /></div></div>
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
            <thead><tr><th>DIVISION</th>{ASSET_TYPES_SHORT.map((a) => <th key={a}>{a}</th>)}<th>TOTAL</th></tr></thead>
            <tbody>
              {pivotData.rows.map((row) => (
                <tr key={`pv-${row.division}`}>
                  <th>{row.division}</th>
                  {row.values.map((v, i) => <td key={`${row.division}-${ASSET_TYPES_SHORT[i]}`} className={v > 0 ? "has-val" : ""}>{v}</td>)}
                  <td style={{ fontWeight: 700, background: "#fff8e1" }}>{row.total}</td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr><td><strong>TOTAL</strong></td>{pivotData.colTotals.map((v, i) => <td key={`tot-${ASSET_TYPES_SHORT[i]}`}>{v}</td>)}<td><strong>{pivotData.grandTotal}</strong></td></tr></tfoot>
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

      <Modal open={logModal.open} title={logModal.idx >= 0 ? "Edit Call Record" : "Add New Call"} onClose={() => setLogModal({ open: false, idx: -1 })} footer={<><button type="button" className="btn btn-outline" onClick={() => setLogModal({ open: false, idx: -1 })}>Cancel</button><button type="button" className="btn btn-primary" onClick={saveLogRecord}>Save Record</button></>}>
        <div className="form-grid">
          <div className="form-group"><label>Incident No.</label><input type="text" value={logForm.incidentNo} readOnly /></div>
          <div className="form-group"><label>Month</label><input type="text" placeholder="e.g. JUL-17" value={logForm.month} onChange={(e) => setLogForm((p) => ({ ...p, month: e.target.value }))} /></div>
          <div className="form-group"><label>Call Open Date/Time</label><input type="datetime-local" value={logForm.callOpenDate} onChange={(e) => setLogForm((p) => ({ ...p, callOpenDate: e.target.value }))} /></div>
          <div className="form-group"><label>Division</label><select value={logForm.division} onChange={(e) => setLogForm((p) => ({ ...p, division: e.target.value, area: "" }))}><option value="">Select</option>{DIVISIONS.map((d) => <option key={d}>{d}</option>)}</select></div>
          <div className="form-group"><label>Area</label><select value={logForm.area} onChange={(e) => setLogForm((p) => ({ ...p, area: e.target.value }))}><option value="">Select Area</option>{(AREAS[logForm.division] || []).map((a) => <option key={a}>{a}</option>)}</select></div>
          <div className="form-group"><label>Device / Machine Name</label><input type="text" value={logForm.machine} onChange={(e) => setLogForm((p) => ({ ...p, machine: e.target.value }))} /></div>
          <div className="form-group"><label>Asset No.</label><input type="text" value={logForm.assetNo} onChange={(e) => setLogForm((p) => ({ ...p, assetNo: e.target.value }))} /></div>
          <div className="form-group"><label>Assets / Non Assets</label><select value={logForm.assetNonAsset} onChange={(e) => setLogForm((p) => ({ ...p, assetNonAsset: e.target.value }))}><option>Assets</option><option>Non Assets</option></select></div>
          <div className="form-group"><label>Type of Assets</label><select value={logForm.assetType} onChange={(e) => setLogForm((p) => ({ ...p, assetType: e.target.value }))}><option value="">Select</option>{ASSET_TYPES.map((t) => <option key={t}>{t}</option>)}</select></div>
          <div className="form-group"><label>Call Category</label><select value={logForm.callCategory} onChange={(e) => setLogForm((p) => ({ ...p, callCategory: e.target.value }))}><option value="">Select</option>{CALL_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
          <div className="form-group"><label>Equipment (Materials)</label><select value={logForm.equipment} onChange={(e) => setLogForm((p) => ({ ...p, equipment: e.target.value }))}>{EQUIPMENT_LIST.map((v) => <option key={v}>{v}</option>)}</select></div>
          <div className="form-group"><label>Root Cause</label><select value={logForm.rootCause} onChange={(e) => setLogForm((p) => ({ ...p, rootCause: e.target.value }))}>{ROOT_CAUSES.map((r) => <option key={r}>{r}</option>)}</select></div>
          <div className="form-group"><label>Repeated</label><select value={logForm.repeated} onChange={(e) => setLogForm((p) => ({ ...p, repeated: e.target.value }))}><option>NO</option><option>YES</option></select></div>
          <div className="form-group"><label>Problem Reported By</label><input type="text" value={logForm.reportedBy} onChange={(e) => setLogForm((p) => ({ ...p, reportedBy: e.target.value }))} /></div>
          <div className="form-group form-full"><label>Call Description</label><textarea value={logForm.description} onChange={(e) => setLogForm((p) => ({ ...p, description: e.target.value }))} /></div>
          <div className="form-group"><label>Call Attended By</label><select value={logForm.attendedBy} onChange={(e) => setLogForm((p) => ({ ...p, attendedBy: e.target.value }))}><option value="">Select Engineer</option>{ENGINEERS.map((eng) => <option key={eng}>{eng}</option>)}</select></div>
          <div className="form-group"><label>Call Attend Date/Time</label><input type="datetime-local" value={logForm.attendDate} onChange={(e) => setLogForm((p) => ({ ...p, attendDate: e.target.value }))} /></div>
          <div className="form-group form-full"><label>Action Taken</label><textarea value={logForm.actionTaken} onChange={(e) => setLogForm((p) => ({ ...p, actionTaken: e.target.value }))} /></div>
          <div className="form-group"><label>Status</label><select value={logForm.status} onChange={(e) => setLogForm((p) => ({ ...p, status: e.target.value }))}><option>OPEN</option><option>CLOSED</option><option>HOLD</option></select></div>
          <div className="form-group"><label>Call Closed Date/Time</label><input type="datetime-local" value={logForm.closedDate} onChange={(e) => setLogForm((p) => ({ ...p, closedDate: e.target.value }))} /></div>
          <div className="form-group"><label>Call Pending Side</label><select value={logForm.pendingSide} onChange={(e) => setLogForm((p) => ({ ...p, pendingSide: e.target.value }))}><option>TML</option><option>SGS</option></select></div>
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
