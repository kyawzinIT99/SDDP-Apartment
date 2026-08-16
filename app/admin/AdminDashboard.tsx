"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { defaultSiteSettings, publicGallery, type Locale, type SiteSettings } from "../lib/site-defaults";
import { TypedDateField } from "../lib/typed-date";
import InvoiceDesk from "./InvoiceDesk";

type ResidentInvoice = { id: string; bookNumber: string; invoiceNumber: string; billingMonth: number; billingYear: string; total: number; issueDate: string };
type Inquiry = { id: string; name: string; phone: string; email?: string; channel: string; stayType: string; roomNumber?: string; arrivalDate?: string; message?: string; locale: string; status: string; notes?: string; convertedResidentId?: string; createdAt: number };
type Resident = { id: string; fullName: string; phone: string; email: string; nationality: string; residentType: string; passportLast4: string; roomNumber: string; checkInDate?: string; checkOutDate?: string; status: string; createdAt: number };
type ResidentDraft = { fullName: string; phone: string; email: string; nationality: string; residentType: string; passportNumber: string; roomNumber: string; checkInDate: string; checkOutDate: string; consentConfirmed: boolean; fromInquiryId?: string };
type Tab = "overview" | "content" | "gallery" | "inquiries" | "residents" | "invoices" | "history" | "users" | "automation";
type AdminUser = { id: string; username: string; displayName: string; role: "owner" | "admin"; active: number; createdAt: number };
type PipelineStatus = "new" | "contacted" | "booked" | "lost" | "converted";

const emptyResident: ResidentDraft = { fullName: "", phone: "", email: "", nationality: "", residentType: "monthly", passportNumber: "", roomNumber: "", checkInDate: "", checkOutDate: "", consentConfirmed: false };
const editableCopy = ["eyebrow", "title", "intro", "essentials", "gallery", "gallerySub", "inquiryTitle", "inquirySub", "locationTitle"];
const pipeline: { id: PipelineStatus; label: string }[] = [
  { id: "new", label: "New" },
  { id: "contacted", label: "Contacted" },
  { id: "booked", label: "Booked" },
  { id: "lost", label: "Lost" },
  { id: "converted", label: "Moved in" },
];

