import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    template: "%s | MediSynx EHR",
    default: "MediSynx EHR | Smart Records. Better Care.",
  },
  description:
    "MediSynx EHR — Next-generation Electronic Health Records platform designed for modern medical practices, outpatient care, and virtual telehealth.",
  keywords: ["MediSynx EHR", "electronic health records", "medical records", "telehealth", "smart records"],
  icons: {
    icon: "/images/image.png",
    shortcut: "/images/image.png",
    apple: "/images/image.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-[#F8FAFC] text-[#0F172A]`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
