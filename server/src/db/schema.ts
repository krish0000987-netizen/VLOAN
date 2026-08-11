import { db } from "./connection.js";

/**
 * NEXUS schema — the platform's own domain model.
 * Tenancy-isolated: every business table carries tenant_id and is queried
 * through tenant-scoped helpers. No cross-tenant leakage by construction.
 */
export function createSchema() {
  db().exec(`
  CREATE TABLE IF NOT EXISTS tenants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    branding TEXT NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS branches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    city TEXT, state TEXT, pincode TEXT,
    status TEXT NOT NULL DEFAULT 'active'
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    branch_id INTEGER REFERENCES branches(id),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    phone TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    last_login_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    token TEXT UNIQUE NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    branch_id INTEGER REFERENCES branches(id),
    lead_no TEXT UNIQUE NOT NULL,
    customer_id INTEGER,
    name TEXT NOT NULL,
    mobile TEXT, email TEXT,
    city TEXT, state TEXT,
    loan_type TEXT,
    requested_amount INTEGER,
    monthly_income INTEGER,
    business_turnover INTEGER,
    source TEXT,
    campaign TEXT,
    dsa_id INTEGER REFERENCES users(id),
    owner_id INTEGER REFERENCES users(id),
    score INTEGER NOT NULL DEFAULT 0,
    probability INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'new',
    next_action TEXT,
    followup_at TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS lead_activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id INTEGER NOT NULL REFERENCES leads(id),
    user_id INTEGER REFERENCES users(id),
    kind TEXT,
    outcome TEXT,
    note TEXT,
    duration_sec INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    customer_no TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    mobile TEXT, email TEXT,
    dob TEXT, gender TEXT,
    pan TEXT,
    aadhaar_masked TEXT,
    address_line1 TEXT, city TEXT, state TEXT, pincode TEXT,
    employment_type TEXT,
    business_name TEXT,
    annual_income INTEGER,
    monthly_income INTEGER,
    business_turnover INTEGER,
    risk_class TEXT NOT NULL DEFAULT 'standard',
    credit_score INTEGER,
    kyc_status TEXT NOT NULL DEFAULT 'pending',
    status TEXT NOT NULL DEFAULT 'active',
    fraud_flag INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    min_amount INTEGER NOT NULL DEFAULT 10000,
    max_amount INTEGER NOT NULL DEFAULT 5000000,
    min_tenure INTEGER NOT NULL DEFAULT 6,
    max_tenure INTEGER NOT NULL DEFAULT 60,
    interest_type TEXT NOT NULL DEFAULT 'reducing',
    interest_rate REAL NOT NULL DEFAULT 16,
    processing_fee_pct REAL NOT NULL DEFAULT 2,
    processing_fee_gst_pct REAL NOT NULL DEFAULT 18,
    penal_rate_pct REAL NOT NULL DEFAULT 24,
    late_fee_amount INTEGER NOT NULL DEFAULT 0,
    grace_days INTEGER NOT NULL DEFAULT 3,
    prepayment_allowed INTEGER NOT NULL DEFAULT 1,
    foreclosure_charge_pct REAL NOT NULL DEFAULT 3,
    part_payment_allowed INTEGER NOT NULL DEFAULT 1,
    part_payment_min_amount INTEGER NOT NULL DEFAULT 10000,
    emi_frequency TEXT NOT NULL DEFAULT 'monthly',
    allocation_order TEXT NOT NULL DEFAULT 'penalty,fees,interest,principal',
    status TEXT NOT NULL DEFAULT 'active'
  );

  CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    application_no TEXT UNIQUE NOT NULL,
    lead_id INTEGER,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    branch_id INTEGER,
    dsa_id INTEGER,
    sales_officer_id INTEGER,
    credit_officer_id INTEGER,
    source TEXT,
    requested_amount INTEGER,
    approved_amount INTEGER,
    tenure INTEGER,
    purpose TEXT,
    co_applicant_name TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    stage TEXT NOT NULL DEFAULT 'application',
    risk_grade TEXT,
    bre_result TEXT NOT NULL DEFAULT 'pending',
    bre_detail TEXT DEFAULT '{}',
    fraud_score INTEGER,
    decision TEXT NOT NULL DEFAULT 'pending',
    decision_by INTEGER,
    decision_at TEXT,
    decision_note TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS workflow_stages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    product_id INTEGER,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    seq INTEGER NOT NULL,
    required_fields TEXT NOT NULL DEFAULT '[]',
    required_documents TEXT NOT NULL DEFAULT '[]',
    sla_hours INTEGER NOT NULL DEFAULT 24,
    approver_role TEXT,
    config TEXT NOT NULL DEFAULT '{}',
    active INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS application_stages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id INTEGER NOT NULL REFERENCES applications(id),
    stage TEXT NOT NULL,
    entered_at TEXT,
    exited_at TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    completed_by INTEGER,
    data TEXT NOT NULL DEFAULT '{}'
  );

  CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    customer_id INTEGER,
    application_id INTEGER,
    category TEXT NOT NULL,
    name TEXT,
    file_path TEXT,
    status TEXT NOT NULL DEFAULT 'uploaded',
    verified_by INTEGER,
    verified_at TEXT,
    ocr_data TEXT NOT NULL DEFAULT '{}',
    ocr_confidence REAL,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS kyc_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    type TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    provider TEXT,
    reference_id TEXT,
    result TEXT NOT NULL DEFAULT '{}',
    consent_id INTEGER,
    verified_by INTEGER,
    verified_at TEXT,
    expires_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS consents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    type TEXT NOT NULL,
    purpose TEXT,
    version TEXT,
    channel TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    obtained_at TEXT NOT NULL DEFAULT (datetime('now')),
    ip TEXT, device TEXT,
    withdrawn_at TEXT
  );

  CREATE TABLE IF NOT EXISTS bureau_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    provider TEXT NOT NULL DEFAULT 'MOCK-CIBIL',
    score INTEGER,
    score_band TEXT,
    total_accounts INTEGER,
    active_accounts INTEGER,
    closed_accounts INTEGER,
    overdue_accounts INTEGER,
    total_outstanding INTEGER,
    credit_utilization REAL,
    enquiries_6m INTEGER,
    writeoffs INTEGER,
    settlements INTEGER,
    dpd_max INTEGER,
    repayment_history TEXT NOT NULL DEFAULT '{}',
    data TEXT NOT NULL DEFAULT '{}',
    is_mock INTEGER NOT NULL DEFAULT 1,
    fetched_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS bank_analyses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    application_id INTEGER,
    provider TEXT NOT NULL DEFAULT 'MOCK-BANK',
    monthly_income INTEGER,
    monthly_expense INTEGER,
    avg_balance INTEGER,
    emi_obligations INTEGER,
    banking_surplus INTEGER,
    bounce_count INTEGER,
    cash_deposits INTEGER,
    turnover INTEGER,
    months_analyzed INTEGER NOT NULL DEFAULT 6,
    risk TEXT,
    data TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS gst_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    gstin TEXT,
    turnover INTEGER,
    filing_status TEXT,
    filing_frequency TEXT,
    tax_liability INTEGER,
    declared_vs_banking_pct REAL,
    risk TEXT,
    data TEXT NOT NULL DEFAULT '{}',
    is_mock INTEGER NOT NULL DEFAULT 1,
    fetched_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS bre_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    code TEXT,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'credit_policy',
    version INTEGER NOT NULL DEFAULT 1,
    priority INTEGER NOT NULL DEFAULT 100,
    conditions TEXT NOT NULL,
    action TEXT NOT NULL,
    effective_from TEXT,
    expiry TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    approved_by INTEGER,
    created_by INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS bre_evaluations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id INTEGER NOT NULL,
    rule_id INTEGER,
    rule_version INTEGER,
    passed INTEGER,
    result TEXT NOT NULL DEFAULT '{}',
    evaluated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS approvals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    entity_type TEXT NOT NULL,
    entity_id INTEGER NOT NULL,
    action TEXT,
    level INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'pending',
    by_user INTEGER,
    note TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    decided_at TEXT
  );

  CREATE TABLE IF NOT EXISTS sanctions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id INTEGER NOT NULL,
    sanction_no TEXT UNIQUE,
    amount INTEGER,
    tenure INTEGER,
    rate REAL,
    emi INTEGER,
    fees_json TEXT NOT NULL DEFAULT '{}',
    conditions TEXT NOT NULL DEFAULT '[]',
    validity_days INTEGER NOT NULL DEFAULT 90,
    status TEXT NOT NULL DEFAULT 'draft',
    issued_at TEXT,
    accepted_at TEXT
  );

  CREATE TABLE IF NOT EXISTS kfs_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id INTEGER,
    loan_id INTEGER,
    version INTEGER NOT NULL DEFAULT 1,
    content TEXT NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'generated',
    generated_at TEXT NOT NULL DEFAULT (datetime('now')),
    disclosed_at TEXT,
    acknowledged_at TEXT
  );

  CREATE TABLE IF NOT EXISTS agreements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id INTEGER,
    loan_id INTEGER,
    template TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    signed_at TEXT,
    signer_name TEXT,
    hash TEXT,
    provider TEXT NOT NULL DEFAULT 'SANDBOX-ESIGN'
  );

  CREATE TABLE IF NOT EXISTS loans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    loan_no TEXT UNIQUE NOT NULL,
    application_id INTEGER,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    branch_id INTEGER,
    principal INTEGER NOT NULL,
    rate REAL NOT NULL,
    tenure INTEGER NOT NULL,
    emi INTEGER,
    disbursed_at TEXT NOT NULL DEFAULT (datetime('now')),
    first_emi_at TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    outstanding INTEGER,
    accrued_interest INTEGER NOT NULL DEFAULT 0,
    fees_due INTEGER NOT NULL DEFAULT 0,
    penal_due INTEGER NOT NULL DEFAULT 0,
    dpd INTEGER NOT NULL DEFAULT 0,
    npa_class TEXT,
    risk_grade TEXT,
    restructured INTEGER NOT NULL DEFAULT 0,
    written_off INTEGER NOT NULL DEFAULT 0,
    closed_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS installments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    loan_id INTEGER NOT NULL REFERENCES loans(id),
    seq INTEGER NOT NULL,
    due_date TEXT NOT NULL,
    principal INTEGER NOT NULL DEFAULT 0,
    interest INTEGER NOT NULL DEFAULT 0,
    fees INTEGER NOT NULL DEFAULT 0,
    total INTEGER NOT NULL DEFAULT 0,
    paid INTEGER NOT NULL DEFAULT 0,
    paid_amount INTEGER NOT NULL DEFAULT 0,
    paid_at TEXT,
    days_late INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending'
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    loan_id INTEGER NOT NULL REFERENCES loans(id),
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    receipt_no TEXT UNIQUE,
    amount INTEGER NOT NULL,
    mode TEXT,
    reference TEXT,
    status TEXT NOT NULL DEFAULT 'received',
    reversed INTEGER NOT NULL DEFAULT 0,
    reversal_reason TEXT,
    allocated INTEGER NOT NULL DEFAULT 0,
    received_at TEXT NOT NULL DEFAULT (datetime('now')),
    recorded_by INTEGER
  );

  CREATE TABLE IF NOT EXISTS payment_allocations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payment_id INTEGER NOT NULL REFERENCES payments(id),
    installment_id INTEGER,
    component TEXT NOT NULL,
    amount INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS ptps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    loan_id INTEGER NOT NULL REFERENCES loans(id),
    customer_id INTEGER NOT NULL,
    amount INTEGER,
    due_date TEXT,
    status TEXT NOT NULL DEFAULT 'promised',
    agent_id INTEGER,
    note TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS collection_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    loan_id INTEGER NOT NULL REFERENCES loans(id),
    customer_id INTEGER NOT NULL,
    agent_id INTEGER,
    priority TEXT,
    kind TEXT,
    status TEXT NOT NULL DEFAULT 'open',
    note TEXT,
    due_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS charge_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    loan_id INTEGER NOT NULL REFERENCES loans(id),
    kind TEXT,
    amount INTEGER,
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'applied',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS settlements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    loan_id INTEGER NOT NULL REFERENCES loans(id),
    requested_amount INTEGER,
    offered_amount INTEGER,
    status TEXT NOT NULL DEFAULT 'requested',
    approved_by INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS writeoffs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    loan_id INTEGER NOT NULL REFERENCES loans(id),
    amount INTEGER,
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'requested',
    approved_by INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS compliance_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    rule_id TEXT,
    name TEXT NOT NULL,
    source TEXT,
    effective_from TEXT,
    expiry TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    applicable_entity TEXT,
    applicable_product TEXT,
    config TEXT NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS complaints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    customer_id INTEGER,
    complaint_no TEXT UNIQUE,
    category TEXT,
    priority TEXT,
    assigned_to INTEGER,
    sla_hours INTEGER NOT NULL DEFAULT 48,
    status TEXT NOT NULL DEFAULT 'open',
    subject TEXT,
    description TEXT,
    resolution TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    resolved_at TEXT
  );

  CREATE TABLE IF NOT EXISTS system_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    key TEXT NOT NULL,
    value TEXT NOT NULL DEFAULT '{}',
    updated_at TEXT,
    UNIQUE(tenant_id, key)
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER,
    user_id INTEGER,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id INTEGER,
    before TEXT,
    after TEXT,
    ip TEXT,
    device TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    user_id INTEGER,
    kind TEXT NOT NULL DEFAULT 'inapp',
    title TEXT,
    body TEXT,
    read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS integrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    provider TEXT,
    status TEXT NOT NULL DEFAULT 'sandbox',
    config TEXT NOT NULL DEFAULT '{}'
  );

  CREATE TABLE IF NOT EXISTS ai_recommendations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    user_id INTEGER,
    kind TEXT,
    prompt TEXT,
    context TEXT,
    result TEXT,
    human_action TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- LOS expansion: parties (co-applicant / guarantor / joint), collateral, offers, credit memos, policy exceptions
  CREATE TABLE IF NOT EXISTS parties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    application_id INTEGER NOT NULL REFERENCES applications(id),
    type TEXT NOT NULL,               -- co_applicant | guarantor | joint
    name TEXT NOT NULL,
    pan TEXT, dob TEXT, mobile TEXT, email TEXT,
    relationship TEXT,
    employment_type TEXT,
    monthly_income INTEGER,
    credit_score INTEGER,
    consent INTEGER NOT NULL DEFAULT 0,
    documents TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS collaterals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    application_id INTEGER NOT NULL REFERENCES applications(id),
    asset_type TEXT NOT NULL,
    owner_name TEXT,
    value INTEGER,
    valuation INTEGER,
    valuation_date TEXT,
    location TEXT,
    legal_status TEXT,
    encumbrance TEXT,
    insurance INTEGER NOT NULL DEFAULT 0,
    verification_status TEXT NOT NULL DEFAULT 'pending',
    documents TEXT NOT NULL DEFAULT '[]',
    ltv REAL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS offers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    application_id INTEGER NOT NULL REFERENCES applications(id),
    label TEXT NOT NULL,
    amount INTEGER NOT NULL,
    tenure INTEGER NOT NULL,
    rate REAL NOT NULL,
    emi INTEGER NOT NULL,
    apr REAL NOT NULL,
    fees INTEGER NOT NULL DEFAULT 0,
    total_repayment INTEGER NOT NULL DEFAULT 0,
    risk_grade TEXT,
    conditions TEXT NOT NULL DEFAULT '[]',
    selected INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS credit_memos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    application_id INTEGER NOT NULL REFERENCES applications(id),
    memo_no TEXT UNIQUE,
    content TEXT NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'draft',          -- draft | submitted | reviewed | approved | rejected | send_back
    created_by INTEGER,
    decided_by INTEGER,
    decided_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS policy_exceptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    application_id INTEGER NOT NULL REFERENCES applications(id),
    rule_code TEXT,
    rule_name TEXT NOT NULL,
    reason TEXT,
    impact TEXT,
    risk TEXT,
    approver_required INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'pending',        -- pending | approved | rejected
    created_by INTEGER,
    decided_by INTEGER,
    decided_at TEXT,
    note TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Payment reconciliation
  CREATE TABLE IF NOT EXISTS recon_batches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    batch_no TEXT UNIQUE NOT NULL,
    source TEXT NOT NULL,
    total_transactions INTEGER NOT NULL DEFAULT 0,
    total_amount INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'imported',
    imported_by INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS recon_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    batch_id INTEGER NOT NULL REFERENCES recon_batches(id),
    txn_date TEXT NOT NULL,
    amount INTEGER NOT NULL,
    mode TEXT,
    reference TEXT,
    account_suffix TEXT,
    payer_name TEXT,
    status TEXT NOT NULL DEFAULT 'unmatched',      -- matched | unmatched | duplicate | failed | reversed | requires_review
    match_type TEXT,                              -- auto_reference | auto_amount | manual | none
    payment_id INTEGER,
    loan_id INTEGER,
    customer_id INTEGER,
    confidence REAL,
    note TEXT,
    reconciled_at TEXT,
    reversed_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- LMS expansion: loan events (append-only financial ledger) + closure records
  CREATE TABLE IF NOT EXISTS loan_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    loan_id INTEGER NOT NULL REFERENCES loans(id),
    kind TEXT NOT NULL,                           -- disbursement | payment | reversal | restructure | closure | settlement | writeoff | recovery | charge
    amount INTEGER,
    reference TEXT,
    data TEXT NOT NULL DEFAULT '{}',
    user_id INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS closures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    loan_id INTEGER NOT NULL REFERENCES loans(id),
    statement TEXT,
    noc TEXT,
    status TEXT NOT NULL DEFAULT 'requested',     -- requested | approved | closed
    approved_by INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    closed_at TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_leads_tenant ON leads(tenant_id);
  CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
  CREATE INDEX IF NOT EXISTS idx_apps_tenant ON applications(tenant_id);
  CREATE INDEX IF NOT EXISTS idx_apps_stage ON applications(stage);
  CREATE INDEX IF NOT EXISTS idx_customers_tenant ON customers(tenant_id);
  CREATE INDEX IF NOT EXISTS idx_loans_tenant ON loans(tenant_id);
  CREATE INDEX IF NOT EXISTS idx_loans_dpd ON loans(dpd);
  CREATE INDEX IF NOT EXISTS idx_inst_loan ON installments(loan_id, seq);
  CREATE INDEX IF NOT EXISTS idx_pay_loan ON payments(loan_id);
  CREATE INDEX IF NOT EXISTS idx_audit_tenant ON audit_logs(tenant_id);
  CREATE INDEX IF NOT EXISTS idx_recon_tenant ON recon_transactions(tenant_id);
  CREATE INDEX IF NOT EXISTS idx_recon_status ON recon_transactions(status);
  CREATE INDEX IF NOT EXISTS idx_loan_events ON loan_events(loan_id);
  `);

  migrate();
}

