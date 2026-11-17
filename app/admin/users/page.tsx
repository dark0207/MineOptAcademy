import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { formatDate, initials } from "@/lib/format";
import { setUserActiveAction, setUserRoleAction } from "@/app/actions/admin";
import { ConfirmForm } from "@/components/ConfirmForm";
import { CreateUserForm } from "@/components/admin/CreateUserForm";

export const metadata: Metadata = { title: "Users" };

export default async function AdminUsers() {
  const admin = await requireAdmin();
  const [users, totalTutorials] = await Promise.all([
    db.user.findMany({ orderBy: [{ role: "asc" }, { createdAt: "desc" }], include: { _count: { select: { progress: true } } } }),
    db.tutorial.count({ where: { published: true } }),
  ]);

  return (
    <>
      <div className="admin-title">
        <div>
          <h1>Users</h1>
          <p>{users.length} accounts. Promote trusted people to administrator, or disable access.</p>
        </div>
      </div>

      <CreateUserForm />

      <div className="card table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Progress</th>
              <th>Joined</th>
              <th>Last sign-in</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const self = u.id === admin.id;
              const isAdmin = u.role === "ADMIN";
              return (
                <tr key={u.id}>
                  <td>
                    <div className="row" style={{ flexWrap: "nowrap" }}>
                      <span className="avatar">{initials(u.name)}</span>
                      <div className="title-cell">
                        <strong>
                          {u.name} {self && <span className="faint">(you)</span>}
                        </strong>
                        <span>{u.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${isAdmin ? "badge-accent" : ""}`}>{isAdmin ? "Admin" : "Learner"}</span>
                  </td>
                  <td className="muted">
                    {u._count.progress}/{totalTutorials}
                  </td>
                  <td className="muted">{formatDate(u.createdAt)}</td>
                  <td className="muted">{formatDate(u.lastLoginAt)}</td>
                  <td>
                    <span className={`badge ${u.active ? "badge-success" : "badge-danger"}`}>{u.active ? "Active" : "Disabled"}</span>
                  </td>
                  <td className="actions">
                    {!self && (
                      <>
                        <ConfirmForm action={setUserRoleAction} message={isAdmin ? `Remove administrator rights from ${u.name}?` : `Make ${u.name} an administrator?`}>
                          <input type="hidden" name="id" value={u.id} />
                          <input type="hidden" name="role" value={isAdmin ? "USER" : "ADMIN"} />
                          <button type="submit" className="btn btn-sm">
                            {isAdmin ? "Make learner" : "Make admin"}
                          </button>
                        </ConfirmForm>{" "}
                        <ConfirmForm action={setUserActiveAction} message={u.active ? `Disable ${u.name}? They will be signed out.` : `Re-enable ${u.name}?`}>
                          <input type="hidden" name="id" value={u.id} />
                          <input type="hidden" name="active" value={u.active ? "false" : "true"} />
                          <button type="submit" className={`btn btn-sm ${u.active ? "btn-danger" : "btn-success"}`}>
                            {u.active ? "Disable" : "Enable"}
                          </button>
                        </ConfirmForm>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
