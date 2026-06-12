import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Firefly",
  description: "Nightlife discovery in Bucharest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
