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
    const factory = (await tmp.deploy(wallet.address)) as SwapPairTokensFactory;
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
      .withArgs(TEST_ADDRESSES[0], TEST_ADDRESSES[1], create2Address, 1);

    await expect(factory.createPair(tokens[0], tokens[1])).to.be.revertedWith(
      "SwapPairTokensFactory::createPair: PAIR_EXISTS"
    );

    await expect(factory.createPair(tokens[1], tokens[0])).to.be.revertedWith(
      "SwapPairTokensFactory::createPair: PAIR_EXISTS"
    );

    expect(await factory.getPair(tokens[0], tokens[1])).to.equal(
      create2Address
    );
    expect(await factory.getPair(tokens[1], tokens[0])).to.equal(
      create2Address
    );
    expect(await factory.allPairs(0)).to.equal(create2Address);
    expect(await factory.allPairsLength()).to.equal(1);

    const pair = pairContract.attach(create2Address) as SwapPairTokens;
    expect(await pair.factory()).to.equal(factoryAddress);
    expect(await pair.token0()).to.equal(TEST_ADDRESSES[0]);
    expect(await pair.token1()).to.equal(TEST_ADDRESSES[1]);
  };

  it("createPair", async () => {
    const { factory } = await loadFixture(fixture);
    await createPair(factory, [...TEST_ADDRESSES]);
  });

  it("createPair: reversed tokens", async () => {
    const { factory } = await loadFixture(fixture);
    const reversedAddress: [string, string] = [
      TEST_ADDRESSES[1],
      TEST_ADDRESSES[0],
    ];
    await createPair(factory, reversedAddress);
  });

  it("createPair: gas", async () => {
    const { factory } = await loadFixture(fixture);
    const estimateGas = await factory.estimateGas.createPair(...TEST_ADDRESSES);
    const tx = await factory.createPair(...TEST_ADDRESSES);
    const receipt = await tx.wait();
    const gasUsed = receipt.gasUsed;
    expect(gasUsed).to.equal(estimateGas);
  });

  it("setFeeTo", async () => {
    const { factory, wallet, other } = await loadFixture(fixture);
    await expect(
      factory.connect(other).setFeeTo(other.address)
    ).to.be.revertedWith("SwapPairTokensFactory::setFeeTo: FORBIDDEN");
    await factory.setFeeTo(wallet.address);
    expect(await factory.feeTo()).to.equal(wallet.address);
  });

  it("setFeeToSetter", async () => {
    const { factory, wallet, other } = await loadFixture(fixture);
    await expect(
      factory.connect(other).setFeeToSetter(other.address)
    ).to.be.revertedWith("SwapPairTokensFactory::setFeeToSetter: FORBIDDEN");
    await factory.setFeeToSetter(other.address);
    expect(await factory.feeToSetter()).to.equal(other.address);
    await expect(factory.setFeeToSetter(wallet.address)).to.be.revertedWith(
      "SwapPairTokensFactory::setFeeToSetter: FORBIDDEN"
    );
  });
});
