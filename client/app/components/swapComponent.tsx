"use client";
import React, { useEffect, useRef, useState } from "react";
import { CogIcon, ArrowSmDownIcon } from "@heroicons/react/outline";
import toast, { Toaster } from "react-hot-toast";
import { DEFAULT_VALUE, ETH } from "@/utils/SupportedCoins";
import { useAccount, useContract, useProvider, useSigner } from "wagmi";
import { useContractContext } from "../context";

import {
  CONTRACTS,
  pathLINK_USDC,
  pathUSDC_LINK,
  pathLINK_USDT,
  pathUSDT_LINK,
  pathLINK_WETH,
  pathWETH_LINK,
  pathUSDC_WETH,
  pathWETH_USDC,
  pathUSDT_USDC,
  pathUSDC_USDT,
  pathUSDT_WETH,
  pathWETH_USDT,
  tokens,
} from "../constants/constants";

import { toEth, toWei } from "../../utils/ether-utils";

const token1 = tokens;
const token2 = tokens;

import SwapField from "./swapField";
import TransactionStatus from "./transactionStatus";
import { getContract } from "wagmi/actions";
import { Contract, ethers } from "ethers";
const SwapComponent = () => {
  const [srcToken, setSrcToken] = useState(ETH);
  const [selectedToken1, setSelectedToken1] = useState(token1[0]);
  const [selectedToken2, setSelectedToken2] = useState(token2[0]);
  const [destToken, setDestToken] = useState(DEFAULT_VALUE);
  const [inputValue, setInputValue] = useState<string>("");
  const [outputValue, setOutputValue] = useState<string>("");

  const {
    swapRouterContract,
    usdcContract,
    usdtContract,
    linkContract,
    wethContract,
  } = useContractContext();

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

  const { address, isConnected } = useAccount();
  const provider = useProvider();
  const { data: signer } = useSigner();

  const [reserveA, setReserveA] = useState(0);
  const [reserveB, setReserveB] = useState(0);
  const [amountOne, setAmountOne] = useState(0);
  const [amountTwo, setAmountTwo] = useState(0);
  const [exactAmountIn, setExactAmountIn] = useState(false);
  const [exactAmountOut, setExactAmountOut] = useState(false);
  const [amountOut, setAmountOut] = useState(0);
  const [amountIn, setAmountIn] = useState(0);

  const getDeadline = () => {
    const _deadline = Math.floor(Date.now() / 1000) + 600; // 10 minutes from the current Unix time
    return _deadline;
  };

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

  const handleSwapSubmit = () => {
    try {
      if (
        exactAmountIn &&
        selectedToken1.symbol != "ETH" &&
        selectedToken2.symbol != "ETH"
      ) {
        if (selectedToken1.symbol == "USDT") {
          swapExactAmountOfTokens(amountOne, pathUSDT_USDC);
        } else if (selectedToken1.symbol == "USDC") {
          swapExactAmountOfTokens(amountOne, pathUSDC_USDT);
        }
      } else if (
        exactAmountOut &&
        selectedToken1.symbol != "ETH" &&
        selectedToken2.symbol != "ETH"
      ) {
        if (selectedToken1.symbol == "USDT") {
          swapTokensForExactAmount(amountTwo, pathUSDT_USDC);
        } else if (selectedToken1.symbol == "USDC") {
          swapExactAmountOfTokens(amountTwo, pathUSDC_USDT);
        }
      } else if (exactAmountIn) {
        if (selectedToken1.symbol == "ETH" && selectedToken2.symbol != "ETH") {
          if (selectedToken2.symbol == "USDT") {
            swapExactAmountOfETHForTokens(amountOne, pathETH_USDT);
          } else if (selectedToken2.symbol == "USDC") {
            swapExactAmountOfETHForTokens(amountOne, pathETH_USDC);
          }
        } else if (
          selectedToken1.symbol != "ETH" &&
          selectedToken2.symbol == "ETH"
        ) {
          if (selectedToken1.symbol == "ETH") {
            swapExactAmountOfTokensForETH(amountOne, pathETH_USDT);
          } else if (selectedToken1.symbol == "USDC") {
            swapExactAmountOfTokensForETH(amountOne, pathETH_USDC);
          }
        }
      } else if (exactAmountOut) {
        if (selectedToken1.symbol == "ETH" && selectedToken2.symbol != "ETH") {
          if (selectedToken2.symbol == "USDT") {
            swapETHForExactAmountOfTokens(amountTwo, pathETH_USDT);
          } else if (selectedToken2.symbol == "USDC") {
            swapETHForExactAmountOfTokens(amountTwo, pathETH_USDC);
          }
        } else if (
          selectedToken1.symbol != "ETH" &&
          selectedToken2.symbol == "ETH"
        ) {
          if (selectedToken1.symbol == "USDT") {
            swapTokensForExactAmountOfETH(amountTwo, pathETH_USDT);
          } else if (selectedToken1.symbol == "USDC") {
            swapTokensForExactAmountOfETH(amountTwo, pathETH_USDC);
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const approveTokens = async (tokenInAddress, amountIn) => {
    try {
      const tokenContract = new Contract(tokenInAddress, usdtAbi, signer);

      const tx = await tokenContract.approve(swapRouterA, toWei(amountIn));

      await tx.wait();
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  const swapExactAmountOfTokens = async (amountIn, path) => {
    try {
      if (amountIn) {
        const deadline = getDeadline();
        const _swapExactTokens = await contract.swapExactTokensForTokens(
          toWei(amountIn),
          1,
          path,
          address,
          deadline
        );
        setTxPending(true);
        await _swapExactTokens.wait();
        setTxPending(false);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const swapTokensForExactAmount = async (amountOut, path) => {
    try {
      if (amountOut) {
        const deadline = getDeadline();
        const _swapTokensForExact = await contract.swapTokensForExactTokens(
          toWei(amountOut),
          1,
          path,
          address,
          deadline
        );
        setTxPending(true);
        await _swapTokensForExact.wait();
        setTxPending(false);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const swapExactAmountOfEthForTokens = async (amountIn, path) => {
    try {
      if (amountIn) {
        const deadline = getDeadline();
        const _swapExactEthForTokens = await contract.swapExactETHForTokens(
          1,
          path,
          address,
          deadline
        );
        setTxPending(true);
        await _swapExactEthForTokens.wait();
        setTxPending(false);
      }
    } catch (error) {
      console.log(error);
    }
  };

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
