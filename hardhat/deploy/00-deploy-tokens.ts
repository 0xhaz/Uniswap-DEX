import { DeployFunction, DeployResult } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { developmentChains, networkConfig } from "../hardhat-helper";
import { ethers, network } from "hardhat";
import verify from "../utils/verify";
import { saveFrontEndFiles, saveConfig } from "../utils/save-frontend-files";
import { Link, USDT, USDC, RToken, WETH9 } from "../typechain";
import { Contract } from "ethers";

const contractNames = ["Link", "USDT", "USDC", "RToken"];

const deployTokens: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts, network } = hre;
  const { deploy, log, get } = deployments;
  const { deployer } = await getNamedAccounts();
  const chaindId: number | undefined = network.config.chainId;

  let blockConfirmations;

  const isDevelopment = developmentChains.includes(network.name);

  const args: any = [];

  const LinkToken = await deployments.deploy("Link", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: blockConfirmations || 1,
  });

  const LinkTokenContract = (await ethers.getContractAt(
    "Link",
    LinkToken.address
  )) as Link;

  const linkMintTx = await LinkTokenContract.mint(
    deployer,
    ethers.utils.parseEther("1000000000")
  );

  log(`Link Token Minted: ${linkMintTx.hash} to ${deployer}`);

  log(`Link Token: ${LinkToken.address}`);
  log("---------------------------------------------------------------");

  const USDTToken = await deployments.deploy("USDT", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: blockConfirmations || 1,
  });

  const USDTTokenContract = (await ethers.getContractAt(
    "USDT",
    USDTToken.address
  )) as USDT;

  const usdtMintTx = await USDTTokenContract.mint(
    deployer,
    ethers.utils.parseEther("1000000000")
  );

  log(`USDT Token Minted: ${usdtMintTx.hash} to ${deployer}`);

  log(`USDT Token: ${USDTToken.address}`);
  log("---------------------------------------------------------------");

  const USDCToken = await deployments.deploy("USDC", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: blockConfirmations || 1,
  });

  const USDCTokenContract = (await ethers.getContractAt(
    "USDC",
    USDCToken.address
  )) as USDC;

  const usdcMintTx = await USDCTokenContract.mint(
    deployer,
    ethers.utils.parseEther("1000000000")
  );

  log(`USDC Token Minted: ${usdcMintTx.hash} to ${deployer}`);

  log(`USDC Token: ${USDCToken.address}`);

  log("---------------------------------------------------------------");

  const RToken = await deployments.deploy("RToken", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: blockConfirmations || 1,
  });

  const RTokenContract = (await ethers.getContractAt(
    "RToken",
    RToken.address
  )) as RToken;

  //   const rtokenMintTx = await RTokenTokenContract.mint(
  //     deployer,
  //     ethers.utils.parseEther("1000000000")
  //   );

  //   log(`RToken Token Minted: ${rtokenMintTx.hash} to ${deployer}`);

  log(`RToken Token: ${RToken.address}`);

  log("---------------------------------------------------------------");

  const WETHToken = await deployments.deploy("WETH9", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: blockConfirmations || 1,
  });

  const WETHTokenContract = (await ethers.getContractAt(
    "WETH9",
    WETHToken.address
  )) as WETH9;

  log(`WETH Token: ${WETHToken.address}`);

  log("---------------------------------------------------------------");

  saveFrontEndFiles(LinkTokenContract, "Link");
  saveFrontEndFiles(USDTTokenContract, "USDT");
  saveFrontEndFiles(USDCTokenContract, "USDC");
  saveFrontEndFiles(RTokenContract, "RToken");

  saveConfig([
    { name: "Link", address: LinkToken.address },
    { name: "USDT", address: USDTToken.address },
    { name: "USDC", address: USDCToken.address },
    { name: "RToken", address: RToken.address },
  ]);

  log("saved frontend files");

  log("---------------------------------------------------------------");

  if (!isDevelopment && process.env.ETHERSCAN_API_KEY) {
    await verify(LinkToken.address, args);
    log(`Link Token Verified: ${LinkToken.address}`);
    await verify(USDTToken.address, args);
    log(`USDT Token Verified: ${USDTToken.address}`);
    await verify(USDCToken.address, args);
    log(`USDC Token Verified: ${USDCToken.address}`);
    await verify(RToken.address, args);
    log(`RToken Token Verified: ${RToken.address}`);

    log("---------------------------------------------------------------");
  }
};

deployTokens.tags = ["all", "Tokens"];
export default deployTokens;
