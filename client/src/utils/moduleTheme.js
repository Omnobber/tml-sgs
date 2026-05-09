export const moduleTheme = {
  "sgs-erc": {
    title: "TML-SGS-ERC",
    color: "#0A3D91",
    routePrefix: "erc"
  },
  "sgs-fms": {
    title: "TML SGS FMS",
    color: "#0B6E4F",
    routePrefix: "fms"
  },
  super: {
    title: "Super Admin",
    color: "#6D2E9B",
    routePrefix: "admin"
  }
};

export function moduleKeyFromUser(user) {
  if (!user) return "";
  if (user.module === "sgs-erc") return "erc";
  if (user.module === "sgs-fms") return "fms";
  return "admin";
}
