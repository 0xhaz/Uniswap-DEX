import "./globals.css";
import type { Metadata } from "next";
import Providers from "./context/Providers";
import Header from "./components/header";

export const metadata: Metadata = {
  title: "UniswapV3 DEX",
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
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
