"use client";

import { useEffect, useMemo, useState } from "react";
import { buildInvoice, ELECTRIC_RATE, parseAmount, WATER_RATE, type InvoiceRecord } from "../lib/invoice";
import { TypedDateField } from "../lib/typed-date";
import InvoiceSheet from "./InvoiceSheet";

type Resident = { id: string; fullName: string; nationality: string; roomNumber: string; status: string };
type Seed = { fullName: string; roomNumber: string; nationality: string } | null;

const months = [
  ["1", "January"], ["2", "February"], ["3", "March"], ["4", "April"], ["5", "May"], ["6", "June"],
  ["7", "July"], ["8", "August"], ["9", "September"], ["10", "October"], ["11", "November"], ["12", "December"],
];

function bangkokDate() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

function emptyDraft(monthlyPrice: string, next: { bookNumber: string; invoiceNumber: string }) {
  const today = bangkokDate();
  const [, month, year] = today.split("-");
  return {
    bookNumber: next.bookNumber,
    invoiceNumber: next.invoiceNumber,
    roomNumber: "",
    residentName: "",
    address: "",
    billingMonth: String(Number(month) || 1),
    billingYear: year || "2026",
    issueDate: today,
    rentAmount: String(parseAmount(monthlyPrice) || 4000),
    electricRate: String(ELECTRIC_RATE),
    electricPrev: "",
    electricCurr: "",
    waterRate: String(WATER_RATE),
    waterPrev: "",
    waterCurr: "",
    otherLabel: "",
    otherAmount: "",
  };
}

