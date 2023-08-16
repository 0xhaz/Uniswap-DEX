const { expect } = require("chai");
const { ethers } = require("hardhat");

// const DAI = "0x6b175474e89094c44da98b954eedeac495271d0f";
// const WETH9 = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
// const USDC = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";

describe("SingleSwapToken", () => {
  let singleSwapToken: any;
  let accounts: any;
  let weth: any;
  let dai: any;
  let usdc;

  before(async () => {
    accounts = await ethers.getSigners(1);
    const SingleSwapToken = await ethers.getContractFactory("SingleSwapToken");
    singleSwapToken = await SingleSwapToken.deploy();
    await singleSwapToken.deployed();

    // weth = await ethers.getContractAt("IWETH", WETH9);
    // dai = await ethers.getContractAt("IERC20", DAI);
    // usdc = await ethers.getContractAt("IERC20", USDC);
  });

  it("swapExactInputSingle", async () => {
    const amountIn = 10n ** 18n;

    await weth.deposit({ value: amountIn });
    await weth.approve(singleSwapToken.address, amountIn);

    await singleSwapToken.swapExactInputSingle(amountIn);
    console.log(
      "WETH balance: ",
      (await weth.balance(accounts[0].address)).toString()
    );
    console.log(
      "DAI balance: ",
      (await dai.balance(accounts[0].address)).toString()
    );
  });

  it("swapExactOutputSingle", async () => {
    const wethAmountInMax = 10n ** 18n;
    const daiAmountOut = 100n * 10n ** 18n;

    await weth.deposit({ value: wethAmountInMax });
    await weth.approve(singleSwapToken.address, wethAmountInMax);

    await singleSwapToken.swapExactOutputSingle(daiAmountOut, wethAmountInMax);
    console.log(
      "WETH balance: ",
      (await weth.balance(accounts[0].address)).toString()
    );
    console.log(
      "DAI balance: ",
      (await dai.balance(accounts[0].address)).toString()
    );
  });
});
