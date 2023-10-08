"use client";
import { Button } from "@nextui-org/react";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import toast, { Toaster } from "react-hot-toast";

import TransactionStatus from "../components/transactionStatus";
import { mintTokens, getBalance } from "@/utils/queries";

const Faucet = () => {
  const { address } = useAccount();
  const [token, setToken] = useState("USDT");
  const [balance, setBalance] = useState<{ [key: string]: number | string }>(
    {}
  );
  const [txPending, setTxPending] = useState<boolean>(false);

  const notifyError = (msg: string) => toast.error(msg, { duration: 4000 });
  const notifySuccess = () =>
    toast.success("Transaction Successful", { duration: 4000 });

  const handleMint = async (tokenName: string) => {
    try {
      setTxPending(true);
      await mintTokens(tokenName);
      notifySuccess();
    } catch (error) {
      console.log(error);
      notifyError("Transaction Failed");
    } finally {
      setTxPending(false);
    }
  };

  useEffect(() => {
    const fetchBalances = async () => {
      if (address) {
        const tokenNames = ["USDT", "USDC", "LINK"];
        const tokenBalances: { [key: string]: number | string } = {};

        const promises = tokenNames.map(async tokenName => {
          const balanceValue = await getBalance(tokenName, address);
          const balance = balanceValue !== null ? balanceValue : "0";
          tokenBalances[tokenName] = balance;
        });

        await Promise.all(promises);

        setBalance(tokenBalances);
      }
    };
    fetchBalances();
  }, [address]);

  return (
    <>
      <h1 className="text-gray-100 text-3xl font-semibold">Mint Your Tokens</h1>
      <div className="w-[50%] flex items-center justify-center bg-[#212429] mt-10 p-20 flex-col ">
        {address && (
          <div className="w-[80%] items-center">
            {Object.keys(balance).map(tokenName => (
              <div
                key={tokenName}
                className="flex justify-between mb-12 ml-10 text-lg font-semibold"
              >
                <div className="flex p-2 gap-4 items-center">
                  <Image
                    src={`/assets/${tokenName.toLowerCase()}_logo.png`}
                    alt={tokenName}
                    width={40}
                    height={40}
                  />
                  <p>{tokenName}</p>
                </div>
                <div className="flex mt-4">
                  <div className="flex flex-col text-gray-400 text-sm">
                    <p>Balance: {balance[tokenName] ?? "Loading..."}</p>
                  </div>
                </div>
                <div className="flex mt-2">
                  <Button auto onPress={() => handleMint(tokenName)}>
                    Get {tokenName}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        {txPending && <TransactionStatus />}
      </div>
    </>
  );
};

export default Faucet;
