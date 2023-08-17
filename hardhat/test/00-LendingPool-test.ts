import { expect } from "chai";
import { ethers } from "hardhat";
import { LendingPool, IERC20 } from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract } from "ethers";

const tokens = (n: number) => {
  return ethers.utils.parseUnits(n.toString(), "ether");
};

const ether = tokens;

describe("LendingPool", () => {
  let lendingPool: LendingPool;
  let deployer: SignerWithAddress;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let addrs: SignerWithAddress[];
  let tokenX: Contract;

  const NAME = "TokenX";
  const SYMBOL = "TKNX";

  const INITIAL_SUPPLY = tokens(1000000);

  beforeEach(async () => {
    const LendingPool = await ethers.getContractFactory("LendingPool");

    const TokenXFactory = await ethers.getContractFactory("TokenX");
    tokenX = TokenXFactory.attach("0x5FbDB2315678afecb367f032d93F642f64180aa3");

    [deployer, owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    lendingPool = (await LendingPool.deploy(tokenX.address)) as LendingPool;
    await lendingPool.deployed();
  });

  describe("Deployment", () => {
    it("Should set the right token address", async () => {
      expect(await lendingPool.tokenAddress()).to.equal(tokenX.address);
    });
  });
});
