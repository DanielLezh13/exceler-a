import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const metadataBase = new URL(`${protocol}://${host}`);
  const title = "Exceler A — Self-Directed Academic Learning";
  const description = "A self-directed Brooklyn College computer science and mathematics curriculum with lessons, code-first practice, mastery testing, persistent progress, DegreeWorks mapping, and an AI tutor.";

  return {
    metadataBase,
    title,
    description,
    icons: {
      icon: "/exceler-a-icon-concept.png",
      shortcut: "/exceler-a-icon-concept.png",
    },
    openGraph: {
      title,
      description,
      type: "website",
      images: [{ url: "/og.png", width: 1280, height: 720, alt: "Exceler A self-directed academic learning" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og.png"],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
