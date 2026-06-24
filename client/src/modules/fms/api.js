import http from "../../api/http";

export async function fetchFmsCallLogs() {
  const { data } = await http.get("/fms/calls");
  return data.calls || [];
}

export async function createFmsCallLog(payload) {
  const { data } = await http.post("/fms/calls", payload);
  return data.call;
}

export async function updateFmsCallLog(id, payload) {
  const { data } = await http.patch(`/fms/calls/${id}`, payload);
  return data.call;
}

export async function deleteFmsCallLog(id) {
  const { data } = await http.delete(`/fms/calls/${id}`);
  return data;
}

export async function deleteFmsCallLogs(ids) {
  const { data } = await http.post("/fms/calls/delete", { ids });
  return data;
}

export async function fetchFmsImportHistory() {
  const { data } = await http.get("/fms/imports");
  return data.imports || [];
}

export async function uploadFmsImportChunk(payload) {
  const { data } = await http.post("/fms/imports", payload);
  return data;
}

export async function fetchFmsImportErrors(importId) {
  const { data } = await http.get(`/fms/imports/${importId}/errors`);
  return data.errors || [];
}

export async function rollbackLastFmsImport() {
  const { data } = await http.post("/fms/imports/rollback-last");
  return data;
}

export async function fetchFmsHealth() {
  const { data } = await http.get("/health");
  return data;
}
