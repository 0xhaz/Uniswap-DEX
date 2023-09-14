import { BigNumber, Contract, Signer, ethers, providers } from "ethers";
import { toEth, toWei, formatEth } from "./ether-utils";
import {
  tokenContract,
  contract,
  wethContract,
  tokenContractMap,
  contractMap,
} from "./contracts";

const getDeadline = () => {
  const deadline = Math.floor(Date.now() / 1000) + 600; // 10 minutes
  return deadline;
};

const getAccount = async () => {
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum as any);
    const signer = provider.getSigner();
    const address = await signer.getAddress();
    return address;
  } catch (error) {
    console.error("Error getting account", error);
    return null;
  }
};

const provider = new ethers.providers.Web3Provider(window.ethereum as any);
let address: string;

/////////////////////// TOKENS ///////////////////////

export const approveTokens = async (
  tokenInAddress: string,
  abi: any,
  spenderAddress: string,
  amountIn: string
) => {
  try {
    const signer = provider.getSigner();

    const tx = await tokenContract(tokenInAddress, abi)
      .connect(signer)
      .approve(spenderAddress, toEth(amountIn));
    await tx.wait();

    console.log(`Approved ${tokenInAddress} for ${amountIn} tokens`);
  } catch (error) {
    console.error("Approval Error: ", error);
    return false;
  }
};

export const getBalance = async (
  tokenAddress: string,
  walletAddress: string
) => {
  try {
    if (!(tokenAddress in tokenContractMap)) {
      throw new Error(`Token ${tokenAddress} not supported`);
      return null;
    }
    const { address, abi } = tokenContractMap[tokenAddress];

    const selectedTokenContract = tokenContract(address, abi);

    const balance = await selectedTokenContract.balanceOf(walletAddress);

    const balanceEth = ethers.utils.formatEther(balance);

    return balanceEth;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const getEthBalance = async (walletAddress: string) => {
  try {
    const balance = await provider.getBalance(walletAddress);
    const balanceEth = ethers.utils.formatEther(balance);

    return balanceEth;
  } catch (error) {
    console.log(error);
    return null;
  }
};

////////////////////// SWAP //////////////////////

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

export const depositEthForWeth = async (amountIn: string) => {
  try {
    const amountInEth = ethers.utils.parseEther(amountIn);

    const weth = wethContract();
    const tx = await weth.deposit({
      from: await getAccount(),
      value: amountInEth,
    });
    await tx.wait();
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
    console.log("Amount In: ", toWei(response));
    return toWei(response);
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
    console.log("Amount Out: ", toWei(response));
    return toWei(response);
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

export const quote = async (
  amountIn: string,
  reserveA: string,
  reserveB: string
) => {
  const swapRouter = contract("swapRouter");
  try {
    const amountInWei = formatEth(amountIn);
    const reserveAWei = toWei(reserveA);
    const reserveBWei = toWei(reserveB);
    const response = await swapRouter?.quote(
      amountInWei,
      reserveAWei,
      reserveBWei
    );
    const responseEth = toEth(response);
    console.log("Quote: ", responseEth);
    return responseEth;
  } catch (error) {
    console.log(error);
    return null;
  }
};

////////////////////// LIQUIDITY //////////////////////

export const liquidityExistsForPair = async (
  tokenOneAddress: string,
  tokenTwoAddress: string,
  userAddress: string
) => {
  const swapFactory = contract("swapFactory");
  const signer = provider.getSigner();
  try {
    const pairAddress = await swapFactory?.getPair(
      tokenOneAddress,
      tokenTwoAddress
    );

    const pairContract = new Contract(
      pairAddress,
      [
        "function balanceOf(address) view returns (uint)",
        "function token0() view returns (address)",
        "function token1() view returns (address)",
      ],
      signer
    );

    const balance = await pairContract?.balanceOf(userAddress);
    const token0Address = await pairContract?.token0();
    const token1Address = await pairContract?.token1();

    if (balance && BigNumber.from(balance).gt(BigNumber.from(0))) {
      return {
        pairAddress,
        balance: balance.toString(),
        token0Address,
        token1Address,
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const addLiquidity = async (
  tokenOneAddress: string,
  tokenTwoAddress: string,
  valueOne: string,
  valueTwo: string
) => {
  const swapRouter = contract("swapRouter");
  try {
    if (valueOne && valueTwo) {
      const deadline = getDeadline();
      const userAddress = await getAccount();
      console.log("tokenOneAddress: ", tokenOneAddress);
      console.log("tokenTwoAddress: ", tokenTwoAddress);

      const _addLiquidity = await swapRouter?.addLiquidity(
        tokenOneAddress,
        tokenTwoAddress,
        toEth(valueOne),
        toEth(valueTwo),
        1,
        1,
        userAddress,
        deadline
      );
      await _addLiquidity.wait();
    }
  } catch (error) {
    console.error(error);
  }
};

export const addLiquidityETH = async (
  addressToken: string,
  valueToken: string,
  valueETH: string
) => {
  const swapRouter = contract("swapRouter");
  try {
    // await approveTokens(addressToken, valueToken);
    const _valueETH = toEth(valueETH.toString());
    const deadline = getDeadline();
    const userAddress = await getAccount();
    const _addLiquidityETH = await swapRouter?.addLiquidityETH(
      addressToken,
      toEth(valueToken.toString()),
      1,
      1,
      userAddress,
      deadline,
      { value: _valueETH }
    );
    await _addLiquidityETH.wait();
  } catch (error) {
    console.error(error);
  }
};

export const removeLiquidity = async (
  addressTokenA: string,
  addressTokenB: string,
  liquidityAmount: string
) => {
  const swapRouter = contract("swapRouter");
  try {
    const deadline = getDeadline();
    const userAddress = await getAccount();

    if (addressTokenA && addressTokenB && liquidityAmount) {
      const estimateGas = await swapRouter.estimateGas.removeLiquidity(
        addressTokenA,
        addressTokenB,
        toEth(liquidityAmount.toString()),
        0,
        0,
        userAddress,
        deadline
      );

      const gasBuffer = 10000;
      const gasLimit = estimateGas.add(gasBuffer);

      const _removeLiquidity = await swapRouter?.removeLiquidity(
        addressTokenA,
        addressTokenB,
        toEth(liquidityAmount.toString()),
        0,
        0,
        userAddress,
        deadline,
        { gasLimit }
      );
      await _removeLiquidity.wait();
    }
  } catch (error) {
    console.error(error);
  }
};

export const removeLiquidityETH = async (
  addressToken: string,
  liquidityAmount: string
) => {
  const swapRouter = contract("swapRouter");
  try {
    if (liquidityAmount) {
      const deadline = getDeadline();
      const userAddress = await getAccount();
      const _removeLiquidityETH = await swapRouter?.removeLiquidityETH(
        addressToken,
        toEth(liquidityAmount),
        0,
        0,
        userAddress,
        deadline
      );
      await _removeLiquidityETH.wait();
    }
  } catch (error) {
    console.error(error);
  }
};

export const getLiquidity = async (
  walletAddress: string,
  addressTokenA: string,
  addressTokenB: string
) => {
  const swapRouter = contract("swapRouter");
  try {
    const liquidity = await swapRouter?.getLiquidityAmount(
      walletAddress,
      addressTokenA,
      addressTokenB
    );

    const liquidityAmount = formatEth(liquidity);
    // console.log("Liquidity Amount: ", liquidityAmount);
    // console.log("Token A Address: ", addressTokenA);
    // console.log("Token B Address: ", addressTokenB);

    return liquidityAmount;
  } catch (error) {
    console.error(error);
    return "0";
  }
};
