import { DeployFunction, DeployResult } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { developmentChains, networkConfig } from "../hardhat-helper";
import { SwapPairTokensFactory } from "../typechain";
import { ethers, network } from "hardhat";
import verify from "../utils/verify";
import { saveFrontEndFiles, saveConfig } from "../utils/save-frontend-files";

const deployFactory: DeployFunction = async (
  hre: HardhatRuntimeEnvironment
) => {
  const { deployments, getNamedAccounts, network } = hre;
  const { deploy, log, get } = deployments;
  const { deployer } = await getNamedAccounts();
  const chaindId: number | undefined = network.config.chainId;
  let blockConfirmations;

  const isDevelopment = developmentChains.includes(network.name);

  const args: any = [deployer];

  const factory = await deployments.deploy("SwapPairTokensFactory", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: blockConfirmations || 1,
  });

  const factoryContract = (await ethers.getContractAt(
    "SwapPairTokensFactory",
    factory.address
  )) as SwapPairTokensFactory;

  const contractFactory = [
    { name: "SwapPairTokensFactory", address: factory.address },
  ];

  log(`SwapPairTokensFactory: ${factory.address}`);
  log("---------------------------------------------------------------");

  saveFrontEndFiles(factoryContract, "SwapPairTokensFactory");
  saveConfig(contractFactory);

  log(`Deployed Factory Contract: ${factory.address}`);
  log("---------------------------------------------------------------");

  if (!isDevelopment && process.env.ETHERSCAN_API_KEY) {
    await verify(factory.address, args);
    log(`Contract verified: ${factory.address}`);
    log("---------------------------------------------------------------");
  }
};

deployFactory.tags = ["all", "SwapPairTokensFactory"];
export default deployFactory;
