"use client";
import "@rainbow-me/rainbowkit/styles.css";

import {
  getDefaultWallets,
  RainbowKitProvider,
  darkTheme,
  midnightTheme,
} from "@rainbow-me/rainbowkit";
import { chain, configureChains, createClient, WagmiConfig } from "wagmi";
import { infuraProvider } from "wagmi/providers/infura";
import WagmiProvider from "./WagmiProvider";
import merge from "lodash.merge";

type ProviderType = { children: React.ReactNode };

const { chains, provider } = configureChains(
  [chain.goerli],
  [
    infuraProvider({
      apiKey: process.env.NEXT_PUBLIC_INFURA_API_KEY,
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
