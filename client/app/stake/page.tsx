"use client";
import React, { useState, useEffect } from "react";
import { CheckIcon, ChevronUpIcon } from "@heroicons/react/outline";
import toast, { Toaster } from "react-hot-toast";
import {
  Button,
  Input,
  Modal,
  Text,
  useModal,
  Dropdown,
} from "@nextui-org/react";
import Link from "next/link";
import { useAccount, useProvider, useSigner } from "wagmi";
import { ethers } from "ethers";
import {
  getPoolAddress,
  approveTokens,
  getStakedAmount,
  getEarnedRewards,
  stakedTokens,
  withdrawTokens,
  claimRewards,
  stakeEther,
  withdrawEther,
  claimEther,
  getBalance,
} from "@/utils/queries";
import { DEFAULT_VALUE, TokenProps, tokens } from "../constants/constants";
import Selector from "@/app/components/selector";

const Stake = () => {
  const [expand, setExpand] = useState<boolean>(false);
  const [stakedAmount, setStakedAmount] = useState<number | string>(0);
  const [earnedRewards, setEarnedRewards] = useState<number | string>(0);
  const [stakeAmount, setStakeAmount] = useState<number | string>(0);
  const [withdrawAmount, setWithdrawAmount] = useState<number | string>(0);
  const [claimAmount, setClaimAmount] = useState<number | string>(0);
  const [stakeToken, setStakeToken] = useState<TokenProps | null>(
    () => tokens.find(token => token.key === DEFAULT_VALUE) || null
  );
  const [txPending, setTxPending] = useState<boolean>(false);
  const [poolAddress, setPoolAddress] = useState<string | null>(null);
  const [poolBalance, setPoolBalance] = useState<number | string>(0);
  const [poolToken, setPoolToken] = useState<TokenProps | null>(null);

  const { address } = useAccount();

  useEffect(() => {
    const fetchData = async () => {
      if (!address || !stakeToken) return;

      try {
        const poolToken = await getPoolAddress(stakeToken?.address || "");
        setPoolAddress(poolToken);
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, [address, stakeToken]);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!address || !stakeToken) return;

      try {
        const balance = await getBalance(stakeToken?.address || "", address);
        setPoolBalance(balance?.toString() || "0");
      } catch (error) {
        console.error(error);
      }
    };

    fetchBalance();
  }, [address, stakeToken]);

  useEffect(() => {
    const fetchStakedAmount = async () => {
      if (!address || !stakeToken) return;

      try {
        const stakedAmount = await getStakedAmount(stakeToken?.address || "");
        setStakedAmount(stakedAmount?.toString() || "0");
      } catch (error) {
        console.error(error);
      }
    };

    fetchStakedAmount();
  }, [address, stakeToken]);

  return (
    <>
      <h1 className="text-gray-100 text-3xl font-semibold">
        Stake Your Tokens
      </h1>
      <div className="w-[50%] bg-[#212429] mt-10 p-20 flex flex-col justify-center items-center px-2 pb-10 ">
        <div className="w-[80%] flex items-center justify-between">
          <div className=" grid items-center mb-12 ml-10 text-lg font-semibold ">
            <p className="px-4 mb-4 ">Stake</p>
            <Selector
              id={"stake"}
              setToken={(token: TokenProps) => setStakeToken(token)}
              defaultValue={stakeToken}
              ignoreValue={null}
              tokens={tokens}
            />
          </div>
          <div>
            <input
              type="number"
              id="stakeAmount"
              className="relative text-white w-full outline-none rounded-xl h-12 px-2 appearance-none text-xl bg-[#2c2f36] "
              placeholder="0.0"
              required
            />
            <Button
              type="secondary"
              style={{
                marginTop: "10px",
                marginLeft: "20px",
              }}
              onPress={() => {}}
            >
              Stake
            </Button>
          </div>
        </div>

        <div className="mt-10 relative border border-gray-500 py-2 px-10 rounded-md flex items-center justify-between ">
          <div className="text-white p-2 mx-4 ">
            <div>Staking APR</div>
            <div>12%</div>
          </div>
          <div className="text-white p-2 mx-4">
            <div>Max Slashing</div>
            <div>10%</div>
          </div>
          <div className="text-white p-2 mx-4">
            <div>Wallet Balance</div>
            <div>Balance</div>
          </div>
        </div>

        <div className="mt-4 relative flex items-center text-white justify-between">
          <div className="mt-4 relative border border-gray-500 py-4 px-6 rounded-sm flex items-center flex-col w-full mr-2 justify-center ">
            <h3 className="text-md mb-1">Staked</h3>
            <h3 className="text-xl font-semibold">"StakeAmount"</h3>
            <div className="text-sm mt-1">
              <input
                type="number"
                id="stakeAmount"
                className="relative text-white w-full outline-none rounded-xl h-12 px-2 appearance-none text-xl bg-[#2c2f36]"
                placeholder="0.0"
                required
                onChange={e => {}}
              />
            </div>
            <Button
              type="secondary"
              style={{
                marginTop: "10px",
              }}
              onPress={() => {}}
            >
              Unstake
            </Button>
          </div>
          <div className="mt-4 relative border w-full border-gray-500 py-4 px-6 rounded-sm flex items-center flex-col ml-2 justify-between ">
            <h3 className="text-md mb-1">Rewards</h3>
            <h3 className="text-xl font-semibold">"RewardsAmount"</h3>
            <div className="text-sm mt-1">
              <input
                type="number"
                id="claimAmount"
                className="relative text-white w-full outline-none rounded-xl h-12 px-2 appearance-none text-xl bg-[#2c2f36]"
                placeholder="0.0"
                required
                onChange={e => {}}
              />
            </div>
            <Button
              type="secondary"
              style={{
                marginTop: "10px",
              }}
              onPress={() => {}}
            >
              Claim
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Stake;
