import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "./components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Aphelion Photon",
  description: "AI Knowledge Base Chatbot",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex h-screen overflow-hidden bg-gray-50`}>
        <Sidebar />
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}
