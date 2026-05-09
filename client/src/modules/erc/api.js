const STORAGE_KEYS = {
  cameras: "erc_cameras",
  calls: "erc_calls",
  inventory: "erc_inventory",
  engineers: "erc_engineers"
};

const seedEngineers = [
  { _id: "eng-1", name: "RATNESH SINGH - Team Leader", email: "ratnesh@erc.local" },
  { _id: "eng-2", name: "ADITYA SINHA", email: "aditya.sinha@erc.local" },
  { _id: "eng-3", name: "ADITYA PANDEY", email: "aditya.pandey@erc.local" },
  { _id: "eng-4", name: "NIHAL GUPTA", email: "nihal.gupta@erc.local" },
  { _id: "eng-5", name: "RITIK GUPTA", email: "ritik.gupta@erc.local" }
];

const seedCameras = Array.from({ length: 36 }).map((_, idx) => {
  const no = String(idx + 1).padStart(3, "0");
  const status = idx % 11 === 0 ? "maintenance" : idx % 5 === 0 ? "faulty" : "active";
  const lastFaultCategory = status === "faulty" ? "camera_not_working" : status === "maintenance" ? "camera_not_in_use" : "";
  return {
    _id: `cam-${idx + 1}`,
    cameraId: `CAM-${no}`,
    name: `Shopfloor Camera ${idx + 1}`,
    location: `Zone ${((idx % 6) + 1).toString()}`,
    modelNumber: `SGS-ERC-M${100 + idx}`,
    serialNumber: `SN-ERC-${5000 + idx}`,
    status,
    lastFaultCategory,
    lastIssue: status === "faulty" ? "Camera Not Working" : status === "maintenance" ? "Camera Not In Use" : "",
    downUntil: status === "active" ? null : new Date(Date.now() + (idx % 8) * 3600 * 1000).toISOString()
  };
});

const seedCalls = [
  {
    _id: "call-1",
    cameraId: "CAM-001",
    issueDescription: "[INC000101] Video feed black screen",
    priority: "high",
    faultCategory: "camera_not_working",
    status: "assigned",
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    assignedEngineerId: "eng-2",
    feedback:
      "Division: Press\nArea: Bay 2\nCategory: Camera Not Working\nReported By: Shift Supervisor\nAttended By: ADITYA SINHA\nLegacy Status: Assigned\nAction Taken: Engineer assigned and diagnostics started",
    images: { before: "", after: "" },
    gps: { lat: "", lng: "" },
    approval: {}
  },
  {
    _id: "call-2",
    cameraId: "CAM-007",
    issueDescription: "[INC000102] Network packet loss detected",
    priority: "medium",
    faultCategory: "network_issue",
    status: "awaiting_customer_approval",
    createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    assignedEngineerId: "eng-3",
    feedback:
      "Division: Assembly\nArea: Main Corridor\nCategory: Network Issue\nReported By: Control Room\nAttended By: ADITYA PANDEY\nLegacy Status: Awaiting Approval\nAction Taken: Re-terminated patch and stabilized link",
    images: { before: "", after: "" },
    gps: { lat: "22.8042", lng: "86.2028" },
    approval: { requestNote: "Please validate image stream now." }
  },
  {
    _id: "call-3",
    cameraId: "CAM-012",
    issueDescription: "[INC000103] Camera intermittently rebooting",
    priority: "low",
    faultCategory: "power_failure",
    status: "completed",
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    assignedEngineerId: "eng-1",
    feedback:
      "Division: Utilities\nArea: Switch Room\nCategory: Power Failure\nReported By: Maintenance\nAttended By: RATNESH SINGH - Team Leader\nLegacy Status: Closed\nAction Taken: Replaced power adaptor and tested uptime",
    images: { before: "", after: "" },
    gps: { lat: "22.8010", lng: "86.2050" },
    approval: {},
    customerDecision: "approved"
  }
];

const seedInventory = [
  { _id: "inv-1", name: "CAT6 Cable", sku: "CAB-ERC-001", quantity: 28, threshold: 10, unit: "pcs" },
  { _id: "inv-2", name: "PoE Injector", sku: "POE-ERC-004", quantity: 7, threshold: 5, unit: "pcs" },
  { _id: "inv-3", name: "12V Adapter", sku: "PWR-ERC-022", quantity: 14, threshold: 6, unit: "pcs" }
];

