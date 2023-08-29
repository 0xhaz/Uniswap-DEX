"use client";
import React, { useEffect, useRef, useState } from "react";
import { CogIcon, ArrowSmDownIcon } from "@heroicons/react/outline";
import toast, { Toaster } from "react-hot-toast";
import { DEFAULT_VALUE, ETH } from "@/utils/SupportedCoins";
import { useAccount } from "wagmi";

import {
  CONTRACTS,
  pathLINK_USDC,
  pathLINK_USDT,
  pathLINK_WETH,
  pathUSDC_WETH,
  pathUSDT_USDC,
  pathUSDT_WETH,
  tokens,
} from "../constants/constants";

import { toEth, toWei } from "../../utils/ether-utils";

const token1 = tokens;
const token2 = tokens;

const swapRouterAddress = CONTRACTS.SWAP_ROUTER.address;
const swapRouterAbi = CONTRACTS.SWAP_ROUTER.abi;
const usdtAddress = CONTRACTS.USDT.address;
const usdtAbi = CONTRACTS.USDT.abi;
const usdcAddress = CONTRACTS.USDC.address;
const usdcAbi = CONTRACTS.USDC.abi;
const linkAddress = CONTRACTS.LINK.address;
const linkAbi = CONTRACTS.LINK.abi;

