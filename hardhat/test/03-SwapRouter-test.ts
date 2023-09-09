import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";

import {
  expandTo18Decimals,
  MINIMUM_LIQUIDITY,
  Version,
} from "./shared/utilities";
import { SwapPairTokens } from "../typechain";

describe("SwapRouter", () => {
  const fixture = async () => {
    const [wallet] = await ethers.getSigners();
    const token = await ethers.getContractFactory("MockERC20");

    const tokenA = await token.deploy(expandTo18Decimals(10000));
    const tokenB = await token.deploy(expandTo18Decimals(10000));

    const weth = await ethers.getContractFactory("WETH9");
    const WETH = await weth.deploy();

    const erc20 = await ethers.getContractFactory("MockERC20");
    const WETHPartner = await erc20.deploy(expandTo18Decimals(10000));

    const factory = await ethers.getContractFactory("SwapPairTokensFactory");
    const swapFactory = await factory.deploy(wallet.address);

    const routerEmit = await ethers.getContractFactory("RouterEventEmitter");
    const routerEventEmitter = await routerEmit.deploy();

    const router = await ethers.getContractFactory("SwapRouter");
    const swapRouter = await router.deploy(swapFactory.address, WETH.address);

    const [tokenAAddress, tokenBAddress, WETHAddress, factoryAddress] =
      await Promise.all([
        tokenA.address,
        tokenB.address,
        WETH.address,
        swapFactory.address,
      ]);

    // initialize pair
    await swapFactory.createPair(tokenAAddress, tokenBAddress);
    const pairAddress = await swapFactory.getPair(tokenAAddress, tokenBAddress);
    const pairFactory = await ethers.getContractFactory("SwapPairTokens");
    const pair = pairFactory.attach(pairAddress) as SwapPairTokens;

    const token0Address = await pair.token0();
    const token0 = tokenAAddress === token0Address ? tokenA : tokenB;
    const token1 = tokenAAddress === token0Address ? tokenB : tokenA;

    await swapFactory.createPair(WETHAddress, WETHPartner.address);
    const WETHPairAddress = await swapFactory.getPair(
      WETHAddress,
      WETHPartner.address
    );

    const wethPair = new Contract(
      WETHPairAddress,
      pairFactory.interface,
      wallet
    );

    return {
      token0,
      token1,
      WETH,
      WETHPartner,
      swapFactory,
      swapRouter,
      pair,
      routerEventEmitter,
      wallet,
      wethPair,
    };
  };

  it("quote", async () => {
    const { swapRouter: router } = await loadFixture(fixture);

    expect(await router.quote(1n, 100n, 200n)).to.equal(2n);
    expect(await router.quote(2n, 200n, 100n)).to.equal(1n);

    await expect(router.quote(0n, 100n, 200n)).to.be.revertedWith(
      "SwapLibrary: INSUFFICIENT_AMOUNT"
    );
    await expect(router.quote(2n, 0n, 100n)).to.be.revertedWith(
      "SwapLibrary: INSUFFICIENT_LIQUIDITY"
    );
    await expect(router.quote(2n, 100n, 0n)).to.be.revertedWith(
      "SwapLibrary: INSUFFICIENT_LIQUIDITY"
    );
  });

  it("getAmountOut", async () => {
    const { swapRouter: router } = await loadFixture(fixture);

    expect(await router.getAmountOut(2n, 100n, 100n)).to.equal(1n);
    await expect(router.getAmountOut(0n, 100n, 100n)).to.be.revertedWith(
      "SwapLibrary: INSUFFICIENT_INPUT_AMOUNT"
    );
    await expect(router.getAmountOut(2n, 0n, 100n)).to.be.revertedWith(
      "SwapLibrary: INSUFFICIENT_LIQUIDITY"
    );
    await expect(router.getAmountOut(2n, 100n, 0n)).to.be.revertedWith(
      "SwapLibrary: INSUFFICIENT_LIQUIDITY"
    );
  });

  it("getAmountIn", async () => {
    const { swapRouter: router } = await loadFixture(fixture);

    expect(await router.getAmountIn(1n, 100n, 100n)).to.equal(2n);
    await expect(router.getAmountIn(0n, 100n, 100n)).to.be.revertedWith(
      "SwapLibrary: INSUFFICIENT_OUTPUT_AMOUNT"
    );
    await expect(router.getAmountIn(1n, 0n, 100n)).to.be.revertedWith(
      "SwapLibrary: INSUFFICIENT_LIQUIDITY"
    );
    await expect(router.getAmountIn(1n, 100n, 0n)).to.be.revertedWith(
      "SwapLibrary: INSUFFICIENT_LIQUIDITY"
    );
  });

  it("getAmountsOut", async () => {
    const {
      swapRouter: router,
      token0,
      token1,
      wallet,
    } = await loadFixture(fixture);

    await token0.approve(router.address, ethers.constants.MaxUint256);
    await token1.approve(router.address, ethers.constants.MaxUint256);
    await router.addLiquidity(
      token0.address,
      token1.address,
      10000n,
      10000n,
      0,
      0,
      wallet.address,
      ethers.constants.MaxUint256
    );

    await expect(router.getAmountsOut(2n, [token0.address])).to.be.revertedWith(
      "SwapLibrary: INVALID_PATH"
    );
    const path = [token0.address, token1.address];
    expect(await router.getAmountsOut(2n, path)).to.deep.equal([2n, 1n]);
  });

  it("getAmountsIn", async () => {
    const {
      swapRouter: router,
      token0,
      token1,
      wallet,
    } = await loadFixture(fixture);

    await token0.approve(router.address, ethers.constants.MaxUint256);
    await token1.approve(router.address, ethers.constants.MaxUint256);
    await router.addLiquidity(
      token0.address,
      token1.address,
      10000n,
      10000n,
      0,
      0,
      wallet.address,
      ethers.constants.MaxUint256
    );

    await expect(router.getAmountsIn(1n, [token0.address])).to.be.revertedWith(
      "SwapLibrary: INVALID_PATH"
    );
    const path = [token0.address, token1.address];
    expect(await router.getAmountsIn(1n, path)).to.deep.equal([2n, 1n]);
  });

  it("factory, WETH", async () => {
    const {
      swapRouter: router,
      swapFactory,
      WETH,
    } = await loadFixture(fixture);
    expect(await router.factory()).to.equal(swapFactory.address);
    expect(await router.WETH()).to.equal(WETH.address);
  });

  it("addLiquidity", async () => {
    const {
      swapRouter: router,
      token0,
      token1,
      wallet,
      pair,
    } = await loadFixture(fixture);

    const token0Amount = expandTo18Decimals(1);
    const token1Amount = expandTo18Decimals(4);

    const expectedLiquidity = expandTo18Decimals(2);
    await token0.approve(router.address, ethers.constants.MaxUint256);
    await token1.approve(router.address, ethers.constants.MaxUint256);
    await expect(
      router.addLiquidity(
        token0.address,
        token1.address,
        token0Amount,
        token1Amount,
        0,
        0,
        wallet.address,
        ethers.constants.MaxUint256
      )
    )
      .to.emit(token0, "Transfer")
      .withArgs(wallet.address, pair.address, token0Amount)
      .to.emit(token1, "Transfer")
      .withArgs(wallet.address, pair.address, token1Amount)
      .to.emit(pair, "Transfer")
      .withArgs(
        ethers.constants.AddressZero,
        ethers.constants.AddressZero,
        MINIMUM_LIQUIDITY
      )
      .to.emit(pair, "Transfer")
      .withArgs(
        ethers.constants.AddressZero,
        wallet.address,
        expectedLiquidity - MINIMUM_LIQUIDITY
      )
      .to.emit(pair, "Sync")
      .withArgs(token0Amount, token1Amount)
      .to.emit(pair, "Mint")
      .withArgs(router.address, token0Amount, token1Amount);

    expect(await pair.balanceOf(wallet.address)).to.equal(
      expectedLiquidity - MINIMUM_LIQUIDITY
    );
  });

  it("removeLiquidity", async () => {
    const {
      swapRouter: router,
      token0,
      token1,
      wallet,
      pair,
    } = await loadFixture(fixture);

    const token0Amount = expandTo18Decimals(1);
    const token1Amount = expandTo18Decimals(4);
    await token0.transfer(pair.address, token0Amount);
    await token1.transfer(pair.address, token1Amount);
    await pair.mint(wallet.address);

    const expectedLiquidity = expandTo18Decimals(2);
    await pair.approve(router.address, ethers.constants.MaxUint256);
    await expect(
      router.removeLiquidity(
        token0.address,
        token1.address,
        expectedLiquidity - MINIMUM_LIQUIDITY,
        0,
        0,
        wallet.address,
        ethers.constants.MaxUint256
      )
    )
      .to.emit(pair, "Transfer")
      .withArgs(
        wallet.address,
        pair.address,
        expectedLiquidity - MINIMUM_LIQUIDITY
      )
      .to.emit(pair, "Transfer")
      .withArgs(
        pair.address,
        ethers.constants.AddressZero,
        expectedLiquidity - MINIMUM_LIQUIDITY
      )
      .to.emit(token0, "Transfer")
      .withArgs(pair.address, wallet.address, token0Amount - 500n)
      .to.emit(token1, "Transfer")
      .withArgs(pair.address, wallet.address, token1Amount - 2000n)
      .to.emit(pair, "Sync")
      .withArgs(500n, 2000n)
      .to.emit(pair, "Burn")
      .withArgs(
        router.address,
        token0Amount - 500n,
        token1Amount - 2000n,
        wallet.address
      );

    expect(await pair.balanceOf(wallet.address)).to.equal(0);

    const totalSupplyToken0 = await token0.totalSupply();
    const totalSupplyToken0InBigInt = totalSupplyToken0.toBigInt();
    const totalSupplyToken1 = await token1.totalSupply();
    const totalSupplyToken1InBigInt = totalSupplyToken1.toBigInt();

    expect(await token0.balanceOf(wallet.address)).to.equal(
      totalSupplyToken0InBigInt - 500n
    );
    expect(await token1.balanceOf(wallet.address)).to.equal(
      totalSupplyToken1InBigInt - 2000n
    );
  });

  it("removeLiquidityETH", async () => {
    const {
      swapRouter: router,
      wallet,
      WETHPartner,
      WETH,
      wethPair: WETHPair,
    } = await loadFixture(fixture);

    const WETHPartnerAmount = expandTo18Decimals(1);
    const ETHAmount = expandTo18Decimals(4);
    await WETHPartner.transfer(WETHPair.address, WETHPartnerAmount);
    await WETH.deposit({ value: ETHAmount });
    await WETH.transfer(WETHPair.address, ETHAmount);
    await WETHPair.mint(wallet.address);

    const expectedLiquidity = expandTo18Decimals(2);
    const WETHPairToken0 = await WETHPair.token0();
    await WETHPair.approve(router.address, ethers.constants.MaxUint256);
    await expect(
      router.removeLiquidityETH(
        WETHPartner.address,
        expectedLiquidity - MINIMUM_LIQUIDITY,
        0,
        0,
        wallet.address,
        ethers.constants.MaxUint256
      )
    )
      .to.emit(WETHPair, "Transfer")
      .withArgs(
        wallet.address,
        WETHPair.address,
        expectedLiquidity - MINIMUM_LIQUIDITY
      )
      .to.emit(WETHPair, "Transfer")
      .withArgs(
        WETHPair.address,
        ethers.constants.AddressZero,
        expectedLiquidity - MINIMUM_LIQUIDITY
      )
      .to.emit(WETH, "Transfer")
      .withArgs(WETHPair.address, router.address, ETHAmount - 2000n)
      .to.emit(WETHPartner, "Transfer")
      .withArgs(WETHPair.address, router.address, WETHPartnerAmount - 500n)
      .to.emit(WETHPartner, "Transfer")
      .withArgs(router.address, wallet.address, WETHPartnerAmount - 500n)
      .to.emit(WETHPair, "Sync")
      .withArgs(
        WETHPairToken0 === WETHPartner.address ? 500n : 2000n,
        WETHPairToken0 === WETHPartner.address ? 2000n : 500n
      )
      .to.emit(WETHPair, "Burn")
      .withArgs(
        router.address,
        WETHPairToken0 === WETHPartner.address
          ? WETHPartnerAmount - 500n
          : ETHAmount - 2000n,
        WETHPairToken0 === WETHPartner.address
          ? ETHAmount - 2000n
          : WETHPartnerAmount - 500n,
        router.address
      );

    expect(await WETHPair.balanceOf(wallet.address)).to.equal(0);

    const totalSupplyWETHPartner = await WETHPartner.totalSupply();
    const totalSupplyWETHPartnerInBigInt = totalSupplyWETHPartner.toBigInt();
    const totalSupplyWETH = await WETH.totalSupply();
    const totalSupplyWETHInBigInt = totalSupplyWETH.toBigInt();
    expect(await WETHPartner.balanceOf(wallet.address)).to.equal(
      totalSupplyWETHPartnerInBigInt - 500n
    );
    expect(await WETH.balanceOf(wallet.address)).to.equal(
      totalSupplyWETHInBigInt - 2000n
    );
  });

  describe("swapExactTokensForTokens", () => {
    const token0Amount = expandTo18Decimals(5);
    const token1Amount = expandTo18Decimals(10);
    const swapAmount = expandTo18Decimals(1);
    const expectedOutputAmount = 1662497915624478906n;

    it("happy path", async () => {
      const {
        swapRouter: router,
        token0,
        token1,
        wallet,
        pair,
      } = await loadFixture(fixture);

      await token0.transfer(pair.address, token0Amount);
      await token1.transfer(pair.address, token1Amount);
      await pair.mint(wallet.address);

      await token0.approve(router.address, ethers.constants.MaxUint256);

      await expect(
        router.swapExactTokensForTokens(
          swapAmount,
          0,
          [token0.address, token1.address],
          wallet.address,
          ethers.constants.MaxUint256
        )
      )
        .to.emit(token0, "Transfer")
        .withArgs(wallet.address, pair.address, swapAmount)
        .to.emit(token1, "Transfer")
        .withArgs(pair.address, wallet.address, expectedOutputAmount)
        .to.emit(pair, "Sync")
        .withArgs(
          token0Amount + swapAmount,
          token1Amount - expectedOutputAmount
        )
        .to.emit(pair, "Swap")
        .withArgs(
          router.address,
          swapAmount,
          0,
          0,
          expectedOutputAmount,
          wallet.address
        );
    });

    it("amounts", async () => {
      const {
        swapRouter: router,
        token0,
        token1,
        wallet,
        pair,
        routerEventEmitter,
      } = await loadFixture(fixture);

      await token0.transfer(pair.address, token0Amount);
      await token1.transfer(pair.address, token1Amount);
      await pair.mint(wallet.address);
      await token0.approve(router.address, ethers.constants.MaxUint256);

      await token0.approve(
        routerEventEmitter.address,
        ethers.constants.MaxUint256
      );
      await expect(
        routerEventEmitter.swapExactTokensForTokens(
          router.address,
          swapAmount,
          0,
          [token0.address, token1.address],
          wallet.address,
          ethers.constants.MaxUint256
        )
      )
        .to.emit(routerEventEmitter, "Amounts")
        .withArgs([swapAmount, expectedOutputAmount]);
    });

    it("gas", async () => {
      const {
        swapRouter: router,
        token0,
        token1,
        wallet,
        pair,
      } = await loadFixture(fixture);

      await token0.transfer(pair.address, token0Amount);
      await token1.transfer(pair.address, token1Amount);
      await pair.mint(wallet.address);
      await token0.approve(router.address, ethers.constants.MaxUint256);

      //   Ensure that setting price{0,1}CumulativeLast for the first time doesn't affect our gas math
      await time.setNextBlockTimestamp(
        (await ethers.provider.getBlock("latest"))!.timestamp + 1
      );
      await pair.sync();

      await token0.approve(router.address, ethers.constants.MaxUint256);
      await time.setNextBlockTimestamp(
        (await ethers.provider.getBlock("latest"))!.timestamp + 1
      );

      const tx = await router.swapExactTokensForTokens(
        swapAmount,
        0,
        [token0.address, token1.address],
        wallet.address,
        ethers.constants.MaxUint256
      );
      const receipt = await tx.wait();
      expect(receipt!.gasUsed).to.equal(110889, "gas used");
    });
  });

  describe("swapTokensForExactTokens", () => {
    const token0Amount = expandTo18Decimals(5);
    const token1Amount = expandTo18Decimals(10);
    const expectedSwapAmount = 557227237267357629n;
    const outputAmount = expandTo18Decimals(1);

    it("happy path", async () => {
      const {
        swapRouter: router,
        token0,
        token1,
        wallet,
        pair,
      } = await loadFixture(fixture);

      await token0.transfer(pair.address, token0Amount);
      await token1.transfer(pair.address, token1Amount);
      await pair.mint(wallet.address);

      await token0.approve(router.address, ethers.constants.MaxUint256);
      await expect(
        router.swapTokensForExactTokens(
          outputAmount,
          ethers.constants.MaxUint256,
          [token0.address, token1.address],
          wallet.address,
          ethers.constants.MaxUint256
        )
      )
        .to.emit(token0, "Transfer")
        .withArgs(wallet.address, pair.address, expectedSwapAmount)
        .to.emit(token1, "Transfer")
        .withArgs(pair.address, wallet.address, outputAmount)
        .to.emit(pair, "Sync")
        .withArgs(
          token0Amount + expectedSwapAmount,
          token1Amount - outputAmount
        )
        .to.emit(pair, "Swap")
        .withArgs(
          router.address,
          expectedSwapAmount,
          0,
          0,
          outputAmount,
          wallet.address
        );
    });

    it("amounts", async () => {
      const {
        swapRouter: router,
        token0,
        token1,
        wallet,
        pair,
        routerEventEmitter,
      } = await loadFixture(fixture);

      await token0.transfer(pair.address, token0Amount);
      await token1.transfer(pair.address, token1Amount);
      await pair.mint(wallet.address);

      await token0.approve(
        routerEventEmitter.address,
        ethers.constants.MaxUint256
      );
      await expect(
        routerEventEmitter.swapTokensForExactTokens(
          router.address,
          outputAmount,
          ethers.constants.MaxUint256,
          [token0.address, token1.address],
          wallet.address,
          ethers.constants.MaxUint256
        )
      )
        .to.emit(routerEventEmitter, "Amounts")
        .withArgs([expectedSwapAmount, outputAmount]);
    });
  });

  describe("swapExactETHForTokens", () => {
    const WETHPartnerAmount = expandTo18Decimals(10);
    const ETHAmount = expandTo18Decimals(5);
    const swapAmount = expandTo18Decimals(1);
    const expectedOutputAmount = 1662497915624478906n;

    it("happy path", async () => {
      const {
        swapRouter: router,
        token0,
        wallet,
        WETHPartner,
        wethPair: WETHPair,
        WETH,
      } = await loadFixture(fixture);

      await WETHPartner.transfer(WETHPair.address, WETHPartnerAmount);
      await WETH.deposit({ value: ETHAmount });
      await WETH.transfer(WETHPair.address, ETHAmount);
      await WETHPair.mint(wallet.address);
      await token0.approve(router.address, ethers.constants.MaxUint256);

      const WETHPairToken0 = await WETHPair.token0();
      await expect(
        router.swapExactETHForTokens(
          0,
          [WETH.address, WETHPartner.address],
          wallet.address,
          ethers.constants.MaxUint256,
          { value: swapAmount }
        )
      )
        .to.emit(WETH, "Transfer")
        .withArgs(router.address, WETHPair.address, swapAmount)
        .to.emit(WETHPartner, "Transfer")
        .withArgs(WETHPair.address, wallet.address, expectedOutputAmount)
        .to.emit(WETHPair, "Sync")
        .withArgs(
          WETHPairToken0 === WETHPartner.address
            ? WETHPartnerAmount - expectedOutputAmount
            : ETHAmount + swapAmount,
          WETHPairToken0 === WETHPartner.address
            ? ETHAmount + swapAmount
            : WETHPartnerAmount - expectedOutputAmount
        )
        .to.emit(WETHPair, "Swap")
        .withArgs(
          router.address,
          WETHPairToken0 === WETHPartner.address ? 0 : swapAmount,
          WETHPairToken0 === WETHPartner.address ? swapAmount : 0,
          WETHPairToken0 === WETHPartner.address ? expectedOutputAmount : 0,
          WETHPairToken0 === WETHPartner.address ? 0 : expectedOutputAmount,
          wallet.address
        );
    });

    it("amounts", async () => {
      const {
        swapRouter: router,
        token0,
        wallet,
        WETHPartner,
        wethPair: WETHPair,
        WETH,
        routerEventEmitter,
      } = await loadFixture(fixture);

      await WETHPartner.transfer(WETHPair.address, WETHPartnerAmount);
      await WETH.deposit({ value: ETHAmount });
      await WETH.transfer(WETHPair.address, ETHAmount);
      await WETHPair.mint(wallet.address);
      await token0.approve(router.address, ethers.constants.MaxUint256);

      await expect(
        routerEventEmitter.swapExactETHForTokens(
          router.address,
          0,
          [WETH.address, WETHPartner.address],
          wallet.address,
          ethers.constants.MaxUint256,
          { value: swapAmount }
        )
      )
        .to.emit(routerEventEmitter, "Amounts")
        .withArgs([swapAmount, expectedOutputAmount]);
    });

    it("gas", async () => {
      const {
        swapRouter: router,
        token0,
        wallet,
        pair,
        WETHPartner,
        wethPair: WETHPair,
        WETH,
      } = await loadFixture(fixture);

      const WETHPartnerAmount = expandTo18Decimals(10);
      const ETHAmount = expandTo18Decimals(5);

      await WETHPartner.transfer(WETHPair.address, WETHPartnerAmount);
      await WETH.deposit({ value: ETHAmount });
      await WETH.transfer(WETHPair.address, ETHAmount);
      await WETHPair.mint(wallet.address);
      await token0.approve(router.address, ethers.constants.MaxUint256);

      await time.setNextBlockTimestamp(
        (await ethers.provider.getBlock("latest"))!.timestamp + 1
      );
      await pair.sync();

      const swapAmount = expandTo18Decimals(1);
      await time.setNextBlockTimestamp(
        (await ethers.provider.getBlock("latest"))!.timestamp + 1
      );
      const tx = await router.swapExactETHForTokens(
        0,
        [WETH.address, WETHPartner.address],
        wallet.address,
        ethers.constants.MaxUint256,
        { value: swapAmount }
      );
      const receipt = await tx.wait();
      expect(receipt!.gasUsed).to.equal(148520, "gas used");
    }).retries(3);
  });

  describe("swapTokensForExactETH", () => {
    const WETHPartnerAmount = expandTo18Decimals(5);
    const ETHAmount = expandTo18Decimals(10);
    const expectedSwapAmount = 557227237267357629n;
    const outputAmount = expandTo18Decimals(1);

    it("happy path", async () => {
      const {
        swapRouter: router,
        wallet,
        WETHPartner,
        wethPair: WETHPair,
        WETH,
      } = await loadFixture(fixture);

      await WETHPartner.transfer(WETHPair.address, WETHPartnerAmount);
      await WETH.deposit({ value: ETHAmount });
      await WETH.transfer(WETHPair.address, ETHAmount);
      await WETHPair.mint(wallet.address);

      await WETHPartner.approve(router.address, ethers.constants.MaxUint256);
      const WETHPairToken0 = await WETHPair.token0();
      await expect(
        router.swapTokensForExactETH(
          outputAmount,
          ethers.constants.MaxUint256,
          [WETHPartner.address, WETH.address],
          wallet.address,
          ethers.constants.MaxUint256
        )
      )
        .to.emit(WETHPartner, "Transfer")
        .withArgs(wallet.address, WETHPair.address, expectedSwapAmount)
        .to.emit(WETH, "Transfer")
        .withArgs(WETHPair.address, router.address, outputAmount)
        .to.emit(WETHPair, "Sync")
        .withArgs(
          WETHPairToken0 === WETHPartner.address
            ? WETHPartnerAmount + expectedSwapAmount
            : ETHAmount - outputAmount,
          WETHPairToken0 === WETHPartner.address
            ? ETHAmount - outputAmount
            : WETHPartnerAmount + expectedSwapAmount
        )
        .to.emit(WETHPair, "Swap")
        .withArgs(
          router.address,
          WETHPairToken0 === WETHPartner.address ? expectedSwapAmount : 0,
          WETHPairToken0 === WETHPartner.address ? 0 : expectedSwapAmount,
          WETHPairToken0 === WETHPartner.address ? 0 : outputAmount,
          WETHPairToken0 === WETHPartner.address ? outputAmount : 0,
          router.address
        );
    });

    it("amounts", async () => {
      const {
        swapRouter: router,
        wallet,
        WETHPartner,
        wethPair: WETHPair,
        WETH,
        routerEventEmitter,
      } = await loadFixture(fixture);

      await WETHPartner.transfer(WETHPair.address, WETHPartnerAmount);
      await WETH.deposit({ value: ETHAmount });
      await WETH.transfer(WETHPair.address, ETHAmount);
      await WETHPair.mint(wallet.address);

      await WETHPartner.approve(
        routerEventEmitter.address,
        ethers.constants.MaxUint256
      );
      await expect(
        routerEventEmitter.swapTokensForExactETH(
          router.address,
          outputAmount,
          ethers.constants.MaxUint256,
          [WETHPartner.address, WETH.address],
          wallet.address,
          ethers.constants.MaxUint256
        )
      )
        .to.emit(routerEventEmitter, "Amounts")
        .withArgs([expectedSwapAmount, outputAmount]);
    });
  });

  describe("swapExactTokensForETH", () => {
    const WETHPartnerAmount = expandTo18Decimals(5);
    const ETHAmount = expandTo18Decimals(10);
    const swapAmount = expandTo18Decimals(1);
    const expectedOutputAmount = 1662497915624478906n;

    it("happy path", async () => {
      const {
        swapRouter: router,
        wallet,
        WETHPartner,
        wethPair: WETHPair,
        WETH,
      } = await loadFixture(fixture);

      await WETHPartner.transfer(WETHPair.address, WETHPartnerAmount);
      await WETH.deposit({ value: ETHAmount });
      await WETH.transfer(WETHPair.address, ETHAmount);
      await WETHPair.mint(wallet.address);

      await WETHPartner.approve(router.address, ethers.constants.MaxUint256);
      const WETHPairToken0 = await WETHPair.token0();
      await expect(
        router.swapExactTokensForETH(
          swapAmount,
          0,
          [WETHPartner.address, WETH.address],
          wallet.address,
          ethers.constants.MaxUint256
        )
      )
        .to.emit(WETHPartner, "Transfer")
        .withArgs(wallet.address, WETHPair.address, swapAmount)
        .to.emit(WETH, "Transfer")
        .withArgs(WETHPair.address, router.address, expectedOutputAmount)
        .to.emit(WETHPair, "Sync")
        .withArgs(
          WETHPairToken0 === WETHPartner.address
            ? WETHPartnerAmount + swapAmount
            : ETHAmount - expectedOutputAmount,
          WETHPairToken0 === WETHPartner.address
            ? ETHAmount - expectedOutputAmount
            : WETHPartnerAmount + swapAmount
        )
        .to.emit(WETHPair, "Swap")
        .withArgs(
          router.address,
          WETHPairToken0 === WETHPartner.address ? swapAmount : 0,
          WETHPairToken0 === WETHPartner.address ? 0 : swapAmount,
          WETHPairToken0 === WETHPartner.address ? 0 : expectedOutputAmount,
          WETHPairToken0 === WETHPartner.address ? expectedOutputAmount : 0,
          router.address
        );
    });

    it("amounts", async () => {
      const {
        swapRouter: router,
        wallet,
        WETHPartner,
        wethPair: WETHPair,
        WETH,
        routerEventEmitter,
      } = await loadFixture(fixture);

      await WETHPartner.transfer(WETHPair.address, WETHPartnerAmount);
      await WETH.deposit({ value: ETHAmount });
      await WETH.transfer(WETHPair.address, ETHAmount);
      await WETHPair.mint(wallet.address);

      await WETHPartner.approve(
        routerEventEmitter.address,
        ethers.constants.MaxUint256
      );
      await expect(
        routerEventEmitter.swapExactTokensForETH(
          router.address,
          swapAmount,
          0,
          [WETHPartner.address, WETH.address],
          wallet.address,
          ethers.constants.MaxUint256
        )
      )
        .to.emit(routerEventEmitter, "Amounts")
        .withArgs([swapAmount, expectedOutputAmount]);
    });
  });

  describe("swapETHForExactTokens", () => {
    const WETHPartnerAmount = expandTo18Decimals(10);
    const ETHAmount = expandTo18Decimals(5);
    const expectedSwapAmount = 557227237267357629n;
    const outputAmount = expandTo18Decimals(1);

    it("happy path", async () => {
      const {
        swapRouter: router,
        wallet,
        WETHPartner,
        wethPair: WETHPair,
        WETH,
      } = await loadFixture(fixture);

      await WETHPartner.transfer(WETHPair.address, WETHPartnerAmount);
      await WETH.deposit({ value: ETHAmount });
      await WETH.transfer(WETHPair.address, ETHAmount);
      await WETHPair.mint(wallet.address);

      const WETHPairToken0 = await WETHPair.token0();
      await expect(
        router.swapETHForExactTokens(
          outputAmount,
          [WETH.address, WETHPartner.address],
          wallet.address,
          ethers.constants.MaxUint256,
          { value: expectedSwapAmount }
        )
      )
        .to.emit(WETH, "Transfer")
        .withArgs(router.address, WETHPair.address, expectedSwapAmount)
        .to.emit(WETHPartner, "Transfer")
        .withArgs(WETHPair.address, wallet.address, outputAmount)
        .to.emit(WETHPair, "Sync")
        .withArgs(
          WETHPairToken0 === WETHPartner.address
            ? WETHPartnerAmount - outputAmount
            : ETHAmount + expectedSwapAmount,
          WETHPairToken0 === WETHPartner.address
            ? ETHAmount + expectedSwapAmount
            : WETHPartnerAmount - outputAmount
        )
        .to.emit(WETHPair, "Swap")
        .withArgs(
          router.address,
          WETHPairToken0 === WETHPartner.address ? 0 : expectedSwapAmount,
          WETHPairToken0 === WETHPartner.address ? expectedSwapAmount : 0,
          WETHPairToken0 === WETHPartner.address ? outputAmount : 0,
          WETHPairToken0 === WETHPartner.address ? 0 : outputAmount,
          wallet.address
        );
    });

    it("amounts", async () => {
      const {
        swapRouter: router,
        wallet,
        WETHPartner,
        wethPair: WETHPair,
        WETH,
        routerEventEmitter,
      } = await loadFixture(fixture);

      await WETHPartner.transfer(WETHPair.address, WETHPartnerAmount);
      await WETH.deposit({ value: ETHAmount });
      await WETH.transfer(WETHPair.address, ETHAmount);
      await WETHPair.mint(wallet.address);

      await expect(
        routerEventEmitter.swapETHForExactTokens(
          router.address,
          outputAmount,
          [WETH.address, WETHPartner.address],
          wallet.address,
          ethers.constants.MaxUint256,
          { value: expectedSwapAmount }
        )
      )
        .to.emit(routerEventEmitter, "Amounts")
        .withArgs([expectedSwapAmount, outputAmount]);
    });
  });
});
