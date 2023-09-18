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
  getAmountsIn,
  getAmountsOut,
  quote,
  withdrawWethForEth,
  getLiquidity,
  hasValidAllowance,
  increaseAllowance,
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
import { ethers } from "ethers";
import { set } from "lodash";

const swapRouter = contract("swapRouter");

const SwapComponent = () => {
  const [srcToken, setSrcToken] = useState<TokenProps | null>(null);
  const [destToken, setDestToken] = useState<TokenProps | null>(null);
  const [exactAmountIn, setExactAmountIn] = useState<boolean>(false);
  const [exactAmountOut, setExactAmountOut] = useState<boolean>(false);

  const [reserveA, setReserveA] = useState<string>("");
  const [reserveB, setReserveB] = useState<string>("");

  const [inputValue, setInputValue] = useState<number | string>(0);
  const [outputValue, setOutputValue] = useState<number | string>(0);

  const [amountIn, setAmountIn] = useState<number | string>(0);
  const [amountOut, setAmountOut] = useState<number | string>(0);

  const isReversed = useRef(false);

  const INCREASE_ALLOWANCE = "Increase allowance";
  const ENTER_AMOUNT = "Enter an amount";
  const CONNECT_WALLET = "Connect wallet";
  const SWAP = "Swap";

  const [estimatedQuote, setEstimatedQuote] = useState<string | null>(null);

  const [swapBtnText, setSwapBtnText] = useState(ENTER_AMOUNT);
  const [txPending, setTxPending] = useState(false);

  const notifyError = (msg: string) => toast.error(msg, { duration: 6000 });
  const notifySuccess = () => toast.success("Transaction completed.");
  const { address } = useAccount();

  function getPathForTokenToEth(srcToken: string): string[] | null {
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
      pair => pair[0] === ETH && pair[1] === destToken
    ) || [null, null];

    if (tokenA && tokenB) {
      return [tokenA, tokenB];
    }

    return null;
  }

  const getAmountOut = async (
    amountA: number,
    reserveA: number,
    reserveB: number
  ) => {
    const swapRouter = contract("swapRouter");
    try {
      if (amountA != 0) {
        const response = await swapRouter?.getAmountOut(
          toEth(amountA.toString()),
          toEth(reserveA.toString()),
          toEth(reserveB.toString())
        );
        console.log("Response in getAmountOut: ", response);

        const formattedResponse = parseFloat(formatEth(response)).toFixed(2);
        console.log("Formatted Response: ", formattedResponse);

        setAmountOut(formattedResponse);
        setOutputValue(formattedResponse);
      }
    } catch (error) {
      console.log("Error: ", error);
    }
  };

  const getAmountIn = async (
    amountB: number,
    reserveA: number,
    reserveB: number
  ) => {
    const swapRouter = contract("swapRouter");
    try {
      if (amountB != 0) {
        const response = await swapRouter?.getAmountIn(
          toEth(amountB.toString()),
          toEth(reserveA.toString()),
          toEth(reserveB.toString())
        );
        console.log("Response in getAmountIn: ", response);

        console.log(
          "Input Value in getAmountIn: ",
          ethers.utils.formatEther(response)
        );

        const formattedResponse = parseFloat(formatEth(response)).toFixed(2);
        setAmountIn(formattedResponse);
        setInputValue(formattedResponse);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getReserves = async (tokenA: string, tokenB: string) => {
    try {
      const response = await swapRouter?.getReserve(tokenA, tokenB);

      console.log("Reserve A: ", formatEth(response?.reserveA));
      console.log("Reserve B: ", formatEth(response?.reserveB));

      setReserveA(formatEth(response?.reserveA));
      setReserveB(formatEth(response?.reserveB));
    } catch (error) {
      console.error("Failed to fetch reserves: ", error);
    }
  };

  const performSwap = async () => {
    setTxPending(true);
    let receipt: any = null;
    let path: string[] | null = null;

    try {
      // if (!srcToken || !destToken) {
      //   throw "Tokens not selected";
      // }

      // if (
      //   typeof inputValue !== "number" ||
      //   isNaN(inputValue) ||
      //   inputValue <= 0
      // ) {
      //   throw "Invalid input value";
      // }

      if (srcToken?.name === "ETH" && destToken?.name === "WETH") {
        if (address) {
          receipt = await depositEthForWeth(toWei(inputValue.toString()));
        } else {
          throw "Wallet not connected";
        }
      } else if (srcToken?.name === "WETH" && destToken?.name === "ETH") {
        if (address) {
          receipt = await withdrawWethForEth(toWei(inputValue.toString()));
        } else {
          throw "Wallet not connected";
        }
      }

      if (exactAmountIn) {
        if (
          srcToken?.name === "ETH" &&
          destToken?.name !== "ETH" &&
          destToken?.name !== "WETH"
        ) {
          path = getPathForTokenToEth(destToken?.address || "");

          if (path) {
            const concatenatedPath = path.join(",");
            receipt = await swapExactAmountOfEthForTokens(
              inputValue.toString(),
              concatenatedPath
            );
          } else {
            throw "Invalid path";
          }
        } else if (srcToken?.name !== "ETH" && destToken?.name === "ETH") {
          path = getPathForTokenToEth(srcToken?.address || "");

          if (path) {
            const concatenatedPath = path.join(",");
            receipt = await swapExactAmountOfTokensForEth(
              inputValue.toString(),
              concatenatedPath
            );
          } else {
            throw "Invalid path";
          }
        } else if (srcToken?.name !== "ETH" && destToken?.name !== "ETH") {
          path = getPathForTokensToTokens(
            srcToken?.address || "",
            destToken?.address || ""
          );

          if (path) {
            const concatenatedPath = path.join(",");
            receipt = await swapExactAmountOfTokens(
              inputValue.toString(),
              concatenatedPath
            );
          } else {
            throw "Invalid path";
          }
        }
        // if (!receipt || !("transactionHash" in receipt)) {
        //   throw "Transaction failed";
        // }
        notifySuccess();
      } else if (exactAmountOut) {
        if (srcToken?.name === "ETH" && destToken?.name !== "ETH") {
          path = getPathForETHToToken(destToken?.address || "");

          if (path) {
            const concatenatedPath = path.join(",");
            receipt = await swapEthForExactAmountOfTokens(
              outputValue.toString(),
              concatenatedPath,
              inputValue.toString()
            );
          } else {
            throw "Invalid path";
          }
        } else if (srcToken?.name !== "ETH" && destToken?.name === "ETH") {
          path = getPathForETHToToken(srcToken?.address || "");

          if (path) {
            const concatenatedPath = path.join(",");
            receipt = await swapTokensForExactAmountOfEth(
              outputValue.toString(),
              concatenatedPath,
              inputValue.toString()
            );
          } else {
            throw "Invalid path";
          }
        } else if (srcToken?.name !== "ETH" && destToken?.name !== "ETH") {
          path = getPathForTokensToTokens(
            srcToken?.address || "",
            destToken?.address || ""
          );

          if (path) {
            const concatenatedPath = path.join(",");
            receipt = await swapTokensForExactAmount(
              outputValue.toString(),
              concatenatedPath
            );
          } else {
            throw "Invalid path";
          }
        }
        if (!receipt || !("transactionHash" in receipt)) {
          throw "Transaction failed";
        }
      }

      notifySuccess();
    } catch (error) {
      if (typeof error === "string") {
        notifyError(error);
      } else {
        console.error("Error: ", error);
      }
    } finally {
      setTxPending(false);
    }
  };

  const handleSwap = async () => {
    if (!address) return;

    if (srcToken?.name === "ETH" && destToken?.name === "WETH") {
      performSwap();
    } else {
      setTxPending(true);
      console.log("srcToken Name: ", srcToken?.name);
      console.log("destToken Name: ", destToken?.name);
      const result = await hasValidAllowance(
        address,
        srcToken?.name || "",
        inputValue.toString()
      );
      setTxPending(false);

      if (result) performSwap();
      else handleInsufficientAllowance();
    }

    if (exactAmountIn) {
      if (
        srcToken?.name === "ETH" &&
        destToken?.name !== "ETH" &&
        destToken?.name !== "WETH"
      ) {
        performSwap();
      } else if (srcToken?.name !== "ETH" && destToken?.name === "ETH") {
        performSwap();
      } else if (srcToken?.name !== "ETH" && destToken?.name !== "ETH") {
        performSwap();
      } else {
        setTxPending(true);
        console.log("srcToken Name: ", srcToken?.name);
        console.log("destToken Name: ", destToken?.name);
        const result = await hasValidAllowance(
          address,
          srcToken?.name || "",
          inputValue.toString()
        );
        setTxPending(false);

        if (result) performSwap();
        else handleInsufficientAllowance();
      }
    } else if (exactAmountOut) {
      if (srcToken?.name === "ETH" && destToken?.name !== "ETH") {
        performSwap();
      } else if (srcToken?.name !== "ETH" && destToken?.name === "ETH") {
        performSwap();
      } else if (srcToken?.name !== "ETH" && destToken?.name !== "ETH") {
        performSwap();
      } else {
        setTxPending(true);
        console.log("srcToken Name: ", srcToken?.name);
        console.log("destToken Name: ", destToken?.name);
        const result = await hasValidAllowance(
          address,
          srcToken?.name || "",
          inputValue.toString()
        );
        setTxPending(false);

        if (result) performSwap();
        else handleInsufficientAllowance();
      }
    }
  };

  const handleIncreaseAllowance = async () => {
    setTxPending(true);
    await increaseAllowance(srcToken?.name || "", inputValue.toString());
    setTxPending(false);

    setSwapBtnText(SWAP);
  };

  useEffect(() => {
    if (srcToken?.address && destToken?.address) {
      getReserves(srcToken?.address, destToken?.address);
    }
  }, [srcToken, destToken]);

  useEffect(() => {
    const fetchQuote = async () => {
      if (srcToken?.address && destToken?.address) {
        const quoteResponse = await quote(
          inputValue.toString(),
          reserveA,
          reserveB
        );
        setEstimatedQuote(quoteResponse?.toString() || null);
      }
    };
    fetchQuote();
  }, [srcToken, destToken, inputValue, reserveA, reserveB]);

  useEffect(() => {
    if (!address) setSwapBtnText(CONNECT_WALLET);
    else if (!inputValue || !outputValue) setSwapBtnText(ENTER_AMOUNT);
    else setSwapBtnText(SWAP);
  }, [inputValue, outputValue, address]);

  return (
    <>
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
            setToken={setSrcToken}
            ignoreValue={destToken?.name || ""}
            handleChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const inputValue = Number(e.target.value);

              if (inputValue !== 0) {
                setInputValue(e.target.value);
                getAmountOut(
                  Number(inputValue),
                  Number(reserveA),
                  Number(reserveB)
                );
                setExactAmountIn(true);
              } else {
                console.error("Input value is empty");
              }
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
            setToken={setDestToken}
            ignoreValue={srcToken?.name || ""}
            handleChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setOutputValue(e.target.value);
              console.log("Output Value: ", outputValue);
              getAmountIn(
                Number(e.target.value),
                Number(reserveA),
                Number(reserveB)
              );
              setExactAmountOut(true);
            }}
          />
          {estimatedQuote !== null && destToken?.name !== "WETH" && (
            <p className="text-zinc-400 text-sm mt-2">
              Estimated Quote: {estimatedQuote} {destToken?.name}
            </p>
          )}
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

      <div className="bg-zinc-900 w-[35%] p-4 px-6 rounded-xl mt-10">
        <div className="flex items-center justify-between py-4 px-1">
          <div>
            <div>Balance A</div>
            <div>"BalanceA"</div>
          </div>
          <div>
            <div>Balance B</div>
            <div>"BalanceB"</div>
          </div>
          <div>
            <div>Reserve A</div>
            <div>"ReserveA"</div>
          </div>
          <div>
            <div>Reserve B</div>
            <div>"ReserveB"</div>
          </div>
        </div>
      </div>
    </>
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