import SwapField from "./swapField";
import TransactionStatus from "./transactionStatus";
const SwapComponent = () => {
  const [srcToken, setSrcToken] = useState(ETH);
  const [destToken, setDestToken] = useState(DEFAULT_VALUE);
  const [inputValue, setInputValue] = useState<string>("");
  const [outputValue, setOutputValue] = useState<string>("");

  const inputValueRef = useRef();
  const outputValueRef = useRef();

  const isReversed = useRef(false);

  const INCREASE_ALLOWANCE = "Increase allowance";
  const ENTER_AMOUNT = "Enter an amount";
  const CONNECT_WALLET = "Connect wallet";
  const SWAP = "Swap";

  const srcTokenObj = {
    id: "srcToken",
    value: inputValue,
    setValue: setInputValue,
    defaultValue: srcToken,
    ignoreValue: destToken,
    setToken: setSrcToken,
  };

  const destTokenObj = {
    id: "destToken",
    value: outputValue,
    setValue: setOutputValue,
    defaultValue: destToken,
    ignoreValue: srcToken,
    setToken: setDestToken,
  };

  const [srcTokenComp, setSrcTokenComp] = useState();
  const [destTokenComp, setDestTokenComp] = useState();
  const [swapBtnText, setSwapBtnText] = useState(ENTER_AMOUNT);
  const [txPending, setTxPending] = useState(false);

  const notifyError = (msg: string) => toast.error(msg, { duration: 6000 });
  const notifySuccess = () => toast.success("Transaction completed");

  const { address } = useAccount();

  async function handleSwap() {
    if (srcToken === ETH && destToken !== ETH) {
      // performSwap()
    } else {
      // Check whether there is allowance when the swap deals with tokenToETH/tokenToToken
      setTxPending(true);
      const result = await hasValidAllowance(address, srcToken, inputValue);
      setTxPending(false);

      if (result) performSwap();
      else handInsufficientAllowance();
    }
  }

  async function handleIncreaseAllowance() {
    // increase the allowance
    setTxPending(true);
    await increaseAllowance(srcToken, inputValue);
    setTxPending(false);

    // set the swapbtn to "Swap" again
    setSwapBtnText(SWAP);
  }

  function handleReverseExchange() {
    // Setting the isReversed value to prevent the input/output values being calculated in their respective side effects
    isReversed.current = true;

    // 1. Swap tokens (srcToken <-> destToken)
    // 2. Swap values (inputValue <-> outputValue)

    setInputValue(outputValue);
    setOutputValue(inputValue);

    setSrcToken(destToken);
    setDestToken(srcToken);
  }

  function getSwapBtnClassName() {
    let className = "p-4 w-full my-2 rounded-xl";
    className +=
      swapBtnText === ENTER_AMOUNT || swapBtnText === CONNECT_WALLET
        ? " text-zinc-400 bg-zinc-800 pointer-events-none"
        : " bg-blue-700";
    className += swapBtnText === INCREASE_ALLOWANCE ? " bg-yellow-600" : "";
    return className;
  }

  function populateOutputValue() {
    if (
      destToken === DEFAULT_VALUE ||
      srcToken === DEFAULT_VALUE ||
      !inputValue
    )
      return;

    try {
      if (srcToken !== ETH && destToken !== ETH) setOutputValue(inputValue);
      else if (srcToken === ETH && destToken !== ETH) {
        const outValue = toEth(toWei(inputValue), 14);
        setOutputValue(outValue);
      } else if (srcToken !== ETH && destToken === ETH) {
        const outValue = toEth(toWei(inputValue), 14);
        setOutputValue(outValue);
      }
    } catch (error) {
      setOutputValue("0");
    }
  }

  function populateInputValue() {
    if (
      destToken === DEFAULT_VALUE ||
      srcToken === DEFAULT_VALUE ||
      !outputValue
    )
      return;

    try {
      if (srcToken !== ETH && destToken !== ETH) setInputValue(outputValue);
      else if (srcToken === ETH && destToken !== ETH) {
        const inValue = toEth(toWei(outputValue), 14);
        setInputValue(inValue);
      } else if (srcToken !== ETH && destToken === ETH) {
        const inValue = toEth(toWei(outputValue), 14);
        setInputValue(inValue);
      }
    } catch (error) {
      setInputValue("0");
    }
  }

  async function performSwap() {
    setTxPending(true);

    let receipt;

    // if(srcToken === ETH && destToken !== ETH)
    // receipt = await swapEthToToken(destToken, inputValue)
    // else if(srcToken !== ETH && destToken === ETH)
    // receipt = await swapTokenToEth(srcToken, inputValue)
    // else receipt = await swapTokenToToken(srcToken, destToken, inputValue)

    setTxPending(false);

    // if (receipt && !receipt.hasOwnProperty("transactionHash"))
    // notifyError(receipt.
    // else notifySuccess();
  }

  function handleInsufficientAllowance() {
    notifyError(
      "Insufficient allowance. Please increase the allowance and try again."
    );
    setSwapBtnText(INCREASE_ALLOWANCE);
  }

  useEffect(() => {
    // Handling the text of the submit button
    if (!address) setSwapBtnText(CONNECT_WALLET);
    else if (!inputValue || !outputValue) setSwapBtnText(ENTER_AMOUNT);
    else setSwapBtnText(SWAP);
  }, [inputValue, outputValue, address]);

  useEffect(() => {
    if (
      document.activeElement !== outputValueRef.current &&
      document.activeElement.ariaLabel !== "srcToken" &&
      !isReversed.current
    )
      populateOutputValue(inputValue);

    setSrcTokenComp(<SwapField obj={srcTokenObj} ref={inputValueRef} />);

    if (inputValue?.length === 0) setOutputValue("");
  }, [inputValue, destToken]);

  useEffect(() => {
    if (
      document.activeElement !== inputValueRef.current &&
      document.activeElement.ariaLabel !== "destToken" &&
      !isReversed.current
    )
      populateInputValue(outputValue);

    setDestTokenComp(<SwapField obj={destTokenObj} ref={outputValueRef} />);

    if (outputValue?.length === 0) setInputValue("");

    // Resetting the isReversed value if its set
    if (isReversed.current) isReversed.current = false;
  }, [outputValue, srcToken]);

  return (
    <div className="bg-zinc-900 w-[35%] p-4 px-6 rounded-xl">
      <div className="flex items-center justify-between py-4 px-1">
        <p>Swap</p>
        <CogIcon className="h-6" />
      </div>

      <div className="relative bg-[#212429] p-4 py-6 rounded-xl mb-2 border-[2px] border-transparent hover:border-zinc-600">
        {srcTokenComp}

        <ArrowSmDownIcon
          className="absolute left-1/2 -translate-x-1/2 -bottom-6 h-10 p-1 bg-[#212429] border-4 border-zinc-900 text-zinc-300 rounded-xl cursor-pointer hover:scale-110"
          onClick={handleReverseExchange}
        />
      </div>

      <div className="bg-[#212429] p-4 py-6 rounded-xl mt-2 border-[2px] border-transparent hover:border-zinc-600">
        {destTokenComp}
      </div>

      <button
        className={getSwapBtnClassName()}
        onClick={() => {
          if (swapBtnText === INCREASE_ALLOWANCE) handleIncreaseAllowance();
          else if (swapBtnText === SWAP) handleSwap();
        }}
      >
        {swapBtnText}
      </button>

      {txPending && <TransactionStatus />}
      <Toaster />
    </div>
  );
};

export default SwapComponent;
