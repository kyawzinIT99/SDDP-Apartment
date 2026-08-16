export type BotLanguage = "en" | "th" | "my";

// ─── SDDP Knowledge Base ───────────────────────────────────────────────
const K = {
  name: "SDDP Apartment",
  address: "8/18 Moo 2, Ton Pao, San Kamphaeng, Chiang Mai 50130",
  phone: ["094-293-5296", "064-504-6997"],
  line: "SDDP.Apartment",
  facebook: "facebook.com/Sddpapartment",

  // Pricing
  daily: "฿450 per night",
  monthly: "฿4,000 per month",
  vip: "฿8,000 per month",
  deposit: "50% of first month (฿2,000 standard / ฿4,000 VIP) — paid when you sign the contract",
  depositPolicy: {
    en: "A 50% deposit (฿2,000) is required along with a copy of your ID or passport. Please note: any fraud or falsified documents will be reported to the police immediately and the original passport/ID may be held until the matter is resolved.",
    th: "ต้องชำระมัดจำ 50% (฿2,000) พร้อมสำเนาบัตรประชาชนหรือพาสปอร์ต หากพบการแจ้งข้อมูลเท็จหรือการโกง ทางที่พักจะดำเนินการแจ้งตำรวจทันที และอาจกักพาสปอร์ต/บัตรประชาชนต้นฉบับไว้จนกว่าเรื่องจะสิ้นสุด",
    my: "စာချုပ်ချုပ်ဆိုသည့်အခါ 50% (฿2,000) ကြိုတင်ငွေ နှင့် မှတ်ပုံတင် သို့မဟုတ် နိုင်ငံကူးလက်မှတ်မိတ္တူ ပေးရမည်။ မှားယွင်းသောစာရွက်စာတမ်းများ သို့မဟုတ် လိမ်ညာမှုတွေ့ရှိပါက ရဲထံ ချက်ချင်းတိုင်ကြားမည်ဖြစ်ပြီး ကိစ္စပြေလည်သည်အထိ နိုင်ငံကူးလက်မှတ်ကို ထိန်းသိမ်းထားနိုင်သည်",
  },
  promotion: "Stay 10 nights → get 1 night free",

  // Rooms
  totalRooms: 47,
  floors: "Floors 2, 3 and 4 — plus VIP rooms",
  roomTypes: {
    en: "Standard rooms (฿4,000/month) and VIP rooms (฿8,000/month). All rooms include: AC, hot shower, fridge, TV, wardrobe, desk and free Wi-Fi.",
    th: "ห้องมาตรฐาน (฿4,000/เดือน) และห้อง VIP (฿8,000/เดือน) ทุกห้องมี: แอร์, ฝักบัวน้ำอุ่น, ตู้เย็น, TV, ตู้เสื้อผ้า, โต๊ะ และ Wi-Fi ฟรี",
    my: "Standard ခန်း (฿4,000/လ) နှင့် VIP ခန်း (฿8,000/လ)။ ခန်းတိုင်းတွင် — AC၊ ရေပူချိုး၊ ရေခဲသေတ္တာ၊ TV၊ ဝတ်စားဆင်ယင်ချိတ်၊ စားပွဲနှင့် Wi-Fi အခမဲ့ပါရှိသည်",
  },

  // Facilities
  wifi: {
    en: "Free high-speed Wi-Fi throughout the building — no extra charge.",
    th: "Wi-Fi ฟรีความเร็วสูงทั่วอาคาร ไม่มีค่าใช้จ่ายเพิ่มเติม",
    my: "အဆောက်အအုံတစ်ခုလုံး မြန်နှုန်းမြင့် Wi-Fi အခမဲ့ — ထပ်ဆောင်းကြေးမရှိ",
  },
  washing: {
    en: "Coin-operated washing machines are available in the building (shared). Hot and cold settings. ฿20–30 per load.",
    th: "มีเครื่องซักผ้าหยอดเหรียญในอาคาร (ส่วนกลาง) ซักร้อนและเย็น ราคาประมาณ ฿20–30 ต่อรอบ",
    my: "အဆောက်အအုံတွင် အကြွေစင် လျှော်စက်ရှိသည် (မျှဝေသုံးစွဲ)။ ရေပူ/ရေအေး ‌ ฿20–30 တစ်ကြိမ်",
  },
  parking: {
    en: "Car and motorbike parking inside the property. Spaces are limited — please confirm availability when you book.",
    th: "มีที่จอดรถยนต์และมอเตอร์ไซค์ในบริเวณที่พัก จำกัดจำนวน กรุณาแจ้งตอนจอง",
    my: "ကား နှင့် ဆိုင်ကယ် ပါကင် ရှိသည်။ နေရာကန့်သတ် — ကြိုတင်စာရင်းသွင်းသောအခါ အတည်ပြုပါ",
  },
  keycard: {
    en: "Each room has keycard access. The building entrance also uses keycard — safer and more convenient than keys.",
    th: "ทุกห้องใช้ระบบคีย์การ์ด ทั้งประตูทางเข้าอาคารและห้องพัก ปลอดภัยและสะดวกกว่ากุญแจปกติ",
    my: "ခန်းတိုင်းနှင့် အဆောက်အဝင်တံခါးတွင် ကီးကတ် ရှိသည်။ သာမာန်သော့ထက် ပိုမိုလုံခြုံပြီး အဆင်ပြေသည်",
  },
  tm30: {
    en: "SDDP prepares TM30 immigration documents for all foreign guests at no extra cost. Bring your passport and we handle the rest.",
    th: "SDDP จัดทำเอกสาร TM30 สำหรับผู้เข้าพักชาวต่างชาติโดยไม่มีค่าใช้จ่ายเพิ่มเติม นำพาสปอร์ตมาแล้วเราจัดการให้",
    my: "SDDP သည် နိုင်ငံခြားဧည့်သည်အားလုံးအတွက် TM30 ကိုယ်ဝင်ကောက်ကြောင်းစာရွက်စာတမ်း ထပ်ဆောင်းကြေးမဲ့ ဆောင်ရွက်ပေးသည်။ နိုင်ငံကူးလက်မှတ်ယူလာပါ — ကျန်သည်ကို ကျွန်ုပ်တို့ဆောင်ရွက်ပါမည်",
  },
  ac: {
    en: "Every room has its own air conditioner. Electricity is metered per room — approx ฿5–7 per unit.",
    th: "ทุกห้องมีแอร์ของตัวเอง ไฟฟ้าคิดค่าบริการตามมิเตอร์ ประมาณ ฿5–7 ต่อหน่วย",
    my: "ခန်းတိုင်းတွင် မိမိ AC ကိုယ်ပိုင်ရှိသည်။ လျှပ်စစ်ကား မီတာနှင့်တွက် — တစ်ယူနစ် ฿5–7 ခန့်",
  },
  water: {
    en: "Water is included in the room rate — no separate water bill.",
    th: "ค่าน้ำรวมอยู่ในค่าเช่าแล้ว ไม่มีค่าน้ำแยก",
    my: "ရေခ ငှားခတွင်ပါဝင်ပြီး — သီးခြား ရေဘိုင်မဆိုင်",
  },
  fridge: {
    en: "Yes — every room comes with a fridge already inside.",
    th: "มีครับ ทุกห้องมีตู้เย็นในห้องอยู่แล้ว",
    my: "ဟုတ်ကဲ့ — ခန်းတိုင်းတွင် ရေခဲသေတ္တာ ပါဝင်ပြီးသားဖြစ်သည်",
  },
  hotWater: {
    en: "Hot water is available in every room — electric shower included.",
    th: "ทุกห้องมีน้ำอุ่น ฝักบัวไฟฟ้าให้พร้อม",
    my: "ခန်းတိုင်းတွင် ရေပူ ရရှိနိုင်သည် — လျှပ်စစ်ချိုးပုံးပါဝင်သည်",
  },
  security: {
    en: "The building uses keycard entry, and the property is managed on-site daily. CCTV cameras cover common areas.",
    th: "อาคารใช้คีย์การ์ดเข้า มีทีมงานดูแลในที่ทุกวัน และมีกล้อง CCTV บริเวณส่วนกลาง",
    my: "အဆောက်အဝင်သည် ကီးကတ်ဝင်ပေါက်ကို အသုံးပြုသည်။ ဝန်ထမ်းများ နေ့တိုင်း ဆောင်ရွက်ပြီး CCTV ကင်မရာများ ပြင်ပဧရိယာတွင် ရှိသည်",
  },
  contract: {
    en: "Monthly stays require a minimum 1-month contract. Daily stays have no minimum. Extensions are flexible — just let the team know before your last day.",
    th: "การเช่ารายเดือนต้องมีสัญญาขั้นต่ำ 1 เดือน รายวันไม่มีขั้นต่ำ ต่อสัญญาได้ง่าย แจ้งทีมงานก่อนวันสุดท้าย",
    my: "လစဉ်နေထိုင်မှုသည် အနည်းဆုံး ၁ လ စာချုပ်လိုအပ်သည်။ နေ့စဉ်မှာ အနည်းဆုံးမလိုပါ။ တိုးချဲ့ရန် — နောက်ဆုံးနေ့မတိုင်မီ အဖွဲ့ကိုအကြောင်းကြားပါ",
  },
  earlyCheckout: {
    en: "For monthly contracts, early check-out before the contract ends may forfeit part of the deposit. Please speak to the team if your plans change.",
    th: "หากยกเลิกก่อนครบสัญญา อาจสูญเสียมัดจำบางส่วน กรุณาคุยกับทีมงานหากแผนเปลี่ยน",
    my: "လစဉ်စာချုပ်အတွက် စာချုပ်ကာလမပြည့်မီ ထွက်ခွာပါက အာမခံငွေ တစ်စိတ်တစ်ပိုင်း ဆုံးရှုံးနိုင်သည်။ အစီအစဉ်ပြောင်းပါက အဖွဲ့ကို ကြိုပြောပါ",
  },
  checkIn: {
    en: "Check-in is flexible — the team will confirm your arrival time after booking. Check-out is typically before noon.",
    th: "เวลาเช็คอินยืดหยุ่น ทีมงานจะยืนยันหลังจองห้อง เช็คเอาต์ปกติก่อนเที่ยง",
    my: "ချက်အင်သည် ပြောင်းလဲနိုင်သည် — ကြိုတင်မှာကြားပြီးနောက် အဖွဲ့က ရောက်ချိန်ကို အတည်ပြုပေးမည်။ ချက်အောက်ကား ပုံမှန်မနက်ခင်း ၁၂ နာရီမတိုင်မီ",
  },
  pets: {
    en: "Pets are not allowed at SDDP Apartment.",
    th: "ไม่อนุญาตให้นำสัตว์เลี้ยงเข้าพัก",
    my: "SDDP Apartment တွင် အိမ်မွေးတိရစ္ဆာန် ခွင့်မပြုပါ",
  },
  cooking: {
    en: "Light cooking is possible — each room has a fridge and kettle. A communal area with a microwave is available. Open flame cooking is not permitted.",
    th: "ปรุงอาหารเบาๆ ได้ แต่ละห้องมีตู้เย็นและกาน้ำร้อน มีไมโครเวฟในพื้นที่ส่วนกลาง ห้ามใช้เตาแก๊สหรือไฟฟ้าแรงสูง",
    my: "အစားအစာ ပေါ့ပေါ့ပါးပါး ချက်ပြုတ်နိုင်သည် — ခန်းတိုင်းတွင် ရေခဲသေတ္တာနှင့် ရေနွေးအိုးရှိသည်။ မိုက်ခရိုဝေ့ဗ် ပြင်ပဧရိယာတွင်ရှိသည်။ ဓာတ်ငွေ့မီးဖိုသုံးခွင့်မပြုပါ",
  },
  elevator: {
    en: "The building has stairs between floors. No elevator — rooms are on floors 2–4 which are easily accessible.",
    th: "อาคารมีบันได ไม่มีลิฟต์ แต่ชั้น 2–4 เดินขึ้นง่าย",
    my: "အဆောက်အအုံတွင် လှေကားသာရှိသည်။ ဓာတ်လှေကားမရှိ — ခန်းများသည် ၂–၄ ထပ်တွင်ရှိပြီး အလွယ်တကူ တက်နိုင်သည်",
  },
  cleaning: {
    en: "Rooms are self-managed. Cleaning supplies and mops are available in common areas. Monthly room checks are done by staff.",
    th: "ดูแลทำความสะอาดห้องเองได้ มีอุปกรณ์ทำความสะอาดให้ในพื้นที่ส่วนกลาง ทีมงานตรวจห้องรายเดือน",
    my: "ခန်းကို ကိုယ်တိုင်ဆောင်ရွက်ပါ။ ပြင်ပဧရိယာတွင် သန့်ရှင်းရေးပစ္စည်းများ ရှိသည်။ ဝန်ထမ်းများ လတစ်ကြိမ် စစ်ဆေးသည်",
  },

  // Nearby places (San Kamphaeng, Chiang Mai ~15 km east of city centre)
  nearby: {
    en: [
      "🏪 7-Eleven convenience store — 2 min walk",
      "🛒 Lotus's (Tesco) San Kamphaeng — 5 min by motorbike (~2 km)",
      "🏬 Makro San Kamphaeng — 10 min by car (~4 km)",
      "🏥 San Kamphaeng Hospital — 5 min by car (~3 km)",
      "🌅 San Kamphaeng morning market — 3 min by motorbike (opens 5–9 AM)",
      "🍜 Local restaurants and street food on the main road — 2–5 min walk",
      "⛽ PTT gas station — 3 min walk",
      "🏫 San Kamphaeng School — 5 min by motorbike",
      "🏙 Chiang Mai city centre — ~20 min by car (15 km via Highway 1317)",
      "✈️ Chiang Mai International Airport — ~25 min by car (20 km)",
    ],
    th: [
      "🏪 7-Eleven — เดิน 2 นาที",
      "🛒 โลตัส สาขาสันกำแพง — มอเตอร์ไซค์ 5 นาที (~2 กม.)",
      "🏬 แม็คโคร สันกำแพง — รถยนต์ 10 นาที (~4 กม.)",
      "🏥 โรงพยาบาลสันกำแพง — รถยนต์ 5 นาที (~3 กม.)",
      "🌅 ตลาดเช้าสันกำแพง — มอเตอร์ไซค์ 3 นาที (เปิด 05.00–09.00 น.)",
      "🍜 ร้านอาหารและอาหารริมถนน — เดิน 2–5 นาที",
      "⛽ ปั๊ม PTT — เดิน 3 นาที",
      "🏫 โรงเรียนสันกำแพง — มอเตอร์ไซค์ 5 นาที",
      "🏙 ตัวเมืองเชียงใหม่ — รถยนต์ ~20 นาที (15 กม. ทางหลวง 1317)",
      "✈️ ท่าอากาศยานเชียงใหม่ — รถยนต์ ~25 นาที (20 กม.)",
    ],
    my: [
      "🏪 7-Eleven — လမ်းလျှောက် ၂ မိနစ်",
      "🛒 Lotus's San Kamphaeng — ဆိုင်ကယ် ၅ မိနစ် (~2 km)",
      "🏬 Makro San Kamphaeng — ကား ၁၀ မိနစ် (~4 km)",
      "🏥 San Kamphaeng ဆေးရုံ — ကား ၅ မိနစ် (~3 km)",
      "🌅 San Kamphaeng မနက်ဈေး — ဆိုင်ကယ် ၃ မိနစ် (မနက် ၅–၉ နာရီ)",
      "🍜 ဒေသနယ်စာနှင့် လမ်းဘေးဆိုင်များ — လမ်းလျှောက် ၂–၅ မိနစ်",
      "⛽ PTT ဆီဆိုင် — လမ်းလျှောက် ၃ မိနစ်",
      "🏫 San Kamphaeng ကျောင်း — ဆိုင်ကယ် ၅ မိနစ်",
      "🏙 ချင်းမိုင်မြို့ — ကား ~၂၀ မိနစ် (15 km)",
      "✈️ ချင်းမိုင်လေဆိပ် — ကား ~၂၅ မိနစ် (20 km)",
    ],
  },
};

