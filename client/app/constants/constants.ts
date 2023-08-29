import USDT_ADDRESS from "../contracts/USDT-address.json";
import USDC_ADDRESS from "../contracts/USDC-address.json";
import LINK_ADDRESS from "../contracts/LINK-address.json";
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
import LINK_ABI from "../contracts/LINK.json";
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

export const CONTRACTS = {
  USDT: {
    address: USDT_ADDRESS,
    abi: USDT_ABI,
  },
  USDC: {
    address: USDC_ADDRESS,
    abi: USDC_ABI,
  },
  LINK: {
    address: LINK_ADDRESS,
    abi: LINK_ABI,
  },
  RTOKEN: {
    address: RTOKEN_ADDRESS,
    abi: RTOKEN_ABI,
  },
  WETH: {
    address: WETH_ADDRESS,
    abi: WETH_ABI,
  },
  SWAP_PAIR_TOKENS: {
    address: SWAP_PAIR_TOKENS_ADDRESS,
    abi: SWAP_PAIR_TOKENS_ABI,
  },
  SWAP_ROUTER: {
    address: SWAP_ROUTER_ADDRESS,
    abi: SWAP_ROUTER_ABI,
  },
  SWAP_FACTORY: {
    address: SWAP_FACTORY_ADDRESS,
    abi: SWAP_FACTORY_ABI,
  },
  STAKING: {
    address: STAKING_ADDRESS,
    abi: STAKING_ABI,
  },
  STAKING_FACTORY: {
    address: STAKING_FACTORY_ADDRESS,
    abi: STAKING_FACTORY_ABI,
  },
  STAKING_ROUTER: {
    address: STAKING_ROUTER_ADDRESS,
    abi: STAKING_ROUTER_ABI,
  },
  LENDING_POOL: {
    address: LENDING_POOL_ADDRESS,
    abi: LENDING_POOL_ABI,
  },
  LENDING_POOL_FACTORY: {
    address: LENDING_POOL_FACTORY_ADDRESS,
    abi: LENDING_POOL_FACTORY_ABI,
  },
  LENDING_POOL_ROUTER: {
    address: LENDING_POOL_ROUTER_ADDRESS,
    abi: LENDING_POOL_ROUTER_ABI,
  },
};

export const pathLINK_USDT = [CONTRACTS.LINK.address, CONTRACTS.USDT.address];

export const pathLINK_USDC = [CONTRACTS.LINK.address, CONTRACTS.USDC.address];

export const pathLINK_WETH = [CONTRACTS.LINK.address, CONTRACTS.WETH.address];

export const pathUSDT_USDC = [CONTRACTS.USDT.address, CONTRACTS.USDC.address];

export const pathUSDT_WETH = [CONTRACTS.USDT.address, CONTRACTS.WETH.address];

export const pathUSDC_WETH = [CONTRACTS.USDC.address, CONTRACTS.WETH.address];

export const tokens = [
  {
    key: "USDT",
    name: "USDT",
    symbol: "USDT",
    address: CONTRACTS.USDT.address,
    logo: "/assets/usdt_logo.png",
  },
  {
    key: "USDC",
    name: "USDC",
    symbol: "USDC",
    address: CONTRACTS.USDC.address,
    logo: "/assets/usdc_logo.png",
  },
  {
    key: "LINK",
    name: "LINK",
    symbol: "LINK",
    address: CONTRACTS.LINK.address,
    logo: "/assets/link_logo.png",
  },
  {
    key: "WETH",
    name: "WETH",
    symbol: "WETH",
    address: CONTRACTS.WETH.address,
    logo: "/assets/eth_logo.png",
  },
];
