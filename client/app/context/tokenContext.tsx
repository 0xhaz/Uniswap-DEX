"use client";
import { useContractContext } from "./index";
import { useContext, useCallback, createContext } from "react";

import { BigNumber } from "ethers";
import { useAccount } from "wagmi";

interface TokenContextProps {
  mintToken: (token: string, amount: BigNumber) => Promise<void>;
  approveToken: (
    token: string,
    spender: string,
    amount: BigNumber
  ) => Promise<void>;
  transferToken: (
    token: string,
    recipient: string,
    amount: BigNumber
  ) => Promise<void>;
  transferTokenFrom: (
    token: string,
    sender: string,
    recipient: string,
    amount: BigNumber
  ) => Promise<void>;
  increaseAllowance: (
    token: string,
    spender: string,
    amount: BigNumber
  ) => Promise<void>;
  decreaseAllowance: (
    token: string,
    spender: string,
    amount: BigNumber
  ) => Promise<void>;
  getBalance: (token: string) => Promise<BigNumber>;
}

export const TokenContext = createContext<TokenContextProps>({
  mintToken: async () => {},
  approveToken: async () => {},
  transferToken: async () => {},
  transferTokenFrom: async () => {},
  increaseAllowance: async () => {},
  decreaseAllowance: async () => {},
  getBalance: async () => BigNumber.from(0),
});

export type TokenProviderProps = {
  children: JSX.Element;
};

export const TokenProvider = ({
  children,
}: TokenProviderProps): JSX.Element => {
  const {
    usdtContract,
    usdcContract,
    linkContract,
    wethContract,
    rTokenContract,
  } = useContractContext();

  const { address } = useAccount();

  const mintToken = useCallback(
    async (token: string, amount: BigNumber) => {
      if (token === "USDT") {
        await usdtContract?.mint(address, amount);
      } else if (token === "USDC") {
        await usdcContract?.mint(address, amount);
      } else if (token === "LINK") {
        await linkContract?.mint(address, amount);
      } else if (token === "WETH") {
        await wethContract?.deposit({ value: amount });
      } else if (token === "rToken") {
        await rTokenContract?.mint(address, amount);
      }
    },
    [usdtContract, usdcContract, linkContract, wethContract, rTokenContract]
  );

  const approveToken = useCallback(
    async (token: string, spender: string, amount: BigNumber) => {
      if (token === "USDT") {
        await usdtContract?.approve(spender, amount);
      } else if (token === "USDC") {
        await usdcContract?.approve(spender, amount);
      } else if (token === "LINK") {
        await linkContract?.approve(spender, amount);
      } else if (token === "WETH") {
        await wethContract?.approve(spender, amount);
      } else if (token === "rToken") {
        await rTokenContract?.approve(spender, amount);
      }
    },
    [usdtContract, usdcContract, linkContract, wethContract, rTokenContract]
  );

  const transferToken = useCallback(
    async (token: string, recipient: string, amount: BigNumber) => {
      if (token === "USDT") {
        await usdtContract?.transfer(recipient, amount);
      } else if (token === "USDC") {
        await usdcContract?.transfer(recipient, amount);
      } else if (token === "LINK") {
        await linkContract?.transfer(recipient, amount);
      } else if (token === "WETH") {
        await wethContract?.transfer(recipient, amount);
      } else if (token === "rToken") {
        await rTokenContract?.transfer(recipient, amount);
      }
    },
    [usdtContract, usdcContract, linkContract, wethContract, rTokenContract]
  );

  const transferTokenFrom = useCallback(
    async (
      token: string,
      sender: string,
      recipient: string,
      amount: BigNumber
    ) => {
      if (token === "USDT") {
        await usdtContract?.transferFrom(sender, recipient, amount);
      } else if (token === "USDC") {
        await usdcContract?.transferFrom(sender, recipient, amount);
      } else if (token === "LINK") {
        await linkContract?.transferFrom(sender, recipient, amount);
      } else if (token === "WETH") {
        await wethContract?.transferFrom(sender, recipient, amount);
      } else if (token === "rToken") {
        await rTokenContract?.transferFrom(sender, recipient, amount);
      }
    },
    [usdtContract, usdcContract, linkContract, wethContract, rTokenContract]
  );

  const increaseAllowance = useCallback(
    async (token: string, spender: string, amount: BigNumber) => {
      if (token === "USDT") {
        await usdtContract?.increaseAllowance(spender, amount);
      } else if (token === "USDC") {
        await usdcContract?.increaseAllowance(spender, amount);
      } else if (token === "LINK") {
        await linkContract?.increaseAllowance(spender, amount);
      } else if (token === "WETH") {
        await wethContract?.increaseAllowance(spender, amount);
      } else if (token === "rToken") {
        await rTokenContract?.increaseAllowance(spender, amount);
      }
    },
    [usdtContract, usdcContract, linkContract, wethContract, rTokenContract]
  );

  const decreaseAllowance = useCallback(
    async (token: string, spender: string, amount: BigNumber) => {
      if (token === "USDT") {
        await usdtContract?.decreaseAllowance(spender, amount);
      } else if (token === "USDC") {
        await usdcContract?.decreaseAllowance(spender, amount);
      } else if (token === "LINK") {
        await linkContract?.decreaseAllowance(spender, amount);
      } else if (token === "WETH") {
        await wethContract?.decreaseAllowance(spender, amount);
      } else if (token === "rToken") {
        await rTokenContract?.decreaseAllowance(spender, amount);
      }
    },
    [usdtContract, usdcContract, linkContract, wethContract, rTokenContract]
  );

  const getBalance = useCallback(
    async (token: string) => {
      if (token === "USDT") {
        return await usdtContract?.balanceOf(address);
      } else if (token === "USDC") {
        return await usdcContract?.balanceOf(address);
      } else if (token === "LINK") {
        return await linkContract?.balanceOf(address);
      } else if (token === "WETH") {
        return await wethContract?.balanceOf(address);
      } else if (token === "rToken") {
        return await rTokenContract?.balanceOf(address);
      }
    },
    [usdtContract, usdcContract, linkContract, wethContract, rTokenContract]
  );

  return (
    <TokenContext.Provider
      value={{
        mintToken,
        approveToken,
        transferToken,
        transferTokenFrom,
        increaseAllowance,
        decreaseAllowance,
        getBalance,
      }}
    >
      {children}
    </TokenContext.Provider>
  );
};

export function useTokenContext() {
  return useContext(TokenContext);
}
