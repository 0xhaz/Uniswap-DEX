const approveTokens = async (tokenInAddress, amountIn) => {
  try {
    const tokenContract = new Contract(tokenInAddress, usdtAbi, signer);

    const tx = await tokenContract.approve(swapRouterContract, toWei(amountIn));

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
      const _swapExactTokens =
        await swapRouterContract?.swapExactTokensForTokens(
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
      const _swapTokensForExact =
        await swapRouterContract?.swapTokensForExactTokens(
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
      const _swapExactEthForTokens =
        await swapRouterContract?.swapExactETHForTokens(
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

const swapEthForExactAmountOfTokens = async (amountOut, path, amountETH) => {
  try {
    if (amountOut) {
      const _amount = toWei(amountETH);
      const _deadline = getDeadline();
      const _swapEthForExactTokens =
        await swapRouterContract?.swapETHForExactTokens(
          toWei(amountOut),
          path,
          address,
          _deadline,
          { value: _amount }
        );
      setTxPending(true);
      await _swapEthForExactTokens.wait();
      setTxPending(false);
    }
  } catch (error) {
    console.log(error);
  }
};

const swapTokensForExactAmountOfETH = async (amountOut, path, amountIn) => {
  try {
    if (amountOut) {
      await approveTokens(selectedToken1.address, toEth(toWei(amountIn)));
      const _deadline = getDeadline();
      const _swapTokensForExactETH =
        await swapRouterContract?.swapTokensForExactETH(
          toWei(amountOut),
          1,
          path,
          address,
          _deadline
        );
      setTxPending(true);
      await _swapTokensForExactETH.wait();
      setTxPending(false);
    }
  } catch (error) {
    console.log(error);
  }
};

const swapExactAmountOfTokensForEth = async (amountIn, path) => {
  try {
    if (amountIn) {
      const deadline = getDeadline();
      const _swapExactTokensForEth =
        await swapRouterContract?.swapExactTokensForETH(
          toWei(amountIn),
          1,
          path,
          address,
          deadline
        );
      setTxPending(true);
      await _swapExactTokensForEth.wait();
      setTxPending(false);
    }
  } catch (error) {
    console.log(error);
  }
};

const getReserves = async (tokenA, tokenB) => {
  const response = await swapRouterContract?.getReserve(tokenA, tokenB);
  setReserveA(toEth(response.reserveA));
  setReserveB(toEth(response.reserveB));
  console.log(toEth(response.reserveA), toEth(response.reserveB));
};

const getAmountOut = async (amountA, reserveA, reserveB) => {
  if (amountA != 0) {
    const amountOut = await swapRouterContract?.getAmountOut(
      toWei(amountA),
      toWei(reserveA),
      toWei(reserveB)
    );
    console.log(toEth(amountOut));
    setAmountOut(toEth(amountOut));
    setAmountTwo(toEth(amountOut));
  }
};

const getAmountIn = async (amountB, reserveA, reserveB) => {
  if (amountB != 0) {
    const amountIn = await swapRouterContract?.getAmountIn(
      toWei(amountB),
      toWei(reserveA),
      toWei(reserveB)
    );
    console.log(toEth(amountIn));
    setAmountIn(toEth(amountIn));
    setAmountOne(toEth(amountIn));
  }
};
