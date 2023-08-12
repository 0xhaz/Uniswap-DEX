import "@rainbow-me/rainbowkit/styles.css";

import {
  getDefaultWallets,
  RainbowKitProvider,
  darkTheme,
  midnightTheme,
} from "@rainbow-me/rainbowkit";
import { chain, configureChains, createClient, WagmiConfig } from "wagmi";
import { infuraProvider } from "wagmi/providers/infura";
import merge from "lodash.merge";

type WagmiProviderProps = {
  children: React.ReactNode;
};

const { chains, provider } = configureChains(
  [chain.goerli],
  [
    infuraProvider({
      apiKey: process.env.NEXT_PUBLIC_INFURA_API_KEY,
    }),
  ]
);

const { connectors } = getDefaultWallets({
  appName: "UniswapV3 DEX",
  chains,
});

const wagmiClient = createClient({
  autoConnect: false,
  connectors,
  provider,
});

const WagmiProvider = ({ children }: WagmiProviderProps) => {
  return (
    <>
      <WagmiConfig client={wagmiClient}>{children} </WagmiConfig>
    </>
  );
};

export default WagmiProvider;
