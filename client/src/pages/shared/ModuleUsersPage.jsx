import { useEffect, useState } from "react";
import { createUser, fetchUsers, updateUser } from "../../api/moduleApi";

export default function ModuleUsersPage({ moduleName, title }) {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "engineer" });

  const load = async () => {
    const rows = await fetchUsers(moduleName);
    setUsers(rows);
  };

  useEffect(() => {
    load().catch(() => {});
  }, [moduleName]);

  const submit = async (e) => {
    e.preventDefault();
    await createUser(moduleName, form);
    setForm({ name: "", email: "", password: "", role: "engineer" });
    await load();
  };

  const toggle = async (user) => {
    await updateUser(moduleName, user.id, { isActive: !user.is_active });
    await load();
  };

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold">{title} User Management</h2>

      <form onSubmit={submit} className="card grid gap-3 md:grid-cols-4">
        <input className="rounded border px-3 py-2" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className="rounded border px-3 py-2" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input className="rounded border px-3 py-2" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        <select className="rounded border px-3 py-2" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          <option value="admin">admin</option>
          <option value="engineer">engineer</option>
          <option value="client">client</option>
        </select>
        <div className="md:col-span-4">
          <button className="rounded bg-slate-900 px-4 py-2 text-white">Create User</button>
        </div>
      </form>

      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>{user.is_active ? "Active" : "Inactive"}</td>
                <td>
                  <button onClick={() => toggle(user)} className="rounded bg-slate-800 px-2 py-1 text-xs text-white">
                    {user.is_active ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
