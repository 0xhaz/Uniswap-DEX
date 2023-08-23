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
  const borrowAmount = tokens(100);
  const mintAmount = tokens(100);
  const repayAmount = tokens(10);

  const SECONDS_PER_DAY = 86400;
  const LENDING_RATE = 0.1;
  const BORROW_RATE = 0.3;
  const DAYS = 30;

  beforeEach(async () => {
    const LendingPool = await ethers.getContractFactory("LendingPool");

    const ERC20Mock = await ethers.getContractFactory("TokenX");
    tokenX = (await ERC20Mock.deploy()) as TokenX;
    await tokenX.deployed();

    [deployer, owner, addr1, addr2] = await ethers.getSigners();
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

        // // repay with interest
        // transaction = await tokenX
        //   .connect(addr1)
        //   .approve(lendingPool.address, borrowAmount);

        // transaction = await lendingPool
        //   .connect(addr1)
        //   .repay(addr1.address, borrowAmount);

        // result = await transaction.wait();
      });

      it("should repay the borrowed amount", async () => {
        // Simulate the time passing by 1 day
        const oneDayInSeconds = 24 * 60 * 60;
        await ethers.provider.send("evm_increaseTime", [oneDayInSeconds]);

        await tokenX.connect(addr1).approve(lendingPool.address, repayAmount);

        await expect(
          lendingPool.connect(addr1).repay(addr1.address, repayAmount)
        )
          .to.emit(lendingPool, "Repay")
          .withArgs(addr1.address, repayAmount);

        const newBalance = await tokenX.balanceOf(addr1.address);
        expect(newBalance).to.equal(borrowAmount.sub(repayAmount));

        const updatedDebt = await lendingPool.getBorrowers(addr1.address);
        expect(updatedDebt).to.equal(borrowAmount.sub(repayAmount));
      });

      it("should emit a Repay event", async () => {
        expect(transaction)
          .to.emit(lendingPool, "Repay")
          .withArgs(addr1.address, borrowAmount);
      });
    });
    describe("Failure", () => {
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
      });

      it("should reverted if the borrower is not the msg.sender", async () => {
        await tokenX.mint(addr2.address, mintAmount);
        await tokenX.connect(addr2).approve(lendingPool.address, repayAmount);

        await expect(
          lendingPool.connect(addr2).repay(addr2.address, repayAmount)
        ).to.be.revertedWithCustomError(
          lendingPool,
          "LendingPool__InvalidUser"
        );
      });

      it("should reverted if the repayment amount is zero", async () => {
        await expect(
          lendingPool.connect(addr1).repay(addr1.address, 0)
        ).to.be.revertedWithCustomError(
          lendingPool,
          "LendingPool__InvalidAmount"
        );
      });

      it("should reverted if the repayment amount is greater than the borrowed amount", async () => {
        const invalidAmount = tokens(200);
        await expect(
          lendingPool.connect(addr1).repay(addr1.address, invalidAmount)
        ).to.be.revertedWith("Invalid amount");
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
      });

      it("should withdraw tokens", async () => {
        const oneDayInSeconds = 24 * 60 * 60;
        await ethers.provider.send("evm_increaseTime", [oneDayInSeconds]);

        const withdrawAmount = tokens(100);
        const interestFactor = BigNumber.from(10 ** 18);
        const totalSupply = await lendingPool.totalSupply();

        const expectedInterest = withdrawAmount
          .mul(oneDayInSeconds)
          .mul(LENDING_RATE)
          .mul(interestFactor)
          .div(totalSupply);

        const expectedInterestHuman = ethers.utils.formatUnits(
          expectedInterest,
          18
        );

        const expectedWithdrawAmount = withdrawAmount.add(expectedInterest);

        const initialBalance = await tokenX.balanceOf(owner.address);

        await expect(
          lendingPool.connect(owner).withdraw(owner.address, withdrawAmount)
        )
          .to.emit(lendingPool, "Withdraw")
          .withArgs(owner.address, withdrawAmount);

        // const newBalance = await tokenX.balanceOf(owner.address);
        // expect(newBalance).to.equal(initialBalance.add(expectedWithdrawAmount));

        // const updatedBalance = await lendingPool.balanceOf(owner.address);
        // expect(updatedBalance).to.equal(
        //   depositAmount.sub(expectedWithdrawAmount)
        // );
      });
    });
    describe("Failure", () => {
      beforeEach(async () => {});
    });
  });
});