function nowIso() {
  return new Date().toISOString();
}

function toJson(value, fallback) {
  try {
    return JSON.parse(value ?? "null") ?? fallback;
  } catch {
    return fallback;
  }
}

function getStore() {
  const cameras = toJson(localStorage.getItem(STORAGE_KEYS.cameras), null) || seedCameras;
  const calls = toJson(localStorage.getItem(STORAGE_KEYS.calls), null) || seedCalls;
  const inventory = toJson(localStorage.getItem(STORAGE_KEYS.inventory), null) || seedInventory;
  const engineers = toJson(localStorage.getItem(STORAGE_KEYS.engineers), null) || seedEngineers;
  setStore({ cameras, calls, inventory, engineers });
  return { cameras, calls, inventory, engineers };
}

function setStore(next) {
  localStorage.setItem(STORAGE_KEYS.cameras, JSON.stringify(next.cameras));
  localStorage.setItem(STORAGE_KEYS.calls, JSON.stringify(next.calls));
  localStorage.setItem(STORAGE_KEYS.inventory, JSON.stringify(next.inventory));
  localStorage.setItem(STORAGE_KEYS.engineers, JSON.stringify(next.engineers));
}

function authUser() {
  const session = toJson(localStorage.getItem("sgs_auth"), {});
  return session?.user || null;
}

function fail(message, status = 400) {
  return Promise.reject({ response: { status, data: { message } } });
}

function withCamera(call, cameras, engineers) {
  const camera = cameras.find((c) => c.cameraId === call.cameraId) || null;
  const assignedEngineer = engineers.find((e) => e._id === call.assignedEngineerId) || null;
  const isOverdue = call.status !== "completed" && Date.now() - new Date(call.createdAt).getTime() > 4 * 60 * 60 * 1000;
  return {
    ...call,
    camera,
    assignedEngineer,
    isOverdue
  };
}

function filterCalls(calls, filters) {
  const { status = "", engineerId = "", date = "", search = "" } = filters || {};
  const query = String(search || "").trim().toLowerCase();
  return calls.filter((call) => {
    if (status && call.status !== status) return false;
    if (engineerId && call.assignedEngineerId !== engineerId) return false;
    if (date) {
      const callDate = new Date(call.createdAt).toISOString().slice(0, 10);
      if (callDate !== date) return false;
    }
    if (query) {
      const hay = `${call.cameraId} ${call.issueDescription} ${call.feedback || ""}`.toLowerCase();
      if (!hay.includes(query)) return false;
    }
    return true;
  });
}

function dashboardSummary(cameras, calls, timeRange = "monthly") {
  const active = cameras.filter((c) => c.status === "active").length;
  const faulty = cameras.filter((c) => c.status !== "active").length;
  const faultMap = {};
  calls.forEach((call) => {
    const name =
      call.faultCategory === "camera_not_working"
        ? "Camera Not Working"
        : call.faultCategory === "camera_not_in_use"
          ? "Camera Not In Use"
          : call.faultCategory === "network_issue"
            ? "Network Issue"
            : call.faultCategory === "power_failure"
              ? "Power Failure"
              : call.faultCategory === "wiring_issue"
                ? "Wiring Issue"
                : "Other";
    faultMap[name] = (faultMap[name] || 0) + 1;
  });
  const faultAnalysis = Object.entries(faultMap).map(([name, value]) => ({ name, value }));
  return {
    selectedTimeRange: timeRange,
    cameraStatus: { total: cameras.length, active, faulty },
    cameraGrid: cameras,
    faultAnalysis,
    monthlyDowncalls: faultAnalysis
  };
}

