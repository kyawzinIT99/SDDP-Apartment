"use client";

import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { defaultSiteSettings, lineChatUrl, officialLineId, publicGallery, type SiteSettings } from "./lib/site-defaults";
import { catalogBoard, type PublicRoom } from "./lib/rooms";
import { TypedDateField } from "./lib/typed-date";
import { ChatWidget } from "./lib/ChatWidget";

type Language = "en" | "th" | "my";
type RoomAvailability = PublicRoom;

const words = {
  en: {
    nav: ["Rooms", "Amenities", "Availability", "Gallery", "Inquiry", "Location"],
    eyebrow: "Stay easy in San Kamphaeng",
    title: "Room to feel at home.",
    intro: "Clean, spacious rooms close to Chiang Mai—with flexible daily or monthly stays and a helpful local team.",
    check: "Check a room",
    see: "See the apartment",
    from: "from",
    daily: "per night",
    monthly: "per month",
    short: "1-month minimum",
    open: "Open every day",
    essentials: "Everything you need, already here.",
    tm30: "TM30 support",
    tm30Sub: "Prepared by SDDP for your stay",
    wifi: "Free fast Wi-Fi",
    wifiSub: "Included throughout the building",
    parking: "Car & bike parking",
    parkingSub: "Available within the property quota",
    secure: "Keycard access",
    secureSub: "A safer, easier way in",
    availabilityLabel: "Live availability", availabilityTitle: "See which rooms are free right now.", availabilitySub: "Room status comes from current resident records. Guest names and private details are never shown.", available: "Available", occupied: "Occupied", unknown: "Check with staff", floor: "Floor", availableNow: "available now", autoUpdate: "Updates automatically",
    gallery: "A real look inside",
    gallerySub: "Recent photos from the official SDDP Apartment Facebook page.",
    inquiryTitle: "Tell us what you need.", inquirySub: "Share your dates and preferred contact. The team will confirm availability directly.",
    name: "Your name", contact: "Phone / Line", email: "Email address", stay: "Stay type", room: "Preferred room", chooseRoom: "Choose an available room", noRooms: "No rooms are currently available", arrival: "Expected arrival", note: "Anything we should know?", send: "Send inquiry", sent: "We'll contact you soon — thank you for your inquiry!", roomChanged: "is now occupied. We switched your selection to", chooseAnother: "is now occupied. Please choose another available room.", occupiedPick: "This room is occupied. Choose an available room to send an inquiry.", needAvailable: "Please select an available room before sending your inquiry.", tapAvailable: "Tap an available room to continue",
    locationTitle: "Close to Chiang Mai. Easy to settle in.", directions: "Open in Google Maps", contactUs: "Contact SDDP",
    amenitiesLabel: "Amenities", galleryLabel: "Gallery", inquiryLabel: "Inquiry", locationLabel: "Location", viewFacebook: "View Facebook", showAll: "View all photos", showLess: "Show less", flexible: "Flexible living", monthlyOption: "Monthly", dailyOption: "Daily", footerLine: "Daily & monthly rooms · Chiang Mai", sending: "Sending…", formError: "Something went wrong — please try again or contact us directly.", adminLabel: "Admin",
    packagesLabel: "Stay options", packagesTitle: "Daily or monthly. Same clean rooms.", packagesSub: "Prices are in Thai baht. The team confirms the room before you travel.", dailyStay: "Daily stay", monthlyStay: "Monthly stay", deposit: "Deposit", offer: "Current offer", chatLine: "Chat on Line", whoLabel: "Who stays here", whoTitle: "A simple base near Chiang Mai.", whoOneTitle: "Work and study", whoOne: "Quiet monthly rooms in San Kamphaeng, without city-centre prices.", whoTwoTitle: "Short visits", whoTwo: "Daily rooms when you need a clean stay without a long contract.", whoThreeTitle: "Easy arrival", whoThree: "TM30 support, Wi-Fi, parking and keycard access are ready when you check in.",
  },
  th: {
    nav: ["ห้องพัก", "สิ่งอำนวยความสะดวก", "ห้องว่าง", "แกลเลอรี", "สอบถาม", "ที่ตั้ง"],
    eyebrow: "พักสบายในสันกำแพง",
    title: "ห้องพักที่ให้ความรู้สึกเหมือนบ้าน",
    intro: "ห้องกว้าง สะอาด ใกล้เมืองเชียงใหม่ เลือกพักได้ทั้งรายวันและรายเดือน พร้อมทีมงานดูแล",
    check: "สอบถามห้องว่าง",
    see: "ชมอพาร์ตเมนต์",
    from: "เริ่มต้น",
    daily: "ต่อคืน",
    monthly: "ต่อเดือน",
    short: "สัญญาเริ่มต้น 1 เดือน",
    open: "เปิดทุกวัน",
    essentials: "ครบทุกสิ่งที่จำเป็นสำหรับการเข้าพัก",
    tm30: "บริการเอกสาร TM30",
    tm30Sub: "SDDP จัดเตรียมให้สำหรับผู้เข้าพัก",
    wifi: "Wi-Fi ฟรี ความเร็วสูง",
    wifiSub: "ใช้งานได้ทั่วอาคาร",
    parking: "ที่จอดรถยนต์และมอเตอร์ไซค์",
    parkingSub: "ให้บริการตามโควตาของที่พัก",
    secure: "ระบบคีย์การ์ด",
    secureSub: "สะดวกและปลอดภัยยิ่งขึ้น",
    availabilityLabel: "สถานะห้องแบบปัจจุบัน", availabilityTitle: "ตรวจสอบห้องว่างได้ทันที", availabilitySub: "สถานะมาจากข้อมูลผู้พักปัจจุบัน โดยไม่แสดงชื่อหรือข้อมูลส่วนตัวของผู้เข้าพัก", available: "ว่าง", occupied: "มีผู้พัก", unknown: "สอบถามพนักงาน", floor: "ชั้น", availableNow: "ห้องว่างขณะนี้", autoUpdate: "อัปเดตอัตโนมัติ",
    gallery: "ชมบรรยากาศจริง",
    gallerySub: "ภาพล่าสุดจากเพจ Facebook ทางการของ SDDP Apartment",
    inquiryTitle: "บอกเราเกี่ยวกับการเข้าพักของคุณ", inquirySub: "แจ้งวันที่และช่องทางติดต่อ ทีมงานจะยืนยันห้องว่างให้โดยตรง",
    name: "ชื่อของคุณ", contact: "โทรศัพท์ / Line", email: "อีเมล", stay: "ประเภทการเข้าพัก", room: "ห้องที่ต้องการ", chooseRoom: "เลือกห้องว่าง", noRooms: "ขณะนี้ไม่มีห้องว่าง", arrival: "วันที่คาดว่าจะเข้าพัก", note: "รายละเอียดเพิ่มเติม", send: "ส่งคำถาม", sent: "เราจะติดต่อกลับเร็ว ๆ นี้ — ขอบคุณสำหรับการสอบถาม!", roomChanged: "มีผู้เข้าพักแล้ว เราเปลี่ยนห้องที่เลือกเป็น", chooseAnother: "มีผู้เข้าพักแล้ว กรุณาเลือกห้องว่างอื่น", occupiedPick: "ห้องนี้มีผู้เข้าพักแล้ว กรุณาเลือกห้องว่างเพื่อส่งคำถาม", needAvailable: "กรุณาเลือกห้องว่างก่อนส่งคำถาม", tapAvailable: "แตะห้องว่างเพื่อดำเนินการต่อ",
    locationTitle: "ใกล้เมืองเชียงใหม่ เริ่มต้นการเข้าพักได้ง่าย", directions: "เปิดใน Google Maps", contactUs: "ติดต่อ SDDP",
    amenitiesLabel: "สิ่งอำนวยความสะดวก", galleryLabel: "แกลเลอรี", inquiryLabel: "สอบถามห้องพัก", locationLabel: "ที่ตั้ง", viewFacebook: "ดู Facebook", showAll: "ดูรูปทั้งหมด", showLess: "แสดงน้อยลง", flexible: "พักได้อย่างยืดหยุ่น", monthlyOption: "รายเดือน", dailyOption: "รายวัน", footerLine: "ห้องพักรายวันและรายเดือน · เชียงใหม่", sending: "กำลังส่ง…", formError: "เกิดข้อผิดพลาด — กรุณาลองใหม่หรือติดต่อเราโดยตรง", adminLabel: "ผู้ดูแล",
    packagesLabel: "ตัวเลือกการเข้าพัก", packagesTitle: "พักรายวันหรือรายเดือน ห้องสะอาดเหมือนกัน", packagesSub: "ราคาเป็นบาท ทีมงานจะยืนยันห้องก่อนคุณเดินทาง", dailyStay: "พักรายวัน", monthlyStay: "พักรายเดือน", deposit: "เงินมัดจำ", offer: "โปรโมชันปัจจุบัน", chatLine: "คุยทาง Line", whoLabel: "เหมาะกับใคร", whoTitle: "ฐานที่พักใกล้เชียงใหม่ ที่เริ่มต้นได้ง่าย", whoOneTitle: "ทำงานและเรียน", whoOne: "ห้องรายเดือนเงียบในสันกำแพง ไม่ต้องจ่ายราคาใจกลางเมือง", whoTwoTitle: "เข้าพักระยะสั้น", whoTwo: "ห้องรายวันเมื่อต้องการที่พักสะอาดโดยไม่ต้องทำสัญญายาว", whoThreeTitle: "เดินทางมาถึงได้ง่าย", whoThree: "มีบริการ TM30, Wi-Fi, ที่จอดรถ และคีย์การ์ดพร้อมเมื่อเช็คอิน",
  },
  my: {
    nav: ["အခန်းများ", "ဝန်ဆောင်မှုများ", "အခန်းလွတ်", "ဓာတ်ပုံများ", "မေးမြန်းရန်", "တည်နေရာ"],
    eyebrow: "San Kamphaeng တွင် သက်တောင့်သက်သာ တည်းခိုပါ",
    title: "အိမ်လို နွေးထွေးတဲ့ အခန်း။",
    intro: "ချင်းမိုင်မြို့အနီး သန့်ရှင်းကျယ်ဝန်းသော အခန်းများ၊ နေ့စဉ် သို့မဟုတ် လစဉ် လိုက်လျောညီထွေ တည်းခိုနိုင်ပါသည်။",
    check: "အခန်းလွတ် မေးမြန်းရန်",
    see: "တိုက်ခန်းကြည့်ရန်",
    from: "မှစ၍",
    daily: "တစ်ညလျှင်",
    monthly: "တစ်လလျှင်",
    short: "အနည်းဆုံး ၁ လ စာချုပ်",
    open: "နေ့စဉ်ဖွင့်သည်",
    essentials: "လိုအပ်သမျှ အဆင်သင့် ရှိပါသည်။",
    tm30: "TM30 အကူအညီ",
    tm30Sub: "SDDP မှ တည်းခိုသူအတွက် စီစဉ်ပေးသည်",
    wifi: "မြန်နှုန်းမြင့် Wi-Fi အခမဲ့",
    wifiSub: "အဆောက်အအုံတစ်လျှောက် အသုံးပြုနိုင်သည်",
    parking: "ကားနှင့်ဆိုင်ကယ် ပါကင်",
    parkingSub: "နေရာလွတ်ရှိမှုအလိုက် ရရှိနိုင်သည်",
    secure: "ကီးကတ် ဝင်ပေါက်",
    secureSub: "ပိုမိုလုံခြုံ လွယ်ကူစွာ ဝင်နိုင်သည်",
    availabilityLabel: "လက်ရှိအခန်းအခြေအနေ", availabilityTitle: "ယခုလွတ်နေသောအခန်းများကို ကြည့်ပါ။", availabilitySub: "အခန်းအခြေအနေကို လက်ရှိနေထိုင်သူမှတ်တမ်းမှ ရယူထားပြီး ဧည့်သည်အမည်နှင့် ကိုယ်ရေးအချက်အလက်များကို မဖော်ပြပါ။", available: "လွတ်", occupied: "နေထိုင်သူရှိ", unknown: "ဝန်ထမ်းကို မေးပါ", floor: "အထပ်", availableNow: "ယခုလွတ်", autoUpdate: "အလိုအလျောက် အပ်ဒိတ်လုပ်သည်",
    gallery: "အတွင်းပိုင်းကို အမှန်တကယ်ကြည့်ပါ",
    gallerySub: "SDDP Apartment တရားဝင် Facebook စာမျက်နှာမှ နောက်ဆုံးဓာတ်ပုံများ။",
    inquiryTitle: "သင်လိုအပ်တာ ပြောပြပါ။", inquirySub: "တည်းခိုမည့်ရက်နှင့် ဆက်သွယ်လိုသည့်နည်းလမ်းကို မျှဝေပါ။ အဖွဲ့က အခန်းလွတ်ကို အတည်ပြုပေးပါမည်။",
    name: "သင့်အမည်", contact: "ဖုန်း / Line", email: "အီးမေးလ်", stay: "တည်းခိုမှုအမျိုးအစား", room: "နှစ်သက်ရာအခန်း", chooseRoom: "လွတ်နေသောအခန်း ရွေးပါ", noRooms: "လက်ရှိ အခန်းလွတ်မရှိပါ", arrival: "ရောက်ရှိမည့်ရက်", note: "ထပ်မံသိရှိရန်", send: "မေးမြန်းချက် ပို့ရန်", sent: "မကြာမီ ဆက်သွယ်ပေးပါမည် — မေးမြန်းမှုအတွက် ကျေးဇူးတင်ပါသည်!", roomChanged: "တွင် နေထိုင်သူရှိသွားပါပြီ။ သင့်ရွေးချယ်မှုကို ပြောင်းပေးထားသည်", chooseAnother: "တွင် နေထိုင်သူရှိသွားပါပြီ။ အခြားအခန်းလွတ်ကို ရွေးပါ။", occupiedPick: "ဤအခန်းတွင် နေထိုင်သူရှိပြီး မေးမြန်း၍မရပါ။ အခန်းလွတ်ကို ရွေးပါ။", needAvailable: "မေးမြန်းချက် မပို့မီ အခန်းလွတ်ကို ရွေးပါ။", tapAvailable: "ဆက်လုပ်ရန် အခန်းလွတ်ကို နှိပ်ပါ",
    locationTitle: "ချင်းမိုင်မြို့အနီး အလွယ်တကူ နေထိုင်နိုင်ပါသည်။", directions: "Google Maps တွင်ဖွင့်ရန်", contactUs: "SDDP ကို ဆက်သွယ်ရန်",
    amenitiesLabel: "ဝန်ဆောင်မှုများ", galleryLabel: "ဓာတ်ပုံများ", inquiryLabel: "မေးမြန်းရန်", locationLabel: "တည်နေရာ", viewFacebook: "Facebook တွင်ကြည့်ရန်", showAll: "ဓာတ်ပုံအားလုံးကြည့်ရန်", showLess: "လျှော့ပြရန်", flexible: "လိုက်လျောညီထွေ တည်းခိုမှု", monthlyOption: "လစဉ်", dailyOption: "နေ့စဉ်", footerLine: "နေ့စဉ်နှင့် လစဉ်အခန်းများ · ချင်းမိုင်", sending: "ပို့နေသည်…", formError: "အမှားတစ်ခုဖြစ်သွားသည် — ထပ်ကြိုးစားပါ သို့မဟုတ် တိုက်ရိုက်ဆက်သွယ်ပါ", adminLabel: "စီမံခန့်ခွဲမှု",
    packagesLabel: "တည်းခိုမှု ရွေးချယ်စရာ", packagesTitle: "နေ့စဉ် သို့မဟုတ် လစဉ်။ အခန်းသန့်ရှင်းမှု အတူတူပါ။", packagesSub: "ဈေးနှုန်းမှာ ထိုင်းဘတ်ဖြစ်သည်။ ခရီးမထွက်မီ အဖွဲ့က အခန်းကို အတည်ပြုပေးပါမည်။", dailyStay: "နေ့စဉ် တည်းခိုမှု", monthlyStay: "လစဉ် တည်းခိုမှု", deposit: "အာမခံငွေ", offer: "လက်ရှိ ကမ်းလှမ်းချက်", chatLine: "Line မှ စကားပြောရန်", whoLabel: "မည်သူများ တည်းခိုသနည်း", whoTitle: "ချင်းမိုင်အနီး အဆင်ပြေသော နေရာ။", whoOneTitle: "အလုပ်နှင့် ပညာသင်", whoOne: "San Kamphaeng တွင် တိတ်ဆိတ်ပြီး ဈေးသက်သာသော လစဉ်အခန်းများ။", whoTwoTitle: "ခဏတာ လာရောက်မှု", whoTwo: "စာချုပ်ရှည်မလိုဘဲ သန့်ရှင်းစွာ တည်းခိုလိုသော နေ့စဉ်အခန်းများ။", whoThreeTitle: "ရောက်ရှိရ လွယ်ကူမှု", whoThree: "TM30 အကူအညီ၊ Wi-Fi၊ ပါကင်နှင့် ကီးကတ် ဝင်ပေါက်များ အဆင်သင့်ရှိသည်။",
  },
} satisfies Record<Language, Record<string, string | string[]>>;

