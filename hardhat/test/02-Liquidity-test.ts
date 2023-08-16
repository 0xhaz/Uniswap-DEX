import { network } from "hardhat";

const DAI_WHALE = "0x25B313158Ce11080524DcA0fD01141EeD5f94b81";
const USDC_WHALE = "0x51eDF02152EBfb338e03E30d65C15fBf06cc9ECC";

describe("Liquidity", () => {
  let liquidity: any;
  let accounts: any;
  let dai: any;
  let usdc: any;

  before(async () => {
    accounts = await ethers.getSigners(1);

    const liquidityFactory = await ethers.getContractFactory("Liquidity");
    liquidity = await liquidityFactory.deploy();
    await liquidity.deployed();

    dai = await ethers.getContractAt("IERC20", DAI);
    usdc = await ethers.getContractAt("IERC20", USDC);

    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [DAI_WHALE],
    });

    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [USDC_WHALE],
    });

    const daiWhale = await ethers.getSigner(DAI_WHALE);
    const usdcWhale = await ethers.getSigner(USDC_WHALE);

    const daiAmount = 1000n * 10n ** 18n;
    const usdcAmount = 1000n * 10n ** 6n;

    const daiBalance = await dai.balanceOf(daiWhale.address);
    const usdcBalance = await usdc.balanceOf(usdcWhale.address);
  });

  it("mintNewPosition", async () => {
    const daiAmount = 100n * 10n ** 18n;
    const usdcAmount = 100n * 10n ** 6n;

    await dai.connect(accounts[0]).transfer(liquidity.address, daiAmount);
    await usdc.connect(accounts[0]).transfer(liquidity.address, usdcAmount);

    await liquidity.mintNewPosition();
    console.log(
      "DAI balance: ",
      (await dai.balanceOf(accounts[0].address)).toString()
    );
    console.log(
      "USDC balance: ",
      (await usdc.balanceOf(accounts[0].address)).toString()
    );
  });
});