/** In-place migrations for schemas that evolved after first creation. */
function migrate() {
  const loansCols = db().prepare("PRAGMA table_info(loans)").all() as { name: string }[];
  if (!loansCols.some((c) => c.name === "updated_at")) {
    db().exec("ALTER TABLE loans ADD COLUMN updated_at TEXT");
  }
  const usersCols = db().prepare("PRAGMA table_info(users)").all() as { name: string }[];
  if (!usersCols.some((c) => c.name === "customer_id")) {
    db().exec("ALTER TABLE users ADD COLUMN customer_id INTEGER");
  }
  const appsCols = db().prepare("PRAGMA table_info(applications)").all() as { name: string }[];
  if (!appsCols.some((c) => c.name === "rate")) {
    db().exec("ALTER TABLE applications ADD COLUMN rate REAL");
  }
  if (!appsCols.some((c) => c.name === "offer_id")) {
    db().exec("ALTER TABLE applications ADD COLUMN offer_id INTEGER");
  }
  const instCols = db().prepare("PRAGMA table_info(installments)").all() as { name: string }[];
  if (!instCols.some((c) => c.name === "superseded")) {
    db().exec("ALTER TABLE installments ADD COLUMN superseded INTEGER NOT NULL DEFAULT 0");
  }
}

export function resetSchema() {
  const tables = [
    "closures", "loan_events", "recon_transactions", "recon_batches", "policy_exceptions", "credit_memos",
    "offers", "collaterals", "parties", "ai_recommendations", "notifications", "audit_logs", "complaints", "compliance_rules",
    "writeoffs", "settlements", "charge_events", "collection_tasks", "ptps",
    "payment_allocations", "payments", "installments", "loans", "agreements",
    "kfs_documents", "sanctions", "approvals", "bre_evaluations", "bre_rules",
    "gst_profiles", "bank_analyses", "bureau_reports", "consents", "kyc_records", "system_config",
    "documents", "application_stages", "workflow_stages", "applications", "products",
    "customers", "lead_activities", "leads", "sessions", "users", "branches", "tenants"
  ];
  db().exec("PRAGMA foreign_keys = OFF;");
  for (const t of tables) {
    db().exec(`DROP TABLE IF EXISTS ${t};`);
  }
  createSchema();
  db().exec("PRAGMA foreign_keys = ON;");
}