// ─── Q&A rules ─────────────────────────────────────────────────────────
type QA = { patterns: RegExp[]; answer: (l: BotLanguage) => string };

const qa: QA[] = [
  // Greetings
  {
    patterns: [/^(hello|hi|hey|yo|howdy|สวัสดี|မင်္ဂလာ|ဟလို|ဟေ)/i],
    answer: (l) => ({
      en: "Hello! 👋 Welcome to SDDP Apartment. Ask me anything about rooms, prices, facilities, or the area around us.",
      th: "สวัสดีครับ! 👋 ยินดีต้อนรับสู่ SDDP Apartment ถามเรื่องห้องพัก ราคา สิ่งอำนวยความสะดวก หรือสถานที่รอบข้างได้เลย",
      my: "မင်္ဂလာပါ! 👋 SDDP Apartment မှ ကြိုဆိုပါသည်။ ခန်း၊ ဈေးနှုန်း၊ ဝန်ဆောင်မှု သို့မဟုတ် ပတ်ဝန်းကျင်အကြောင်း မေးနိုင်ပါသည်။",
    }[l]),
  },

  // Price / cost
  {
    patterns: [/price|cost|rate|how much|fee|charge|vip|ราคา|ค่าเช่า|ค่าห้อง|ห้อง vip|ဈေးနှုန်|ဘယ်လောက်|VIP/i],
    answer: (l) => ({
      en: `Standard room: ${K.monthly}/month · Daily: ${K.daily}\nVIP room: ${K.vip}/month\nDeposit: ${K.deposit}\nOffer: ${K.promotion}`,
      th: `ห้องมาตรฐาน: ${K.monthly}/เดือน · รายวัน: ${K.daily}\nห้อง VIP: ${K.vip}/เดือน\nมัดจำ: 50% (มาตรฐาน ฿2,000 / VIP ฿4,000)\nโปรโมชัน: ${K.promotion}`,
      my: `Standard ခန်း: ${K.monthly}/လ · နေ့စဉ်: ${K.daily}\nVIP ခန်း: ${K.vip}/လ\nအာမခံ: ${K.deposit}\nကမ်းလှမ်းချက်: ${K.promotion}`,
    }[l]),
  },

  // Deposit & payment
  {
    patterns: [/deposit|pay|payment|document|id|passport|fraud|scam|มัดจำ|จ่าย|เอกสาร|พาสปอร์ต|โกง|အာမခံ|ပေးဆောင်|နိုင်ငံကူး|လိမ်/i],
    answer: (l) => K.depositPolicy[l],
  },

  // Promotion / discount
  {
    patterns: [/promo|discount|offer|special|deal|โปร|ส่วนลด|ลด|ကမ်းလှမ်း|လျှော့/i],
    answer: (l) => ({
      en: `Current offer: ${K.promotion} 🎉`,
      th: `โปรโมชันปัจจุบัน: ${K.promotion} 🎉`,
      my: `လက်ရှိကမ်းလှမ်းချက်: ${K.promotion} 🎉`,
    }[l]),
  },

  // Washing machine / laundry
  {
    patterns: [/wash|laundry|washing machine|เครื่องซัก|ซักผ้า|ซักรีด|လျှော်/i],
    answer: (l) => K.washing[l],
  },

  // Wi-Fi / internet
  {
    patterns: [/wifi|wi-fi|internet|wireless|network|อินเทอร์เน็ต|ไวไฟ|အင်တာနက်|ဝိုင်ဖိုင်/i],
    answer: (l) => K.wifi[l],
  },

  // Parking
  {
    patterns: [/park|parking|car|motorbike|bike|vehicle|จอดรถ|ที่จอด|รถ|ပါကင်|ကား|ဆိုင်ကယ်/i],
    answer: (l) => K.parking[l],
  },

  // Keycard / security
  {
    patterns: [/key|keycard|card|access|lock|door|คีย์|กุญแจ|ประตู|ความปลอดภัย|ကီး|တံခါး|လုံခြုံ/i],
    answer: (l) => l === "en" ? `${K.keycard.en}\n\n${K.security.en}` : l === "th" ? `${K.keycard.th}\n\n${K.security.th}` : `${K.keycard.my}\n\n${K.security.my}`,
  },

  // TM30 / immigration / foreigner / visa
  {
    patterns: [/tm.?30|immigration|visa|foreigner|foreign|เอกสาร|ต่างชาติ|วีซ่า|TM30|နိုင်ငံခြား|ဗီဇာ|TM/i],
    answer: (l) => K.tm30[l],
  },

  // Air conditioning / electricity
  {
    patterns: [/air.?con|ac\b|a\.c|cooling|electric|bill|unit|แอร์|ค่าไฟ|ไฟฟ้า|AC|လေ| လျှပ်စစ်/i],
    answer: (l) => K.ac[l],
  },

  // Water bill
  {
    patterns: [/water|ค่าน้ำ|น้ำ|ရေ/i],
    answer: (l) => K.water[l],
  },

  // Fridge / refrigerator
  {
    patterns: [/fridge|refrigerator|ตู้เย็น|ရေခဲသေတ္တာ/i],
    answer: (l) => K.fridge[l],
  },

  // Hot water / shower
  {
    patterns: [/hot water|shower|hot|น้ำอุ่น|ฝักบัว|ရေပူ|ချိုး/i],
    answer: (l) => K.hotWater[l],
  },

  // Cooking / kitchen
  {
    patterns: [/cook|kitchen|microwave|kettle|gas|stove|ครัว|ปรุง|ทำอาหาร|ချက်|မီးဖိုချောင်/i],
    answer: (l) => K.cooking[l],
  },

  // Elevator / lift / stairs
  {
    patterns: [/elevator|lift|stairs|floor|ลิฟต์|บันได|ชั้น|ဓာတ်လှေကား|လှေကား|ထပ်/i],
    answer: (l) => K.elevator[l],
  },

  // Cleaning / housekeeping
  {
    patterns: [/clean|housekeep|maid|สะอาด|ทำความสะอาด|แม่บ้าน|သန့်ရှင်း|သုတ်/i],
    answer: (l) => K.cleaning[l],
  },

  // Pets
  {
    patterns: [/pet|dog|cat|animal|สัตว์|หมา|แมว|တိရစ္ဆာန်|ခွေး|ကြောင်/i],
    answer: (l) => K.pets[l],
  },

  // Contract / minimum stay / extension
  {
    patterns: [/contract|minimum|min stay|extend|renew|สัญญา|ขั้นต่ำ|ต่อสัญญา|စာချုပ်|အနည်းဆုံး|တိုး/i],
    answer: (l) => K.contract[l],
  },

  // Early checkout / cancellation
  {
    patterns: [/cancel|early|check.?out early|ยกเลิก|ออกก่อน|ဖျက်သိမ်|ကြိုထွက်/i],
    answer: (l) => K.earlyCheckout[l],
  },

  // Check-in / check-out time
  {
    patterns: [/check.?in|check.?out|arrive|arrival|time|เช็คอิน|เช็คเอาต์|เวลา|ချက်အင်|ချက်အောက်|ရောက်ချိန်/i],
    answer: (l) => K.checkIn[l],
  },

  // Room types / features / amenities
  {
    patterns: [/room type|vip|standard|what.*(room|include)|furni|amenity|feature|ประเภท|ห้อง vip|ห้องมี|เฟอร์นิเจอร์|ခန်းအမျိုးအစား|ဘာပါ/i],
    answer: (l) => K.roomTypes[l],
  },

  // Available rooms / floors
  {
    patterns: [/available|vacant|empty|floor|how many room|ห้องว่าง|จำนวน|ชั้น|ว่างไหม|အခန်းလွတ်|ဘယ်နှခန်|ထပ်/i],
    answer: (l) => ({
      en: `SDDP has ${K.totalRooms} rooms on ${K.floors}. Check live availability on this page — it updates every 30 seconds.`,
      th: `SDDP มีทั้งหมด ${K.totalRooms} ห้อง บน${K.floors} ตรวจสอบห้องว่างสดได้บนหน้านี้ อัปเดตทุก 30 วินาที`,
      my: `SDDP တွင် ${K.totalRooms} ခန်းရှိသည် — ${K.floors}။ ဤစာမျက်နှာတွင် အခန်းလွတ်ကို တိုက်ရိုက်ကြည့်နိုင်သည် (30 စက္ကန့်တိုင်း အပ်ဒိတ်)`,
    }[l]),
  },

  // Nearby places / location / surroundings
  {
    patterns: [/near|close|around|market|hospital|lotus|makro|7.?eleven|convenience|airport|chiang mai|food|restaurant|distance|ใกล้|ตลาด|โรงพยาบาล|ร้านอาหาร|ระยะ|ห่าง|ရှိ|နီး|ဈေး|ဆေးရုံ|ခရီးလမ်း/i],
    answer: (l) => ({
      en: `Here's what's around SDDP Apartment:\n\n${K.nearby.en.join("\n")}`,
      th: `สถานที่รอบข้าง SDDP Apartment:\n\n${K.nearby.th.join("\n")}`,
      my: `SDDP Apartment ပတ်ဝန်းကျင်တွင် ရှိသောနေရာများ:\n\n${K.nearby.my.join("\n")}`,
    }[l]),
  },

  // Address / location / map / directions
  {
    patterns: [/address|location|where|map|direction|how to get|find|ที่อยู่|ที่ตั้ง|แผนที่|เส้นทาง|လိပ်စာ|နေရာ|မြေပုံ|လမ်းကြောင်း/i],
    answer: (l) => ({
      en: `${K.address}\n\nWe're in San Kamphaeng district, about 15 km east of Chiang Mai city centre.\n👉 Google Maps: https://maps.app.goo.gl/L2Vm3riBiPHxG4d2A`,
      th: `${K.address}\n\nเราอยู่ในอำเภอสันกำแพง ห่างจากตัวเมืองเชียงใหม่ประมาณ 15 กม. ทางทิศตะวันออก\n👉 Google Maps: https://maps.app.goo.gl/L2Vm3riBiPHxG4d2A`,
      my: `${K.address}\n\nSan Kamphaeng ခရိုင်တွင်ရှိပြီး ချင်းမိုင်မြို့ပြင်မှ ၁၅ km အရှေ့ဘက်တွင်ရှိသည်။\n👉 Google Maps: https://maps.app.goo.gl/L2Vm3riBiPHxG4d2A`,
    }[l]),
  },

  // Booking / inquiry / reservation
  {
    patterns: [/book|reserv|inquiry|inquire|how to.*(stay|rent)|สอบถาม|จอง|ต้องการ|မှာ|ကြိုတင်|မေးမြန်|ငှါး/i],
    answer: (l) => ({
      en: `You can book by:\n1. Filling the inquiry form on this page (scroll down to the Inquiry section)\n2. Chatting on Line @${K.line}\n3. Calling ${K.phone[0]}\n\nThe team will confirm your room and dates directly.`,
      th: `จองได้หลายช่องทาง:\n1. กรอกแบบฟอร์มสอบถามในหน้านี้ (เลื่อนลงไปที่ส่วน "สอบถาม")\n2. แชท Line @${K.line}\n3. โทร ${K.phone[0]}\n\nทีมงานจะยืนยันห้องและวันที่ให้โดยตรง`,
      my: `ကြိုတင်မှာကြားနည်း:\n1. ဤစာမျက်နှာ မေးမြန်းဖောင် ဖြည့်ပါ (Inquiry အပိုင်းသို့ ဆင်းပါ)\n2. Line @${K.line} မှ ဆက်သွယ်ပါ\n3. ${K.phone[0]} ကို ခေါ်ဆိုပါ\n\nအဖွဲ့က ခန်းနှင့် ရက်စွဲကို တိုက်ရိုက် အတည်ပြုပေးပါမည်`,
    }[l]),
  },

  // Contact / phone / Line
  {
    patterns: [/contact|phone|call|line|whatsapp|reach|get in touch|ติดต่อ|โทร|ไลน์|ဆက်သွယ်|ဖုန်း|Line/i],
    answer: (l) => ({
      en: `📞 ${K.phone[0]} / ${K.phone[1]}\n💬 Line: @${K.line}\n📘 Facebook: ${K.facebook}`,
      th: `📞 ${K.phone[0]} / ${K.phone[1]}\n💬 Line: @${K.line}\n📘 Facebook: ${K.facebook}`,
      my: `📞 ${K.phone[0]} / ${K.phone[1]}\n💬 Line: @${K.line}\n📘 Facebook: ${K.facebook}`,
    }[l]),
  },
];

