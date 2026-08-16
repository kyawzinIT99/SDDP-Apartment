import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const incoming = await headers();
  const host = incoming.get("x-forwarded-host") ?? incoming.get("host") ?? "localhost:3001";
  const protocol = incoming.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const title = "SDDP Apartment | San Kamphaeng, Chiang Mai";
  const description = "Clean daily and monthly rooms in Ton Pao, San Kamphaeng with free Wi-Fi, parking and TM30 support.";
  return { title, description, icons: { icon: "/brand-logo.jpg" }, openGraph: { title, description, type: "website", url: origin, images: [{ url: `${origin}/og.png`, width: 1734, height: 908, alt: "SDDP Apartment - Room to feel at home" }] }, twitter: { card: "summary_large_image", title, description, images: [`${origin}/og.png`] } };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en"><body>{children}</body></html>
  );
}