function reportsSummary(cameras, calls, params = {}) {
  const totalCameras = cameras.length;
  const workingCameras = cameras.filter((c) => c.status === "active").length;
  const notWorkingCameras = totalCameras - workingCameras;
  const totalDowncalls = calls.length;
  const uptimePercent = totalCameras ? ((workingCameras / totalCameras) * 100).toFixed(1) : "0.0";
  const slaPercent = totalDowncalls
    ? ((calls.filter((c) => c.status === "completed").length / totalDowncalls) * 100).toFixed(1)
    : "0.0";
  const issue = {};
  calls.forEach((call) => {
    const name =
      call.faultCategory === "camera_not_working"
        ? "Camera Not Working"
        : call.faultCategory === "network_issue"
          ? "Network Issue"
          : call.faultCategory === "power_failure"
            ? "Power Failure"
            : call.faultCategory === "wiring_issue"
              ? "Wiring Issue"
              : "Other";
    issue[name] = (issue[name] || 0) + 1;
  });
  const issueCategory = Object.entries(issue).map(([name, value]) => ({ name, value }));
  const byDay = {};
  calls.forEach((call) => {
    const day = new Date(call.createdAt).toISOString().slice(0, 10);
    byDay[day] = (byDay[day] || 0) + 1;
  });
  const downcallsTrend = Object.entries(byDay)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, downcalls]) => ({ date, downcalls }));

  return {
    report: {
      dateRange: {
        startDate: params.startDate || "",
        endDate: params.endDate || ""
      },
      kpis: {
        totalCameras,
        workingCameras,
        notWorkingCameras,
        totalDowncalls,
        uptimePercent,
        slaPercent,
        deltas: {
          totalCameras: 0,
          workingCameras: 0,
          notWorkingCameras: 0,
          totalDowncalls: 0,
          uptimePercent: 0,
          slaPercent: 0
        }
      },
      charts: {
        cameraStatus: [
          { name: "Working", value: workingCameras },
          { name: "Not Working", value: notWorkingCameras }
        ],
        issueCategory,
        downcallsTrend
      }
    }
  };
}

function routePath(url) {
  const [path, query = ""] = String(url || "").split("?");
  return { path, query, searchParams: new URLSearchParams(query) };
}

