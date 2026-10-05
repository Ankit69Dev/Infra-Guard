import type { Metadata } from "next";
import Providers from "@/components/Providers";
import "leaflet/dist/leaflet.css";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Infra Guard",
    template: "%s | Infra Guard",
  },
  icons: {
    icon: "/logo.jpeg",
  },
  description:
    "Infra Guard is a predictive infrastructure monitoring platform for reporting, tracking, and managing public infrastructure issues.",
  applicationName: "Infra Guard",
  keywords: [
    "Infra Guard",
    "infrastructure monitoring",
    "predictive maintenance",
    "public infrastructure",
    "road maintenance",
    "bridge monitoring",
    "drainage monitoring",
    "streetlight monitoring",
    "Ranchi",
    "Jharkhand",
  ],
  authors: [{ name: "Infra Guard" }],
  creator: "Infra Guard",
  publisher: "Infra Guard",
  metadataBase: new URL("http://localhost:3000"),
  openGraph: {
    title: "Infra Guard",
    description:
      "Predictive monitoring and issue reporting for public infrastructure.",
    type: "website",
    siteName: "Infra Guard",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}