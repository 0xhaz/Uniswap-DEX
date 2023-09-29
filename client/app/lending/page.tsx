"use client";
import React, { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Button, Input, Modal } from "@nextui-org/react";
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
  const [toggleWithdraw, setToggleWithdraw] = useState<boolean>(false);
  const [toggleRepay, setToggleRepay] = useState<boolean>(false);
  const [txPending, setTxPending] = useState<boolean>(false);
  const [userBalance, setUserBalance] = useState<number>(0);
  const [lendAmount, setLendAmount] = useState<number>(0);
  const [borrowedAmount, setBorrowedAmount] = useState<number>(0);
  const [repayAmount, setRepayAmount] = useState<number>(0);
  const [borrowAmount, setBorrowAmount] = useState<number>(0);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(0);
  const [supplyAmount, setSupplyAmount] = useState<number>(0);
  const [poolAddress, setPoolAddress] = useState<string>("");
  const [toBorrow, setToBorrow] = useState<number>(0);

  const handleModal = () => setExpand(true);
  const closeModal = () => setExpand(false);

  const { address } = useAccount();
  return (
    <>
      <h1 className="text-gray-100 text-3xl font-semibold">Lending Pool</h1>
      <div className="w-[50%] bg-[#212429] mt-10 flex flex-col justify-center items-center px-2 pb-10">
        <div className="w-full flex flex-col justify-around"></div>
        <div className="flex items-center justify-between">
          <div className="text-gray-100 flex m-10 text-lg font-semibold">
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

        <div className="flex justify-between m-2 gap-4 items-center">
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
          <Button
            auto
            className="mt-4"
            onClick={() => {
              setToggleBorrow(!toggleBorrow);
              setToggleSupply(false);
            }}
          >
            Borrow
          </Button>

          <Button
            auto
            className="mt-4"
            onClick={() => {
              setToggleWithdraw(!toggleWithdraw);
              setToggleRepay(false);
              setToggleBorrow(false);
              setToggleSupply(false);
            }}
          >
            Withdraw
          </Button>
          <Button
            auto
            className="mt-4"
            onClick={() => {
              setToggleRepay(!toggleRepay);
              setToggleWithdraw(false);
              setToggleBorrow(false);
              setToggleSupply(false);
            }}
          >
            Repay
          </Button>
        </div>
      </div>
    </>
  );
};

export default Lending;