const api = {
  async get(url, config = {}) {
    const { cameras, calls, inventory, engineers } = getStore();
    const { path, searchParams } = routePath(url);
    const params = { ...(config.params || {}) };
    for (const [k, v] of searchParams.entries()) params[k] = v;

    if (path === "/auth/engineers") return { data: { engineers } };
    if (path === "/cameras") return { data: { cameras } };
    if (path.startsWith("/cameras/") && path.endsWith("/details")) {
      const id = path.split("/")[2];
      const camera = cameras.find((c) => c._id === id);
      if (!camera) return fail("Camera not found", 404);
      return { data: { camera } };
    }
    if (path === "/calls") {
      const user = authUser();
      let scopedCalls = [...calls];
      if (user?.role === "engineer") {
        const engineer = engineers.find((e) => e.email === user.email) || engineers[0];
        scopedCalls = scopedCalls.filter((c) => !c.assignedEngineerId || c.assignedEngineerId === engineer._id);
      }
      scopedCalls = filterCalls(scopedCalls, params);
      return { data: { calls: scopedCalls.map((c) => withCamera(c, cameras, engineers)) } };
    }
    if (path.startsWith("/calls/")) {
      const id = path.split("/")[2];
      const call = calls.find((c) => c._id === id);
      if (!call) return fail("Call not found", 404);
      return { data: { call: withCamera(call, cameras, engineers) } };
    }
    if (path === "/dashboard/summary") {
      return { data: dashboardSummary(cameras, calls, params.timeRange || "monthly") };
    }
    if (path === "/reports") return { data: reportsSummary(cameras, calls, params) };
    if (path === "/reports/export/pdf" || path === "/reports/export/excel") {
      const mime = path.endsWith("/pdf") ? "application/pdf" : "application/vnd.ms-excel";
      const text = path.endsWith("/pdf") ? "ERC Report PDF Export" : "ERC Report Excel Export";
      return { data: new Blob([text], { type: mime }) };
    }
    if (path === "/inventory") return { data: { items: inventory } };

    return fail(`Unknown GET endpoint: ${path}`, 404);
  },

  async post(url, body, config = {}) {
    const store = getStore();
    const { cameras, calls, inventory, engineers } = store;
    const { path } = routePath(url);

    if (path === "/uploads/image") {
      const file = config?.headers?.["Content-Type"] === "multipart/form-data" ? body?.get?.("image") : null;
      return { data: { url: file ? URL.createObjectURL(file) : "" } };
    }
    if (path === "/calls") {
      const camera = cameras.find((c) => c.cameraId === body.cameraId);
      if (!camera) return fail("Camera not found", 404);
      const call = {
        _id: `call-${Date.now()}`,
        cameraId: body.cameraId,
        issueDescription: body.issueDescription || "Issue not specified",
        priority: body.priority || "medium",
        faultCategory: body.faultCategory || "camera_not_working",
        status: "pending",
        createdAt: nowIso(),
        assignedEngineerId: "",
        feedback: "",
        images: { before: "", after: "" },
        gps: { lat: "", lng: "" },
        approval: {}
      };
      store.calls = [call, ...calls];
      setStore(store);
      return { data: { call: withCamera(call, cameras, engineers) } };
    }
    if (path === "/inventory") {
      const item = {
        _id: `inv-${Date.now()}`,
        name: body.name,
        sku: body.sku,
        quantity: Number(body.quantity || 0),
        threshold: Number(body.threshold || 0),
        unit: body.unit || "pcs"
      };
      store.inventory = [item, ...inventory];
      setStore(store);
      return { data: { item } };
    }

    return fail(`Unknown POST endpoint: ${path}`, 404);
  },

  async patch(url, body) {
    const store = getStore();
    const { cameras, calls, engineers } = store;
    const { path } = routePath(url);

    const callMatch = path.match(/^\/calls\/([^/]+)\/(.+)$/);
    if (callMatch) {
      const [, id, action] = callMatch;
      const idx = calls.findIndex((c) => c._id === id);
      if (idx < 0) return fail("Call not found", 404);
      const next = { ...calls[idx] };

      if (action === "assign") {
        next.assignedEngineerId = body.engineerId || "";
        if (next.status === "pending") next.status = "assigned";
      } else if (action === "status") {
        next.status = body.status || next.status;
        next.feedback = body.feedback ?? next.feedback;
        next.images = { before: body.beforeImageUrl || "", after: body.afterImageUrl || "" };
        next.gps = { lat: body.lat || "", lng: body.lng || "" };
      } else if (action === "request-approval") {
        next.status = "awaiting_customer_approval";
        next.feedback = body.feedback ?? next.feedback;
        next.images = { before: body.beforeImageUrl || "", after: body.afterImageUrl || "" };
        next.gps = { lat: body.lat || "", lng: body.lng || "" };
        next.approval = { requestNote: body.approvalNote || "" };
      } else if (action === "customer-decision") {
        next.customerDecision = body.decision;
        next.customerDecisionNote = body.decisionNote || "";
        next.status = body.decision === "approve" ? "approved" : "rejected_on_hold";
      } else {
        return fail(`Unknown call action: ${action}`, 404);
      }

      store.calls[idx] = next;
      setStore(store);
      return { data: { call: withCamera(next, cameras, engineers) } };
    }

    const callDirectMatch = path.match(/^\/calls\/([^/]+)$/);
    if (callDirectMatch) {
      const id = callDirectMatch[1];
      const idx = calls.findIndex((c) => c._id === id);
      if (idx < 0) return fail("Call not found", 404);
      store.calls[idx] = { ...store.calls[idx], ...body };
      setStore(store);
      return { data: { call: withCamera(store.calls[idx], cameras, engineers) } };
    }

    const cameraMatch = path.match(/^\/cameras\/([^/]+)$/);
    if (cameraMatch) {
      const id = cameraMatch[1];
      const idx = cameras.findIndex((c) => c._id === id);
      if (idx < 0) return fail("Camera not found", 404);
      const current = cameras[idx];
      const updated = {
        ...current,
        status: body.status || current.status,
        lastFaultCategory: body.lastFaultCategory ?? current.lastFaultCategory,
        lastIssue: body.lastIssue ?? current.lastIssue,
        downUntil: body.downUntil ?? current.downUntil
      };
      store.cameras[idx] = updated;
      setStore(store);
      return { data: { camera: updated } };
    }

    return fail(`Unknown PATCH endpoint: ${path}`, 404);
  }
};

export default api;
