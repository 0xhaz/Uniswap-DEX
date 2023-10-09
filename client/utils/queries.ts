import { BigNumber, Contract, Signer, ethers, providers } from "ethers";
import { toEth, toWei, formatEth } from "./ether-utils";
import {
  tokenContract,
  contract,
  wethContract,
  tokenContractMap,
  contractMap,
} from "./contracts";

import { useProvider, useSigner } from "wagmi";

const getDeadline = () => {
  const deadline = Math.floor(Date.now() / 1000) + 600; // 10 minutes
  return deadline;
};

const getAccount = async () => {
  try {
    if (typeof window !== "undefined" && window.ethereum) {
      const ethereum = window.ethereum as ethers.providers.ExternalProvider;

      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      return address;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting account", error);
    return null;
  }
};

// const provider = new ethers.providers.Web3Provider(window.ethereum as any);
// let address: string;

/////////////////////// TOKENS ///////////////////////

export const approveTokens = async (
  tokenInAddress: string,
  abi: any,
  spenderAddress: string,
  amountIn: string
) => {
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum as any);
    const signer = provider.getSigner();

    const token = tokenContract(tokenInAddress, abi);

    if (!token) {
      console.error(
        "Failed to get token contract for tokenName:",
        tokenInAddress
      );
      return false;
    }

    const tx = await token
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
    const { address, abi } = tokenContractMap[tokenAddress];

    const selectedTokenContract = tokenContract(address, abi);

    if (!selectedTokenContract) {
      console.error(
        "Failed to get token contract for tokenName:",
        tokenAddress
      );
      return null;
    }

    const balance = await selectedTokenContract.balanceOf(walletAddress);

    const parsedBalance = parseFloat(formatEth(balance)).toFixed(2);

    return parsedBalance;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const getEthBalance = async (walletAddress: string) => {
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum as any);
    const balance = await provider.getBalance(walletAddress);
    const balanceEth = ethers.utils.formatEther(balance);

    return balanceEth;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const hasValidAllowance = async (
  walletAddress: string,
  tokenName: string,
  amount: string
) => {
  try {
    const swapRouter = contract("swapRouter");
    const tokenInfo = tokenContractMap[tokenName];

    if (!swapRouter || !tokenInfo) {
      console.error("Missing contract information for tokenName:", tokenName);
      return false;
    }

    const tokenNameContract = tokenContract(tokenInfo.address, tokenInfo.abi);

    if (!tokenNameContract) {
      console.error("Failed to get token contract for tokenName:", tokenName);
      return false;
    }

    const data = await tokenNameContract?.allowance(
      walletAddress,
      swapRouter?.address
    );

    if (!data) {
      console.error("Missing data for tokenName:", tokenName);
      return false;
    }

    const result = BigNumber.from(data.toString()).gte(
      BigNumber.from(toWei(amount))
    );

    return result;
  } catch (error) {
    console.error("Error checking allowance for tokenName:", tokenName, error);
    return false;
  }
};

export const increaseAllowance = async (tokenName: string, amount: string) => {
  try {
    const swapRouter = contract("swapRouter");
    const tokenInfo = tokenContractMap[tokenName];

    if (!swapRouter || !tokenInfo) {
      console.error("Missing contract information for tokenName:", tokenName);
      return null;
    }

    const tokenNameContract = tokenContract(tokenInfo.address, tokenInfo.abi);

    if (!tokenNameContract) {
      console.error("Failed to get token contract for tokenName:", tokenName);
      return null;
    }

    const data = await tokenNameContract?.approve(
      swapRouter?.address,
      toWei(amount)
    );

    if (!data) {
      console.error("Failed to approve for tokenName:", tokenName);
      return null;
    }

    const receipt = await data.wait();
    return receipt;
  } catch (error) {
    console.error(
      "Error increasing allowance for tokenName:",
      tokenName,
      error
    );
    return null;
  }
};

export const mintTokens = async (tokenName: string) => {
  const tokenInfo = tokenContractMap[tokenName];
  const provider = new ethers.providers.Web3Provider(window.ethereum as any);
  const signer = provider.getSigner();
  try {
    const tokenNameContract = tokenContract(tokenInfo.address, tokenInfo.abi);
    const mint = await tokenNameContract?.mint(signer.getAddress());
    await mint.wait();
  } catch (error) {
    console.error(error);
  }
};

////////////////////// SWAP //////////////////////

export const swapExactAmountOfTokens = async (
  amountIn: string,
  path: string[]
) => {
  try {
    if (amountIn) {
      const deadline = getDeadline();
      const swapRouter = contract("swapRouter");
      const provider = new ethers.providers.Web3Provider(
        window.ethereum as any
      );
      const signer = provider.getSigner();

      const _swapExactTokens = await swapRouter?.swapExactTokensForTokens(
        toEth(amountIn.toString()),
        1,
        path.map(address => address.toLowerCase()), // Ensure all addresses are in lowercase
        signer.getAddress(),
        deadline,
        { gasLimit: 1000000 }
      );
      await _swapExactTokens.wait();
    }
  } catch (error) {
    console.log("Error ", error);
  }
};

export const swapTokensForExactAmount = async (
  amountOut: string,
  path: string[]
) => {
  try {
    if (amountOut) {
      const deadline = getDeadline();
      const swapRouter = contract("swapRouter");
      const provider = new ethers.providers.Web3Provider(
        window.ethereum as any
      );
      const signer = provider.getSigner();
      const _swapTokensForExact = await swapRouter?.swapTokensForExactTokens(
        toEth(amountOut.toString()),
        1,
        path.map(address => address.toLowerCase()),
        signer.getAddress(),
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
  path: string[]
) => {
  try {
    if (amountIn) {
      const _amount = toEth(amountIn.toString());
      const deadline = getDeadline();
      const swapRouter = contract("swapRouter");
      const provider = new ethers.providers.Web3Provider(
        window.ethereum as any
      );
      const signer = provider.getSigner();
      const _swapExactEthForTokens = await swapRouter?.swapExactETHForTokens(
        1,
        path.map(address => address.toLowerCase()),
        signer.getAddress(),
        deadline,
        { value: _amount }
      );

      await _swapExactEthForTokens.wait();
    }
  } catch (error) {
    console.log(error);
  }
};

export const swapEthForExactAmountOfTokens = async (
  amountOut: string,
  path: string[],
  amountETH: string
) => {
  try {
    if (amountOut) {
      const _amount = toEth(amountETH.toString());
      const _deadline = getDeadline();
      const swapRouter = contract("swapRouter");
      const provider = new ethers.providers.Web3Provider(
        window.ethereum as any
      );
      const signer = provider.getSigner();
      const _swapEthForExactTokens = await swapRouter?.swapETHForExactTokens(
        toEth(amountOut),
        path.map(address => address.toLowerCase()),
        signer.getAddress(),
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
  path: string[],
  amountIn: string
) => {
  try {
    if (amountOut) {
      const _deadline = getDeadline();
      const swapRouter = contract("swapRouter");
      const provider = new ethers.providers.Web3Provider(
        window.ethereum as any
      );
      const signer = provider.getSigner();
      const _swapTokensForExactETH = await swapRouter?.swapTokensForExactETH(
        toEth(amountOut.toString()),
        1,
        path.map(address => address.toLowerCase()),
        signer.getAddress(),
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
  path: string[]
) => {
  try {
    if (amountIn) {
      const deadline = getDeadline();
      const swapRouter = contract("swapRouter");
      const provider = new ethers.providers.Web3Provider(
        window.ethereum as any
      );
      const signer = provider.getSigner();
      const _swapExactTokensForEth = await swapRouter?.swapExactTokensForETH(
        toEth(amountIn.toString()),
        1,
        path.map(address => address.toLowerCase()),
        signer.getAddress(),
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
    const amountInEth = toEth(amountIn);
    const provider = new ethers.providers.Web3Provider(window.ethereum as any);
    const signer = provider.getSigner();

    const weth = wethContract();

    if (!weth) {
      throw new Error("WETH contract not found");
    }

    const tx = await weth.deposit({
      from: signer.getAddress(),
      value: amountInEth,
    });

    await tx.wait();

    const wethBalance = await weth.balanceOf(signer.getAddress());

    return wethBalance;
  } catch (error) {
    console.log("error depositing eth for weth", error);
    throw error;
  }
};

export const withdrawWethForEth = async (amountIn: string) => {
  try {
    const amountInEth = toEth(amountIn);
    const address = await getAccount();

    const weth = wethContract();

    if (!weth) {
      throw new Error("WETH contract not found");
    }

    const tx = await weth.withdraw(amountInEth, {
      from: address,
    });

    await tx.wait();

    const wethBalance = await weth.balanceOf(address);

    return wethBalance;
  } catch (error) {
    console.log("error withdrawing weth for eth", error);
    throw error;
  }
};

export const getAmountsIn = async (amountOut: string, path: string[]) => {
  const swapRouter = contract("swapRouter");
  try {
    const response = await swapRouter?.getAmountsIn(amountOut, path);

    return response.map((amount: string) => formatEth(amount));
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const getAmountsOut = async (amountIn: string, path: string[]) => {
  const swapRouter = contract("swapRouter");
  try {
    const response = await swapRouter?.getAmountsOut(amountIn, path);

    return response.map((amount: string) => formatEth(amount));
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
    const amountInWei = toEth(amountIn);
    const reserveAWei = toEth(reserveA);
    const reserveBWei = toEth(reserveB);
    const response = await swapRouter?.quote(
      amountInWei,
      reserveAWei,
      reserveBWei
    );
    const responseEth = formatEth(response.toString());
    console.log("Quote: ", responseEth);
    return responseEth;
  } catch (error) {
    console.log(error);
  }
};

////////////////////// LIQUIDITY //////////////////////

export const getPairAddress = async (tokenA: string, tokenB: string) => {
  const swapFactory = contract("swapFactory");

  try {
    const pairAddress = await swapFactory?.getPair(tokenA, tokenB);
    return pairAddress;
  } catch (error) {
    console.error("Error getting pair address: ", error);
    return null;
  }
};

export const liquidityExistsForPair = async (
  tokenOneAddress: string,
  tokenTwoAddress: string,
  userAddress: string
) => {
  const swapFactory = contract("swapFactory");
  const provider = new ethers.providers.Web3Provider(window.ethereum as any);
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
      const estimateGas = await swapRouter?.estimateGas.removeLiquidity(
        addressTokenA,
        addressTokenB,
        toEth(liquidityAmount.toString()),
        0,
        0,
        userAddress,
        deadline
      );

      const gasBuffer = 10000;
      const gasLimit = estimateGas?.add(gasBuffer);

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
  pairAddress: string,
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

    return liquidityAmount;
  } catch (error) {
    console.error(error);
    return "0";
  }
};

////////////////////// STAKING //////////////////////

export const getPoolAddress = async (tokenAddress: string) => {
  const stakingContract = contract("stakingRouter");
  const tokenInfo = tokenContractMap[tokenAddress];
  try {
    const getPool = await stakingContract?.getPoolAddress(tokenInfo?.address);
    return getPool;
  } catch (error) {
    console.error(error);
  }
};

export const getStakedAmount = async (tokenAddress: string) => {
  const stakingContract = contract("stakingRouter");
  const provider = new ethers.providers.Web3Provider(window.ethereum as any);
  const signer = provider.getSigner();
  const tokenContractInfo = tokenContractMap[tokenAddress];

  try {
    const staked = await stakingContract?.getStaked(
      signer.getAddress(),
      tokenContractInfo.address
    );

    return staked;
  } catch (error) {
    console.error(error);
  }
};

export const getEarnedRewards = async (tokenAddress: string) => {
  const stakingContract = contract("stakingRouter");
  const provider = new ethers.providers.Web3Provider(window.ethereum as any);
  const signer = provider.getSigner();
  const tokenContractInfo = tokenContractMap[tokenAddress];

  try {
    const rewardEarned = await stakingContract?.getRewardEarned(
      tokenContractInfo.address,
      signer.getAddress()
    );

    return rewardEarned;
  } catch (error) {
    console.error(error);
  }
};

export const stakedTokens = async (
  tokenAddress: string,
  inputAmount: string
) => {
  let receipt;
  let result;
  const stakingContract = contract("stakingRouter");
  const tokenInfo = tokenContractMap[tokenAddress];

  try {
    const staked = await stakingContract?.stake(
      tokenInfo.address,
      toEth(inputAmount)
    );

    await staked.wait();
  } catch (error) {
    console.error("Error when staking: ", error);
  }
};

export const withdrawTokens = async (
  tokenAddress: string,
  outAmount: string
) => {
  const stakingContract = contract("stakingRouter");
  const tokenInfo = tokenContractMap[tokenAddress];
  try {
    const withdraw = await stakingContract?.withdraw(
      tokenInfo.address,
      toEth(outAmount)
    );

    await withdraw.wait();
  } catch (error) {
    console.error(error);
  }
};

export const claimRewards = async (tokenAddress: string, outAmount: string) => {
  const stakingContract = contract("stakingRouter");
  const tokenInfo = tokenContractMap[tokenAddress];
  try {
    const claim = await stakingContract?.redeemReward(tokenInfo.address);

    await claim.wait();
  } catch (error) {
    console.error(error);
  }
};

export const stakeEther = async (amount: string) => {
  const stakingContract = contract("stakingRouter");
  const provider = new ethers.providers.Web3Provider(window.ethereum as any);
  const signer = provider.getSigner();
  const amountInWei = toEth(amount);

  try {
    const stake = await stakingContract?.stakeETH({
      from: signer.getAddress(),
      value: amountInWei,
    });

    await stake.wait();
  } catch (error) {
    console.error(error);
  }
};

export const withdrawEther = async (amount: string) => {
  const stakingContract = contract("stakingRouter");

  try {
    const withdraw = await stakingContract?.withdrawETH(toEth(amount));

    await withdraw.wait();
  } catch (error) {
    console.error(error);
  }
};

export const claimEther = async () => {
  const stakingContract = contract("stakingRouter");

  try {
    const claim = await stakingContract?.redeemRewardETH();

    await claim.wait();
  } catch (error) {
    console.error(error);
  }
};

export const hasValidAllowanceStaking = async (
  walletAddress: string,
  tokenName: string,
  amount: string
) => {
  try {
    const stakingRouter = contract("stakingRouter");
    const stakingContract = contract("staking");
    const tokenInfo = tokenContractMap[tokenName];

    if (!stakingRouter || !tokenInfo) {
      console.error("Missing contract information for tokenName:", tokenName);
      return false;
    }

    const tokenNameContract = tokenContract(tokenInfo.address, tokenInfo.abi);

    if (!tokenNameContract) {
      console.error("Failed to get token contract for tokenName:", tokenName);
      return false;
    }

    const data = await tokenNameContract?.allowance(
      walletAddress,
      stakingRouter?.address
    );

    if (!data) {
      console.error("Missing data for tokenName:", tokenName);
      return false;
    }

    const result = BigNumber.from(data.toString()).gte(
      BigNumber.from(toWei(amount))
    );

    return result;
  } catch (error) {
    console.error("Error checking allowance for tokenName:", tokenName, error);
    return false;
  }
};

////////////////////// LENDING //////////////////////

export const hasValidAllowanceLending = async (
  walletAdress: string,
  tokenName: string,
  amount: string
) => {
  const lendingPoolContract = contract("lendingPoolRouter");
  const tokenInfo = tokenContractMap[tokenName];

  try {
    if (!lendingPoolContract || !tokenInfo) {
      console.error("Missing contract information for tokenName:", tokenName);
      return false;
    }

    const tokenNameContract = tokenContract(tokenInfo.address, tokenInfo.abi);

    if (!tokenNameContract) {
      console.error("Failed to get token contract for tokenName:", tokenName);
      return false;
    }

    const data = await tokenNameContract?.allowance(
      walletAdress,
      lendingPoolContract?.address
    );

    if (!data) {
      console.error("Missing data for tokenName:", tokenName);
      return false;
    }

    const result = BigNumber.from(data.toString()).gte(
      BigNumber.from(toWei(amount))
    );

    return result;
  } catch (error) {
    console.error("Error checking allowance for tokenName:", tokenName, error);
    return false;
  }
};

export const getLendingPoolAddress = async (tokenAddress: string) => {
  const lendingPoolContract = contract("lendingPoolRouter");
  const tokenInfo = tokenContractMap[tokenAddress];
  try {
    const getPool = await lendingPoolContract?.getPoolAddress(
      tokenInfo.address
    );
    return getPool;
  } catch (error) {
    console.error(error);
  }
};

export const createPool = async (tokenAddress: string) => {
  const lendingPoolContract = contract("lendingPoolRouter");
  const tokenInfo = tokenContractMap[tokenAddress];
  try {
    const createPool = await lendingPoolContract?.createPool(tokenInfo.address);
    await createPool.wait();
  } catch (error) {
    console.error(error);
  }
};

export const getRepaidAmount = async (tokenAddress: string) => {
  const lendingPoolContract = contract("lendingPoolRouter");
  const tokenInfo = tokenContractMap[tokenAddress];
  const provider = new ethers.providers.Web3Provider(window.ethereum as any);
  const signer = provider.getSigner();
  try {
    const repayAmount = await lendingPoolContract?.getRepayAmount(
      tokenInfo.address,
      signer.getAddress()
    );

    return repayAmount;
  } catch (error) {
    console.error(error);
  }
};

export const getWithdrawalAmount = async (
  tokenAddress: string,
  amount: string
) => {
  const lendingPoolContract = contract("lendingPoolRouter");
  const tokenInfo = tokenContractMap[tokenAddress];
  const provider = new ethers.providers.Web3Provider(window.ethereum as any);
  const signer = provider.getSigner();
  try {
    const withdrawAmount = await lendingPoolContract?.getWithdrawAmount(
      tokenInfo.address,
      signer.getAddress(),
      amount
    );
    return withdrawAmount;
  } catch (error) {
    console.error(error);
  }
};

export const depositTokens = async (tokenAddress: string, amount: string) => {
  const lendingPoolContract = contract("lendingPoolRouter");
  const tokenInfo = tokenContractMap[tokenAddress];
  try {
    const deposit = await lendingPoolContract?.depositToken(
      tokenInfo.address,
      toEth(amount)
    );
    await deposit.wait();
  } catch (error) {
    console.error(error);
  }
};

export const withdrawTokensLending = async (
  tokenAddress: string,
  amount: string
) => {
  const lendingPoolContract = contract("lendingPoolRouter");
  const tokenInfo = tokenContractMap[tokenAddress];
  try {
    const withdraw = await lendingPoolContract?.withdrawToken(
      tokenInfo.address,
      toEth(amount)
    );
    await withdraw.wait();
  } catch (error) {
    console.error(error);
  }
};

export const borrowTokens = async (tokenAddress: string, amount: string) => {
  const lendingPoolContract = contract("lendingPoolRouter");
  const tokenInfo = tokenContractMap[tokenAddress];
  try {
    const borrow = await lendingPoolContract?.borrowToken(
      tokenInfo.address,
      toEth(amount)
    );
    await borrow.wait();
  } catch (error) {
    console.error(error);
  }
};

export const getLendAmount = async (tokenAddress: string) => {
  const lendingPoolContract = contract("lendingPoolRouter");
  const tokenInfo = tokenContractMap[tokenAddress];
  const provider = new ethers.providers.Web3Provider(window.ethereum as any);
  const signer = provider.getSigner();

  try {
    const lendAmount = await lendingPoolContract?.getLendAmount(
      tokenInfo.address,
      signer.getAddress()
    );

    return lendAmount;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getBorrowAmount = async (tokenAddress: string) => {
  const lendingPoolContract = contract("lendingPoolRouter");
  const tokenInfo = tokenContractMap[tokenAddress];
  const provider = new ethers.providers.Web3Provider(window.ethereum as any);
  const signer = provider.getSigner();

  try {
    const borrowAmount = await lendingPoolContract?.getBorrowAmount(
      tokenInfo.address,
      signer.getAddress()
    );
    return borrowAmount;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getTotalBorrowAvailable = async (tokenAddress: string) => {
  const lendingPoolContract = contract("lendingPoolRouter");
  const tokenInfo = tokenContractMap[tokenAddress];

  try {
    const totalBorrowAvailable = await lendingPoolContract?.getTotalLendAmount(
      tokenInfo?.address
    );

    return totalBorrowAvailable;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const repayTokens = async (tokenAddress: string, amount: string) => {
  const lendingPoolContract = contract("lendingPoolRouter");
  const tokenInfo = tokenContractMap[tokenAddress];
  try {
    const payToken = await lendingPoolContract?.repayToken(
      tokenInfo.address,
      toEth(amount)
    );

    await payToken.wait();
  } catch (error) {
    console.error(error);
  }
};

export const depositEther = async (amount: string) => {
  const lendingPoolContract = contract("lendingPoolRouter");
  const provider = new ethers.providers.Web3Provider(window.ethereum as any);
  const signer = provider.getSigner();
  const amountInWei = toEth(amount);
  try {
    const deposit = await lendingPoolContract?.depositETH({
      from: signer.getAddress(),
      value: amountInWei,
    });
    await deposit.wait();
  } catch (error) {
    console.error(error);
  }
};

export const withdrawEtherLending = async (amount: string) => {
  const lendingPoolContract = contract("lendingPoolRouter");
  const provider = new ethers.providers.Web3Provider(window.ethereum as any);
  const signer = provider.getSigner();
  const amountInWei = toEth(amount);
  try {
    const withdraw = await lendingPoolContract?.withdrawETH(amountInWei);
    await withdraw.wait();
  } catch (error) {
    console.error(error);
  }
};

export const borrowEther = async (amount: string) => {
  const lendingPoolContract = contract("lendingPoolRouter");
  const amountInWei = toEth(amount);
  try {
    const borrow = await lendingPoolContract?.borrowETH(amountInWei);
    await borrow.wait();
  } catch (error) {
    console.error(error);
  }
};

export const repayEther = async (amount: string) => {
  const lendingPoolContract = contract("lendingPoolRouter");
  const amountInWei = toEth(amount);
  try {
    const repay = await lendingPoolContract?.repayETH(amountInWei);
    await repay.wait();
  } catch (error) {
    console.error(error);
  }
};