export default function Home() {
  const [language, setLanguage] = useState<Language>("en");
  const [settings, setSettings] = useState<SiteSettings>(defaultSiteSettings);
  const [showGallery, setShowGallery] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [availability, setAvailability] = useState<{ rooms: RoomAvailability[]; stale?: boolean; source?: string }>({ rooms: catalogBoard(), stale: true, source: "catalog" });
  const [selectedRoom, setSelectedRoom] = useState("");
  const [formStatus, setFormStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [formNotice, setFormNotice] = useState("");
  const t = { ...words[language], ...(settings.copy[language] ?? {}) };
  const nav = words[language].nav;
  const lineId = officialLineId(settings.lineId);
  const lineHref = lineChatUrl(settings.lineId);
  const visibleGallery = publicGallery.filter((image) => !settings.galleryHidden.includes(image));
  const roomsByFloor = availability.rooms.reduce<Record<string, RoomAvailability[]>>((groups, room) => { (groups[room.floor] ??= []).push(room); return groups; }, {});
  const availableRooms = availability.rooms.filter((room) => room.status === "available");
  const availableCount = availableRooms.length;
  const selectedIsAvailable = availableRooms.some((room) => room.roomNumber === selectedRoom);
  const theme = { "--yellow": settings.accentColor, "--red": settings.actionColor, "--cream": settings.backgroundColor, "--ink": settings.textColor } as CSSProperties;

  useEffect(() => {
    fetch("/api/site").then((response) => response.ok ? response.json() : null).then((data) => data && setSettings(data)).catch(() => undefined);
    let active = true;
    const loadAvailability = () => fetch("/api/rooms").then((response) => response.ok ? response.json() : null).then((data) => { if (active && data?.rooms) setAvailability(data); }).catch(() => undefined);
    loadAvailability();
    const timer = window.setInterval(loadAvailability, 30_000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  useEffect(() => {
    if (!selectedRoom) return;
    const current = availability.rooms.find((room) => room.roomNumber === selectedRoom);
    if (current && current.status !== "available") {
      setSelectedRoom("");
      setFormNotice(`${t.room} ${current.roomNumber} ${t.chooseAnother}`);
    }
  }, [availability, selectedRoom, t.chooseAnother, t.room]);

  function pickRoom(room: RoomAvailability) {
    if (room.status !== "available") {
      setFormNotice(t.occupiedPick);
      return;
    }
    setSelectedRoom(room.roomNumber);
    setFormNotice("");
    document.getElementById("inquiry")?.scrollIntoView({ behavior: "smooth" });
  }

  async function submitInquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const chosen = availability.rooms.find((room) => room.roomNumber === selectedRoom);
    if (!chosen || chosen.status !== "available") {
      setFormNotice(t.needAvailable);
      setFormStatus("idle");
      return;
    }
    setFormStatus("sending"); setFormNotice("");
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    try {
      const response = await fetch("/api/inquiries", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...data, roomNumber: selectedRoom, locale: language }) });
      const result = await response.json();
      if (response.status === 409 && result.code === "room_unavailable") {
        const refreshed = await fetch("/api/rooms").then((value) => value.json());
        if (refreshed?.rooms) setAvailability(refreshed);
        setSelectedRoom("");
        const notice = `${t.room} ${result.roomNumber} ${t.chooseAnother}`;
        setFormNotice(notice); setFormStatus("idle"); return;
      }
      if (!response.ok) throw new Error();
      setFormStatus("sent"); setSelectedRoom(""); form.reset();
    }
    catch { setFormStatus("error"); }
  }

  return (
    <main lang={language} style={theme}>
      <header className={`nav${menuOpen ? " menu-open" : ""}`}>
        <a href="#top" className="brand" aria-label="SDDP Apartment home">
          <img src="/brand-logo.jpg" alt="SDDP Apartment" />
          <span><b>SDDP</b><small>APARTMENT</small></span>
        </a>
        <nav aria-label="Primary navigation">
          {([["#top", nav[0]], ["#amenities", nav[1]], ["#availability", nav[2]], ["#gallery", nav[3]], ["#inquiry", nav[4]], ["#location", nav[5]]] as [string, string][]).map(([href, label]) => (
            <a key={href} href={href} onClick={() => setMenuOpen(false)}>{label}</a>
          ))}
        </nav>
        <div className="nav-side">
          <div className="languages" aria-label="Language">
            {(["en", "th", "my"] as Language[]).map((code) => <button key={code} className={language === code ? "active" : ""} onClick={() => setLanguage(code)}>{code === "en" ? "EN" : code === "th" ? "ไทย" : "မြန်မာ"}</button>)}
          </div>
          <a className="small-cta" href="#inquiry">{t.check}</a>
          <button className="nav-hamburger" aria-label={menuOpen ? "Close menu" : "Open menu"} onClick={() => setMenuOpen((o) => !o)}>
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span />{t.eyebrow}</p>
          <h1>{t.title}</h1>
          <p className="intro">{t.intro}</p>
          <div className="hero-actions"><a className="primary" href="#inquiry">{t.check}<b>↗</b></a><a className="secondary" href="#gallery">{t.see}<b>↓</b></a></div>
          <div className="meta-row"><span><i />{t.open}</span><span>{settings.address}</span></div>
        </div>
        <div className="hero-media">
          <img className="hero-photo" src={`/gallery/${settings.heroImage}`} alt="Bright furnished room at SDDP Apartment" />
          <div className="price-card daily"><small>{t.from}</small><b>฿{settings.dailyPrice}</b><span>{t.daily}</span></div>
          <div className="price-card monthly"><small>{t.from}</small><b>฿{settings.monthlyPrice}</b><span>{t.monthly}</span></div>
          <div className="short-stay"><span>✓</span><div><b>{t.short}</b><small>{t.flexible}</small></div></div>
        </div>
      </section>

      <section className="packages-section" id="packages">
        <div className="packages-head"><span>01 / {t.packagesLabel}</span><h2>{t.packagesTitle}</h2><p>{t.packagesSub}</p></div>
        <div className="package-grid">
          <article>
            <small>{t.dailyStay}</small>
            <b>฿{settings.dailyPrice}</b>
            <span>{t.daily}</span>
            <p>{t.flexible}</p>
            <a href="#inquiry">{t.check}</a>
          </article>
          <article className="featured">
            <small>{t.monthlyStay}</small>
            <b>฿{settings.monthlyPrice}</b>
            <span>{t.monthly}</span>
            <p>{t.deposit}: {settings.monthlyDeposit}</p>
            <a href="#inquiry">{t.check}</a>
          </article>
          <article>
            <small>{t.offer}</small>
            <b>{settings.promotion}</b>
            <span>{t.chatLine}</span>
            <p>LINE {lineId}</p>
            <a href={lineHref} target="_blank" rel="noreferrer">{t.chatLine}</a>
          </article>
        </div>
      </section>

      <section className="who-section" id="who">
        <div className="section-title"><span>02 / {t.whoLabel}</span><h2>{t.whoTitle}</h2></div>
        <div className="who-grid">
          {[[t.whoOneTitle, t.whoOne], [t.whoTwoTitle, t.whoTwo], [t.whoThreeTitle, t.whoThree]].map(([title, copy]) => <article key={title}><h3>{title}</h3><p>{copy}</p></article>)}
        </div>
      </section>

      <section className="amenities" id="amenities">
        <div className="section-title"><span>03 / {t.amenitiesLabel}</span><h2>{t.essentials}</h2></div>
        <div className="amenity-grid">
          {[["⌂",t.tm30,t.tm30Sub],["⌁",t.wifi,t.wifiSub],["◇",t.parking,t.parkingSub],["▣",t.secure,t.secureSub]].map(([icon,title,sub]) => <article key={title}><i>{icon}</i><h3>{title}</h3><p>{sub}</p></article>)}
        </div>
      </section>

      <section className="availability-section" id="availability">
        <div className="availability-head">
          <div><span>04 / {t.availabilityLabel}</span><h2>{t.availabilityTitle}</h2><p>{t.availabilitySub}</p></div>
          <div className="availability-count"><b>{availableCount}</b><span>{t.availableNow}</span><small><i />{availability.source === "database" ? t.autoUpdate : t.unknown}</small></div>
        </div>
        <div className="status-legend"><span><i className="available" />{t.available}</span><span><i className="occupied" />{t.occupied}</span>{availability.stale && <span><i className="unknown" />{t.unknown}</span>}</div>
        <p className="room-hint">{t.tapAvailable}</p>
        <div className="floor-list">
          {Object.entries(roomsByFloor).map(([floor, rooms]) => <section className="floor-card" key={floor}><header><span>{t.floor}</span><b>{floor}</b><small>{rooms.filter((room) => room.status === "available").length}/{rooms.length} {t.available}</small></header><div className="room-grid">{rooms.map((room) => <button type="button" key={room.roomNumber} className={`room-status ${room.status}${selectedRoom === room.roomNumber ? " selected" : ""}`} aria-disabled={room.status !== "available"} onClick={() => pickRoom(room)}><b>{room.roomNumber}</b><span><i />{room.status === "available" ? t.available : room.status === "occupied" ? t.occupied : t.unknown}</span></button>)}</div></section>)}
        </div>
      </section>

      <section className="gallery-section" id="gallery">
        <div className="gallery-head"><div><span>05 / {t.galleryLabel}</span><h2>{t.gallery}</h2><p>{t.gallerySub}</p></div><a href={`${settings.facebookUrl}/photos`} target="_blank" rel="noreferrer">{t.viewFacebook} <b>↗</b></a></div>
        <div className={`gallery-grid ${showGallery ? "expanded" : ""}`}>{visibleGallery.map((image, index) => <figure key={image} className={`photo-${index + 1}`}><img src={`/gallery/${image}`} alt={`SDDP Apartment property view ${index + 1}`} /></figure>)}</div>
        <button className="gallery-toggle" onClick={() => setShowGallery((value) => !value)}>{showGallery ? t.showLess : `${t.showAll} (${visibleGallery.length})`}</button>
      </section>

      <section className="inquiry-section" id="inquiry">
        <div className="inquiry-copy"><span>06 / {t.inquiryLabel}</span><h2>{t.inquiryTitle}</h2><p>{t.inquirySub}</p><div className="direct-contact"><a href={`tel:${settings.phonePrimary.replace(/-/g, "")}`}>{settings.phonePrimary}</a><a className="line-official" href={lineHref} target="_blank" rel="noreferrer"><img src="/brand-logo.jpg" alt="SDDP Apartment" /><span><b>LINE</b><small>{lineId}</small></span></a></div></div>
        <form onSubmit={submitInquiry}>
          <label>{t.name}<input name="name" required autoComplete="name" /></label>
          <label>{t.contact}<input name="phone" required autoComplete="tel" /></label>
          <label>{t.email}<input name="email" type="email" required autoComplete="email" /></label>
          <div className="form-row"><label>{t.stay}<select name="stayType"><option value="monthly">{t.monthlyOption}</option><option value="daily">{t.dailyOption}</option></select></label><label>{t.room}<select name="roomNumber" required value={selectedRoom} onChange={(event) => { const next = availability.rooms.find((room) => room.roomNumber === event.target.value); if (next && next.status !== "available") { setFormNotice(t.occupiedPick); setSelectedRoom(""); return; } setSelectedRoom(event.target.value); setFormNotice(""); }}><option value="">{availableCount ? t.chooseRoom : t.noRooms}</option>{availableRooms.map((room) => <option key={room.roomNumber} value={room.roomNumber}>{room.roomNumber} — {t.available}</option>)}</select></label></div>
          <label>{t.arrival}<TypedDateField name="arrivalDate" /></label>
          <label>{t.note}<textarea name="message" rows={3} /></label>
          <button className="form-submit" disabled={formStatus === "sending" || !selectedIsAvailable}>{formStatus === "sending" ? t.sending : t.send}<b>↗</b></button>
          <div aria-live="polite">{formNotice && <p className="form-message">{formNotice}</p>}{formStatus === "sent" && <p className="form-message success">{t.sent}</p>}{formStatus === "error" && <p className="form-message">{t.formError}</p>}</div>
        </form>
      </section>

      <section className="location-section" id="location"><div><span>07 / {t.locationLabel}</span><h2>{t.locationTitle}</h2><p>{settings.address}</p><a href={settings.mapUrl} target="_blank" rel="noreferrer">{t.directions} ↗</a></div><div className="map-frame"><iframe src={settings.mapEmbedUrl} title="SDDP Apartment on Google Maps" loading="lazy" referrerPolicy="no-referrer-when-downgrade" /></div></section>
      <footer><a className="brand" href="#top"><img src="/brand-logo.jpg" alt="" /><span><b>SDDP</b><small>APARTMENT</small></span></a><p>{t.footerLine}</p><div><a href={`tel:${settings.phonePrimary.replace(/-/g, "")}`}>{settings.phonePrimary}</a><a className="line-official compact" href={lineHref} target="_blank" rel="noreferrer"><img src="/brand-logo.jpg" alt="" /><span>LINE {lineId}</span></a><a href={settings.facebookUrl} target="_blank" rel="noreferrer">Facebook</a></div></footer>
      <div className="chat-widget-wrap">
        <ChatWidget lang={language} lineId={lineId} lineHref={lineHref} />
      </div>
    </main>
  );
}
