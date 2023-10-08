import "@rainbow-me/rainbowkit/styles.css";

import { getDefaultWallets } from "@rainbow-me/rainbowkit";
import { Chain, configureChains, createClient, WagmiConfig } from "wagmi";
import { infuraProvider } from "wagmi/providers/infura";
import { localhost, sepolia, hardhat } from "wagmi/chains";

import { publicProvider } from "wagmi/providers/public";

type WagmiProviderProps = {
  children: React.ReactNode;
};

export const { chains, provider } = configureChains(
  [localhost, sepolia, hardhat],

  [
    publicProvider(),
    infuraProvider({
      apiKey: process.env.NEXT_PUBLIC_INFURA_API_KEY || "",
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
      <WagmiConfig client={wagmiClient}>{children}</WagmiConfig>
    </>
  );
};

export default WagmiProvider;
