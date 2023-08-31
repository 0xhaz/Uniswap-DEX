import "./globals.css";
import type { Metadata } from "next";
import Providers from "./context/Providers";
import Header from "./components/header";
import { ContractProvider } from "./context";

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
          <ContractProvider>
            <div className="w-full h-screen flex flex-col items-center justify-center bg-[#2d242f]">
              <Header />

              {children}
            </div>
          </ContractProvider>
        </Providers>
      </body>
    </html>
  );
}
