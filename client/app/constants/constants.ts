import USDT_ADDRESS from "../contracts/USDT-address.json";
import USDC_ADDRESS from "../contracts/USDC-address.json";
import LINK_ADDRESS from "../contracts/Link-address.json";
import RTOKEN_ADDRESS from "../contracts/RToken-address.json";
import WETH_ADDRESS from "../contracts/WETH9-address.json";
import SWAP_PAIR_TOKENS_ADDRESS from "../contracts/SwapPairTokens-address.json";
import SWAP_ROUTER_ADDRESS from "../contracts/SwapRouter-address.json";
import SWAP_FACTORY_ADDRESS from "../contracts/SwapPairTokensFactory-address.json";
import STAKING_ADDRESS from "../contracts/StakingPool-address.json";
import STAKING_FACTORY_ADDRESS from "../contracts/StakingPoolFactory-address.json";
import STAKING_ROUTER_ADDRESS from "../contracts/StakingPoolRouter-address.json";
import LENDING_POOL_ADDRESS from "../contracts/LendingPool-address.json";
import LENDING_POOL_FACTORY_ADDRESS from "../contracts/LendingPoolFactory-address.json";
import LENDING_POOL_ROUTER_ADDRESS from "../contracts/LendingPoolRouter-address.json";

import USDT_ABI from "../contracts/USDT.json";
import USDC_ABI from "../contracts/USDC.json";
import LINK_ABI from "../contracts/Link.json";
import RTOKEN_ABI from "../contracts/RToken.json";
import WETH_ABI from "../contracts/WETH9.json";
import SWAP_PAIR_TOKENS_ABI from "../contracts/SwapPairTokens.json";
import SWAP_ROUTER_ABI from "../contracts/SwapRouter.json";
import SWAP_FACTORY_ABI from "../contracts/SwapPairTokensFactory.json";
import STAKING_ABI from "../contracts/StakingPool.json";
import STAKING_FACTORY_ABI from "../contracts/StakingPoolFactory.json";
import STAKING_ROUTER_ABI from "../contracts/StakingPoolRouter.json";
import LENDING_POOL_ABI from "../contracts/LendingPool.json";
import LENDING_POOL_FACTORY_ABI from "../contracts/LendingPoolFactory.json";
import LENDING_POOL_ROUTER_ABI from "../contracts/LendingPoolRouter.json";

type Contract = {
  [key: string]: {
    address: string;
    abi: any;
  };
};

export const CONTRACTS: Contract = {
  USDT: {
    address: USDT_ADDRESS.contractAddress,
    abi: USDT_ABI.abi,
  },
  USDC: {
    address: USDC_ADDRESS.contractAddress,
    abi: USDC_ABI.abi,
  },
  LINK: {
    address: LINK_ADDRESS.contractAddress,
    abi: LINK_ABI.abi,
  },
  RTOKEN: {
    address: RTOKEN_ADDRESS.contractAddress,
    abi: RTOKEN_ABI.abi,
  },
  WETH: {
    address: WETH_ADDRESS.contractAddress,
    abi: WETH_ABI.abi,
  },
  SWAP_PAIR_TOKENS: {
    address: SWAP_PAIR_TOKENS_ADDRESS.contractAddress,
    abi: SWAP_PAIR_TOKENS_ABI.abi,
  },
  SWAP_ROUTER: {
    address: SWAP_ROUTER_ADDRESS.contractAddress,
    abi: SWAP_ROUTER_ABI.abi,
  },
  SWAP_FACTORY: {
    address: SWAP_FACTORY_ADDRESS.contractAddress,
    abi: SWAP_FACTORY_ABI.abi,
  },
  STAKING: {
    address: STAKING_ADDRESS.contractAddress,
    abi: STAKING_ABI.abi,
  },
  STAKING_FACTORY: {
    address: STAKING_FACTORY_ADDRESS.contractAddress,
    abi: STAKING_FACTORY_ABI.abi,
  },
  STAKING_ROUTER: {
    address: STAKING_ROUTER_ADDRESS.contractAddress,
    abi: STAKING_ROUTER_ABI.abi,
  },
  LENDING_POOL: {
    address: LENDING_POOL_ADDRESS.contractAddress,
    abi: LENDING_POOL_ABI.abi,
  },
  LENDING_POOL_FACTORY: {
    address: LENDING_POOL_FACTORY_ADDRESS.contractAddress,
    abi: LENDING_POOL_FACTORY_ABI.abi,
  },
  LENDING_POOL_ROUTER: {
    address: LENDING_POOL_ROUTER_ADDRESS.contractAddress,
    abi: LENDING_POOL_ROUTER_ABI.abi,
  },
};

