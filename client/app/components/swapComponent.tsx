import React, { useEffect, useState, useRef } from "react";
import {
  approveTokens,
  swapTokensForExactAmount,
  swapExactAmountOfEthForTokens,
  swapEthForExactAmountOfTokens,
  swapTokensForExactAmountOfEth,
  swapExactAmountOfTokensForEth,
  swapExactAmountOfTokens,
  getAmountIn,
  getAmountOut,
  getAmountsIn,
  getAmountsOut,
  quote,
} from "../../utils/queries";
import { contract, tokenContract } from "@/utils/contracts";
import { CogIcon, ArrowSmDownIcon } from "@heroicons/react/outline";
import SwapField from "./swapField";
import TransactionStatus from "./transactionStatus";
import toast, { Toaster } from "react-hot-toast";
import {
  DEFAULT_VALUE,
  tokens,
  ETH,
  CONTRACTS,
  pathLINK_USDC,
  pathLINK_USDT,
  pathLINK_WETH,
  pathUSDC_LINK,
  pathUSDC_USDT,
  pathUSDC_WETH,
  pathUSDT_LINK,
  pathUSDT_USDC,
  pathUSDT_WETH,
  pathWETH_LINK,
  pathWETH_USDC,
  pathWETH_USDT,
} from "../constants/constants";
import { toEth, toWei } from "../../utils/ether-utils";
import { useAccount } from "wagmi";

