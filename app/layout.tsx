import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "pm-os · PM Interview & Career OS",
    template: "%s · pm-os",
  },
  description:
    "Question types, concepts, frameworks and company rubrics for PM interviews — with the research checked and the caveats attached. Plus interviewer guides: probes, signal checklists and bias guards.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
