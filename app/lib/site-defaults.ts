export type Locale = "en" | "th" | "my";
export type SiteSettings = {
  dailyPrice: string; monthlyPrice: string; monthlyDeposit: string; promotion: string;
  phonePrimary: string; phoneSecondary: string; whatsapp: string; lineId: string;
  address: string; mapUrl: string; mapEmbedUrl: string; facebookUrl: string; parkingQuota: string;
  accentColor: string; actionColor: string; backgroundColor: string; textColor: string;
  heroImage: string; galleryHidden: string[];
  copy: Partial<Record<Locale, Record<string, string>>>;
};
export const defaultSiteSettings: SiteSettings = {
  dailyPrice: "450", monthlyPrice: "4,000", monthlyDeposit: "1 month", promotion: "Stay 10 nights, get 1 night free",
  phonePrimary: "094-293-5296", phoneSecondary: "064-504-6997", whatsapp: "+66942935296", lineId: "sddpapartment",
  address: "8/18 Moo 2, Ton Pao, San Kamphaeng, Chiang Mai 50130", mapUrl: "https://maps.app.goo.gl/L2Vm3riBiPHxG4d2A", mapEmbedUrl: "https://www.google.com/maps?q=SDDP%20Apartment%2C%208%2F18%20Moo%202%2C%20Ton%20Pao%2C%20San%20Kamphaeng%2C%20Chiang%20Mai%2050130&output=embed", facebookUrl: "https://www.facebook.com/Sddpapartment", parkingQuota: "Limited - please confirm when booking",
  accentColor: "#ffd94f", actionColor: "#ee302b", backgroundColor: "#f7f3eb", textColor: "#1b1c1d",
  heroImage: "4254e9b028ca9674.jpg", galleryHidden: [], copy: {},
};
export const publicGallery = ["01511945a4a9e2ff.jpg","1e43ed603f65076c.jpg","2c61476b3c08988e.jpg","39865d8dc140a872.jpg","4254e9b028ca9674.jpg","46192d2ad7751c6c.jpg","4d693a6c06e6830a.jpg","6665318f2b1bf24a.jpg","73ed1ada02ac9dbf.jpg","7cd3772aadb58a67.jpg","9686a1da62f2a212.jpg","b362e4b1fb16ecd8.jpg","cb1eb2a7ff1e3e26.jpg","dee46c31d645ed53.jpg","fd2b2bc66487aa08.jpg"];
