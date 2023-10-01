import { DeployFunction, DeployResult } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { developmentChains, networkConfig } from "../hardhat-helper";
import { ethers, network } from "hardhat";
import verify from "../utils/verify";
import { saveFrontEndFiles, saveConfig } from "../utils/save-frontend-files";
import { LendingPoolRouter } from "../typechain";

const deployLendingRouter: DeployFunction = async (
  hre: HardhatRuntimeEnvironment
) => {
  const { deployments, getNamedAccounts, network } = hre;
  const { deploy, log, get } = deployments;
  const { deployer } = await getNamedAccounts();
  const chaindId: number | undefined = network.config.chainId;
  let blockConfirmations;

  const isDevelopment = developmentChains.includes(network.name);

  const factoryContract = await deployments.get("LendingPoolFactory");
  const wethContract = await deployments.get("WETH9");

  const args: any = [factoryContract.address, wethContract.address];

  const router = await deployments.deploy("LendingPoolRouter", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: blockConfirmations || 1,
  });

  const routerContract = (await ethers.getContractAt(
    "LendingPoolRouter",
    router.address
  )) as LendingPoolRouter;

  const contractFactory = [
    { name: "LendingPoolRouter", address: router.address },
  ];

  log(`LendingPoolRouter: ${router.address}`);
  log("---------------------------------------------------------------");

  saveFrontEndFiles(routerContract, "LendingPoolRouter");
  saveConfig(contractFactory);

  log(`Deployed Router Contract: ${router.address}`);
  log("---------------------------------------------------------------");

  if (!isDevelopment && process.env.ETHERSCAN_API_KEY) {
    await verify(router.address, args);
    log(`Contract verified: ${router.address}`);
    log("---------------------------------------------------------------");
  }
};

deployLendingRouter.tags = ["all", "LendingPoolRouter"];
export default deployLendingRouter;
