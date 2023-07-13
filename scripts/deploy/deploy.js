const { writeFileSync } = require("fs");

async function main() {
  const [deployer, user1] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy Manager

  const FuulManager = await hre.ethers.getContractFactory("FuulManager");

  const attributor = "0xe4566e2504eee95169fdae9c124357c80669dd5c";
  const pauser = user1.address;
  const unpauser = user1.address;
  const erc20 = "0x2a61f17d6Ab1288627D8E21D75712df07007dafb";

  const limit = ethers.utils.parseEther("40000000000000");

  const fuulManager = await FuulManager.deploy(
    attributor,
    pauser,
    unpauser,
    erc20,
    limit,
    limit
  );

  await fuulManager.deployed();

  writeFileSync(
    "deployment/fuulManager.json",
    JSON.stringify(
      {
        address: fuulManager.address,
        args: [attributor, pauser, unpauser, erc20, limit, limit],
      },
      null,
      2
    )
  );

  // Deploy factory

  const FuulFactory = await hre.ethers.getContractFactory("FuulFactory");

  const manager = fuulManager.address;
  const feeCollector = deployer.address;
  const feeCurrency = ethers.constants.AddressZero;

  const fuulFactory = await FuulFactory.deploy(
    manager,
    feeCollector,
    feeCurrency,
    erc20
  );

  await fuulFactory.deployed();

  console.log("FuulFactory deployed at:", fuulFactory.addres);

  writeFileSync(
    "deployment/fuulFactory.json",
    JSON.stringify(
      {
        address: fuulFactory.address,
        args: [manager, feeCollector, feeCurrency, erc20],
      },
      null,
      2
    )
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
