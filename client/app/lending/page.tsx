"use client";
import React, { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Button, Input } from "@nextui-org/react";
import { useAccount, useProvider } from "wagmi";
import { DEFAULT_VALUE, tokens, TokenProps } from "../constants/constants";
import Selector from "../components/selector";
import TransactionStatus from "../components/transactionStatus";
import { contract } from "@/utils/contracts";
import {
  getLendingPoolAddress,
  createPool,
  getRepaidAmount,
  getWithdrawalAmount,
  depositTokens,
  withdrawTokensLending,
  borrowTokens,
  repayTokens,
  depositEther,
  withdrawEtherLending,
  borrowEther,
  repayEther,
} from "@/utils/queries";

const lendingRouter = contract("lendingPoolRouter");

const Lending = () => {
  const [expand, setExpand] = useState<boolean>(false);
  const [selectedToken, setSelectedToken] = useState<TokenProps | null>(
    () => tokens.find(token => token.key === DEFAULT_VALUE) || null
  );
  const [toggleSupply, setToggleSupply] = useState<boolean>(false);
  const [toggleBorrow, setToggleBorrow] = useState<boolean>(false);
  const [toggleRepay, setToggleRepay] = useState<boolean>(false);
  const [txPending, setTxPending] = useState<boolean>(false);
  const [userBalance, setUserBalance] = useState<number>(0);
  const [lendAmount, setLendAmount] = useState<number>(0);
  const [borrowedAmount, setBorrowedAmount] = useState<number>(0);
  const [repayAmount, setRepayAmount] = useState<number>(0);
  const [borrowAmount, setBorrowAmount] = useState<number>(0);
  const [supplyAmount, setSupplyAmount] = useState<number>(0);
  const [poolAddress, setPoolAddress] = useState<string>("");
  const [toBorrow, setToBorrow] = useState<number>(0);

  const { address } = useAccount();
  return (
    <>
      <div className="w-full mt-10 flex flex-col justify-center items-center px-2 pb-10">
        <div className="w-full flex flex-col justify-around">
          <h1 className="text-gray-100 text-3xl font-semibold">Lending Pool</h1>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-gray-100 flex items-center text-lg font-semibold">
            Lend
          </div>
          <Selector
            id={"lend"}
            setToken={(token: TokenProps) => setSelectedToken(token)}
            defaultValue={selectedToken || null}
            ignoreValue={null}
            tokens={tokens}
          />
        </div>

        <div className="flex  justify-between w-full">
          <div className="mt-4 relative border w-full mr-2 text-white border-gray-500 py-4 px-6 rounded-md flex flex-col items-center justify-between">
            <div className="flex items-center justify-between w-full my-2">
              <div>Wallet Balance</div>
              <div>{userBalance}</div>
            </div>
            <div className="flex items-center justify-between w-full my-2">
              <div>Available to supply</div>
              <div>{userBalance}</div>
            </div>
            <div className="flex items-center justify-between w-full my-2">
              <div>Available to borrow</div>
              <div>{userBalance}</div>
            </div>
          </div>
          <div className="mt-4 relative border w-full ml-2 text-white border-gray-500 py-4 px-6 rounded-md flex flex-col items-center justify-between">
            <div className="flex items-center justify-between w-full my-2">
              <div>Supplied Amount</div>
              <div>{lendAmount}</div>
            </div>
            <div className="flex items-center justify-between w-full my-2">
              <div>Borrowed Amount</div>
              <div>{borrowedAmount}</div>
            </div>
            <div className="flex items-center justify-between w-full my-2">
              <div>Interest</div>
              <div>13 %</div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div>
            <Button
              auto
              className="mt-4"
              onClick={() => {
                setToggleSupply(!toggleSupply);
                setToggleBorrow(false);
              }}
            >
              Supply
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Lending;
