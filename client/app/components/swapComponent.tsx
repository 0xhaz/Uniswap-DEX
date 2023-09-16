import React, { useEffect, useState, useRef } from "react";
import {
  approveTokens,
  swapTokensForExactAmount,
  swapExactAmountOfEthForTokens,
  swapEthForExactAmountOfTokens,
  swapTokensForExactAmountOfEth,
  swapExactAmountOfTokensForEth,
  swapExactAmountOfTokens,
  depositEthForWeth,
  getAmountIn,
  getAmountOut,
  getAmountsIn,
  getAmountsOut,
  // quote,
  withdrawWethForEth,
} from "@/utils/queries";
import { contract, tokenContract, tokenContractMap } from "@/utils/contracts";
import { CogIcon, ArrowSmDownIcon } from "@heroicons/react/outline";
import SwapField from "./swapField";
import TransactionStatus from "./transactionStatus";
import toast, { Toaster } from "react-hot-toast";
import {
  DEFAULT_VALUE,
  ETH,
  CONTRACTS,
  tokenPairs,
  tokens,
  TokenProps,
} from "../constants/constants";
import { formatEth, toEth, toWei } from "../../utils/ether-utils";
import { useAccount } from "wagmi";

const swapRouter = contract("swapRouter");
const token1 = tokens;
const token2 = tokens;