export const pathLINK_USDT = [CONTRACTS.LINK.address, CONTRACTS.USDT.address];
export const pathUSDT_LINK = [CONTRACTS.USDT.address, CONTRACTS.LINK.address];

export const pathLINK_USDC = [CONTRACTS.LINK.address, CONTRACTS.USDC.address];
export const pathUSDC_LINK = [CONTRACTS.USDC.address, CONTRACTS.LINK.address];

export const pathLINK_WETH = [CONTRACTS.LINK.address, CONTRACTS.WETH.address];
export const pathWETH_LINK = [CONTRACTS.WETH.address, CONTRACTS.LINK.address];

export const pathUSDT_USDC = [CONTRACTS.USDT.address, CONTRACTS.USDC.address];
export const pathUSDC_USDT = [CONTRACTS.USDC.address, CONTRACTS.USDT.address];

export const pathUSDT_WETH = [CONTRACTS.USDT.address, CONTRACTS.WETH.address];
export const pathWETH_USDT = [CONTRACTS.WETH.address, CONTRACTS.USDT.address];

export const pathUSDC_WETH = [CONTRACTS.USDC.address, CONTRACTS.WETH.address];
export const pathWETH_USDC = [CONTRACTS.WETH.address, CONTRACTS.USDC.address];

export const pathLINK_ETH = [CONTRACTS.LINK.address, CONTRACTS.WETH.address];
export const pathETH_LINK = [CONTRACTS.WETH.address, CONTRACTS.LINK.address];

export const pathUSDT_ETH = [CONTRACTS.USDT.address, CONTRACTS.WETH.address];
export const pathETH_USDT = [CONTRACTS.WETH.address, CONTRACTS.USDT.address];

export const pathUSDC_ETH = [CONTRACTS.USDC.address, CONTRACTS.WETH.address];
export const pathETH_USDC = [CONTRACTS.WETH.address, CONTRACTS.USDC.address];

export const tokenPairs: string[][] = [
  pathLINK_USDT,
  pathLINK_USDC,
  pathLINK_WETH,
  pathLINK_ETH,
  pathUSDT_USDC,
  pathUSDT_LINK,
  pathUSDC_LINK,
  pathUSDC_USDT,
  pathUSDT_WETH,
  pathUSDT_ETH,
  pathUSDC_WETH,
  pathUSDT_ETH,
  pathUSDC_ETH,
  pathWETH_LINK,
  pathWETH_USDT,
  pathWETH_USDC,
  pathETH_LINK,
  pathETH_USDT,
  pathETH_USDC,
];

export const ETH = "ETH";
export const USDT = "USDT";
export const USDC = "USDC";
export const LINK = "LINK";
export const RTOKEN = "RTOKEN";
export const WETH = "WETH";
export const COINA = "CoinA";
export const COINB = "CoinB";
export const COINC = "CoinC";
export const DEFAULT_VALUE = "Select a token";

export type TokenProps = {
  key: string;
  name: string;
  symbol?: string;
  address?: string;
  abi?: any;
  logo?: string;
};

export const tokens: TokenProps[] = [
  {
    key: "USDT",
    name: "USDT",
    symbol: "USDT",
    address: CONTRACTS.USDT.address,
    abi: CONTRACTS.USDT.abi,
    logo: "/assets/usdt_logo.png",
  },
  {
    key: "USDC",
    name: "USDC",
    symbol: "USDC",
    address: CONTRACTS.USDC.address,
    abi: CONTRACTS.USDC.abi,
    logo: "/assets/usdc_logo.png",
  },
  {
    key: "LINK",
    name: "LINK",
    symbol: "LINK",
    address: CONTRACTS.LINK.address,
    abi: CONTRACTS.LINK.abi,
    logo: "/assets/link_logo.png",
  },
  {
    key: "WETH",
    name: "WETH",
    symbol: "WETH",
    address: CONTRACTS.WETH.address,
    abi: CONTRACTS.WETH.abi,
    logo: "/assets/eth_logo.png",
  },
  {
    key: "ETH",
    name: "ETH",
    symbol: "ETH",
    address: CONTRACTS.WETH.address,
    abi: CONTRACTS.WETH.abi,
    logo: "/assets/eth_logo.png",
  },
  {
    key: DEFAULT_VALUE,
    name: DEFAULT_VALUE,
    symbol: DEFAULT_VALUE,
    address: "",
    abi: [],
    logo: "",
  },
];
