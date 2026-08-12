import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Scout – Video Finder",
  description: "Search and filter videos on YouTube by your own criteria.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}