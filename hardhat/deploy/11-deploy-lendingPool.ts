import { DeployFunction, DeployResult } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { developmentChains, networkConfig } from "../hardhat-helper";
import { ethers, network } from "hardhat";
import verify from "../utils/verify";
import { saveFrontEndFiles, saveConfig } from "../utils/save-frontend-files";
import { LendingPool } from "../typechain";

const deployLendingPool: DeployFunction = async (
  hre: HardhatRuntimeEnvironment
) => {
  const { deployments, getNamedAccounts, network } = hre;
  const { deploy, log, get } = deployments;
  const { deployer } = await getNamedAccounts();
  const chaindId: number | undefined = network.config.chainId;
  let blockConfirmations;

  const isDevelopment = developmentChains.includes(network.name);

  const wethTokenContract = await deployments.get("WETH9");

  const args: any = [wethTokenContract.address];

  const lendingPool = await deployments.deploy("LendingPool", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: blockConfirmations || 1,
  });

  const lendingPoolContract = (await ethers.getContractAt(
    "LendingPool",
    lendingPool.address
  )) as LendingPool;

  const contractFactory = [
    { name: "LendingPool", address: lendingPool.address },
  ];

  log(`LendingPool: ${lendingPool.address}`);
  log("---------------------------------------------------------------");

  saveFrontEndFiles(lendingPoolContract, "LendingPool");
  saveConfig(contractFactory);

  log(`Deployed LendingPool Contract: ${lendingPool.address}`);
  log("---------------------------------------------------------------");

  if (!isDevelopment && process.env.ETHERSCAN_API_KEY) {
    await verify(lendingPool.address, args);
    log(`Contract verified: ${lendingPool.address}`);
    log("---------------------------------------------------------------");
  }
};

deployLendingPool.tags = ["all", "LendingPool"];
export default deployLendingPool;
