import type { Metadata } from "next";
import { Providers } from "@/components/Providers";
import "../css/globals.css";

export const metadata: Metadata = {
  title: "Sub-Based Internet",
  description: "Wi-Fi subscription management platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
