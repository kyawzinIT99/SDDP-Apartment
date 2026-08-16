import { amountWords, billingLabel, invoiceCopy, invoiceLetterhead, money, printDate, type InvoiceLanguage, type InvoiceRecord } from "../lib/invoice";

type InvoiceView = Omit<InvoiceRecord, "id" | "createdAt"> & { id?: string; createdAt?: number };

export default function InvoiceSheet({ invoice, language }: { invoice: InvoiceView; language: InvoiceLanguage }) {
  const t = invoiceCopy[language];
  const meter = (previous: number, current: number, units: number) => previous || current
    ? `${t.previous} ${previous || "—"}  ${t.current} ${current || "—"}  ${t.used} ${units || 0} ${t.units}`
    : "";
  const rows = [
    { no: 1, title: t.rent, detail: "", amount: invoice.rentAmount },
    { no: 2, title: t.electric(invoice.electricRate), detail: meter(invoice.electricPrev, invoice.electricCurr, invoice.electricUnits), amount: invoice.electricAmount },
    { no: 3, title: t.water(invoice.waterRate), detail: meter(invoice.waterPrev, invoice.waterCurr, invoice.waterUnits), amount: invoice.waterAmount },
    { no: 4, title: invoice.otherLabel ? `${t.other} ${invoice.otherLabel}` : t.other, detail: "", amount: invoice.otherAmount },
  ];

  return (
    <article className="invoice-paper" lang={language}>
      <header className="invoice-head">
        <img src="/brand-logo.jpg" alt="SDDP Apartment" />
        <div>
          <b>{invoiceLetterhead.name}</b>
          <p>{language === "th" ? invoiceLetterhead.thaiAddress : invoiceLetterhead.englishAddress}</p>
          <p>{t.phone} {invoiceLetterhead.phone}</p>
          <p>{t.taxId} {invoiceLetterhead.taxId}</p>
        </div>
        <dl>
          <div><dt>{t.book}</dt><dd>{invoice.bookNumber}</dd></div>
          <div><dt>{t.number}</dt><dd>{invoice.invoiceNumber}</dd></div>
        </dl>
      </header>

      <div className="invoice-meta">
        <div className="invoice-guest">
          <p><span>{t.name}</span><b>{invoice.residentName}</b></p>
          <p><span>{t.address}</span><b>{invoice.address}</b></p>
        </div>
        <aside>
          <strong>{t.title}</strong>
          <p><span>{t.room}</span><b>{invoice.roomNumber}</b></p>
          <p><span>{t.month}</span><b>{invoice.billingYear ? billingLabel(invoice.billingMonth, invoice.billingYear, language) : ""}</b></p>
        </aside>
      </div>

      <table>
        <thead>
          <tr><th>{t.colNo}</th><th>{t.colItem}</th><th>{t.colAmount}</th></tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.no}>
              <td>{row.no}</td>
              <td><b>{row.title}</b>{row.detail ? <small>{row.detail}</small> : null}</td>
              <td>{row.amount ? money(row.amount) : ""}</td>
            </tr>
          ))}
          {Array.from({ length: 4 }, (_, index) => <tr key={`empty-${index}`}><td /><td /><td /></tr>)}
        </tbody>
      </table>

      <footer>
        <p className="invoice-words">{amountWords(invoice.total, language)}</p>
        <div className="invoice-total">
          <span>{t.totalPay}</span>
          <b>{invoice.total ? money(invoice.total) : ""}</b>
        </div>
      </footer>
      <div className="invoice-foot">
        <small>*{t.notes}</small>
        <p><span>{t.date}</span><b>{printDate(invoice.issueDate)}</b></p>
      </div>
    </article>
  );
}
