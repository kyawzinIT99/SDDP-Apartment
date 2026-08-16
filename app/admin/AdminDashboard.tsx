"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { defaultSiteSettings, publicGallery, type Locale, type SiteSettings } from "../lib/site-defaults";

type Inquiry = { id: string; name: string; phone: string; channel: string; stayType: string; roomNumber?: string; arrivalDate?: string; message?: string; locale: string; status: string; notes?: string; convertedResidentId?: string; createdAt: number };
type Resident = { id: string; fullName: string; phone: string; email: string; nationality: string; residentType: string; passportLast4: string; roomNumber: string; checkInDate?: string; checkOutDate?: string; status: string; createdAt: number };
type ResidentDraft = { fullName: string; phone: string; email: string; nationality: string; residentType: string; passportNumber: string; roomNumber: string; checkInDate: string; checkOutDate: string; consentConfirmed: boolean; fromInquiryId?: string };
type Tab = "overview" | "content" | "gallery" | "inquiries" | "residents" | "automation";
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

export default function AdminDashboard({ displayName }: { displayName: string }) {
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
  const [residentFilter, setResidentFilter] = useState<"active" | "checked_out" | "all">("active");
  const [converting, setConverting] = useState<string>("");

  useEffect(() => {
    Promise.all([
      fetch("/api/site").then((r) => r.json()),
      fetch("/api/inquiries").then((r) => r.ok ? r.json() : []),
      fetch("/api/residents").then((r) => r.ok ? r.json() : []),
      fetch("/api/admin/status").then((r) => r.ok ? r.json() : {}),
      fetch("/api/rooms").then((r) => r.ok ? r.json() : { rooms: [] }),
    ]).then(([site, leads, residentRows, automation, rooms]) => {
      setSettings(site);
      setInquiries(leads);
      setResidents(residentRows);
      setN8nReady(Boolean(automation.n8nConfigured));
      setHosting(automation.hosting ?? "render-sqlite");
      setAvailableCount((rooms.rooms ?? []).filter((room: { status: string }) => room.status === "available").length);
      setStatus("All changes saved");
    }).catch(() => setStatus("Could not load the latest data"));
  }, []);

  const newInquiries = inquiries.filter((item) => item.status === "new").length;
  const activeResidents = residents.filter((item) => item.status === "active").length;
  const visibleInquiries = pipelineFilter === "all" ? inquiries : inquiries.filter((item) => item.status === pipelineFilter);
  const visibleResidents = useMemo(() => residents.filter((item) => residentFilter === "all" || item.status === residentFilter), [residents, residentFilter]);

  function field<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) { setSettings((current) => ({ ...current, [key]: value })); setStatus("Unsaved changes"); }
  function copyField(key: string, value: string) { setSettings((current) => ({ ...current, copy: { ...current.copy, [locale]: { ...(current.copy[locale] ?? {}), [key]: value } } })); setStatus("Unsaved changes"); }
  function toggleGallery(image: string) { setSettings((current) => ({ ...current, galleryHidden: current.galleryHidden.includes(image) ? current.galleryHidden.filter((item) => item !== image) : [...current.galleryHidden, image] })); setStatus("Unsaved changes"); }
  async function saveSettings() { setStatus("Saving…"); const response = await fetch("/api/site", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(settings) }); setStatus(response.ok ? "Published to the website" : "Save failed — try again"); }
  async function save(event: FormEvent) { event.preventDefault(); await saveSettings(); }
  async function addResident(event: FormEvent) {
    event.preventDefault(); setStatus("Saving resident securely…");
    const response = await fetch("/api/residents", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(residentDraft) });
    const result = await response.json();
    if (!response.ok) { setStatus(result.error ?? "Resident save failed"); return; }
    const rows = await fetch("/api/residents").then((value) => value.json());
    const leads = await fetch("/api/inquiries").then((value) => value.ok ? value.json() : inquiries);
    setResidents(rows); setInquiries(leads); setResidentDraft(emptyResident); setConverting(""); setStatus("Resident saved securely"); setTab("residents");
  }
  async function setResidentStatus(id: string, nextStatus: "active" | "checked_out") {
    setStatus(nextStatus === "checked_out" ? "Checking resident out…" : "Reactivating resident…");
    const response = await fetch("/api/residents", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, status: nextStatus }) });
    if (!response.ok) { setStatus("Resident status update failed"); return; }
    setResidents((current) => current.map((resident) => resident.id === id ? { ...resident, status: nextStatus } : resident));
    setStatus(nextStatus === "checked_out" ? "Room released on the public website" : "Room marked occupied on the public website");
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
    automation: "Hosting & later VPS",
  };

  return <main className="admin-shell">
    <aside className="admin-nav">
      <a className="brand" href="/"><img src="/brand-logo.jpg" alt="" /><span><b>SDDP</b><small>ADMIN PANEL</small></span></a>
      <div className="admin-menu">{([
        ["overview", "Overview"],
        ["content", "Website content"],
        ["gallery", "Photo gallery"],
        ["inquiries", `Inquiries (${newInquiries})`],
        ["residents", `Residents (${activeResidents})`],
        ["automation", "Hosting"],
      ] as const).map(([id, label]) => <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}><i>{id === "overview" ? "▣" : id === "content" ? "Aa" : id === "gallery" ? "▧" : id === "inquiries" ? "↗" : id === "residents" ? "◎" : "⌁"}</i>{label}</button>)}</div>
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
        <div className="card-head"><div><span>GUEST PIPELINE</span><h2>Follow up, then move guests in</h2><p>New website requests start here. Mark contacted or booked, add a staff note, then convert a confirmed guest into a resident record.</p></div></div>
        <div className="pipeline-tabs"><button type="button" className={pipelineFilter === "all" ? "active" : ""} onClick={() => setPipelineFilter("all")}>All ({inquiries.length})</button>{pipeline.map((step) => <button type="button" key={step.id} className={pipelineFilter === step.id ? "active" : ""} onClick={() => setPipelineFilter(step.id)}>{step.label} ({inquiries.filter((item) => item.status === step.id).length})</button>)}</div>
        {visibleInquiries.length === 0 ? <div className="empty-state"><b>No inquiries in this step</b><p>New website requests will appear here first.</p></div> : visibleInquiries.map((item) => <article key={item.id} className="pipeline-card">
          <span className={`lead-status ${item.status}`}>{item.status}</span>
          <div><b>{item.name}</b><small>{item.phone} · {item.channel} · {item.locale.toUpperCase()}</small></div>
          <div><b>{item.roomNumber ? `Room ${item.roomNumber}` : item.stayType}</b><small>{item.stayType} · {item.arrivalDate || "Arrival not set"}</small></div>
          <p>{item.message || "No guest note"}</p>
          <time>{new Date(item.createdAt).toLocaleString()}</time>
          <div className="pipeline-actions">{pipeline.filter((step) => step.id !== "converted").map((step) => <button type="button" key={step.id} disabled={item.status === "converted"} className={item.status === step.id ? "active" : ""} onClick={() => setInquiryStatus(item.id, step.id)}>{step.label}</button>)}
            {item.status !== "converted" && <button type="button" className="convert" onClick={() => startConvert(item)}>Move in</button>}
          </div>
          <label className="staff-note">Staff note<textarea defaultValue={item.notes ?? ""} rows={2} onBlur={(event) => { if (event.target.value !== (item.notes ?? "")) saveInquiryNotes(item.id, event.target.value); }} /></label>
        </article>)}
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
            <label>Check-in<input type="date" value={residentDraft.checkInDate} onChange={(e) => setResidentDraft({ ...residentDraft, checkInDate: e.target.value })} /></label>
            <label>Check-out<input type="date" value={residentDraft.checkOutDate} onChange={(e) => setResidentDraft({ ...residentDraft, checkOutDate: e.target.value })} /></label>
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
            <button type="button" className="resident-action" onClick={() => setResidentStatus(resident.id, resident.status === "active" ? "checked_out" : "active")}>{resident.status === "active" ? "Check out" : "Reactivate"}</button>
          </article>)}
        </section>
      </div>}

      {tab === "automation" && <div className="automation-grid">
        <section className="editor-card automation-status">
          <div className="signal"><i className="on" /></div>
          <span>CURRENT HOSTING</span>
          <h2>Render free now, VPS later</h2>
          <p>The public marketing site and this progressive CRM are on Render&apos;s free web service. A later move to your own VPS is already planned. Other websites and their git remotes are not used.</p>
          <dl>
            <div><dt>Current hosting</dt><dd>Render free</dd></div>
            <div><dt>Current storage</dt><dd>{hosting === "cloudflare-d1" ? "Cloudflare D1" : "SQLite on Render"}</dd></div>
            <div><dt>Later hosting</dt><dd>VPS later</dd></div>
            <div><dt>Optional alerts</dt><dd>{n8nReady ? "Webhook connected" : "Not connected yet"}</dd></div>
          </dl>
        </section>
        <section className="editor-card flow-card">
          <span>PROGRESSIVE CRM</span>
          <div className="flow"><b>Website form</b><i>→</i><b>Inquiry pipeline</b><i>→</i><b>Resident record</b><i>→</i><b>Live room status</b></div>
          <p>Start with inquiries and occupancy. Add billing, contracts, and a persistent VPS disk when you are ready. Passport data stays encrypted and is never sent in notifications.</p>
        </section>
      </div>}
    </section>
  </main>;
}
