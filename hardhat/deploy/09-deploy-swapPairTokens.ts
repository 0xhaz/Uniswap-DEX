import { DeployFunction, DeployResult } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { developmentChains, networkConfig } from "../hardhat-helper";
import { ethers, network } from "hardhat";
import verify from "../utils/verify";
import { saveFrontEndFiles, saveConfig } from "../utils/save-frontend-files";
import { SwapPairTokens } from "../typechain";

const deploySwapPairTokens: DeployFunction = async (
  hre: HardhatRuntimeEnvironment
) => {
  const { deployments, getNamedAccounts, network } = hre;
  const { deploy, log, get } = deployments;
  const { deployer } = await getNamedAccounts();
  const chaindId: number | undefined = network.config.chainId;
  let blockConfirmations;

  const isDevelopment = developmentChains.includes(network.name);

  const args: any = [];

  const swapPairTokens = await deployments.deploy("SwapPairTokens", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: blockConfirmations || 1,
  });

  const swapPairTokensContract = (await ethers.getContractAt(
    "SwapPairTokens",
    swapPairTokens.address
  )) as SwapPairTokens;

  const contractFactory = [
    { name: "SwapPairTokens", address: swapPairTokens.address },
  ];

  log(`SwapPairTokens: ${swapPairTokens.address}`);
  log("---------------------------------------------------------------");

  saveFrontEndFiles(swapPairTokensContract, "SwapPairTokens");
  saveConfig(contractFactory);

  log(`Deployed SwapPairTokens Contract: ${swapPairTokens.address}`);
  log("---------------------------------------------------------------");

  if (!isDevelopment && process.env.ETHERSCAN_API_KEY) {
    await verify(swapPairTokens.address, args);
    log(`Contract verified: ${swapPairTokens.address}`);
    log("---------------------------------------------------------------");
  }
};

deploySwapPairTokens.tags = ["all", "SwapPairTokens"];
export default deploySwapPairTokens;
