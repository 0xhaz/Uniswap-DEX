import "@rainbow-me/rainbowkit/styles.css";

import {
  getDefaultWallets,
  RainbowKitProvider,
  darkTheme,
  midnightTheme,
} from "@rainbow-me/rainbowkit";
import {
  Chain,
  chain,
  configureChains,
  createClient,
  WagmiConfig,
} from "wagmi";
import { infuraProvider } from "wagmi/providers/infura";
import { localhost, sepolia, hardhat } from "wagmi/chains";
import merge from "lodash.merge";
import { publicProvider } from "wagmi/providers/public";

type WagmiProviderProps = {
  children: React.ReactNode;
};

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
  [localFork, sepolia],

  [
    publicProvider(),
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
