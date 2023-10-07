import { DeployFunction, DeployResult } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { developmentChains, networkConfig } from "../hardhat-helper";
import { ethers, network } from "hardhat";
import verify from "../utils/verify";
import { saveFrontEndFiles, saveConfig } from "../utils/save-frontend-files";
import { SwapPairTokens2 } from "../typechain";

const deploySwapPairTokens2: DeployFunction = async (
  hre: HardhatRuntimeEnvironment
) => {
  const { deployments, getNamedAccounts, network } = hre;
  const { deploy, log, get } = deployments;
  const { deployer } = await getNamedAccounts();
  const chaindId: number | undefined = network.config.chainId;
  let blockConfirmations;

  const isDevelopment = developmentChains.includes(network.name);

  const usdtContract = await deployments.get("USDT");
  const usdcContract = await deployments.get("USDC");
  const wethContract = await deployments.get("WETH9");
  const linkContract = await deployments.get("Link");

  const args: any = [usdtContract.address, wethContract.address];

  const swapPairTokens2 = await deployments.deploy("SwapPairTokens2", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: blockConfirmations || 5,
  });

  const swapPairTokens2Contract = (await ethers.getContractAt(
    "SwapPairTokens2",
    swapPairTokens2.address
  )) as SwapPairTokens2;

  const contractFactory = [
    { name: "SwapPairTokens2", address: swapPairTokens2.address },
  ];

  log(`SwapPairTokens2: ${swapPairTokens2.address}`);
  log("---------------------------------------------------------------");

  saveFrontEndFiles(swapPairTokens2Contract, "SwapPairTokens2");
  saveConfig(contractFactory);

  log(`Deployed SwapPairTokens2 Contract: ${swapPairTokens2.address}`);
  log("---------------------------------------------------------------");

  if (!isDevelopment && process.env.ETHERSCAN_API_KEY) {
    await verify(swapPairTokens2.address, args);
    log(`Contract verified: ${swapPairTokens2.address}`);
    log("---------------------------------------------------------------");
  }
};

deploySwapPairTokens2.tags = ["all", "SwapPairTokens2"];
export default deploySwapPairTokens2;
