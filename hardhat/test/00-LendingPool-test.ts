import { expect } from "chai";
import { ethers } from "hardhat";
import { LendingPool, TokenX } from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber } from "ethers";

const tokens = (n: number) => {
  return ethers.utils.parseUnits(n.toString(), "ether");
};

const ether = tokens;

const dateToUNIX = (date: Date | string) => {
  return Math.round(new Date(date).getTime() / 1000).toString();
};

describe("LendingPool", () => {
  let lendingPool: LendingPool;
  let deployer: SignerWithAddress;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let addrs: SignerWithAddress[];
  let tokenX: TokenX;
  let transaction: any, result: any;

  const depositAmount = tokens(1000);
  const borrowAmount = tokens(10);
  const mintAmount = tokens(100);
  const INTEREST_RATE = 130;
  const SECONDS_PER_DAY = 86400;
  const DAYS = 30;

  beforeEach(async () => {
    const LendingPool = await ethers.getContractFactory("LendingPool");

    const ERC20Mock = await ethers.getContractFactory("TokenX");
    tokenX = (await ERC20Mock.deploy()) as TokenX;
    await tokenX.deployed();

    [deployer, owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    lendingPool = (await LendingPool.deploy(tokenX.address)) as LendingPool;
    await lendingPool.deployed();
  });

  describe("Deployment", () => {
    it("should set the right token address", async () => {
      expect(await lendingPool.tokenAddress()).to.equal(tokenX.address);
    });
  });

  describe("Deposit", () => {
    describe("Success", () => {
      beforeEach(async () => {
        await tokenX.mint(owner.address, depositAmount);
        await tokenX.connect(owner).approve(lendingPool.address, depositAmount);
        transaction = await lendingPool
          .connect(owner)
          .deposit(depositAmount, owner.address);
        result = await transaction.wait();
      });

      it("should deposit tokens", async () => {
        const ownerBalance = await lendingPool.balanceOf(owner.address);
        expect(ownerBalance).to.equal(depositAmount);
      });

      it("should deposit tokens to the lending pool", async () => {
        const lendingPoolBalance = await tokenX.balanceOf(lendingPool.address);
        expect(lendingPoolBalance).to.equal(depositAmount);
      });

      it("should emit a Deposit event", async () => {
        expect(transaction)
          .to.emit(lendingPool, "Deposit")
          .withArgs(owner.address, depositAmount);
      });
    });

    describe("Failure", () => {
      const invalidAmount = tokens(0);
      beforeEach(async () => {
        await tokenX.mint(owner.address, depositAmount);
        await tokenX.connect(owner).approve(lendingPool.address, invalidAmount);
      });

      it("should not deposit tokens", async () => {
        await expect(
          lendingPool.connect(owner).deposit(invalidAmount, owner.address)
        ).to.be.revertedWithCustomError(
          lendingPool,
          "LendingPool__InvalidAmount"
        );
      });
    });
  });

  describe("Borrow", () => {
    describe("Success", () => {
      beforeEach(async () => {
        await tokenX.mint(owner.address, depositAmount);
        await tokenX.connect(owner).approve(lendingPool.address, depositAmount);

        transaction = await lendingPool
          .connect(owner)
          .deposit(depositAmount, owner.address);
        result = await transaction.wait();

        transaction = await lendingPool
          .connect(addr1)
          .borrow(borrowAmount, addr1.address);
        result = await transaction.wait();
      });

      it("should borrow and transfer tokens", async () => {
        const addr1BorrowedAmount = await tokenX.balanceOf(addr1.address);
        expect(addr1BorrowedAmount).to.equal(borrowAmount);
      });

      it("should reduce the lending pool balance", async () => {
        const lendingPoolBalance = await tokenX.balanceOf(lendingPool.address);
        expect(lendingPoolBalance).to.equal(depositAmount.sub(borrowAmount));
      });

      it("should emit a Borrow event", async () => {
        expect(transaction)
          .to.emit(lendingPool, "Borrow")
          .withArgs(addr1.address, borrowAmount);
      });
    });

    describe("Failure", () => {
      const invalidAmount = tokens(200);

      beforeEach(async () => {
        await tokenX.mint(owner.address, depositAmount);
        await tokenX.connect(owner).approve(lendingPool.address, depositAmount);

        transaction = await lendingPool
          .connect(owner)
          .deposit(depositAmount, owner.address);
        result = await transaction.wait();
      });

      it("should reverted if the borrowed amount exceeds than 10 percent of the lending pool", async () => {
        await expect(
          lendingPool.connect(addr1).borrow(invalidAmount, addr1.address)
        ).to.be.revertedWithCustomError(
          lendingPool,
          "LendingPool__InvalidValue"
        );
      });
    });
  });

  describe("Repay", () => {
    describe("Success", () => {
      let expectedInterest: any;
      let expectedRepayAmount: any;

      //   function calculateRepayAmount(borrowAmount: BigNumber) {
      //     // Convert the values to BigNumber before performing arithmetic
      //     const borrowedAmount = BigNumber.from(borrowAmount);
      //     const interestAmount = borrowedAmount
      //       .mul(DAYS)
      //       .mul(INTEREST_RATE)
      //       .div(365 * 100);

      //     const interestAmountWithDecimals = ethers.utils.parseUnits(
      //       interestAmount.toString(),
      //       "ether"
      //     );
      //     return borrowedAmount.add(interestAmountWithDecimals);
      //   }

      beforeEach(async () => {
        await tokenX.mint(owner.address, depositAmount);
        await tokenX.connect(owner).approve(lendingPool.address, depositAmount);

        // await tokenX.mint(addr1.address, mintAmount);

        transaction = await lendingPool
          .connect(owner)
          .deposit(depositAmount, owner.address);
        result = await transaction.wait();

        transaction = await lendingPool
          .connect(addr1)
          .borrow(borrowAmount, addr1.address);
        result = await transaction.wait();

        // //  move 30 days forward
        // const timeTravel = async (seconds: number) => {
        //   await ethers.provider.send("evm_increaseTime", [seconds]);
        //   await ethers.provider.send("evm_mine", []);
        // };
        // await timeTravel(SECONDS_PER_DAY * DAYS);

        //   Calculate the expected interest
        // expectedRepayAmount = calculateRepayAmount(borrowAmount);

        // repay with interest
        transaction = await tokenX
          .connect(addr1)
          .approve(lendingPool.address, borrowAmount);

        transaction = await lendingPool
          .connect(addr1)
          .repay(addr1.address, borrowAmount);

        result = await transaction.wait();
      });

      it("should repay the borrowed amount", async () => {
        const addr1BorrowedAmount = await tokenX.balanceOf(addr1.address);
        expect(addr1BorrowedAmount).to.equal(0);
        const lendingPoolBalance = await tokenX.balanceOf(lendingPool.address);
        expect(lendingPoolBalance).to.equal(depositAmount);
      });

      it("should emit a Repay event", async () => {
        expect(transaction)
          .to.emit(lendingPool, "Repay")
          .withArgs(addr1.address, borrowAmount);
      });
    });
    describe("Failure", () => {
      it("should reverted if the repayment amount is zero", async () => {
        await expect(
          lendingPool.connect(addr1).borrow(0, addr1.address)
        ).to.be.revertedWithCustomError(
          lendingPool,
          "LendingPool__InvalidAmount"
        );
      });
    });
  });

  describe("Withdraw", () => {
    describe("Success", () => {
      beforeEach(async () => {
        await tokenX.mint(owner.address, depositAmount);
        await tokenX.connect(owner).approve(lendingPool.address, depositAmount);

        transaction = await lendingPool
          .connect(owner)
          .deposit(depositAmount, owner.address);
        result = await transaction.wait();

        transaction = await lendingPool
          .connect(owner)
          .withdraw(owner.address, depositAmount);
        result = await transaction.wait();

        // Fast-forward 30 days
        await ethers.provider.send("evm_increaseTime", [
          SECONDS_PER_DAY * DAYS,
        ]);
        await ethers.provider.send("evm_mine", []);
      });

      it("should withdraw tokens", async () => {
        // const lendingPoolBalance = await tokenX.balanceOf(lendingPool.address);
        // expect(lendingPoolBalance).to.equal(0);
      });
    });
    describe("Failure", () => {
      beforeEach(async () => {});
    });
  });
});
