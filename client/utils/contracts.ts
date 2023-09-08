import { CONTRACTS } from "../app/constants/constants";
import { ethers, providers } from "ethers";

const usdt = CONTRACTS.USDT;
const usdtAbi = CONTRACTS.USDT.abi;
const usdc = CONTRACTS.USDC;
const usdcAbi = CONTRACTS.USDC.abi;
const link = CONTRACTS.LINK;
const linkAbi = CONTRACTS.LINK.abi;
const rToken = CONTRACTS.RTOKEN;
const rTokenAbi = CONTRACTS.RTOKEN.abi;
const weth = CONTRACTS.WETH;
const wethAbi = CONTRACTS.WETH.abi;
const swapPair = CONTRACTS.SWAP_PAIR_TOKENS;
const swapPairAbi = CONTRACTS.SWAP_PAIR_TOKENS.abi;
const swapRouter = CONTRACTS.SWAP_ROUTER;
const swapRouterAbi = CONTRACTS.SWAP_ROUTER.abi;
const swapFactory = CONTRACTS.SWAP_FACTORY;
const swapFactoryAbi = CONTRACTS.SWAP_FACTORY.abi;
const staking = CONTRACTS.STAKING;
const stakingAbi = CONTRACTS.STAKING.abi;
const stakingFactory = CONTRACTS.STAKING_FACTORY;
const stakingFactoryAbi = CONTRACTS.STAKING_FACTORY.abi;
const stakingRouter = CONTRACTS.STAKING_ROUTER;
const stakingRouterAbi = CONTRACTS.STAKING_ROUTER.abi;
const lendingPool = CONTRACTS.LENDING_POOL;
const lendingPoolAbi = CONTRACTS.LENDING_POOL.abi;
const lendingPoolFactory = CONTRACTS.LENDING_POOL_FACTORY;
const lendingPoolFactoryAbi = CONTRACTS.LENDING_POOL_FACTORY.abi;
const lendingPoolRouter = CONTRACTS.LENDING_POOL_ROUTER;
const lendingPoolRouterAbi = CONTRACTS.LENDING_POOL_ROUTER.abi;

export const tokenContractMap: Record<string, { address: string; abi: any }> = {
  USDT: { address: usdt.address, abi: usdtAbi },
  USDC: { address: usdc.address, abi: usdcAbi },
  LINK: { address: link.address, abi: linkAbi },
  RTOKEN: { address: rToken.address, abi: rTokenAbi },
  WETH: { address: weth.address, abi: wethAbi },
};

export const contractMap: Record<string, { address: string; abi: any }> = {
  swapPair: { address: swapPair.address, abi: swapPairAbi },
  swapRouter: { address: swapRouter.address, abi: swapRouterAbi },
  swapFactory: { address: swapFactory.address, abi: swapFactoryAbi },
  staking: { address: staking.address, abi: stakingAbi },
  stakingFactory: { address: stakingFactory.address, abi: stakingFactoryAbi },
  stakingRouter: { address: stakingRouter.address, abi: stakingRouterAbi },
  lendingPool: { address: lendingPool.address, abi: lendingPoolAbi },
  lendingPoolFactory: {
    address: lendingPoolFactory.address,
    abi: lendingPoolFactoryAbi,
  },
  lendingPoolRouter: {
    address: lendingPoolRouter.address,
    abi: lendingPoolRouterAbi,
  },
};

export const tokenContract = (address: string, abi: any): ethers.Contract => {
  const provider = new ethers.providers.Web3Provider(window.ethereum as any);
  const signer = provider.getSigner();
  const contract = new ethers.Contract(address, abi, signer);

  return contract;
};

export const contract = (contractName: string): ethers.Contract => {
  const contractInfo = contractMap[contractName as keyof typeof contractMap];
  if (!contractInfo) {
    throw new Error(`Contract ${contractName} not supported`);
  }

  const provider = new ethers.providers.Web3Provider(window.ethereum as any);
  const signer = provider.getSigner();
  const signerOrProvider = signer || provider;
  const contract = new ethers.Contract(
    contractInfo.address,
    contractInfo.abi,
    signerOrProvider
  );

  return contract;
};

export const wethContract = () => {
  const provider = new ethers.providers.Web3Provider(window.ethereum as any);
  const signer = provider.getSigner();
  const contract = new ethers.Contract(weth.address, wethAbi, signer);

  return contract;
};