export default function InvoiceDesk({
  residents,
  monthlyPrice,
  photo,
  seed,
  onStatus,
}: {
  residents: Resident[];
  monthlyPrice: string;
  photo: string;
  seed: Seed;
  onStatus: (value: string) => void;
}) {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [draft, setDraft] = useState(() => emptyDraft(monthlyPrice, { bookNumber: "014", invoiceNumber: "0691" }));
  const [saved, setSaved] = useState<InvoiceRecord | null>(null);

  const preview = useMemo(() => buildInvoice(draft, { bookNumber: draft.bookNumber, invoiceNumber: draft.invoiceNumber, issueDate: draft.issueDate || bangkokDate() }), [draft]);

  async function load(room = "") {
    const response = await fetch(`/api/invoices${room ? `?room=${encodeURIComponent(room)}` : ""}`);
    const result = await response.json();
    if (!response.ok) { onStatus(result.error ?? "Could not load invoices"); return result; }
    setInvoices(Array.isArray(result.invoices) ? result.invoices : []);
    return result;
  }

  useEffect(() => { load().then((result) => {
    if (result?.next) setDraft((current) => ({ ...current, bookNumber: result.next.bookNumber, invoiceNumber: result.next.invoiceNumber }));
  }); }, []);

  useEffect(() => {
    if (!seed) return;
    setDraft((current) => ({
      ...current,
      residentName: seed.fullName,
      roomNumber: seed.roomNumber,
      address: seed.nationality || current.address,
      rentAmount: String(parseAmount(monthlyPrice) || current.rentAmount),
    }));
    load(seed.roomNumber).then((result) => {
      const last = result?.lastForRoom;
      if (!last) return;
      setDraft((current) => ({
        ...current,
        electricPrev: String(last.electricCurr || ""),
        waterPrev: String(last.waterCurr || ""),
      }));
    });
  }, [seed, monthlyPrice]);

  function field(key: keyof typeof draft, value: string) {
    setDraft((current) => ({ ...current, [key]: value }));
    setSaved(null);
  }

  function pickResident(id: string) {
    const resident = residents.find((item) => item.id === id);
    if (!resident) return;
    setDraft((current) => ({ ...current, residentName: resident.fullName, roomNumber: resident.roomNumber, address: resident.nationality }));
    setSaved(null);
    load(resident.roomNumber).then((result) => {
      const last = result?.lastForRoom;
      if (!last) return;
      setDraft((current) => ({ ...current, electricPrev: String(last.electricCurr || ""), waterPrev: String(last.waterCurr || "") }));
    });
  }

  async function saveAndPrint() {
    onStatus("Saving invoice…");
    const response = await fetch("/api/invoices", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(draft) });
    const result = await response.json().catch(() => ({ error: "Invoice save failed" }));
    if (!response.ok) { onStatus(result.error ?? "Invoice save failed"); return; }
    setSaved(result.invoice);
    setInvoices((current) => [result.invoice, ...current]);
    onStatus(`Invoice ${result.invoice.bookNumber}/${result.invoice.invoiceNumber} saved`);
    document.body.classList.add("print-invoice");
    window.print();
    document.body.classList.remove("print-invoice");
    const next = await load();
    if (next?.next) setDraft(emptyDraft(monthlyPrice, next.next));
  }

  function reprint(invoice: InvoiceRecord) {
    setSaved(invoice);
    document.body.classList.add("print-invoice");
    window.print();
    document.body.classList.remove("print-invoice");
  }

  const paper = saved ?? preview;

  return (
    <div className="invoice-desk">
      <form className="editor-card invoice-desk-form" onSubmit={(event) => { event.preventDefault(); saveAndPrint(); }}>
        <div className="card-head"><div><span>ใบแจ้งหนี้</span><h2>Fill, save, then print</h2><p>This follows the original SDDP paper invoice. Type the year as 2026. Meter use and the total are calculated for you.</p></div></div>
        <label>Resident<select value="" onChange={(event) => pickResident(event.target.value)}><option value="">Choose a resident or type below</option>{residents.filter((item) => item.status === "active").map((item) => <option key={item.id} value={item.id}>{item.fullName} · Room {item.roomNumber}</option>)}</select></label>
        <div className="two-col">
          <label>Name / ชื่อ<input required value={draft.residentName} onChange={(event) => field("residentName", event.target.value)} /></label>
          <label>Address / ที่อยู่<input value={draft.address} onChange={(event) => field("address", event.target.value)} /></label>
          <label>Room / ห้อง<input required value={draft.roomNumber} onChange={(event) => field("roomNumber", event.target.value)} /></label>
          <label>Rent<input inputMode="numeric" value={draft.rentAmount} onChange={(event) => field("rentAmount", event.target.value)} /></label>
          <label>เดือน<select value={draft.billingMonth} onChange={(event) => field("billingMonth", event.target.value)}>{months.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label>Year<input type="text" inputMode="numeric" maxLength={4} placeholder="YYYY" value={draft.billingYear} onChange={(event) => field("billingYear", event.target.value.replace(/\D/g, "").slice(0, 4))} /></label>
          <label>เล่มที่<input value={draft.bookNumber} onChange={(event) => field("bookNumber", event.target.value)} /></label>
          <label>เลขที่<input value={draft.invoiceNumber} onChange={(event) => field("invoiceNumber", event.target.value)} /></label>
        </div>
        <label>วันที่<TypedDateField value={draft.issueDate} onChange={(issueDate) => field("issueDate", issueDate)} /></label>
        <div className="two-col">
          <label>Electric previous<input inputMode="numeric" value={draft.electricPrev} onChange={(event) => field("electricPrev", event.target.value)} /></label>
          <label>Electric current<input inputMode="numeric" value={draft.electricCurr} onChange={(event) => field("electricCurr", event.target.value)} /></label>
          <label>Water previous<input inputMode="numeric" value={draft.waterPrev} onChange={(event) => field("waterPrev", event.target.value)} /></label>
          <label>Water current<input inputMode="numeric" value={draft.waterCurr} onChange={(event) => field("waterCurr", event.target.value)} /></label>
          <label>Other note<input placeholder="อื่นๆ" value={draft.otherLabel} onChange={(event) => field("otherLabel", event.target.value)} /></label>
          <label>Other amount<input inputMode="numeric" value={draft.otherAmount} onChange={(event) => field("otherAmount", event.target.value)} /></label>
        </div>
        <p className="invoice-live-total">Total {preview.totalWords} · {preview.total ? preview.total.toLocaleString("en-US") : 0} baht</p>
        <button className="admin-save" type="submit">Save and print invoice <b>↗</b></button>
      </form>

      <div className="invoice-preview">
        <InvoiceSheet invoice={paper} photo={photo} />
      </div>

      <section className="editor-card invoice-history">
        <div className="card-head"><div><span>SAVED</span><h2>Printed invoices</h2></div></div>
        {invoices.length === 0 ? <div className="empty-state compact"><b>No invoices yet</b><p>Save one to keep the book and running number.</p></div> : invoices.map((item) => (
          <article key={item.id}>
            <div><b>{item.residentName}</b><small>Room {item.roomNumber} · {item.bookNumber}/{item.invoiceNumber}</small></div>
            <div><b>{item.total.toLocaleString("en-US")} baht</b><small>{item.issueDate}</small></div>
            <button type="button" className="resident-action" onClick={() => reprint(item)}>Print</button>
          </article>
        ))}
      </section>
    </div>
  );
}
