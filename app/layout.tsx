import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "pm-os · Archetype & Heuristic Playground",
  description:
    "A live constraint solver for product heuristics. Move a user's situation and watch which behavioural rules switch on, which switch off, and which conflict.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
