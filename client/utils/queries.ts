import { BigNumber, ethers } from "ethers";
import { toEth, toWei } from "./ether-utils";
import { tokenContract, contract } from "./contracts";

const getDeadline = () => {
  const deadline = Math.floor(Date.now() / 1000) + 600; // 10 minutes
  return deadline;
};

let address: string;

export const approveTokens = async (
  tokenInAddress: string,
  amountIn: string
) => {
  try {
    const selectedTokenContract = tokenContract(tokenInAddress);
    const swapRouterContract = contract("swapRouter");

    const tx = await selectedTokenContract.approve(
      swapRouterContract,
      toWei(amountIn)
    );

    await tx.wait();
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};

export const swapExactAmountOfTokens = async (
  amountIn: string,
  path: string
) => {
  try {
    if (amountIn) {
      const deadline = getDeadline();
      const swapRouter = contract("swapRouter");
      const _swapExactTokens = await swapRouter?.swapExactTokensForTokens(
        toWei(amountIn),
        1,
        path,
        address,
        deadline
      );

      await _swapExactTokens.wait();
    }
  } catch (error) {
    console.log(error);
  }
};

export const swapTokensForExactAmount = async (
  amountOut: string,
  path: string
) => {
  try {
    if (amountOut) {
      const deadline = getDeadline();
      const swapRouter = contract("swapRouter");
      const _swapTokensForExact = await swapRouter?.swapTokensForExactTokens(
        toWei(amountOut),
        1,
        path,
        address,
        deadline
      );

      await _swapTokensForExact.wait();
    }
  } catch (error) {
    console.log(error);
  }
};

export const swapExactAmountOfEthForTokens = async (
  amountIn: string,
  path: string
) => {
  try {
    if (amountIn) {
      const deadline = getDeadline();
      const swapRouter = contract("swapRouter");
      const _swapExactEthForTokens = await swapRouter?.swapExactETHForTokens(
        1,
        path,
        address,
        deadline
      );

      await _swapExactEthForTokens.wait();
    }
  } catch (error) {
    console.log(error);
  }
};

export const swapEthForExactAmountOfTokens = async (
  amountOut: string,
  path: string,
  amountETH: string
) => {
  try {
    if (amountOut) {
      const _amount = toWei(amountETH);
      const _deadline = getDeadline();
      const swapRouter = contract("swapRouter");
      const _swapEthForExactTokens = await swapRouter?.swapETHForExactTokens(
        toWei(amountOut),
        path,
        address,
        _deadline,
        { value: _amount }
      );

      await _swapEthForExactTokens.wait();
    }
  } catch (error) {
    console.log(error);
  }
};

export const swapTokensForExactAmountOfEth = async (
  amountOut: string,
  path: string,
  amountIn: string,
  selectedTokenAddress: string
) => {
  try {
    if (amountOut) {
      const selectedTokenContract = tokenContract(path);
      await approveTokens(selectedTokenAddress, toEth(toWei(amountIn)));
      const _deadline = getDeadline();
      const swapRouter = contract("swapRouter");
      const _swapTokensForExactETH = await swapRouter?.swapTokensForExactETH(
        toWei(amountOut),
        1,
        path,
        address,
        _deadline
      );

      await _swapTokensForExactETH.wait();
    }
  } catch (error) {
    console.log(error);
  }
};

export const swapExactAmountOfTokensForEth = async (
  amountIn: string,
  path: string
) => {
  try {
    if (amountIn) {
      const deadline = getDeadline();
      const swapRouter = contract("swapRouter");
      const _swapExactTokensForEth = await swapRouter?.swapExactTokensForETH(
        toWei(amountIn),
        1,
        path,
        address,
        deadline
      );

      await _swapExactTokensForEth.wait();
    }
  } catch (error) {
    console.log(error);
  }
};

export const getAmountIn = async (
  amountB: string,
  reserveA: string,
  reserveB: string
) => {
  const swapRouter = contract("swapRouter");
  try {
    const response = await swapRouter?.getAmountIn(amountB, reserveA, reserveB);
    console.log("Amount In: ", toEth(response));
    return toEth(response);
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const getAmountOut = async (
  amountA: string,
  reserveA: string,
  reserveB: string
) => {
  const swapRouter = contract("swapRouter");
  try {
    const response = await swapRouter?.getAmountOut(
      amountA,
      reserveA,
      reserveB
    );
    console.log("Amount Out: ", toEth(response));
    return toEth(response);
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const getAmountsIn = async (amountOut: string, path: string[]) => {
  const swapRouter = contract("swapRouter");
  try {
    const response = await swapRouter?.getAmountsIn(amountOut, path);
    console.log(
      "Amounts In: ",
      response.map((amount: string) => toEth(amount))
    );
    return response.map((amount: string) => toEth(amount));
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const getAmountsOut = async (amountIn: string, path: string[]) => {
  const swapRouter = contract("swapRouter");
  try {
    const response = await swapRouter?.getAmountsOut(amountIn, path);
    console.log(
      "Amounts Out: ",
      response.map((amount: string) => toEth(amount))
    );
    return response.map((amount: string) => toEth(amount));
  } catch (error) {
    console.log(error);
    return null;
  }
};

export function quote(amountIn: string, reserveA: string, reserveB: string) {
  const swapRouter = contract("swapRouter");
  try {
    const response = swapRouter?.quote(amountIn, reserveA, reserveB);
    console.log("Quote: ", toEth(response));
    return toEth(response);
  } catch (error) {
    console.log(error);
    return null;
  }
}
