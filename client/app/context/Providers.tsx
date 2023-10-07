"use client";
import "@rainbow-me/rainbowkit/styles.css";

import { RainbowKitProvider, midnightTheme } from "@rainbow-me/rainbowkit";
import { Chain, configureChains, createClient, WagmiConfig } from "wagmi";
import { infuraProvider } from "wagmi/providers/infura";
import { localhost, sepolia, hardhat } from "wagmi/chains";
import { publicProvider } from "wagmi/providers/public";
import WagmiProvider from "./WagmiProvider";
import merge from "lodash.merge";

type ProviderType = { children: React.ReactNode };

const { chains, provider } = configureChains(
  [localhost, sepolia, hardhat],

  [
    publicProvider(),
    infuraProvider({
      apiKey: process.env.NEXT_PUBLIC_INFURA_API_KEY || "",
    }),
  ]
);

const myTheme = merge(midnightTheme(), {
  colors: {
    accentColor: "#18181b",
    accentColorForeground: "#fff",
  },
});

const Providers = ({ children }: ProviderType) => {
  return (
    <WagmiProvider>
      <RainbowKitProvider chains={chains} theme={myTheme}>
        {children}
      </RainbowKitProvider>
    </WagmiProvider>
  );
};

export default Providers;
