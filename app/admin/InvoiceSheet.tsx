import { billingLabel, invoiceLetterhead, money, printDate, type InvoiceRecord } from "../lib/invoice";

type InvoiceView = Omit<InvoiceRecord, "id" | "createdAt"> & { id?: string; createdAt?: number };

export default function InvoiceSheet({ invoice, photo }: { invoice: InvoiceView; photo: string }) {
  const rows = [
    { no: 1, title: "ค่าเช่าห้อง", detail: "", amount: invoice.rentAmount },
    { no: 2, title: `ค่าไฟฟ้า หน่วยละ ${invoice.electricRate} บาท`, detail: invoice.electricPrev || invoice.electricCurr ? `ก่อน ${invoice.electricPrev || "—"}  หลัง ${invoice.electricCurr || "—"}  ใช้ไป ${invoice.electricUnits || 0} หน่วย` : "", amount: invoice.electricAmount },
    { no: 3, title: `ค่าน้ำ หน่วยละ ${invoice.waterRate} บาท`, detail: invoice.waterPrev || invoice.waterCurr ? `ก่อน ${invoice.waterPrev || "—"}  หลัง ${invoice.waterCurr || "—"}  ใช้ไป ${invoice.waterUnits || 0} หน่วย` : "", amount: invoice.waterAmount },
    { no: 4, title: invoice.otherLabel ? `อื่นๆ ${invoice.otherLabel}` : "อื่นๆ", detail: "", amount: invoice.otherAmount },
  ];

  return (
    <article className="invoice-paper">
      <header className="invoice-head">
        <img src={photo} alt="" />
        <div>
          <b>{invoiceLetterhead.name}</b>
          <p>{invoiceLetterhead.thaiAddress}</p>
          <p>โทร. {invoiceLetterhead.phone}</p>
          <p>เลขประจำตัวผู้เสียภาษีอากร {invoiceLetterhead.taxId}</p>
        </div>
        <dl>
          <div><dt>เล่มที่</dt><dd>{invoice.bookNumber}</dd></div>
          <div><dt>เลขที่</dt><dd>{invoice.invoiceNumber}</dd></div>
        </dl>
      </header>

      <div className="invoice-meta">
        <div className="invoice-guest">
          <p><span>ชื่อ</span><b>{invoice.residentName}</b></p>
          <p><span>ที่อยู่</span><b>{invoice.address}</b></p>
        </div>
        <aside>
          <strong>ใบแจ้งหนี้</strong>
          <p><span>ห้อง</span><b>{invoice.roomNumber}</b></p>
          <p><span>เดือน</span><b>{invoice.billingYear ? billingLabel(invoice.billingMonth, invoice.billingYear) : ""}</b></p>
        </aside>
      </div>

      <table>
        <thead>
          <tr><th>ลำดับที่</th><th>รายการ</th><th>จำนวนเงิน</th></tr>
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
        <p className="invoice-words">{invoice.totalWords}</p>
        <div className="invoice-total">
          <span>รวมเงินที่ชำระ</span>
          <b>{invoice.total ? money(invoice.total) : ""}</b>
        </div>
      </footer>
      <div className="invoice-foot">
        <small>*{invoiceLetterhead.notes}</small>
        <p><span>วันที่</span><b>{printDate(invoice.issueDate)}</b></p>
      </div>
    </article>
  );
}