// ─── Fallback — show Line contact ──────────────────────────────────────
const fallback: Record<BotLanguage, (line: string) => string> = {
  en: (line) => `I'm not sure about that one 🙏 For a direct answer, chat with our team on Line:\n\n💬 @${line}\n📞 ${K.phone[0]}\n\nWe're happy to help!`,
  th: (line) => `ขอโทษที ไม่แน่ใจในเรื่องนั้น 🙏 สำหรับคำตอบตรงๆ ติดต่อทีมงานเราทาง Line:\n\n💬 @${line}\n📞 ${K.phone[0]}`,
  my: (line) => `ထိုကိစ္စနှင့်ပတ်သက်၍ မသေချာပါ 🙏 တိုက်ရိုက်အဖြေရရှိရန် Line မှ ဆက်သွယ်ပါ:\n\n💬 @${line}\n📞 ${K.phone[0]}`,
};

export function botReply(text: string, lang: BotLanguage, lineId: string): string {
  const q = text.trim();
  if (!q) return "";
  const footer = `\n\n💬 @${lineId}\n📞 ${K.phone[0]}`;
  for (const item of qa) {
    if (item.patterns.some((p) => p.test(q))) {
      return item.answer(lang) + footer;
    }
  }
  return fallback[lang](lineId);
}

export const botGreeting: Record<BotLanguage, string> = {
  en: "Hi! 👋 I'm the SDDP assistant. Ask me about rooms, prices, Wi-Fi, parking, washing machines, nearby places — anything!",
  th: "สวัสดี! 👋 ฉันคือผู้ช่วย SDDP ถามเรื่องห้อง ราคา Wi-Fi ที่จอดรถ เครื่องซักผ้า สถานที่ใกล้เคียง ได้เลย!",
  my: "မင်္ဂလာပါ! 👋 ကျွန်ုပ်သည် SDDP အကူအညီပေးသူဖြစ်သည်။ ခန်း၊ ဈေးနှုန်း၊ Wi-Fi၊ ပါကင်၊ လျှော်စက်၊ အနီးနားနေရာများ — မည်သည့်မေးခွန်းမဆို မေးနိုင်ပါသည်!",
};
