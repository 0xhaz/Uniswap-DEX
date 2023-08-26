import { DeployFunction, DeployResult } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { developmentChains, networkConfig } from "../hardhat-helper";
import { ethers, network } from "hardhat";
import verify from "../utils/verify";
import { saveFrontEndFiles, saveConfig } from "../utils/save-frontend-files";
import { StakingPoolFactory } from "../typechain";

const deployStakingFactory: DeployFunction = async (
  hre: HardhatRuntimeEnvironment
) => {
  const { deployments, getNamedAccounts, network } = hre;
  const { deploy, log, get } = deployments;
  const { deployer } = await getNamedAccounts();
  const chaindId: number | undefined = network.config.chainId;
  let blockConfirmations;

  const isDevelopment = developmentChains.includes(network.name);

  const usdcToken = await deployments.get("USDC");
  const rToken = await deployments.get("RToken");
  const linkToken = await deployments.get("Link");
  const wethToken = await deployments.get("WETH9");

  const args: any = [deployer];

  const factory = await deployments.deploy("StakingPoolFactory", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: blockConfirmations || 1,
  });

  const factoryContract = (await ethers.getContractAt(
    "StakingPoolFactory",
    factory.address
  )) as StakingPoolFactory;

  const createUsdcPoolTx = await factoryContract.createPool(
    usdcToken.address,
    rToken.address
  );
  await createUsdcPoolTx.wait();
  log(`USDC Pool Created: ${createUsdcPoolTx.hash}`);

  const createLinkPoolTx = await factoryContract.createPool(
    linkToken.address,
    rToken.address
  );
  await createLinkPoolTx.wait();
  log(`Link Pool Created: ${createLinkPoolTx.hash}`);

  const createWethPoolTx = await factoryContract.createPool(
    wethToken.address,
    rToken.address
  );
  await createWethPoolTx.wait();
  log(`Weth Pool Created: ${createWethPoolTx.hash}`);

  const contractFactory = [
    { name: "StakingPoolFactory", address: factory.address },
  ];

  log(`StakingPoolFactory: ${factory.address}`);
  log("---------------------------------------------------------------");

  saveFrontEndFiles(factoryContract, "StakingPoolFactory");
  saveConfig(contractFactory);

  log(`Deployed StakingPool Factory Contract: ${factory.address}`);
  log("---------------------------------------------------------------");

  if (!isDevelopment && process.env.ETHERSCAN_API_KEY) {
    await verify(factory.address, args);
    log(`Contract verified: ${factory.address}`);
    log("---------------------------------------------------------------");
  }
};

deployStakingFactory.tags = ["all", "StakingPoolFactory"];
export default deployStakingFactory;
