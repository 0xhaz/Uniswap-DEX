async function token() {
  const [owner, signer] = await ethers.getSigners();

  const Usdt = await ethers.getContractFactory("USDT");
  const usdt = await Usdt.deploy();

  const Usdc = await ethers.getContractFactory("USDC");
  const usdc = await Usdc.deploy();

  const Fantom = await ethers.getContractFactory("Fantom");
  const fantom = await Fantom.deploy();

  const Maker = await ethers.getContractFactory("Maker");
  const maker = await Maker.deploy();

  const Link = await ethers.getContractFactory("Link");
  const link = await Link.deploy();

  console.log("usdtAddress=", usdt.address);
  console.log("usdcAddress=", usdc.address);
  console.log("fantomAddress=", fantom.address);
  console.log("makerAddress=", maker.address);
  console.log("linkAddress=", link.address);
}

token()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
