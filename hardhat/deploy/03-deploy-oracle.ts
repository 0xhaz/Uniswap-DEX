import { DeployFunction, DeployResult } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { developmentChains, networkConfig } from "../hardhat-helper";
import { ethers, network } from "hardhat";
import verify from "../utils/verify";
import { saveFrontEndFiles, saveConfig } from "../utils/save-frontend-files";
import { SwapPriceOracle } from "../typechain";

const deployOracle: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts, network } = hre;
  const { deploy, log, get } = deployments;
  const { deployer } = await getNamedAccounts();
  const chaindId: number | undefined = network.config.chainId;
  let blockConfirmations;

  const isDevelopment = developmentChains.includes(network.name);

  const factoryContract = await deployments.get("SwapPairTokensFactory");
  const wethContract = await deployments.get("WETH9");

  const args: any = [factoryContract.address, wethContract.address];

  const oracle = await deployments.deploy("SwapPriceOracle", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: blockConfirmations || 1,
  });

  const oracleContract = (await ethers.getContractAt(
    "SwapPriceOracle",
    oracle.address
  )) as SwapPriceOracle;

  const contractFactory = [
    { name: "SwapPriceOracle", address: oracle.address },
  ];

  log(`SwapPriceOracle: ${oracle.address}`);
  log("---------------------------------------------------------------");

  saveFrontEndFiles(oracleContract, "SwapPriceOracle");
  saveConfig(contractFactory);

  log(`Deployed Oracle Contract: ${oracle.address}`);
  log("---------------------------------------------------------------");

  if (!isDevelopment && process.env.ETHERSCAN_API_KEY) {
    await verify(oracle.address, args);
    log(`Contract verified: ${oracle.address}`);
    log("---------------------------------------------------------------");
  }
};

deployOracle.tags = ["all", "SwapPriceOracle"];
export default deployOracle;
