"use client";
import { ethers, providers } from "ethers";
import { createContext, useContext } from "react";
import { CONTRACTS } from "../constants/constants";
import { getProvider } from "wagmi/actions";
import { useAccount, useContract, useProvider, useSigner } from "wagmi";

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

type Contract = Record<string, any> | null;

export type ContractContextValue = {
  usdtContract: Contract;
  usdcContract: Contract;
  linkContract: Contract;
  rTokenContract: Contract;
  wethContract: Contract;
  swapPairContract: Contract;
  swapRouterContract: Contract;
  swapFactoryContract: Contract;
  stakingContract: Contract;
  stakingFactoryContract: Contract;
  stakingRouterContract: Contract;
  lendingPoolContract: Contract;
  lendingPoolFactoryContract: Contract;
  lendingPoolRouterContract: Contract;
  provider: providers.Provider | null;
};

type ContractProviderProps = {
  children: JSX.Element;
};

export const ContractContext = createContext<ContractContextValue>({
  usdtContract: null,
  usdcContract: null,
  linkContract: null,
  rTokenContract: null,
  wethContract: null,
  swapPairContract: null,
  swapRouterContract: null,
  swapFactoryContract: null,
  stakingContract: null,
  stakingFactoryContract: null,
  stakingRouterContract: null,
  lendingPoolContract: null,
  lendingPoolFactoryContract: null,
  lendingPoolRouterContract: null,
  provider: null,
});

export const ContractProvider = ({ children }: ContractProviderProps) => {
  const provider = getProvider();
  const { data: signer } = useSigner();

  const usdtContract = useContract({
    address: usdt.address,
    abi: usdtAbi,
    signerOrProvider: signer || provider,
  });

  const usdcContract = useContract({
    address: usdc.address,
    abi: usdcAbi,
    signerOrProvider: signer || provider,
  });

  const linkContract = useContract({
    address: link.address,
    abi: linkAbi,
    signerOrProvider: signer || provider,
  });

  const rTokenContract = useContract({
    address: rToken.address,
    abi: rTokenAbi,
    signerOrProvider: signer || provider,
  });

  const wethContract = useContract({
    address: weth.address,
    abi: wethAbi,
    signerOrProvider: signer || provider,
  });

  const swapPairContract = useContract({
    address: swapPair.address,
    abi: swapPairAbi,
    signerOrProvider: signer || provider,
  });

  const swapRouterContract = useContract({
    address: swapRouter.address,
    abi: swapRouterAbi,
    signerOrProvider: signer || provider,
  });

  const swapFactoryContract = useContract({
    address: swapFactory.address,
    abi: swapFactoryAbi,
    signerOrProvider: signer || provider,
  });

  const stakingContract = useContract({
    address: staking.address,
    abi: stakingAbi,
    signerOrProvider: signer || provider,
  });

  const stakingFactoryContract = useContract({
    address: stakingFactory.address,
    abi: stakingFactoryAbi,
    signerOrProvider: signer || provider,
  });

  const stakingRouterContract = useContract({
    address: stakingRouter.address,
    abi: stakingRouterAbi,
    signerOrProvider: signer || provider,
  });

  const lendingPoolContract = useContract({
    address: lendingPool.address,
    abi: lendingPoolAbi,
    signerOrProvider: signer || provider,
  });

  const lendingPoolFactoryContract = useContract({
    address: lendingPoolFactory.address,
    abi: lendingPoolFactoryAbi,
    signerOrProvider: signer || provider,
  });

  const lendingPoolRouterContract = useContract({
    address: lendingPoolRouter.address,
    abi: lendingPoolRouterAbi,
    signerOrProvider: signer || provider,
  });

  return (
    <ContractContext.Provider
      value={{
        usdtContract,
        usdcContract,
        linkContract,
        rTokenContract,
        wethContract,
        swapPairContract,
        swapRouterContract,
        swapFactoryContract,
        stakingContract,
        stakingFactoryContract,
        stakingRouterContract,
        lendingPoolContract,
        lendingPoolFactoryContract,
        lendingPoolRouterContract,
        provider,
      }}
    >
      {children}
    </ContractContext.Provider>
  );
};

export const useContractContext = () => useContext(ContractContext);
