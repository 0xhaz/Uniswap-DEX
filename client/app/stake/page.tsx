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
  getEthBalance,
  hasValidAllowanceStaking,
} from "@/utils/queries";
import {
  CONTRACTS,
  DEFAULT_VALUE,
  RTOKEN,
  TokenProps,
  tokens,
} from "../constants/constants";
import Selector from "@/app/components/selector";
import TransactionStatus from "@/app/components/transactionStatus";
import { contract } from "@/utils/contracts";
import { formatEth, toEth, toWei } from "@/utils/ether-utils";

const stakingRouter = contract("stakingRouter");

const Stake = () => {
  const [stakedAmount, setStakedAmount] = useState<number | string>(0);
  const [earnedRewards, setEarnedRewards] = useState<number | string>(0);
  const [stakeAmount, setStakeAmount] = useState<string | number>(0);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(0);
  const [claimAmount, setClaimAmount] = useState<number | string>(0);
  const [stakeToken, setStakeToken] = useState<TokenProps | null>(
    () => tokens.find(token => token.key === DEFAULT_VALUE) || null
  );
  const [txPending, setTxPending] = useState<boolean>(false);
  const [poolAddress, setPoolAddress] = useState<string | null>(null);
  const [poolBalance, setPoolBalance] = useState<number | string>(0);

  const { address } = useAccount();

  const notifyError = (msg: string) => toast.error(msg, { duration: 6000 });
  const notifySuccess = () => toast.success("Transaction completed.");

  const handleStake = async () => {
    if (!address || !stakeToken) return;

    try {
      setTxPending(true);
      if (stakeToken?.key === "ETH") {
        await stakeEther(stakeAmount.toString());
        setStakeAmount(stakeAmount.toString());
        setStakeAmount("");
        notifySuccess();
      } else {
        const hasAllowance = await hasValidAllowanceStaking(
          address,
          stakeToken?.key || "",
          stakeAmount.toString()
        );

        if (!hasAllowance) {
          await approveTokens(
            stakeToken?.address || "",
            stakeToken?.abi || "",
            stakingRouter?.address,
            stakeAmount.toString()
          );

          notifySuccess();
        } else {
          console.log("Already approved. Proceeding with staking...");
        }

        await stakedTokens(stakeToken?.key || "", stakeAmount.toString());

        const updatedStakedAmount = await getStakedAmount(
          stakeToken?.key || ""
        );

        setStakedAmount(formatEth(updatedStakedAmount.toString()));
        setStakeAmount("");
        notifySuccess();
      }
    } catch (error) {
      console.error(error);
      notifyError("Transaction failed.");
    } finally {
      setTxPending(false);
    }
  };

  const handleUnstakes = () => {
    if (!address) return;
    if (stakeToken) {
      setTxPending(true);
      if (stakeToken?.key === "ETH") {
        withdrawEther(withdrawAmount.toString());
        notifySuccess();
      } else {
        withdrawTokens(stakeToken?.key || "", withdrawAmount.toString());

        notifySuccess();
      }
      setTxPending(false);
    }
  };

  const handleClaim = () => {
    if (!address) return;
    const tokenInfo = CONTRACTS.RTOKEN;
    if (stakeToken) {
      if (stakeToken?.key === "ETH") {
        claimEther();
      } else {
        approveTokens(
          tokenInfo?.address || "",
          tokenInfo?.abi || "",
          stakingRouter?.address,
          claimAmount.toString()
        );

        claimRewards(stakeToken?.key || "", claimAmount.toString());
      }
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!address || !stakeToken) return;

      try {
        const poolToken = await getPoolAddress(stakeToken?.key || "");
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
        if (stakeToken?.key === "ETH") {
          const balance = await getEthBalance(address);
          setPoolBalance(balance?.toString() || "0");
        } else {
          const balance = await getBalance(stakeToken?.key || "", address);
          setPoolBalance(balance?.toString() || "0");
        }
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
        const stakedAmount = await getStakedAmount(stakeToken?.key || "");
        const parseStakedAmount = parseFloat(
          formatEth(stakedAmount.toString())
        ).toFixed(2);
        setStakedAmount(parseStakedAmount || "0");
      } catch (error) {
        console.error(error);
      }
    };

    fetchStakedAmount();
  }, [address, stakeToken]);

  useEffect(() => {
    const fetchEarnedRewards = async () => {
      if (!address || !stakeToken) return;

      try {
        const earnedRewards = await getEarnedRewards(stakeToken?.key || "");
        const parseEarnedRewards = parseFloat(formatEth(earnedRewards)).toFixed(
          4
        );
        setEarnedRewards(parseEarnedRewards);
      } catch (error) {
        console.error(error);
      }
    };

    fetchEarnedRewards();
  }, [address, stakeToken]);

  return (
    <>
      <h1 className="text-gray-100 text-3xl font-semibold ">
        Stake Your Tokens
      </h1>
      <div className="w-[50%] bg-[#212429] mt-10 p-20 flex flex-col justify-center items-center px-2 pb-10 ">
        <div className="w-[80%] flex items-center justify-between">
          <div className=" grid items-center mb-12 ml-10 text-lg font-semibold ">
            <p className="px-4 mb-6 text-2xl ">Stake</p>
            <div className="relative flex items-center rounded-xl mt-0">
              <input
                type="number"
                id=""
                className=" text-white w-[300px] outline-none rounded-xl h-12 px-2 appearance-none text-xl bg-[#2c2f36] "
                placeholder="0.0"
                required
                onChange={e => setStakeAmount(e.target.value)}
                value={stakeAmount}
              />
              <div className="absolute -right-1 ">
                <Selector
                  id={"stake"}
                  setToken={(token: TokenProps) => setStakeToken(token)}
                  defaultValue={stakeToken}
                  ignoreValue={"ETH"}
                  tokens={tokens}
                />
              </div>
            </div>
          </div>
          <div>
            <Button
              type="secondary"
              style={{
                marginTop: "10px",
                marginLeft: "20px",
              }}
              onPress={() => handleStake()}
            >
              Stake
            </Button>
          </div>
        </div>

        <div className=" relative border border-gray-500 py-2 px-10 rounded-md flex items-center justify-between ">
          <div className="text-white p-2 mx-4  ">
            <div className="">Staking APY</div>
            <div className=" flex items-center justify-center">12%</div>
          </div>
          <div className="text-white p-2 mx-4">
            <div></div>
            <div></div>
          </div>
          <div className="text-white p-2 mx-4">
            <div>Wallet Balance</div>
            <div>{poolBalance}</div>
          </div>
        </div>

        <div className="mt-4 relative flex items-center text-white justify-between">
          <div className="mt-4 relative border border-gray-500 py-4 px-6 rounded-sm flex items-center flex-col w-full mr-2 justify-center ">
            <h3 className="text-md mb-1">Staked</h3>
            <h3 className="text-xl font-semibold">{stakedAmount}</h3>
            <div className="text-sm mt-1">
              <input
                type="number"
                id="stakeAmount"
                className="relative text-white w-full outline-none rounded-xl h-12 px-2 appearance-none text-xl bg-[#2c2f36]"
                placeholder="0.0"
                required
                onChange={e => setWithdrawAmount(+e.target.value)}
                value={withdrawAmount}
              />
            </div>
            <Button
              type="secondary"
              style={{
                marginTop: "10px",
              }}
              onPress={() => handleUnstakes()}
            >
              Unstake
            </Button>
          </div>
          <div className="mt-4 relative border w-full border-gray-500 py-4 px-6 rounded-sm flex items-center flex-col ml-2 justify-between ">
            <h3 className="text-md mb-1">Rewards</h3>
            <h3 className="text-xl font-semibold">{earnedRewards}</h3>
            <div className="text-sm mt-1">
              <input
                type="number"
                id="claimAmount"
                className="relative text-white w-full outline-none rounded-xl h-12 px-2 appearance-none text-xl bg-[#2c2f36]"
                placeholder="0.0"
                required
                onChange={e => setClaimAmount(e.target.value)}
              />
            </div>
            <Button
              type="secondary"
              style={{
                marginTop: "10px",
              }}
              onPress={() => handleClaim()}
            >
              Claim
            </Button>

            {txPending && <TransactionStatus />}

            <Toaster />
          </div>
        </div>
      </div>
    </>
  );
};

export default Stake;
