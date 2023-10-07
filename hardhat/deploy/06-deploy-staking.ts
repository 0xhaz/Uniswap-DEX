import { DeployFunction, DeployResult } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { developmentChains, networkConfig } from "../hardhat-helper";
import { ethers, network } from "hardhat";
import verify from "../utils/verify";
import { saveFrontEndFiles, saveConfig } from "../utils/save-frontend-files";
import { StakingPool } from "../typechain";

const deployStaking: DeployFunction = async (
  hre: HardhatRuntimeEnvironment
) => {
  const { deployments, getNamedAccounts, network } = hre;
  const { deploy, log, get } = deployments;
  const { deployer } = await getNamedAccounts();
  const chaindId: number | undefined = network.config.chainId;
  let blockConfirmations;

  const isDevelopment = developmentChains.includes(network.name);

  const usdtContract = await deployments.get("USDT");
  const rTokenContract = await deployments.get("RToken");

  const args: any = [usdtContract.address, rTokenContract.address];

  const staking = await deployments.deploy("StakingPool", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: blockConfirmations || 5,
  });

  const stakingContract = (await ethers.getContractAt(
    "StakingPool",
    staking.address
  )) as StakingPool;

  const contractFactory = [{ name: "StakingPool", address: staking.address }];

  log(`StakingPool: ${staking.address}`);
  log("---------------------------------------------------------------");

  saveFrontEndFiles(stakingContract, "StakingPool");
  saveConfig(contractFactory);

  log(`Deployed StakingPool Contract: ${staking.address}`);
  log("---------------------------------------------------------------");

  if (!isDevelopment && process.env.ETHERSCAN_API_KEY) {
    await verify(staking.address, args);
    log(`Contract verified: ${staking.address}`);
    log("---------------------------------------------------------------");
  }
};

deployStaking.tags = ["all", "StakingPool"];
export default deployStaking;
