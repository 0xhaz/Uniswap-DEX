"use client";
import "@rainbow-me/rainbowkit/styles.css";

import {
  getDefaultWallets,
  RainbowKitProvider,
  darkTheme,
  midnightTheme,
} from "@rainbow-me/rainbowkit";
import { Chain, configureChains, createClient, WagmiConfig } from "wagmi";
import { infuraProvider } from "wagmi/providers/infura";
import { localhost, sepolia, hardhat } from "wagmi/chains";
import { publicProvider } from "wagmi/providers/public";
import WagmiProvider from "./WagmiProvider";
import merge from "lodash.merge";
import { jsonRpcProvider } from "wagmi/providers/jsonRpc";

type ProviderType = { children: React.ReactNode };

const localFork: Chain = {
  id: 31337,
  name: "localhost:8545",
  network: "localhost",
  nativeCurrency: {
    decimals: 18,
    name: "localhost",
    symbol: "ETH",
  },
  rpcUrls: {
    default: "http://localhost:8545",
  },
};

const { chains, provider } = configureChains(
  [localhost, sepolia, hardhat],

  [
    publicProvider(),
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
