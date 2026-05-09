import http from "./http";

export const login = async ({ module, role, email, password }) => {
  const { data } = await http.post("/auth/login", { module, role, email, password });
  return data;
};

export const superLogin = async ({ email, password }) => {
  const { data } = await http.post("/auth/super/login", { email, password });
  return data;
};

export const logout = async (refreshToken) => {
  await http.post("/auth/logout", { refreshToken });
};
