import { DeployFunction, DeployResult } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { developmentChains, networkConfig } from "../hardhat-helper";
import { ethers, network } from "hardhat";
import verify from "../utils/verify";
import { saveFrontEndFiles, saveConfig } from "../utils/save-frontend-files";
import { StakingPoolRouter } from "../typechain";

const deployStakingRouter: DeployFunction = async (
  hre: HardhatRuntimeEnvironment
) => {
  const { deployments, getNamedAccounts, network } = hre;
  const { deploy, log, get } = deployments;
  const { deployer } = await getNamedAccounts();
  const chaindId: number | undefined = network.config.chainId;
  let blockConfirmations;

  const isDevelopment = developmentChains.includes(network.name);

  const factoryContract = await deployments.get("StakingPoolFactory");
  const wethContract = await deployments.get("WETH9");
  const rTokenContract = await deployments.get("RToken");

  const args: any = [
    factoryContract.address,
    wethContract.address,
    rTokenContract.address,
  ];

  const router = await deployments.deploy("StakingPoolRouter", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: blockConfirmations || 5,
  });

  const routerContract = (await ethers.getContractAt(
    "StakingPoolRouter",
    router.address
  )) as StakingPoolRouter;

  const contractFactory = [
    { name: "StakingPoolRouter", address: router.address },
  ];

  log(`StakingPoolRouter: ${router.address}`);
  log("---------------------------------------------------------------");

  saveFrontEndFiles(routerContract, "StakingPoolRouter");
  saveConfig(contractFactory);

  log(`Deployed Router Contract: ${router.address}`);
  log("---------------------------------------------------------------");

  if (!isDevelopment && process.env.ETHERSCAN_API_KEY) {
    await verify(router.address, args);
    log(`Contract verified: ${router.address}`);
    log("---------------------------------------------------------------");
  }
};

deployStakingRouter.tags = ["all", "StakingPoolRouter"];
export default deployStakingRouter;