const SwapComponent = () => {
  const [srcToken, setSrcToken] = useState<TokenProps>(token1[5]);
  const [destToken, setDestToken] = useState<TokenProps>(token2[5]);
  const [exactAmountIn, setExactAmountIn] = useState<string>("");
  const [exactAmountOut, setExactAmountOut] = useState<string>("");
  const [isExactAmountSet, setIsExactAmountSet] = useState<boolean>(false);
  const [isExactAmountOutSet, setIsExactAmountOutSet] =
    useState<boolean>(false);
  const [reserveA, setReserveA] = useState<string>("");
  const [reserveB, setReserveB] = useState<string>("");

  const [inputValue, setInputValue] = useState<string>("");
  const [outputValue, setOutputValue] = useState<string>("");

  const inputValueRef = useRef<HTMLInputElement>(null);
  const outputValueRef = useRef<HTMLInputElement>(null);

  const isReversed = useRef(false);

  const INCREASE_ALLOWANCE = "Increase allowance";
  const ENTER_AMOUNT = "Enter an amount";
  const CONNECT_WALLET = "Connect wallet";
  const SWAP = "Swap";

  const [estimatedQuote, setEstimatedQuote] = useState<string | null>(null);

  const [swapBtnText, setSwapBtnText] = useState(ENTER_AMOUNT);
  const [txPending, setTxPending] = useState(false);

  console.log("srcToken", srcToken);
  console.log("destToken", destToken);

  const notifyError = (msg: string) => toast.error(msg, { duration: 6000 });
  const notifySuccess = () => toast.success("Transaction completed.");
  const { address } = useAccount();

  // get pair path
  function getPathForTokenToETH(srcToken: string): string[] | null {
    const [tokenA, tokenB] = tokenPairs.find(
      pair => pair[0] === srcToken && pair[1] === ETH
    ) || [null, null];

    if (tokenA && tokenB) {
      return [tokenA, tokenB];
    }

    return null;
  }

  function getPathForTokensToTokens(
    srcToken: string,
    destToken: string
  ): string[] | null {
    const [tokenA, tokenB] = tokenPairs.find(
      pair => pair[0] === srcToken && pair[1] === destToken
    ) || [null, null];

    if (tokenA && tokenB) {
      return [tokenA, tokenB];
    }

    return null;
  }

  function getPathForETHToToken(destToken: string): string[] | null {
    const [tokenA, tokenB] = tokenPairs.find(
      pair => pair[0] === "ETH" && pair[1] === destToken
    ) || [null, null];

    if (tokenA && tokenB) {
      return [tokenA, tokenB];
    }

    return null;
  }

  const performSwap = async () => {
    let receipt;
    let path: string[] | null = null;
    if (srcToken.name === "ETH" && destToken.name === "WETH") {
      if (address) {
        try {
          await depositEthForWeth(inputValue);
        } catch (error) {
          console.error("Error depositing ETH for WETH", error);
        }
      }
    }
  };

  const handleSwap = async () => {
    if (srcToken.name === "ETH" && destToken.name === "WETH") {
      setTxPending(true);
      await performSwap();
      setTxPending(false);
    }
  };

  return (
    <div className="bg-zinc-900 w-[35%] p-4 px-6 rounded-xl">
      <div className="flex items-center justify-between py-4 px-1">
        <p>Swap</p>
        <CogIcon className="h-6" />
      </div>
      <div className="relative bg-[#212429] p-4 py-6 rounded-xl mb-2 border-[2px] border-transparent hover:border-zinc-600">
        <SwapField
          id={"srcToken"}
          value={inputValue}
          setValue={setInputValue}
          defaultValue={DEFAULT_VALUE}
          setToken={setSrcToken as any}
          ignoreValue={destToken.key}
          handleChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setInputValue(e.target.value);
          }}
        />

        <ArrowSmDownIcon
          className="absolute left-1/2 -translate-x-1/2 -bottom-6 h-10 p-1 bg-[#212429] border-4 border-zinc-900 text-zinc-300 rounded-xl cursor-pointer hover:scale-110"
          onClick={handleReverseExchange}
        />
      </div>

      <div className="bg-[#212429] p-4 py-6 rounded-xl mt-2 border-[2px] border-transparent hover:border-zinc-600">
        <SwapField
          id={"destToken"}
          value={outputValue}
          setValue={setOutputValue}
          defaultValue={DEFAULT_VALUE}
          setToken={setDestToken as any}
          ignoreValue={srcToken.key}
          handleChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setOutputValue(e.target.value);
          }}
        />
        {estimatedQuote !== null && destToken.name !== "WETH" && (
          <p className="text-zinc-400 text-sm mt-2">
            Estimated Quote: {estimatedQuote} {destToken.name}
          </p>
        )}
      </div>

      <button
        className={getSwapBtnClassName()}
        onClick={() => {
          if (swapBtnText === INCREASE_ALLOWANCE)
            console.log("increaseAllowance");
          else if (swapBtnText === SWAP) handleSwap();
        }}
      >
        {swapBtnText}
      </button>

      {txPending && <TransactionStatus />}

      <Toaster />
    </div>
  );

  // Front end functionality

  function handleReverseExchange(
    e: React.MouseEvent<SVGSVGElement, MouseEvent>
  ) {
    // 1. Swap tokens (srcToken <-> destToken)
    // 2. Swap values (inputValue <-> outputValue)
    console.log("Before swap:");
    console.log("srcToken:", srcToken);
    console.log("destToken:", destToken);
    console.log("inputValue:", inputValue);
    console.log("outputValue:", outputValue);

    // Swap srcToken and destToken
    const newSrcToken = destToken;
    const newDestToken = srcToken;

    console.log("After swapping tokens:");
    console.log("newSrcToken:", newSrcToken);
    console.log("newDestToken:", newDestToken);

    // Use functional updates for state variables
    setSrcToken(() => newSrcToken);
    setDestToken(() => newDestToken);

    // Swap input and output values
    setInputValue(outputValue);
    setOutputValue(inputValue);

    console.log("After state updates:");
    console.log("srcToken:", srcToken);
    console.log("destToken:", destToken);
    console.log("inputValue:", inputValue);
    console.log("outputValue:", outputValue);
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

  function handleInsufficientAllowance() {
    notifyError(
      "Insufficient allowance. Click 'Increase allowance' to increase it."
    );
    setSwapBtnText(INCREASE_ALLOWANCE);
  }
};

export default SwapComponent;
