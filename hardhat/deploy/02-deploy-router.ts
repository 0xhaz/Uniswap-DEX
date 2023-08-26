import { DeployFunction, DeployResult } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { developmentChains, networkConfig } from "../hardhat-helper";
import { ethers, network } from "hardhat";
import verify from "../utils/verify";
import { saveFrontEndFiles, saveConfig } from "../utils/save-frontend-files";
import { SwapRouter } from "../typechain";

const deployRouter: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts, network } = hre;
  const { deploy, log, get } = deployments;
  const { deployer } = await getNamedAccounts();
  const chaindId: number | undefined = network.config.chainId;
  let blockConfirmations;

  const isDevelopment = developmentChains.includes(network.name);

  const factoryContract = await deployments.get("SwapPairTokensFactory");
  const wethContract = await deployments.get("WETH9");

  const args: any = [factoryContract.address, wethContract.address];

  const router = await deployments.deploy("SwapRouter", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: blockConfirmations || 1,
  });

  const routerContract = (await ethers.getContractAt(
    "SwapRouter",
    router.address
  )) as SwapRouter;

  const contractFactory = [{ name: "SwapRouter", address: router.address }];

  log(`SwapRouter: ${router.address}`);
  log("---------------------------------------------------------------");

  saveFrontEndFiles(routerContract, "SwapRouter");
  saveConfig(contractFactory);

  log(`Deployed Router Contract: ${router.address}`);
  log("---------------------------------------------------------------");

  if (!isDevelopment && process.env.ETHERSCAN_API_KEY) {
    await verify(router.address, args);
    log(`Contract verified: ${router.address}`);
    log("---------------------------------------------------------------");
  }
};

deployRouter.tags = ["all", "SwapRouter"];
export default deployRouter;
