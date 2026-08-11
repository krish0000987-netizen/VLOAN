import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, fmtInr, badgeFor, statusLabel } from "../lib/api";
import { PageHeader, Card, DataTable, Badge, type Column } from "../components/ui";

export default function Customers() {
  const nav = useNavigate();
  const [data, setData] = useState<any>({ rows: [], total: 0 });
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    params.set("page", String(page));
    api(`/customers?${params}`).then(setData);
  }, [q, page]);

  const columns: Column<any>[] = [
    { key: "customer_no", header: "Customer ID", render: (r) => <span className="font-medium text-zinc-800">{r.customer_no}</span> },
    { key: "name", header: "Name", sortValue: (r) => r.name, render: (r) => (
      <div>
        <div className="font-medium text-zinc-800">{r.name}</div>
        <div className="text-[10.5px] text-zinc-400">{r.mobile || ""}</div>
      </div>
    )},
    { key: "city", header: "Location", render: (r) => <span className="text-zinc-600">{r.city ? `${r.city}, ${r.state}` : "—"}</span> },
    { key: "employment", header: "Profile", render: (r) => <span className="capitalize text-zinc-600">{r.employment_type || "—"}</span> },
    { key: "credit_score", header: "Credit score", align: "right", sortValue: (r) => r.credit_score, render: (r) => r.credit_score ? (
      <span className={`num font-semibold ${r.credit_score >= 750 ? "text-emerald-600" : r.credit_score >= 650 ? "text-amber-600" : "text-rose-600"}`}>{r.credit_score}</span>
    ) : <span className="text-zinc-300">—</span>},
    { key: "risk", header: "Risk", render: (r) => <Badge status={r.risk_class} /> },
    { key: "kyc", header: "KYC", render: (r) => <Badge status={r.kyc_status} /> },
    { key: "loans", header: "Active loans", align: "right", render: (r) => <span className="num">{r.active_loans}</span> },
    { key: "apps", header: "Applications", align: "right", render: (r) => <span className="num">{r.applications_count}</span> },
    { key: "status", header: "Status", render: (r) => <Badge status={r.status} /> }
  ];

  return (
    <div>
      <PageHeader title="Customers" sub={`${data.total} customer profiles · complete 360 view`} breadcrumb="CRM / Customers" />
      <Card>
        <DataTable
          columns={columns}
          rows={data.rows}
          total={data.total}
          page={page}
          limit={25}
          onPage={setPage}
          searchable
          searchPlaceholder="Search by name, mobile, PAN, customer ID…"
          onSearch={(v) => { setQ(v); setPage(1); }}
          onRowClick={(r) => nav(`/customers/${r.id}`)}
          exportName="nexus-customers"
        />
      </Card>
    </div>
  );
}