export default function AdminDashboard({ displayName, role }: { displayName: string; role?: "owner" | "admin" }) {
  const [tab, setTab] = useState<Tab>("overview");
  const [settings, setSettings] = useState<SiteSettings>(defaultSiteSettings);
  const [locale, setLocale] = useState<Locale>("en");
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [residentDraft, setResidentDraft] = useState<ResidentDraft>(emptyResident);
  const [availableCount, setAvailableCount] = useState(0);
  const [status, setStatus] = useState("Loading current website…");
  const [n8nReady, setN8nReady] = useState(false);
  const [hosting, setHosting] = useState("render-sqlite");
  const [pipelineFilter, setPipelineFilter] = useState<"all" | PipelineStatus>("all");
  const [inquiryPage, setInquiryPage] = useState(1);
  const INQUIRY_PAGE_SIZE = 5;
  const [residentFilter, setResidentFilter] = useState<"active" | "checked_out" | "all">("active");
  const [converting, setConverting] = useState<string>("");
  const [invoiceSeed, setInvoiceSeed] = useState<{ fullName: string; roomNumber: string; nationality: string } | null>(null);
  const [historyOpen, setHistoryOpen] = useState<string | null>(null);
  const [residentInvoices, setResidentInvoices] = useState<Record<string, ResidentInvoice[]>>({});
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [userDraft, setUserDraft] = useState({ username: "", displayName: "", role: "admin" as "owner" | "admin", password: "" });
  const [userStatus, setUserStatus] = useState("");
  const isOwner = !role || role === "owner";

  useEffect(() => {
    Promise.all([
      fetch("/api/site").then((r) => r.json()),
      fetch("/api/inquiries").then((r) => r.ok ? r.json() : []),
      fetch("/api/residents").then((r) => r.ok ? r.json() : []),
      fetch("/api/admin/status").then((r) => r.ok ? r.json() : {}),
      fetch("/api/rooms").then((r) => r.ok ? r.json() : { rooms: [] }),
    ]).then(([site, leads, residentRows, automation, rooms]) => {
      setSettings(site);
      setInquiries(Array.isArray(leads) ? leads : []);
      setResidents(Array.isArray(residentRows) ? residentRows : []);
      setN8nReady(Boolean(automation.n8nConfigured));
      setHosting(automation.hosting ?? "render-sqlite");
      setAvailableCount((rooms.rooms ?? []).filter((room: { status: string }) => room.status === "available").length);
      setStatus(Array.isArray(residentRows) ? "All changes saved" : "Admin APIs are not connected");
    }).catch(() => setStatus("Could not load the latest data"));
  }, []);

  const newInquiries = inquiries.filter((item) => item.status === "new").length;
  const activeResidents = residents.filter((item) => item.status === "active").length;
  const visibleInquiries = pipelineFilter === "all" ? inquiries : inquiries.filter((item) => item.status === pipelineFilter);
  const inquiryPageCount = Math.max(1, Math.ceil(visibleInquiries.length / INQUIRY_PAGE_SIZE));
  const inquiryPageSafe = Math.min(inquiryPage, inquiryPageCount);
  const pagedInquiries = visibleInquiries.slice((inquiryPageSafe - 1) * INQUIRY_PAGE_SIZE, inquiryPageSafe * INQUIRY_PAGE_SIZE);
  function setInquiryFilter(f: "all" | PipelineStatus) { setPipelineFilter(f); setInquiryPage(1); }

  async function clearOldLost() {
    const lostOld = inquiries.filter((i) => i.status === "lost" && i.createdAt < Date.now() - 30 * 24 * 60 * 60 * 1000).length;
    if (lostOld === 0) { setStatus("No lost inquiries older than 30 days to clear"); return; }
    if (!confirm(`Delete ${lostOld} lost inquir${lostOld === 1 ? "y" : "ies"} older than 30 days? This cannot be undone.`)) return;
    setStatus("Clearing…");
    const r = await fetch("/api/inquiries", { method: "DELETE" });
    const result = await r.json().catch(() => ({})) as { deleted?: number };
    if (r.ok) {
      setInquiries((prev) => prev.filter((i) => !(i.status === "lost" && i.createdAt < Date.now() - 30 * 24 * 60 * 60 * 1000)));
      setStatus(`Cleared ${result.deleted ?? lostOld} old lost inquir${(result.deleted ?? lostOld) === 1 ? "y" : "ies"}`);
    } else {
      setStatus("Clear failed — try again");
    }
  }
  const visibleResidents = useMemo(() => residents.filter((item) => residentFilter === "all" || item.status === residentFilter), [residents, residentFilter]);

  function field<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) { setSettings((current) => ({ ...current, [key]: value })); setStatus("Unsaved changes"); }
  function copyField(key: string, value: string) { setSettings((current) => ({ ...current, copy: { ...current.copy, [locale]: { ...(current.copy[locale] ?? {}), [key]: value } } })); setStatus("Unsaved changes"); }
  function toggleGallery(image: string) { setSettings((current) => ({ ...current, galleryHidden: current.galleryHidden.includes(image) ? current.galleryHidden.filter((item) => item !== image) : [...current.galleryHidden, image] })); setStatus("Unsaved changes"); }
  async function saveSettings() { setStatus("Saving…"); const response = await fetch("/api/site", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(settings) }); setStatus(response.ok ? "Published to the website" : "Save failed — try again"); }
  async function save(event: FormEvent) { event.preventDefault(); await saveSettings(); }
  async function refreshRooms() {
    const rooms = await fetch("/api/rooms").then((value) => value.ok ? value.json() : { rooms: [] });
    setAvailableCount((rooms.rooms ?? []).filter((room: { status: string }) => room.status === "available").length);
  }
  async function addResident(event: FormEvent) {
    event.preventDefault(); setStatus("Saving resident securely…");
    try {
      const response = await fetch("/api/residents", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(residentDraft) });
      const result = await response.json().catch(() => ({ error: `Resident save failed (${response.status})` }));
      if (!response.ok) { setStatus(result.error ?? "Resident save failed"); return; }
      const rows = await fetch("/api/residents").then((value) => value.json());
      const leads = await fetch("/api/inquiries").then((value) => value.ok ? value.json() : inquiries);
      setResidents(Array.isArray(rows) ? rows : []); setInquiries(Array.isArray(leads) ? leads : inquiries); setResidentDraft(emptyResident); setConverting(""); setStatus(result.resident?.roomNumber ? `Resident saved — room ${result.resident.roomNumber} is now occupied` : "Resident saved securely"); setTab("residents");
      await refreshRooms();
    } catch {
      setStatus("Resident save failed — the server did not respond");
    }
  }
  async function setResidentStatus(id: string, nextStatus: "active" | "checked_out") {
    setStatus(nextStatus === "checked_out" ? "Checking resident out…" : "Reactivating resident…");
    const response = await fetch("/api/residents", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, status: nextStatus }) });
    if (!response.ok) { setStatus("Resident status update failed"); return; }
    setResidents((current) => current.map((resident) => resident.id === id ? { ...resident, status: nextStatus } : resident));
    setStatus(nextStatus === "checked_out" ? "Room released on the public website" : "Room marked occupied on the public website");
    await refreshRooms();
  }
  async function setInquiryStatus(id: string, nextStatus: PipelineStatus) {
    setStatus("Updating inquiry…");
    const response = await fetch("/api/inquiries", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, status: nextStatus }) });
    if (!response.ok) { setStatus("Inquiry update failed"); return; }
    setInquiries((current) => current.map((item) => item.id === id ? { ...item, status: nextStatus } : item));
    setStatus(`Inquiry marked ${nextStatus}`);
  }
  async function saveInquiryNotes(id: string, notes: string) {
    const response = await fetch("/api/inquiries", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, notes }) });
    if (!response.ok) { setStatus("Note save failed"); return; }
    setInquiries((current) => current.map((item) => item.id === id ? { ...item, notes } : item));
    setStatus("Staff note saved");
  }
  function startConvert(inquiry: Inquiry) {
    setConverting(inquiry.id);
    setResidentDraft({
      ...emptyResident,
      fullName: inquiry.name,
      phone: inquiry.phone,
      residentType: inquiry.stayType || "monthly",
      roomNumber: inquiry.roomNumber ?? "",
      checkInDate: inquiry.arrivalDate ?? "",
      fromInquiryId: inquiry.id,
      consentConfirmed: false,
    });
    setTab("residents");
    setStatus("Complete the resident form to move this guest in");
  }
  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.assign("/admin");
  }

  const titles: Record<Tab, string> = {
    overview: "Today at SDDP",
    content: "Website content",
    gallery: "Photo gallery",
    inquiries: "Guest pipeline",
    residents: "Resident records",
    invoices: "Printable invoice",
    history: "Past residents",
    users: "Admin users",
    automation: "Hosting on Render",
  };

  function openUsersTab() {
    setTab("users");
    fetch("/api/admin/users").then((r) => r.ok ? r.json() : []).then((rows) => setAdminUsers(Array.isArray(rows) ? rows : [])).catch(() => undefined);
  }

  async function createUser(e: FormEvent) {
    e.preventDefault();
    setUserStatus("Creating…");
    const r = await fetch("/api/admin/users", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(userDraft) });
    const result = await r.json().catch(() => ({})) as { error?: string };
    if (!r.ok) { setUserStatus(result.error ?? "Failed"); return; }
    setUserStatus("User created");
    setUserDraft({ username: "", displayName: "", role: "admin", password: "" });
    openUsersTab();
  }

  async function toggleUserActive(id: string, active: boolean) {
    await fetch("/api/admin/users", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, active }) });
    setAdminUsers((prev) => prev.map((u) => u.id === id ? { ...u, active: active ? 1 : 0 } : u));
  }

  async function deleteUser(id: string) {
    if (!confirm("Delete this admin user permanently?")) return;
    await fetch("/api/admin/users", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) });
    setAdminUsers((prev) => prev.filter((u) => u.id !== id));
  }

  async function loadResidentInvoices(resident: Resident) {
    if (residentInvoices[resident.id]) { setHistoryOpen(historyOpen === resident.id ? null : resident.id); return; }
    const data = await fetch(`/api/invoices?name=${encodeURIComponent(resident.fullName)}`).then((r) => r.ok ? r.json() : { invoices: [] });
    const rows: ResidentInvoice[] = (data.invoices ?? []).map((inv: { id: string; bookNumber: string; invoiceNumber: string; billingMonth: number; billingYear: string; total: number; issueDate: string }) => ({
      id: inv.id, bookNumber: inv.bookNumber, invoiceNumber: inv.invoiceNumber, billingMonth: inv.billingMonth, billingYear: inv.billingYear, total: inv.total, issueDate: inv.issueDate,
    }));
    setResidentInvoices((prev) => ({ ...prev, [resident.id]: rows }));
    setHistoryOpen(resident.id);
  }

  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const checkouts = residents.filter((r) => r.status === "checked_out");

  async function loadAllInvoices(): Promise<Record<string, ResidentInvoice[]>> {
    const cache: Record<string, ResidentInvoice[]> = { ...residentInvoices };
    await Promise.all(checkouts.filter((r) => !cache[r.id]).map(async (r) => {
      const data = await fetch(`/api/invoices?name=${encodeURIComponent(r.fullName)}`).then((res) => res.ok ? res.json() : { invoices: [] });
      cache[r.id] = (data.invoices ?? []).map((inv: { id: string; bookNumber: string; invoiceNumber: string; billingMonth: number; billingYear: string; total: number; issueDate: string }) => ({
        id: inv.id, bookNumber: inv.bookNumber, invoiceNumber: inv.invoiceNumber, billingMonth: inv.billingMonth, billingYear: inv.billingYear, total: inv.total, issueDate: inv.issueDate,
      }));
    }));
    setResidentInvoices(cache);
    return cache;
  }

  async function exportHistoryCSV() {
    setStatus("Preparing Excel export…");
    const allInvoices = await loadAllInvoices();
    const header = ["Name", "Nationality", "Room", "Passport Last 4", "Check-in", "Check-out", "Book No", "Invoice No (Tax ID)", "Month", "Year", "Issue Date", "Total (THB)"];
    const body: string[][] = [];
    for (const r of checkouts) {
      const invs = allInvoices[r.id] ?? [];
      if (invs.length === 0) {
        body.push([r.fullName, r.nationality || "", r.roomNumber || "", r.passportLast4 || "", r.checkInDate || "", r.checkOutDate || "", "", "", "", "", "", ""]);
      } else {
        for (const inv of invs) {
          body.push([r.fullName, r.nationality || "", r.roomNumber || "", r.passportLast4 || "", r.checkInDate || "", r.checkOutDate || "", inv.bookNumber, inv.invoiceNumber, monthNames[(inv.billingMonth - 1) % 12], inv.billingYear, inv.issueDate, String(inv.total)]);
        }
      }
    }
    const csv = [header, ...body].map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `sddp-past-residents-${new Date().toISOString().slice(0, 10)}.csv` });
    a.click();
    URL.revokeObjectURL(a.href);
    setStatus("Excel file downloaded");
  }

  async function exportHistoryPDF() {
    setStatus("Preparing PDF…");
    const allInvoices = await loadAllInvoices();
    const rows = checkouts.flatMap((r) => {
      const invs = allInvoices[r.id] ?? [];
      if (invs.length === 0) return [`<tr><td>${r.fullName}</td><td>${r.nationality || "—"}</td><td>${r.roomNumber || "—"}</td><td>${r.passportLast4 ? "••••" + r.passportLast4 : "—"}</td><td>${r.checkInDate || "—"}</td><td>${r.checkOutDate || "—"}</td><td colspan="3">—</td><td>—</td></tr>`];
      return invs.map((inv) => `<tr><td>${r.fullName}</td><td>${r.nationality || "—"}</td><td>${r.roomNumber || "—"}</td><td>${r.passportLast4 ? "••••" + r.passportLast4 : "—"}</td><td>${r.checkInDate || "—"}</td><td>${r.checkOutDate || "—"}</td><td>${inv.bookNumber}</td><td>${inv.invoiceNumber}</td><td>${monthNames[(inv.billingMonth - 1) % 12]} ${inv.billingYear}</td><td style="text-align:right">฿${inv.total.toLocaleString()}</td></tr>`);
    });
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>SDDP Past Residents</title><style>
      body{font-family:Arial,sans-serif;font-size:11px;color:#1b1c1d;margin:24px}
      h1{font-size:18px;margin:0 0 4px}p{margin:0 0 16px;color:#777}
      table{border-collapse:collapse;width:100%}
      th{background:#1b1c1d;color:#fff;padding:6px 8px;text-align:left;font-size:9px;letter-spacing:.08em;text-transform:uppercase}
      td{padding:5px 8px;border-bottom:1px solid #e8e5df;vertical-align:top}
      tr:last-child td{border-bottom:none}
      @media print{body{margin:0}h1{font-size:14px}}
    </style></head><body>
      <h1>SDDP Apartment — Past Residents Report</h1>
      <p>Generated ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })} · ${checkouts.length} resident${checkouts.length !== 1 ? "s" : ""}</p>
      <table><thead><tr><th>Name</th><th>Nationality</th><th>Room</th><th>Passport</th><th>Check-in</th><th>Check-out</th><th>Book No</th><th>Invoice No</th><th>Period</th><th>Total</th></tr></thead>
      <tbody>${rows.join("")}</tbody></table>
    </body></html>`;
    const win = window.open("", "_blank", "width=1100,height=700");
    if (win) { win.document.write(html); win.document.close(); win.focus(); win.print(); }
    setStatus("PDF print dialog opened");
  }

  return <main className="admin-shell">
    <aside className="admin-nav">
      <a className="brand" href="/"><img src="/brand-logo.jpg" alt="" /><span><b>SDDP</b><small>ADMIN PANEL</small></span></a>
      <div className="admin-menu">{([
        ["overview", "Overview"],
        ["content", "Website content"],
        ["gallery", "Photo gallery"],
        ["inquiries", `Inquiries (${newInquiries})`],
        ["residents", `Residents (${activeResidents})`],
        ["invoices", "Invoices"],
        ["history", `Past residents (${residents.filter((r) => r.status === "checked_out").length})`],
        ...(isOwner ? [["users", `Users (${adminUsers.length})`]] as const : []),
        ["automation", "Hosting"],
      ] as const).map(([id, label]) => <button key={id} className={tab === id ? "active" : ""} onClick={() => id === "users" ? openUsersTab() : setTab(id as Tab)}><i>{id === "overview" ? "▣" : id === "content" ? "Aa" : id === "gallery" ? "▧" : id === "inquiries" ? "↗" : id === "residents" ? "◎" : id === "invoices" ? "฿" : id === "history" ? "◷" : id === "users" ? "👤" : "⌁"}</i>{label}</button>)}</div>
      <div className="admin-user"><span>{displayName.slice(0, 1).toUpperCase()}</span><div><b>{displayName}</b><small>Property editor</small></div><button type="button" className="admin-logout" onClick={logout}>Sign out</button></div>
    </aside>
    <section className="admin-main">
      <header><div><p>SDDP CONTROL CENTRE</p><h1>{titles[tab]}</h1></div><div className="save-state"><i className={status.includes("failed") || status.includes("required") || status.includes("consent") || status.includes("not correct") ? "error" : ""} />{status}</div></header>

      {tab === "overview" && <div className="overview-grid">
        <article className="editor-card stat-card"><span>NEW ENQUIRIES</span><b>{newInquiries}</b><p>Waiting for a first reply</p></article>
        <article className="editor-card stat-card"><span>ROOMS FREE</span><b>{availableCount}</b><p>Shown live on the public website</p></article>
        <article className="editor-card stat-card"><span>ACTIVE RESIDENTS</span><b>{activeResidents}</b><p>Occupied rooms from CRM records</p></article>
        <article className="editor-card stat-card"><span>PIPELINE</span><b>{inquiries.length}</b><p>All website requests so far</p></article>
        <section className="editor-card wide"><div className="card-head"><div><span>NEXT STEP</span><h2>Work the newest guest requests</h2></div><button type="button" className="text-link" onClick={() => setTab("inquiries")}>Open pipeline ↗</button></div>
          {inquiries.filter((item) => item.status === "new").slice(0, 4).map((item) => <article key={item.id} className="overview-lead"><div><b>{item.name}</b><small>{item.phone} · Room {item.roomNumber || "—"}</small></div><button type="button" onClick={() => { setTab("inquiries"); setPipelineFilter("new"); }}>Follow up</button></article>)}
          {newInquiries === 0 && <div className="empty-state compact"><b>No new inquiries</b><p>New website requests will appear here first.</p></div>}
        </section>
      </div>}

      {tab === "content" && <form className="editor-grid" onSubmit={save}>
        <section className="editor-card wide"><div className="card-head"><div><span>PUBLIC COPY</span><h2>Homepage messaging</h2></div><div className="locale-tabs">{(["en", "th", "my"] as Locale[]).map((code) => <button type="button" key={code} className={locale === code ? "active" : ""} onClick={() => setLocale(code)}>{code === "en" ? "English" : code === "th" ? "ไทย" : "မြန်မာ"}</button>)}</div></div><div className="copy-fields">{editableCopy.map((key) => <label key={key}>{key.replace(/([A-Z])/g, " $1")}<textarea rows={key.includes("intro") || key.includes("Sub") ? 3 : 2} value={settings.copy[locale]?.[key] ?? ""} placeholder={`Use the current ${locale.toUpperCase()} text`} onChange={(event) => copyField(key, event.target.value)} /></label>)}</div></section>
        <section className="editor-card"><div className="card-head"><div><span>RATES</span><h2>Prices &amp; offer</h2></div></div><label>Daily price (THB)<input value={settings.dailyPrice} onChange={(e) => field("dailyPrice", e.target.value)} /></label><label>Monthly price (THB)<input value={settings.monthlyPrice} onChange={(e) => field("monthlyPrice", e.target.value)} /></label><label>Deposit<input value={settings.monthlyDeposit} onChange={(e) => field("monthlyDeposit", e.target.value)} /></label><label>Promotion<input value={settings.promotion} onChange={(e) => field("promotion", e.target.value)} /></label></section>
        <section className="editor-card"><div className="card-head"><div><span>CONTACT</span><h2>Guest contact</h2></div></div><label>Main phone<input value={settings.phonePrimary} onChange={(e) => field("phonePrimary", e.target.value)} /></label><label>Second phone<input value={settings.phoneSecondary} onChange={(e) => field("phoneSecondary", e.target.value)} /></label><label>WhatsApp<input value={settings.whatsapp} onChange={(e) => field("whatsapp", e.target.value)} /></label><label>Official Line ID<input value={settings.lineId} onChange={(e) => field("lineId", e.target.value)} /></label></section>
        <section className="editor-card wide"><div className="card-head"><div><span>PROPERTY</span><h2>Location &amp; availability</h2></div></div><div className="two-col"><label>Address<input value={settings.address} onChange={(e) => field("address", e.target.value)} /></label><label>Parking quota note<input value={settings.parkingQuota} onChange={(e) => field("parkingQuota", e.target.value)} /></label><label>Google Maps visitor link<input value={settings.mapUrl} onChange={(e) => field("mapUrl", e.target.value)} /></label><label>Embedded map URL<input value={settings.mapEmbedUrl} onChange={(e) => field("mapEmbedUrl", e.target.value)} /></label><label>Facebook URL<input value={settings.facebookUrl} onChange={(e) => field("facebookUrl", e.target.value)} /></label></div></section>
        <section className="editor-card wide design-controls"><div className="card-head"><div><span>VISUAL DESIGN</span><h2>Front-page theme</h2><p>Adjust the public colour system and choose the main room image. Changes apply across desktop and mobile.</p></div></div><div className="theme-fields"><label>Brand yellow<input type="color" value={settings.accentColor} onChange={(e) => field("accentColor", e.target.value)} /></label><label>Action colour<input type="color" value={settings.actionColor} onChange={(e) => field("actionColor", e.target.value)} /></label><label>Page background<input type="color" value={settings.backgroundColor} onChange={(e) => field("backgroundColor", e.target.value)} /></label><label>Text colour<input type="color" value={settings.textColor} onChange={(e) => field("textColor", e.target.value)} /></label><label className="hero-select">Main hero photo<select value={settings.heroImage} onChange={(e) => field("heroImage", e.target.value)}>{publicGallery.map((image, index) => <option key={image} value={image}>Photo {String(index + 1).padStart(2, "0")}</option>)}</select></label></div></section>
        <button className="admin-save" type="submit">Publish website changes <b>↗</b></button>
      </form>}

      {tab === "gallery" && <section className="editor-card admin-gallery"><div className="card-head"><div><span>FACEBOOK LIBRARY</span><h2>{publicGallery.length} imported property photos</h2><p>Choose the hero image and control which photos visitors can see. Save once after making your selections.</p></div><a href={settings.facebookUrl + "/photos"} target="_blank" rel="noreferrer">Open Facebook ↗</a></div><div className="admin-gallery-grid">{publicGallery.map((image, index) => { const visible = !settings.galleryHidden.includes(image); return <figure key={image} className={visible ? "" : "is-hidden"}><img src={`/gallery/${image}`} alt="" /><figcaption><b>Photo {String(index + 1).padStart(2, "0")}{settings.heroImage === image ? " · Hero" : ""}</b><button onClick={() => toggleGallery(image)}>{visible ? "Hide" : "Show"}</button></figcaption></figure>; })}</div><button className="admin-save gallery-save" type="button" onClick={saveSettings}>Save gallery changes <b>↗</b></button></section>}

      {tab === "inquiries" && <section className="editor-card inquiry-table">
        <div className="card-head"><div><span>GUEST PIPELINE</span><h2>Follow up, then move guests in</h2><p>New website requests start here. Mark contacted or booked, add a staff note, then convert a confirmed guest into a resident record.</p></div>
          {isOwner && <button type="button" className="resident-action" style={{ color: "#b42020", flexShrink: 0 }} onClick={clearOldLost}>🗑 Clear lost &gt;30 days</button>}
        </div>
        <div className="pipeline-tabs">
          <button type="button" className={pipelineFilter === "all" ? "active" : ""} onClick={() => setInquiryFilter("all")}>All ({inquiries.length})</button>
          {pipeline.map((step) => <button type="button" key={step.id} className={pipelineFilter === step.id ? "active" : ""} onClick={() => setInquiryFilter(step.id)}>{step.label} ({inquiries.filter((item) => item.status === step.id).length})</button>)}
        </div>
        {visibleInquiries.length === 0
          ? <div className="empty-state"><b>No inquiries in this step</b><p>New website requests will appear here first.</p></div>
          : <>
            {pagedInquiries.map((item) => <article key={item.id} className="pipeline-card">
              <span className={`lead-status ${item.status}`}>{item.status}</span>
              <div><b>{item.name}</b><small>{item.phone}{item.email ? ` · ${item.email}` : ""} · {item.channel} · {item.locale.toUpperCase()}</small></div>
              <div><b>{item.roomNumber ? `Room ${item.roomNumber}` : item.stayType}</b><small>{item.stayType} · {item.arrivalDate || "Arrival not set"}</small></div>
              <p>{item.message || "No guest note"}</p>
              <time>{new Date(item.createdAt).toLocaleString()}</time>
              <div className="pipeline-actions">{pipeline.filter((step) => step.id !== "converted").map((step) => <button type="button" key={step.id} disabled={item.status === "converted"} className={item.status === step.id ? "active" : ""} onClick={() => setInquiryStatus(item.id, step.id)}>{step.label}</button>)}
                {item.status !== "converted" && <button type="button" className="convert" onClick={() => startConvert(item)}>Move in</button>}
              </div>
              <label className="staff-note">Staff note<textarea defaultValue={item.notes ?? ""} rows={2} onBlur={(event) => { if (event.target.value !== (item.notes ?? "")) saveInquiryNotes(item.id, event.target.value); }} /></label>
            </article>)}
            {inquiryPageCount > 1 && <nav className="pagination">
              <button type="button" className="page-arrow" disabled={inquiryPageSafe === 1} onClick={() => setInquiryPage((p) => p - 1)}>‹</button>
              {Array.from({ length: inquiryPageCount }, (_, i) => i + 1).map((n) => (
                <button type="button" key={n} className={`page-num${n === inquiryPageSafe ? " active" : ""}`} onClick={() => setInquiryPage(n)}>{n}</button>
              ))}
              <button type="button" className="page-arrow" disabled={inquiryPageSafe === inquiryPageCount} onClick={() => setInquiryPage((p) => p + 1)}>›</button>
              <small>{(inquiryPageSafe - 1) * INQUIRY_PAGE_SIZE + 1}–{Math.min(inquiryPageSafe * INQUIRY_PAGE_SIZE, visibleInquiries.length)} of {visibleInquiries.length}</small>
            </nav>}
          </>
        }
      </section>}

      {tab === "residents" && <div className="resident-layout">
        <form className="editor-card resident-form" onSubmit={addResident}>
          <div className="card-head"><div><span>PRIVATE RECORD</span><h2>{converting ? "Move this guest in" : "Add a resident"}</h2><p>Passport numbers are encrypted before storage and are never returned to the browser after saving. Checking a resident out frees that room on the public website.</p></div></div>
          <div className="two-col">
            <label>Full name<input required value={residentDraft.fullName} onChange={(e) => setResidentDraft({ ...residentDraft, fullName: e.target.value })} /></label>
            <label>Resident type<select value={residentDraft.residentType} onChange={(e) => setResidentDraft({ ...residentDraft, residentType: e.target.value })}><option value="monthly">Monthly</option><option value="daily">Daily</option><option value="staff">Staff</option><option value="other">Other</option></select></label>
            <label>Phone<input value={residentDraft.phone} onChange={(e) => setResidentDraft({ ...residentDraft, phone: e.target.value })} /></label>
            <label>Email<input type="email" value={residentDraft.email} onChange={(e) => setResidentDraft({ ...residentDraft, email: e.target.value })} /></label>
            <label>Nationality<input value={residentDraft.nationality} onChange={(e) => setResidentDraft({ ...residentDraft, nationality: e.target.value })} /></label>
            <label>Passport number<input autoComplete="off" value={residentDraft.passportNumber} onChange={(e) => setResidentDraft({ ...residentDraft, passportNumber: e.target.value })} /></label>
            <label>Room number<input value={residentDraft.roomNumber} onChange={(e) => setResidentDraft({ ...residentDraft, roomNumber: e.target.value })} /></label>
            <label>Check-in<TypedDateField value={residentDraft.checkInDate} onChange={(checkInDate) => setResidentDraft({ ...residentDraft, checkInDate })} /></label>
            <label>Check-out<TypedDateField value={residentDraft.checkOutDate} onChange={(checkOutDate) => setResidentDraft({ ...residentDraft, checkOutDate })} /></label>
          </div>
          <label className="consent-check"><input type="checkbox" checked={residentDraft.consentConfirmed} onChange={(e) => setResidentDraft({ ...residentDraft, consentConfirmed: e.target.checked })} /> Resident consent or a valid registration basis has been confirmed.</label>
          <button className="admin-save" type="submit">{converting ? "Save and occupy this room" : "Save private resident record"} <b>↗</b></button>
        </form>
        <section className="editor-card resident-list">
          <div className="card-head"><div><span>PRIVATE DIRECTORY</span><h2>Current resident records</h2></div>
            <div className="locale-tabs">{(["active", "checked_out", "all"] as const).map((id) => <button type="button" key={id} className={residentFilter === id ? "active" : ""} onClick={() => setResidentFilter(id)}>{id === "checked_out" ? "Checked out" : id === "all" ? "All" : "Active"}</button>)}</div>
          </div>
          {visibleResidents.length === 0 ? <div className="empty-state"><b>No residents in this view</b><p>Add a resident or convert a booked inquiry.</p></div> : visibleResidents.map((resident) => <article key={resident.id}>
            <div><b>{resident.fullName}</b><small>{resident.nationality || "Nationality not set"} · {resident.residentType}</small></div>
            <div><b>Room {resident.roomNumber || "—"}</b><small>{resident.phone || resident.email || "No contact supplied"}</small></div>
            <div><b>{resident.passportLast4 ? `Passport •••• ${resident.passportLast4}` : "No passport stored"}</b><small>{resident.status.replace("_", " ")}</small></div>
            <button type="button" className="resident-action" onClick={() => { setInvoiceSeed({ fullName: resident.fullName, roomNumber: resident.roomNumber, nationality: resident.nationality }); setTab("invoices"); setStatus(`Invoice started for ${resident.fullName}`); }}>Invoice</button>
            <button type="button" className="resident-action" onClick={() => setResidentStatus(resident.id, resident.status === "active" ? "checked_out" : "active")}>{resident.status === "active" ? "Check out" : "Reactivate"}</button>
          </article>)}
        </section>
      </div>}

      {tab === "invoices" && <InvoiceDesk residents={residents} monthlyPrice={settings.monthlyPrice} seed={invoiceSeed} onStatus={setStatus} />}

      {tab === "history" && <section className="editor-card history-section">
        <div className="card-head"><div><span>PAST RESIDENTS</span><h2>Checked-out guest records</h2><p>Full profile and every invoice issued during their stay. Tap a name to expand the invoice history.</p></div>
          {checkouts.length > 0 && <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <button type="button" className="resident-action" onClick={exportHistoryCSV}>⬇ Excel</button>
            <button type="button" className="resident-action" onClick={exportHistoryPDF}>⬇ PDF</button>
          </div>}
        </div>
        {residents.filter((r) => r.status === "checked_out").length === 0
          ? <div className="empty-state"><b>No checked-out residents yet</b><p>When you check out an active resident, their record appears here with all invoices attached.</p></div>
          : residents.filter((r) => r.status === "checked_out").map((r) => {
            const isOpen = historyOpen === r.id;
            const invs = residentInvoices[r.id] ?? [];
            const totalPaid = invs.reduce((sum, inv) => sum + inv.total, 0);
            return <article key={r.id} className="history-card">
              <div className="history-head" onClick={() => loadResidentInvoices(r)} style={{ cursor: "pointer" }}>
                <div className="history-avatar">{r.fullName.slice(0,1).toUpperCase()}</div>
                <div className="history-info">
                  <b>{r.fullName}</b>
                  <small>Room {r.roomNumber || "—"} · {r.nationality || "—"} · {r.residentType}</small>
                  <small>{r.checkInDate ? `Checked in ${r.checkInDate}` : "No check-in date"}{r.checkOutDate ? ` → Checked out ${r.checkOutDate}` : ""}</small>
                  {r.passportLast4 && <small>Passport •••• {r.passportLast4}</small>}
                </div>
                <div className="history-summary">
                  {isOpen && invs.length > 0 && <b>฿{totalPaid.toLocaleString()}</b>}
                  {isOpen && invs.length > 0 && <small>{invs.length} invoice{invs.length !== 1 ? "s" : ""}</small>}
                  <i style={{ opacity: .5, fontSize: 12 }}>{isOpen ? "▲" : "▼ invoices"}</i>
                </div>
              </div>
              {isOpen && <div className="history-invoices">
                {invs.length === 0
                  ? <p className="history-none">No invoices found for this resident.</p>
                  : invs.map((inv) => <div key={inv.id} className="history-inv-row">
                    <span style={{ fontWeight: 700 }}>#{inv.invoiceNumber}</span>
                    <span style={{ color: "#888", fontSize: 10 }}>Book {inv.bookNumber}</span>
                    <span>{monthNames[(inv.billingMonth - 1) % 12]} {inv.billingYear}</span>
                    <span style={{ color: "#aaa", fontSize: 11 }}>{inv.issueDate}</span>
                    <b>฿{inv.total.toLocaleString()}</b>
                  </div>)
                }
                {invs.length > 0 && <div className="history-inv-total"><span>Total collected</span><b>฿{totalPaid.toLocaleString()}</b></div>}
              </div>}
            </article>;
          })
        }
      </section>}

      {tab === "users" && isOwner && <div className="users-layout">
        <form className="editor-card user-form" onSubmit={createUser}>
          <div className="card-head"><div><span>NEW STAFF ACCOUNT</span><h2>Create admin user</h2><p>Owner accounts can manage all settings and create more users. Admin accounts can use the CRM but cannot manage users.</p></div></div>
          <label>Username<input required value={userDraft.username} onChange={(e) => setUserDraft({ ...userDraft, username: e.target.value.toLowerCase().replace(/\s/g, "") })} placeholder="e.g. somchai" autoComplete="off" /></label>
          <label>Display name<input value={userDraft.displayName} onChange={(e) => setUserDraft({ ...userDraft, displayName: e.target.value })} placeholder="e.g. Somchai Jaidee" /></label>
          <label>Role<select value={userDraft.role} onChange={(e) => setUserDraft({ ...userDraft, role: e.target.value as "owner" | "admin" })}>
            <option value="admin">Administrator — CRM access, no user management</option>
            <option value="owner">Owner — full access including user management</option>
          </select></label>
          <label>Password<input type="password" required minLength={6} value={userDraft.password} onChange={(e) => setUserDraft({ ...userDraft, password: e.target.value })} autoComplete="new-password" /></label>
          <button className="admin-save" type="submit">Create staff account <b>↗</b></button>
          {userStatus && <small style={{ color: userStatus.includes("created") ? "green" : "#b42020" }}>{userStatus}</small>}
        </form>
        <section className="editor-card user-list">
          <div className="card-head"><div><span>STAFF DIRECTORY</span><h2>All admin accounts</h2></div></div>
          {adminUsers.length === 0
            ? <div className="empty-state"><b>No named users yet</b><p>Create staff accounts above. The master password always works as the owner login.</p></div>
            : adminUsers.map((u) => <article key={u.id} className="user-card">
              <div className="user-avatar">{u.displayName.slice(0, 1).toUpperCase()}</div>
              <div>
                <b>{u.displayName}</b>
                <small>@{u.username} · <span style={{ color: u.role === "owner" ? "#ee302b" : "#555", fontWeight: 700 }}>{u.role}</span> · {u.active ? "Active" : <span style={{ color: "#aaa" }}>Inactive</span>}</small>
                <small style={{ color: "#aaa" }}>Created {new Date(u.createdAt).toLocaleDateString()}</small>
              </div>
              <div className="user-actions">
                <button type="button" className="resident-action" onClick={() => toggleUserActive(u.id, !u.active)}>{u.active ? "Deactivate" : "Activate"}</button>
                <button type="button" className="resident-action" style={{ color: "#b42020" }} onClick={() => deleteUser(u.id)}>Delete</button>
              </div>
            </article>)
          }
        </section>
      </div>}

      {tab === "automation" && <div className="automation-grid">
        <section className="editor-card automation-status">
          <div className="signal"><i className="on" /></div>
          <span>CURRENT HOSTING</span>
          <h2>Render Starter is the host</h2>
          <p>The public site and CRM stay on this Render Starter service. Attach a 1 GB disk at /var/data so residents and invoices survive deploys. No custom domain or mail server: use the onrender.com URL, phone, and Line.</p>
          <dl>
            <div><dt>Current hosting</dt><dd>Render Starter</dd></div>
            <div><dt>Current storage</dt><dd>{hosting === "cloudflare-d1" ? "Cloudflare D1" : "SQLite on Render disk"}</dd></div>
            <div><dt>Public URL / mail</dt><dd>onrender.com · Line and phone only</dd></div>
            <div><dt>Next host</dt><dd>Stay on Render</dd></div>
            <div><dt>Optional alerts</dt><dd>{n8nReady ? "SDDP Inquiry Alert connected" : "SDDP n8n not connected yet"}</dd></div>
          </dl>
        </section>
        <section className="editor-card flow-card">
          <span>PROGRESSIVE CRM</span>
          <div className="flow"><b>Website form</b><i>→</i><b>Inquiry pipeline</b><i>→</i><b>Resident record</b><i>→</i><b>Live room status</b></div>
          <p>Start with inquiries and occupancy. Print the original SDDP invoice from the Invoices tab. The Render disk keeps those records across deploys. Staff alerts use a new n8n workflow named SDDP Inquiry Alert on the existing Hostinger instance. BCC and PDF workflows are not used. Passport data stays encrypted and is never sent in notifications.</p>
        </section>
      </div>}
    </section>
  </main>;
}
