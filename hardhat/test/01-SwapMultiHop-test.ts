describe("SwapMultiHop", () => {
  let swapMultiHop: any;
  let accounts: any;
  let weth: any;
  let dai: any;
  let usdc: any;

  before(async () => {
    accounts = await ethers.getSigners(1);
    const SwapMultiHop = await ethers.getContractFactory("SwapMultiHop");
    swapMultiHop = await SwapMultiHop.deploy();
    await swapMultiHop.deployed();

    weth = await ethers.getContractAt("IWETH", WETH9);
    dai = await ethers.getContractAt("IERC20", DAI);
    usdc = await ethers.getContractAt("IERC20", USDC);
  });

  it("swapExactInputMultiHop", async () => {
    const amountIn = 10n ** 18n;

    await weth.deposit({ value: amountIn });
    await weth.approve(swapMultiHop.address, amountIn);

    await swapMultiHop.swapExactInputMultiHop(amountIn);
    console.log(
      "WETH balance: ",
      (await weth.balance(accounts[0].address)).toString()
    );
    console.log(
      "DAI balance: ",
      (await dai.balance(accounts[0].address)).toString()
    );
  });

  it("swapExactOutputMultihop", async () => {
    const wethAmountInMax = 10n ** 18n; // 1 WETH
    const daiAmountOut = 100n * 10n ** 18n; // 100 DAI

    await weth.deposit({ value: wethAmountInMax });
    await weth.approve(swapMultiHop.address, wethAmountInMax);

    await swapMultiHop.swapExactOutputMultihop(daiAmountOut, wethAmountInMax);
    console.log(
      "WETH balance: ",
      (await weth.balanceOf(accounts[0].address)).toString()
    );
    console.log(
      "DAI balance: ",
      (await dai.balanceOf(accounts[0].address)).toString()
    );
  });
});
