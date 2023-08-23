import { expect } from "chai";
import { SwapPairTokensFactory, SwapPairTokens } from "../typechain";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { getCreate2Address } from "./shared/utilities";
import { ethers } from "hardhat";

const TEST_ADDRESSES: [string, string] = [
  "0x1000000000000000000000000000000000000000",
  "0x2000000000000000000000000000000000000000",
];

describe("SwapPairTokensFactory", () => {
  const fixture = async () => {
    const tmp = await ethers.getContractFactory("SwapPairTokensFactory");
    const [wallet, other] = await ethers.getSigners();
    const factory = await tmp.deploy(wallet.address);
    return { factory, wallet, other };
  };

  it("feeTo, feeToSetter, allPairsLength", async () => {
    const { factory, wallet } = await loadFixture(fixture);
    expect(await factory.feeTo()).to.equal(ethers.constants.AddressZero);
    expect(await factory.feeToSetter()).to.equal(wallet.address);
    expect(await factory.allPairsLength()).to.equal(0);
  });

  const createPair = async (
    factory: SwapPairTokensFactory,
    tokens: [string, string]
  ) => {
    const pairContract = await ethers.getContractFactory("SwapPairTokens");
    const factoryAddress = factory.address;
    const create2Address = getCreate2Address(
      factoryAddress,
      tokens,
      pairContract.bytecode
    );
    await expect(factory.createPair(tokens[0], tokens[1]))
      .to.emit(factory, "PairCreated")
      .withArgs(tokens[0], tokens[1], create2Address, 1);

    await expect(factory.createPair(tokens[0], tokens[1])).to.be.revertedWith(
      "SwapPairTokensFactory::createPair: PAIR_EXIST"
    );

    await expect(factory.createPair(tokens[1], tokens[0])).to.be.revertedWith(
      "SwapPairTokensFactory::createPair: PAIR_EXIST"
    );
  };
});
