import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { q1, run, now } from "../db/connection.js";

export function hashPassword(pw: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(pw, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(pw: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(pw, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export function createSession(userId: number): string {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
  run("INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)", [userId, token, expires]);
  return token;
}

export interface SessionUser {
  id: number;
  tenant_id: number;
  branch_id: number | null;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  customer_id: number | null;
}

export function getUserFromToken(token: string | undefined): SessionUser | null {
  if (!token) return null;
  const row = q1<SessionUser>(
    `SELECT u.id, u.tenant_id, u.branch_id, u.name, u.email, u.role, u.phone, u.customer_id
     FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token = ? AND s.expires_at > ?`,
    [token, now()]
  );
  return row ?? null;
}

export function destroySession(token: string) {
  run("DELETE FROM sessions WHERE token = ?", [token]);
}

/* ---------------- RBAC ---------------- */

export const ROLES: Record<string, string[]> = {
  super_admin: ["*"],
  tenant_admin: [
    "dashboard.view", "leads.*", "customers.*", "applications.*", "credit.*", "bre.*",
    "underwriting.*", "loans.*", "payments.*", "collections.*", "recovery.*",
    "sanctions.*", "kfs.*", "compliance.*", "audit.view", "reports.*", "ai.*",
    "admin.users", "admin.products", "admin.rules", "admin.integrations", "admin.tenants"
  ],
  branch_admin: [
    "dashboard.view", "leads.*", "customers.*", "applications.*", "credit.view", "credit.fetch",
    "bre.view", "underwriting.view", "loans.view", "payments.view", "payments.record",
    "collections.*", "sanctions.view", "kfs.view", "reports.view", "ai.view"
  ],
  sales_manager: ["dashboard.view", "leads.*", "customers.view", "customers.edit", "applications.view", "applications.create", "reports.view", "ai.view"],
  telecaller: ["dashboard.view", "leads.view", "leads.edit", "leads.convert", "customers.view"],
  field_executive: ["dashboard.view", "leads.view", "leads.edit", "customers.view", "applications.view", "applications.create", "collections.view"],
  credit_analyst: ["dashboard.view", "applications.view", "applications.edit", "applications.advance", "credit.*", "bre.view", "bre.simulate", "underwriting.*", "kfs.view", "ai.view"],
  credit_manager: ["dashboard.view", "applications.*", "credit.*", "bre.view", "underwriting.*", "sanctions.*", "kfs.*", "approvals.decide", "loans.edit", "payments.reverse", "recovery.approve", "reports.view", "ai.view"],
  underwriter: ["dashboard.view", "applications.view", "credit.*", "bre.view", "bre.simulate", "underwriting.*", "kfs.view", "ai.view"],
  operations: ["dashboard.view", "applications.view", "applications.edit", "applications.advance", "documents.*", "sanctions.view", "kfs.view", "agreements.*", "loans.view", "disbursements.*", "payments.view", "payments.record"],
  collection_manager: ["dashboard.view", "loans.view", "collections.*", "recovery.*", "payments.view", "payments.record", "reports.view", "ai.view"],
  collection_agent: ["dashboard.view", "collections.view", "collections.edit", "payments.record", "customers.view", "loans.view"],
  dsa: ["dashboard.view", "leads.view", "leads.create", "leads.edit", "applications.view", "applications.create"],
  finance: ["dashboard.view", "loans.view", "loans.edit", "payments.*", "disbursements.view", "reports.view", "audit.view"],
  auditor: ["dashboard.view", "audit.view", "loans.view", "customers.view", "compliance.view", "reports.view", "payments.view"],
  compliance_officer: ["dashboard.view", "customers.view", "compliance.*", "audit.view", "kyc.*", "consents.*", "complaints.*", "applications.view", "kfs.view", "reports.view"],
  customer_support: ["dashboard.view", "customers.view", "complaints.*", "leads.view", "loans.view", "payments.view"],
  customer: ["portal.*", "dashboard.view"]
};

export function hasPermission(user: SessionUser, perm: string): boolean {
  const perms = ROLES[user.role] ?? [];
  for (const p of perms) {
    if (p === "*") return true;
    if (p.endsWith(".*") && perm.startsWith(p.slice(0, -1))) return true;
    if (p === perm) return true;
  }
  return false;
}

export const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  tenant_admin: "Tenant Admin",
  branch_admin: "Branch Admin",
  sales_manager: "Sales Manager",
  telecaller: "Telecaller",
  field_executive: "Field Executive",
  credit_analyst: "Credit Analyst",
  credit_manager: "Credit Manager",
  underwriter: "Underwriter",
  operations: "Operations",
  collection_manager: "Collection Manager",
  collection_agent: "Collection Agent",
  dsa: "DSA Partner",
  finance: "Finance",
  auditor: "Auditor",
  compliance_officer: "Compliance Officer",
  customer_support: "Customer Support",
  customer: "Customer"
};
