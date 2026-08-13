import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Scout – Multi-Source Video Search",
  description: "Search and filter videos across multiple platforms including YouTube, Reddit, and Internet Archive using your own criteria.",
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