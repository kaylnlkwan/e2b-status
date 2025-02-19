import type { Metadata } from "next";
import "./globals.css";
import localFont from "next/font/local";

const ibmPlexMono = localFont({
  src: [
    {
      path: "/fonts/IBM_Plex_Mono/IBMPlexMono-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "/fonts/IBM_Plex_Mono/IBMPlexMono-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "/fonts/IBM_Plex_Mono/IBMPlexMono-Italic.ttf",
      weight: "400",
      style: "italic",
    },
  ],
  variable: "--font-ibmplexmono",
  display: "swap",
});

const ibmPlexSans = localFont({
  src: [
    {
      path: "/fonts/IBM_Plex_Sans/IBMPlexSans-VariableFont_wdth,wght.ttf",
      weight: "100 700",
      style: "normal",
    },
    {
      path: "/fonts/IBM_Plex_Sans/IBMPlexSans-Italic-VariableFont_wdth,wght.ttf",
      weight: "100 700",
      style: "italic",
    },
  ],
  variable: "--font-ibmplexsans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "E2B Status Page",
  description: "Checking the status of E2B's API endpoints",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${ibmPlexMono.variable} ${ibmPlexSans.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
