const { ContractFactory, utils, BigNumber } = require("ethers");

const WETH9 = require("../context/WETH9.json");

type linkLibrariesType = {
  bytecode: string;
  linkReferences: any;
};

type linkReferencesType = {
  start: number;
  length: number;
};

const artifacts = {
  UniswapV3Factory: require("@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json"),
  SwapRouter: require("@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json"),
  NFTDescriptor: require("@uniswap/v3-periphery/artifacts/contracts/libraries/NFTDescriptor.sol/NFTDescriptor.json"),
  NonfungibleTokenPositionDescriptor: require("@uniswap/v3-periphery/artifacts/contracts/NonfungibleTokenPositionDescriptor.sol/NonfungibleTokenPositionDescriptor.json"),
  NonfungiblePositionManager: require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json"),
  WETH9,
};

const linkLibraries = (
  { bytecode, linkReferences }: linkLibrariesType,
  libraries: any
) => {
  Object.keys(linkReferences).forEach(fileName => {
    Object.keys(linkReferences[fileName]).forEach(contractName => {
      if (!libraries.hasOwnProperty(contractName)) {
        throw new Error(`Missing library for ${contractName}`);
      }

      const address = utils
        .getAddress(libraries[contractName])
        .toLowerCase()
        .slice(2);

      linkReferences[fileName][contractName].forEach(
        ({ start, length }: linkReferencesType) => {
          const start2 = 2 + start * 2;
          const length2 = length * 2;

          bytecode = bytecode
            .slice(0, start2)
            .concat(address)
            .concat(bytecode.slice(start2 + length2, bytecode.length));
        }
      );
    });
  });

  return bytecode;
};

async function mainContract() {
  const [signer] = await ethers.getSigners();
  const Weth = new ContractFactory(
    artifacts.WETH9.abi,
    artifacts.WETH9.bytecode,
    signer
  );
  const weth = await Weth.deploy();

  const Factory = new ContractFactory(
    artifacts.UniswapV3Factory.abi,
    artifacts.UniswapV3Factory.bytecode,
    signer
  );
  const factory = await Factory.deploy();

  const SwapRouter = new ContractFactory(
    artifacts.SwapRouter.abi,
    artifacts.SwapRouter.bytecode,
    signer
  );
  const swapRouter = await SwapRouter.deploy(factory.address, weth.address);

  const NFTDescriptor = new ContractFactory(
    artifacts.NFTDescriptor.abi,
    artifacts.NFTDescriptor.bytecode,
    signer
  );
  const nftDescriptor = await NFTDescriptor.deploy();

  const linkedBytecode = linkLibraries(
    {
      bytecode: artifacts.NonfungibleTokenPositionDescriptor.bytecode,
      linkReferences: {
        "NFTDescriptor.sol": {
          NFTDescriptor: [
            {
              length: 20,
              start: 1681,
            },
          ],
        },
      },
    },
    {
      NFTDescriptor: nftDescriptor.address,
    }
  );

  const NonfungibleTokenPositionDescriptor = new ContractFactory(
    artifacts.NonfungibleTokenPositionDescriptor.abi,
    linkedBytecode,
    signer
  );

  const nonfungibleTokenPositionDescriptor =
    await NonfungibleTokenPositionDescriptor.deploy(
      weth.address,
      "0x4554480000000000000000000000000000000000000000000000000000000000"
    );

  const nonfungiblePositionManager = new ContractFactory(
    artifacts.NonfungiblePositionManager.abi,
    artifacts.NonfungiblePositionManager.bytecode,
    signer
  );

  const nonfungiblePositionManger = await nonfungiblePositionManager.deploy(
    factory.address,
    weth.address,
    nonfungibleTokenPositionDescriptor.address
  );

  console.log("wethAddress=", `'${weth.address}'`);
  console.log("factoryAddress=", `'${factory.address}'`);
  console.log("swapRouterAddress=", `'${swapRouter.address}'`);
  console.log("nftDescriptorAddress=", `'${nftDescriptor.address}'`);
  console.log(
    "positionDescriptorAddress=",
    `'${nonfungibleTokenPositionDescriptor.address}'`
  );
  console.log(
    "positionManagerAddress=",
    `'${nonfungiblePositionManager.address}'`
  );
}

mainContract()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
