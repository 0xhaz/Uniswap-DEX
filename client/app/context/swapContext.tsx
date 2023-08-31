"use client";
import { useContext, useCallback, createContext, useState } from "react";
import { BigNumber, ethers, providers } from "ethers";

import { useContractContext } from "./index";

interface SwapContextProps {
  swapExactAmountOfTokens: (amountIn: string, path: string[]) => Promise<void>;
  swapTokensForExactAmount: (
    amountOut: string,
    path: string[]
  ) => Promise<void>;
  swapExactAmountOfEthForTokens: (
    amountIn: string,
    path: string[]
  ) => Promise<void>;
  swapEthForExactAmountOfTokens: (
    amountOut: string,
    path: string[]
  ) => Promise<void>;
  swapTokensForExactAmountOfEth: (
    amountOut: string,
    path: string[],
    amountIn: string
  ) => Promise<void>;
  swapExactAmountOfTokensForEth: (
    amountIn: string,
    path: string[]
  ) => Promise<void>;
  getReserves: (tokenA: string, tokenB: string) => Promise<void>;
  getAmountOut: (
    amountA: string,
    reserveA: string,
    reserveB: string
  ) => Promise<void>;
  getAmountIn: (
    amountB: string,
    reserveA: string,
    reserveB: string
  ) => Promise<void>;
}

export const SwapContext = createContext<SwapContextProps>({
  swapExactAmountOfTokens: async () => {},
  swapTokensForExactAmount: async () => {},
  swapExactAmountOfEthForTokens: async () => {},
  swapEthForExactAmountOfTokens: async () => {},
  swapTokensForExactAmountOfEth: async () => {},
  swapExactAmountOfTokensForEth: async () => {},
  getReserves: async () => {},
  getAmountOut: async () => {},
  getAmountIn: async () => {},
});

export type SwapProviderProps = {
  children: React.ReactNode;
};

const getDeadline = () => {
  const date = new Date();
  const timestamp = Math.floor(date.getTime() / 1000);
  const deadline = timestamp + 600;
  return deadline;
};

export const SwapProvider = ({ children }: SwapProviderProps) => {
  const [reserveA, setReserveA] = useState<string | number>(0);
  const [reserveB, setReserveB] = useState<string | number>(0);
  const [amountIn, setAmountIn] = useState<string | number>(0);
  const [amountOut, setAmountOut] = useState<string | number>(0);
  const [amountOne, setAmountOne] = useState<string | number>(0);
  const [amountTwo, setAmountTwo] = useState<string | number>(0);

  const { swapRouterContract } = useContractContext();

  let address: string | null = null;

  const swapExactAmountOfTokens = useCallback(
    async (amountIn: string, path: string[]) => {
      try {
        if (amountIn) {
          const deadline = getDeadline();
          const tx = await swapRouterContract?.swapExactTokensForTokens(
            ethers.utils.parseEther(amountIn),
            1,
            path,
            address,
            deadline
          );
          await tx?.wait();
        }
      } catch (error) {
        console.error(error);
      }
    },
    [swapRouterContract, address]
  );

  const swapTokensForExactAmount = useCallback(
    async (amountOut: string, path: string[]) => {
      try {
        if (amountOut) {
          const deadline = getDeadline();
          const tx = await swapRouterContract?.swapTokensForExactTokens(
            ethers.utils.parseEther(amountOut),
            1,
            path,
            address,
            deadline
          );
          await tx?.wait();
        }
      } catch (error) {
        console.error(error);
      }
    },
    [swapRouterContract, address]
  );

  const swapExactAmountOfEthForTokens = useCallback(
    async (amountIn: string, path: string[]) => {
      try {
        if (amountIn) {
          const deadline = getDeadline();
          const tx = await swapRouterContract?.swapExactETHForTokens(
            1,
            path,
            address,
            deadline,
            { value: ethers.utils.parseEther(amountIn) }
          );
          await tx?.wait();
        }
      } catch (error) {
        console.error(error);
      }
    },
    [swapRouterContract, address]
  );

  const swapEthForExactAmountOfTokens = useCallback(
    async (amountOut: string, path: string[]) => {
      try {
        if (amountOut) {
          const deadline = getDeadline();
          const tx = await swapRouterContract?.swapETHForExactTokens(
            ethers.utils.parseEther(amountOut),
            path,
            address,
            deadline
          );
          await tx?.wait();
        }
      } catch (error) {
        console.error(error);
      }
    },
    [swapRouterContract, address]
  );

  const swapTokensForExactAmountOfEth = useCallback(
    async (amountOut: string, path: string[], amountIn: string) => {
      try {
        if (amountOut) {
          const deadline = getDeadline();
          const tx = await swapRouterContract?.swapTokensForExactETH(
            ethers.utils.parseEther(amountOut),
            ethers.utils.parseEther(amountIn),
            path,
            address,
            deadline
          );
          await tx?.wait();
        }
      } catch (error) {
        console.error(error);
      }
    },
    [swapRouterContract, address]
  );

  const swapExactAmountOfTokensForEth = useCallback(
    async (amountIn: string, path: string[]) => {
      try {
        if (amountIn) {
          const deadline = getDeadline();
          const tx = await swapRouterContract?.swapExactTokensForETH(
            ethers.utils.parseEther(amountIn),
            1,
            path,
            address,
            deadline
          );
          await tx?.wait();
        }
      } catch (error) {
        console.error(error);
      }
    },
    [swapRouterContract, address]
  );

  const getReserves = useCallback(
    async (tokenA: string, tokenB: string) => {
      const response = await swapRouterContract?.getReserves(tokenA, tokenB);
      setReserveA(ethers.utils.formatEther(response?.reserveA));
      setReserveB(ethers.utils.formatEther(response?.reserveB));
      console.log(
        ethers.utils.formatEther(response?.reserveA),
        ethers.utils.formatEther(response?.reserveB)
      );
    },
    [swapRouterContract]
  );

  const getAmountOut = useCallback(
    async (amountA: string, reserveA: string, reserveB: string) => {
      const response = await swapRouterContract?.getAmountOut(
        ethers.utils.parseEther(amountA),
        ethers.utils.parseEther(reserveA),
        ethers.utils.parseEther(reserveB)
      );
      console.log(ethers.utils.formatEther(response));
      setAmountOut(ethers.utils.formatEther(response));
      setAmountTwo(ethers.utils.formatEther(response));
    },
    [swapRouterContract]
  );

  const getAmountIn = useCallback(
    async (amountB: string, reserveA: string, reserveB: string) => {
      const response = await swapRouterContract?.getAmountIn(
        ethers.utils.parseEther(amountB),
        ethers.utils.parseEther(reserveA),
        ethers.utils.parseEther(reserveB)
      );
      console.log(ethers.utils.formatEther(response));
      setAmountIn(ethers.utils.formatEther(response));
      setAmountOne(ethers.utils.formatEther(response));
    },
    [swapRouterContract]
  );

  return (
    <SwapContext.Provider
      value={{
        swapExactAmountOfTokens,
        swapTokensForExactAmount,
        swapExactAmountOfEthForTokens,
        swapEthForExactAmountOfTokens,
        swapTokensForExactAmountOfEth,
        swapExactAmountOfTokensForEth,
        getReserves,
        getAmountOut,
        getAmountIn,
      }}
    >
      {children}
    </SwapContext.Provider>
  );
};

export const useSwapContext = () => useContext(SwapContext);
