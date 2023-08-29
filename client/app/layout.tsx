import "./globals.css";
import type { Metadata } from "next";
import Providers from "./context/Providers";
import Header from "./components/header";
import SwapComponent from "./components/swapComponent";
import NavItems from "./components/navItems";

export const metadata: Metadata = {
  title: "Defi Suite",
  description: "Decentralized Exchange AMM",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="w-full h-screen flex flex-col items-center justify-center bg-[#2d242f]">
            <Header />

            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
