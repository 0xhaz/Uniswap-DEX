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
  getBalance,
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

  const [srcBalance, setSrcBalance] = useState<string>("");
  const [destBalance, setDestBalance] = useState<string>("");

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
      return [tokenA, tokenB].toString().split(",");
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

  const fetchBalance = async () => {
    if (!address) return;

    if (srcToken?.address && destToken?.address) {
      const [srcBalanceValue, destBalanceValue] = await Promise.all([
        getBalance(srcToken?.name, address),
        getBalance(destToken?.name, address),
      ]);

      setSrcBalance(srcBalanceValue || "0");
      setDestBalance(destBalanceValue || "0");
    }
  };

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

        const formattedResponse = parseFloat(formatEth(response)).toFixed(2);

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
      if (srcToken?.name === "ETH" && destToken?.name === "WETH") {
        if (address) {
          receipt = await depositEthForWeth(inputValue.toString());
        } else {
          throw "Wallet not connected";
        }
      } else if (srcToken?.name === "WETH" && destToken?.name === "ETH") {
        if (address) {
          receipt = await withdrawWethForEth(inputValue.toString());
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
            receipt = await swapExactAmountOfEthForTokens(
              inputValue.toString(),
              path
            );
          } else {
            throw "Invalid path";
          }
        } else if (srcToken?.name !== "ETH" && destToken?.name === "ETH") {
          path = getPathForTokenToEth(srcToken?.name || "");

          if (path) {
            receipt = await swapExactAmountOfTokensForEth(
              inputValue.toString(),
              path
            );
          } else {
            throw "Invalid path";
          }
        } else if (srcToken?.name !== "ETH" && destToken?.name !== "ETH") {
          path = getPathForTokensToTokens(
            srcToken?.address || "",
            destToken?.address || ""
          );

          console.log("Path: ", path);
          console.log("srcToken Address: ", srcToken?.address);
          console.log("destToken Address: ", destToken?.address);

          if (path) {
            receipt = await swapExactAmountOfTokens(
              inputValue.toString(),
              path
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
            receipt = await swapEthForExactAmountOfTokens(
              outputValue.toString(),
              path,
              inputValue.toString()
            );
          } else {
            throw "Invalid path";
          }
        } else if (srcToken?.name !== "ETH" && destToken?.name === "ETH") {
          path = getPathForETHToToken(srcToken?.address || "");

          if (path) {
            receipt = await swapTokensForExactAmountOfEth(
              outputValue.toString(),
              path,
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

          console.log("Path: ", path);

          if (path) {
            receipt = await swapTokensForExactAmount(
              outputValue.toString(),
              path
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

    const sourceTokenName = srcToken?.name || "";
    const destTokenName = destToken?.name || "";

    const hasSourceTokenAllowance = await hasValidAllowance(
      address,
      sourceTokenName,
      inputValue.toString()
    );

    const hasDestTokenAllowance = await hasValidAllowance(
      address,
      destTokenName,
      inputValue.toString()
    );

    const isExactAmountIn = !!exactAmountIn;
    const isExactAmountOut = !!exactAmountOut;
    const isEthToWethSwap =
      sourceTokenName === "ETH" && destTokenName === "WETH";

    let shouldPerformSwap = false;

    if (isEthToWethSwap) {
      shouldPerformSwap = true;
    } else if (isExactAmountIn || isExactAmountOut) {
      shouldPerformSwap = hasSourceTokenAllowance || hasDestTokenAllowance;
    }

    if (shouldPerformSwap) {
      performSwap();
      setInputValue(0);
      setOutputValue(0);
    } else {
      handleInsufficientAllowance();
    }
  };

  const handleIncreaseAllowance = async () => {
    setTxPending(true);
    await increaseAllowance(srcToken?.name || "", inputValue.toString());
    notifySuccess();
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
        const parsedQuote = parseFloat(
          quoteResponse?.toString() || "0"
        ).toFixed(2);
        setEstimatedQuote(parsedQuote);
      }
    };
    fetchQuote();
  }, [srcToken, destToken, inputValue, reserveA, reserveB]);

  useEffect(() => {
    if (!address) setSwapBtnText(CONNECT_WALLET);
    else if (!inputValue || !outputValue) setSwapBtnText(ENTER_AMOUNT);
    else setSwapBtnText(SWAP);
  }, [inputValue, outputValue, address]);

  useEffect(() => {
    fetchBalance();
  }, [srcToken, destToken]);

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
              const newValue =
                e.target.value !== "" ? e.target.value : DEFAULT_VALUE;

              setInputValue(newValue);
              getAmountOut(
                Number(newValue),
                Number(reserveA),
                Number(reserveB)
              );
              setExactAmountIn(true);
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

      <div className="bg-zinc-900 w-[45%] p-4 px-6 rounded-xl mt-10">
        <div className="flex items-center justify-between py-4 px-1">
          <div>
            <div className="flex items-center justify-center p-2">
              Balance {srcToken?.name}
            </div>
            <div className="flex items-center justify-center">{srcBalance}</div>
          </div>
          <div>
            <div className="flex items-center justify-center p-2">
              Balance {destToken?.name}
            </div>
            <div className="flex items-center justify-center">
              {destBalance}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-center p-2">
              Reserve {srcToken?.name}
            </div>
            <div className="flex items-center justify-center">
              {parseFloat(reserveA).toFixed(2)}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-center p-2">
              Reserve {destToken?.name}
            </div>
            <div className="flex items-center justify-center">
              {parseFloat(reserveB).toFixed(2)}
            </div>
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

    // Swap srcToken and destToken
    const newSrcToken = destToken;
    const newDestToken = srcToken;

    // Use functional updates for state variables
    setSrcToken(() => newSrcToken);
    setDestToken(() => newDestToken);

    // Swap input and output values
    setInputValue(outputValue);
    setOutputValue(inputValue);
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
