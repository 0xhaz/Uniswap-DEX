import { DeployFunction, DeployResult } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { developmentChains, networkConfig } from "../hardhat-helper";
import { ethers, network } from "hardhat";
import verify from "../utils/verify";
import { saveFrontEndFiles, saveConfig } from "../utils/save-frontend-files";
import { LendingPoolFactory } from "../typechain";

const deployLendingPoolFactory: DeployFunction = async (
  hre: HardhatRuntimeEnvironment
) => {
  const { deployments, getNamedAccounts, network } = hre;
  const { deploy, log, get } = deployments;
  const { deployer } = await getNamedAccounts();
  const chaindId: number | undefined = network.config.chainId;
  let blockConfirmations;

  const isDevelopment = developmentChains.includes(network.name);

  const args: any = [deployer];

  const factory = await deployments.deploy("LendingPoolFactory", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: blockConfirmations || 1,
  });

  const factoryContract = (await ethers.getContractAt(
    "LendingPoolFactory",
    factory.address
  )) as LendingPoolFactory;

  const contractFactory = [
    { name: "LendingPoolFactory", address: factory.address },
  ];

  log(`LendingPoolFactory: ${factory.address}`);
  log("---------------------------------------------------------------");

  saveFrontEndFiles(factoryContract, "LendingPoolFactory");
  saveConfig(contractFactory);

  log(`Deployed LendingPool Factory Contract: ${factory.address}`);
  log("---------------------------------------------------------------");

  if (!isDevelopment && process.env.ETHERSCAN_API_KEY) {
    await verify(factory.address, args);
    log(`Contract verified: ${factory.address}`);
    log("---------------------------------------------------------------");
  }
};

deployLendingPoolFactory.tags = ["all", "LendingPoolFactory"];
export default deployLendingPoolFactory;
