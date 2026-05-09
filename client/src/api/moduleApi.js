import http from "./http";

export const fetchCalls = async (moduleName, params = {}) => {
  const { data } = await http.get(`/${moduleName}/calls`, { params });
  return data.calls;
};

export const createCall = async (moduleName, payload) => {
  const { data } = await http.post(`/${moduleName}/calls`, payload);
  return data.call;
};

export const updateCall = async (moduleName, id, payload) => {
  const { data } = await http.patch(`/${moduleName}/calls/${id}`, payload);
  return data.call;
};

export const fetchCallDetail = async (moduleName, id) => {
  const { data } = await http.get(`/${moduleName}/calls/${id}`);
  return data.call;
};

export const fetchSummary = async (moduleName) => {
  const { data } = await http.get(`/${moduleName}/reports/summary`);
  return data;
};

export const fetchUsers = async (moduleName) => {
  const { data } = await http.get(`/${moduleName}/users`);
  return data.users;
};

export const createUser = async (moduleName, payload) => {
  const { data } = await http.post(`/${moduleName}/users`, payload);
  return data.user;
};

export const updateUser = async (moduleName, id, payload) => {
  const { data } = await http.patch(`/${moduleName}/users/${id}`, payload);
  return data.user;
};

export const fetchNotifications = async (moduleName) => {
  const { data } = await http.get(`/${moduleName}/notifications`);
  return data.notifications;
};

export const markNotificationRead = async (moduleName, id) => {
  const { data } = await http.patch(`/${moduleName}/notifications/${id}/read`);
  return data.notification;
};

export const fetchSuperSummary = async () => {
  const { data } = await http.get("/admin/summary");
  return data;
};

export const fetchVehicleStatus = async () => {
  const { data } = await http.get("/fms/vehicle-status");
  return data.vehicles;
};

export const fetchMaintenance = async () => {
  const { data } = await http.get("/fms/maintenance");
  return data.schedules;
};

export const createMaintenance = async (payload) => {
  const { data } = await http.post("/fms/maintenance", payload);
  return data.schedule;
};
