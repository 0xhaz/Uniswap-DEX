const hre = require("hardhat");

async function main() {
  const FantomToken = await hre.getContractFactory("Fantom");
  const fantomToken = await FantomToken.deploy();
  await fantomToken.deployed();

  console.log("FantomToken deployed to:", fantomToken.address);

  const MakerToken = await hre.getContractFactory("Maker");
  const makerToken = await MakerToken.deploy();
  await makerToken.deployed();

  console.log("MakerToken deployed to:", makerToken.address);

  const ChainlinkToken = await hre.getContractFactory("Link");
  const chainlinkToken = await ChainlinkToken.deploy();
  await chainlinkToken.deployed();

  console.log("ChainlinkToken deployed to:", chainlinkToken.address);

  const UsdcToken = await hre.getContractFactory("USDC");
  const usdcToken = await UsdcToken.deploy();
  await usdcToken.deployed();

  console.log("UsdcToken deployed to:", usdcToken.address);

  const UsdtToken = await hre.getContractFactory("USDT");
  const usdtToken = await UsdtToken.deploy();
  await usdtToken.deployed();

  console.log("UsdtToken deployed to:", usdtToken.address);

  const SingleSwapToken = await hre.getContractFactory("SingleSwapToken");
  const singleSwapToken = await SingleSwapToken.deploy();
  await singleSwapToken.deployed();

  console.log("SingleSwapToken deployed to:", singleSwapToken.address);

  const SwapMultiHop = await hre.getContractFactory("SwapMultiHop");
  const swapMultiHop = await SwapMultiHop.deploy();
  await swapMultiHop.deployed();

  console.log("SwapMultiHop deployed to:", swapMultiHop.address);

  const UserStorageData = await hre.getContractFactory("UserStorageData");
  const userStorageData = await UserStorageData.deploy();
  await userStorageData.deployed();

  console.log("UserStorageData deployed to:", userStorageData.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
