import { useEffect, useState } from "react";
import { api, fmtDate, fmtDateTime } from "../lib/api";
import { PageHeader, Card, CardTitle, Badge, Tabs, Stat, Modal, Field } from "../components/ui";

export default function Compliance() {
  const [data, setData] = useState<any>(null);
  const [tab, setTab] = useState("rules");
  const [complaintOpen, setComplaintOpen] = useState(false);
  const [complaint, setComplaint] = useState<any>({ category: "Service", priority: "medium", subject: "", description: "" });
  const [customers, setCustomers] = useState<any[]>([]);

  const load = () => api("/admin/compliance").then(setData);
  useEffect(() => { load(); api("/customers?limit=100").then((r) => setCustomers(r.rows)); }, []);

  if (!data) return null;

  return (
    <div>
      <PageHeader title="Compliance Center" sub="KYC · AML · Consent · KFS · Grievance — India-focused compliance-control framework" breadcrumb="Compliance" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Stat label="KYC verified" value={data.kycStats?.verified ?? 0} tone="green" />
        <Stat label="KYC pending" value={data.kycStats?.pending ?? 0} tone="amber" />
        <Stat label="Active consents" value={data.consents?.filter((c: any) => c.status === "active").length ?? 0} />
        <Stat label="Open complaints" value={data.complaints?.filter((c: any) => ["open", "in_progress"].includes(c.status)).length ?? 0} tone="red" />
      </div>

      <Tabs active={tab} onChange={setTab} items={[
        { key: "rules", label: "Compliance rules", count: data.rules?.length },
        { key: "consents", label: "Consents", count: data.consents?.length },
        { key: "kyc", label: "KYC records", count: data.kyc?.length },
        { key: "complaints", label: "Grievances", count: data.complaints?.length }
      ]} />

      {tab === "rules" && (
        <Card>
          <CardTitle title="Compliance rule versions" sub="Every rule carries source, effective dates, version and configurable policy" />
          <div className="divide-y divide-zinc-50">
            {data.rules?.map((r: any) => (
              <div key={r.id} className="flex items-start gap-3 py-3">
                <div className="w-14 shrink-0"><Badge status="indigo">{r.rule_id}</Badge></div>
                <div className="flex-1">
                  <div className="text-[12.5px] font-medium text-zinc-800">{r.name} <span className="text-zinc-400 font-normal">· v{r.version}</span></div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">{JSON.parse(r.config || "{}").description || "—"}</div>
                  <div className="text-[10.5px] text-zinc-400 mt-0.5">Source: {r.source} · effective {fmtDate(r.effective_from)}{r.expiry ? ` → ${fmtDate(r.expiry)}` : ""}</div>
                </div>
                <Badge status={r.status} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === "consents" && (
        <Card>
          <CardTitle title="Consent ledger" sub="Type · purpose · channel · status — evidence retained" />
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead><tr className="border-b border-zinc-200 text-zinc-400 text-left">
                <th className="th">Customer</th><th className="th">Type</th><th className="th">Purpose</th><th className="th">Channel</th><th className="th">Obtained</th><th className="th">Status</th>
              </tr></thead>
              <tbody>
                {data.consents?.map((c: any) => (
                  <tr key={c.id} className="border-b border-zinc-50">
                    <td className="td font-medium">{c.customer_name}</td>
                    <td className="td capitalize">{c.type}</td>
                    <td className="td text-zinc-500">{c.purpose || "—"}</td>
                    <td className="td capitalize text-zinc-500">{c.channel}</td>
                    <td className="td text-zinc-500">{fmtDateTime(c.obtained_at)}</td>
                    <td className="td"><Badge status={c.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === "kyc" && (
        <Card>
          <CardTitle title="KYC verification records" sub="Verification source, reference, consent and audit are always retained" />
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead><tr className="border-b border-zinc-200 text-zinc-400 text-left">
                <th className="th">Customer</th><th className="th">Type</th><th className="th">Provider</th><th className="th">Reference</th><th className="th">Verified</th><th className="th">Expires</th><th className="th">Status</th>
              </tr></thead>
              <tbody>
                {data.kyc?.map((k: any) => (
                  <tr key={k.id} className="border-b border-zinc-50">
                    <td className="td font-medium">{k.customer_name}</td>
                    <td className="td uppercase">{k.type}</td>
                    <td className="td text-zinc-500">{k.provider} {k.provider?.startsWith("MOCK") && <Badge status="sandbox">SANDBOX</Badge>}</td>
                    <td className="td font-mono text-[11px]">{k.reference_id}</td>
                    <td className="td text-zinc-500">{k.verified_at ? fmtDate(k.verified_at) : "—"}</td>
                    <td className="td text-zinc-500">{k.expires_at ? fmtDate(k.expires_at) : "—"}</td>
                    <td className="td"><Badge status={k.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === "complaints" && (
        <Card>
          <CardTitle title="Customer grievance center" sub="Acknowledge → assign → resolve within SLA, with escalation" right={
            <button className="btn btn-primary btn-sm" onClick={() => setComplaintOpen(true)}>New complaint</button>
          } />
          <div className="divide-y divide-zinc-50">
            {data.complaints?.map((c: any) => (
              <div key={c.id} className="flex items-center gap-3 py-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[12.5px] font-medium text-zinc-800">{c.complaint_no}</span>
                    <Badge status={c.priority} />
                    <span className="text-[12px] text-zinc-500">{c.subject}</span>
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">{c.customer_name || "—"} · {c.category} · {fmtDate(c.created_at)} · SLA {c.sla_hours}h{c.c.resolved_at ? ` · resolved ${fmtDate(c.resolved_at)}` : ""}</div>
                  {c.resolution && <div className="text-[11px] text-zinc-500 mt-1">Resolution: {c.resolution}</div>}
                </div>
                <Badge status={c.status} />
                {["open", "in_progress"].includes(c.status) && (
                  <div className="flex gap-1">
                    <button className="btn btn-secondary btn-sm" onClick={async () => { await api(`/admin/complaints/${c.id}`, { method: "PATCH", body: { status: "in_progress" } }); load(); }}>Progress</button>
                    <button className="btn btn-primary btn-sm" onClick={async () => { const r = prompt("Resolution notes:"); await api(`/admin/complaints/${c.id}`, { method: "PATCH", body: { status: "resolved", resolution: r || "Resolved" } }); load(); }}>Resolve</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      <Modal open={complaintOpen} onClose={() => setComplaintOpen(false)} title="Raise customer complaint">
        <div className="space-y-3">
          <Field label="Customer">
            <select className="input" value={complaint.customer_id ?? ""} onChange={(e) => setComplaint({ ...complaint, customer_id: Number(e.target.value) })}>
              <option value="">Select customer…</option>
              {customers.slice(0, 100).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category"><input className="input" value={complaint.category} onChange={(e) => setComplaint({ ...complaint, category: e.target.value })} /></Field>
            <Field label="Priority">
              <select className="input" value={complaint.priority} onChange={(e) => setComplaint({ ...complaint, priority: e.target.value })}>
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
              </select>
            </Field>
          </div>
          <Field label="Subject"><input className="input" value={complaint.subject} onChange={(e) => setComplaint({ ...complaint, subject: e.target.value })} /></Field>
          <Field label="Description"><textarea className="input min-h-16" value={complaint.description} onChange={(e) => setComplaint({ ...complaint, description: e.target.value })} /></Field>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button className="btn btn-secondary" onClick={() => setComplaintOpen(false)}>Cancel</button>
          <button className="btn btn-primary" disabled={!complaint.customer_id || !complaint.subject} onClick={async () => { await api("/admin/complaints", { method: "POST", body: complaint }); setComplaintOpen(false); setComplaint({ category: "Service", priority: "medium", subject: "", description: "" }); load(); }}>Register complaint</button>
        </div>
      </Modal>
    </div>
  );
}