const SwapComponent = () => {
  const [srcToken, setSrcToken] = useState<string>("ETH");
  const [destToken, setDestToken] = useState<string>(DEFAULT_VALUE);
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

  const srcTokenObj = {
    id: "srcToken",
    value: inputValue,
    setValue: setInputValue,
    defaultValue: srcToken,
    ignoreValue: destToken,
    setToken: setSrcToken,
    exactAmountIn: exactAmountIn,
    setExactAmountIn: setExactAmountIn,
  };

  const destTokenObj = {
    id: "destToken",
    value: outputValue,
    setValue: setOutputValue,
    defaultValue: destToken,
    ignoreValue: srcToken,
    setToken: setDestToken,
    exactAmountIn: exactAmountOut,
    setExactAmountIn: setExactAmountOut,
  };

  const [srcTokenComp, setSrcTokenComp] = useState<JSX.Element | null>(null);
  const [destTokenComp, setDestTokenComp] = useState<JSX.Element | null>(null);
  const [estimatedQuote, setEstimatedQuote] = useState<string | null>(null);

  const [swapBtnText, setSwapBtnText] = useState(ENTER_AMOUNT);
  const [txPending, setTxPending] = useState(false);

  const notifyError = (msg: string) => toast.error(msg, { duration: 6000 });
  const notifySuccess = () => toast.success("Transaction completed.");
  const { address } = useAccount();

  // get pair path
  function getPathForTokenToETH(srcToken: string): string[] | null {
    // define a mapping of token addresses to their respective paths to ETH
    const tokenToETHPaths = {
      [CONTRACTS.USDT.address]: pathUSDT_WETH,
      [CONTRACTS.USDC.address]: pathUSDC_WETH,
      [CONTRACTS.LINK.address]: pathLINK_WETH,
    };

    // Check if a path exists for the given source token
    if (srcToken in tokenToETHPaths) {
      return tokenToETHPaths[srcToken];
    }

    return null;
  }

  function getPathForTokensToTokens(
    srcToken: string,
    destToken: string
  ): string[] | null {
    const tokenPairsToPath = {
      [`${CONTRACTS.USDT.address}-${CONTRACTS.USDC.address}`]: pathUSDT_USDC,
      [`${CONTRACTS.USDT.address}-${CONTRACTS.LINK.address}`]: pathUSDT_LINK,
      [`${CONTRACTS.USDC.address}-${CONTRACTS.USDT.address}`]: pathUSDC_USDT,
      [`${CONTRACTS.USDC.address}-${CONTRACTS.LINK.address}`]: pathUSDC_LINK,
      [`${CONTRACTS.LINK.address}-${CONTRACTS.USDT.address}`]: pathLINK_USDT,
      [`${CONTRACTS.LINK.address}-${CONTRACTS.USDC.address}`]: pathLINK_USDC,
    };

    const tokenPairKey = `${srcToken}-${destToken}`;

    if (tokenPairKey in tokenPairsToPath) {
      return tokenPairsToPath[tokenPairKey];
    }

    return null;
  }

  function getPathForETHToToken(destToken: string): string[] | null {
    const ETHToTokenPaths = {
      [CONTRACTS.USDT.address]: pathWETH_USDT,
      [CONTRACTS.USDC.address]: pathWETH_USDC,
      [CONTRACTS.LINK.address]: pathWETH_LINK,
    };

    if (destToken in ETHToTokenPaths) {
      return ETHToTokenPaths[destToken];
    }

    return null;
  }

  // Functions for functionality

  const performSwap = async () => {
    setTxPending(true);
    let receipt;
    let path: string[] | null = null;
    if (exactAmountIn && Number(exactAmountIn) > 0) {
      if (srcToken === ETH && destToken !== ETH) {
        path = getPathForTokenToETH(destToken);

        if (path) {
          const concatenatedPath = path.join(",");
          receipt = await swapExactAmountOfEthForTokens(
            srcToken,
            concatenatedPath
          );
        } else {
          console.error("Invalid path");
        }
      } else if (srcToken !== ETH && destToken === ETH) {
        path = getPathForTokenToETH(srcToken);
        if (path) {
          const concatenatedPath = path.join(",");
          receipt = await swapExactAmountOfTokensForEth(
            srcToken,
            concatenatedPath
          );
        } else {
          console.error("Invalid path");
        }
      } else if (srcToken !== ETH && destToken !== ETH) {
        path = getPathForTokensToTokens(srcToken, destToken);

        if (path) {
          const concatenatedPath = path.join(",");
          receipt = await swapExactAmountOfTokens(srcToken, concatenatedPath);
        } else {
          console.error("Invalid path");
        }
      }
    } else if (exactAmountOut && Number(exactAmountOut) > 0) {
      if (srcToken === ETH && destToken !== ETH) {
        path = getPathForETHToToken(destToken);

        if (path) {
          const concatenatedPath = path.join(",");
          receipt = await swapEthForExactAmountOfTokens(
            srcToken,
            concatenatedPath,
            exactAmountOut
          );
        } else {
          console.error("Invalid path");
        }
      } else if (srcToken !== ETH && destToken === ETH) {
        path = getPathForTokenToETH(srcToken);

        if (path) {
          const concatenatedPath = path.join(",");
          receipt = await swapTokensForExactAmountOfEth(
            toWei(exactAmountOut),
            concatenatedPath,
            toWei(exactAmountIn),
            srcToken
          );
        } else {
          console.error("Invalid path");
        }
      } else if (srcToken !== ETH && destToken !== ETH) {
        path = getPathForTokensToTokens(srcToken, destToken);

        if (path) {
          const concatenatedPath = path.join(",");
          receipt = await swapTokensForExactAmount(destToken, concatenatedPath);
        } else {
          console.error("Invalid path");
        }
      }
    }
  };

  const handleSwap = async () => {
    if (exactAmountIn && Number(exactAmountIn) > 0) {
      setIsExactAmountSet(true);
      if (srcToken === ETH && destToken !== ETH) {
        performSwap();
      } else if (srcToken !== ETH && destToken === ETH) {
        setTxPending(true);
        const result = await approveTokens(srcToken, inputValue);
        setTxPending(false);

        if (result) {
          const amountIn = await getAmountIn(
            exactAmountOut,
            reserveA,
            reserveB
          );
          if (amountIn) {
            setInputValue(amountIn.toString());
          } else {
            handleInsufficientAllowance();
          }
        } else handleInsufficientAllowance();
      }
    } else if (exactAmountOut && Number(exactAmountOut) > 0) {
      setIsExactAmountOutSet(true);
      if (srcToken === ETH && destToken !== ETH) {
        performSwap();
      } else if (srcToken !== ETH && destToken === ETH) {
        setTxPending(true);
        const result = await approveTokens(srcToken, inputValue);
        setTxPending(false);

        if (result) {
          const amountOut = await getAmountOut(
            exactAmountIn,
            reserveA,
            reserveB
          );
          if (amountOut) {
            setOutputValue(amountOut.toString());
          } else {
            handleInsufficientAllowance();
          }
        } else handleInsufficientAllowance();
      }
    }
  };

  const getReserves = async (tokenA: string, tokenB: string) => {
    const swapRouter = contract("swapRouter");
    try {
      const response = await swapRouter?.getReserve(tokenA, tokenB);
      setReserveA(toEth(response.reserveA));
      setReserveB(toEth(response.reserveB));
      console.log(toEth(response.reserveA), toEth(response.reserveB));
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    // Handling the text of the submit button

    if (!address) setSwapBtnText(CONNECT_WALLET);
    else if (!inputValue || !outputValue) setSwapBtnText(ENTER_AMOUNT);
    else setSwapBtnText(SWAP);
  }, [inputValue, outputValue, address]);

  useEffect(() => {
    if (
      document.activeElement &&
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
      document.activeElement &&
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

  useEffect(() => {
    if (srcToken != "0" && destToken != "0" && srcToken !== destToken) {
      getReserves(srcToken, destToken);
    }
  }, [srcToken, destToken]);

  useEffect(() => {
    if (srcToken !== DEFAULT_VALUE && destToken !== DEFAULT_VALUE) {
      const amountIn = isExactAmountSet ? exactAmountIn : inputValue;
      const amountOut = isExactAmountOutSet ? exactAmountOut : outputValue;

      const quoteResult = quote(amountIn, reserveA, reserveB);

      setEstimatedQuote(quoteResult);
    }
  }, [
    srcToken,
    destToken,
    exactAmountIn,
    exactAmountOut,
    inputValue,
    outputValue,
    reserveA,
    reserveB,
  ]);

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
        {estimatedQuote !== null && (
          <p className="text-zinc-400 text-sm mt-2">
            Estimated Quote: {estimatedQuote} {destToken}
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
    // Setting the isReversed value to prevent the input/output values
    // being calculated in their respective side - effects
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

  async function populateOutputValue(inputValue: string) {
    if (
      destToken === DEFAULT_VALUE ||
      srcToken === DEFAULT_VALUE ||
      !inputValue
    )
      return;

    try {
      if (srcToken !== ETH && destToken !== ETH) setOutputValue(inputValue);
      else if (srcToken === ETH && destToken !== ETH) {
        const path = getPathForTokensToTokens(srcToken, destToken);
        if (path) {
          const outputAmounts = await getAmountsOut(toWei(inputValue), path);
          if (outputAmounts && outputAmounts.length > 0) {
            const outValue = toEth(outputAmounts[outputAmounts.length - 1]);
            setOutputValue(outValue.toString());
          } else {
            setOutputValue("0");
          }
        }
      } else if (srcToken !== ETH && destToken === ETH) {
        const path = getPathForTokensToTokens(srcToken, destToken);
        if (path) {
          const outputAmounts = await getAmountsOut(toWei(inputValue), path);
          if (outputAmounts && outputAmounts.length > 0) {
            const outValue = toEth(outputAmounts[outputAmounts.length - 1]);
            setOutputValue(outValue.toString());
          } else {
            setOutputValue("0");
          }
        }
      }
    } catch (error) {
      setOutputValue("0");
    }
  }

  async function populateInputValue(outputValue: string) {
    if (
      destToken === DEFAULT_VALUE ||
      srcToken === DEFAULT_VALUE ||
      !outputValue
    )
      return;

    try {
      if (srcToken !== ETH && destToken !== ETH) setInputValue(outputValue);
      else if (srcToken === ETH && destToken !== ETH) {
        const path = getPathForTokensToTokens(srcToken, destToken);

        if (path) {
          const inputAmounts = await getAmountsIn(toWei(outputValue), path);
          if (inputAmounts && inputAmounts.length > 0) {
            const inputValue = toEth(inputAmounts[0]);
            setInputValue(inputValue.toString());
          } else {
            setInputValue("0");
          }
        }
      } else if (srcToken !== ETH && destToken === ETH) {
        const path = getPathForTokensToTokens(srcToken, destToken);
        if (path) {
          const inputAmounts = await getAmountsIn(toWei(outputValue), path);
          if (inputAmounts && inputAmounts.length > 0) {
            const inputValue = toEth(inputAmounts[0]);
            setInputValue(inputValue.toString());
          } else {
            setInputValue("0");
          }
        }
      }
    } catch (error) {
      setInputValue("0");
    }
  }

  function handleInsufficientAllowance() {
    notifyError(
      "Insufficient allowance. Click 'Increase allowance' to increase it."
    );
    setSwapBtnText(INCREASE_ALLOWANCE);
  }
};

export default SwapComponent;
