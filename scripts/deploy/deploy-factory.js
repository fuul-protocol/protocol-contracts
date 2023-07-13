const { writeFileSync } = require("fs");

async function main() {
  const [deployer, user1] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const FuulFactory = await hre.ethers.getContractFactory("FuulFactory");

  const manager = user1.address;
  const feeCollector = deployer.address;
  const feeCurrency = ethers.constants.AddressZero;
  const erc20 = "0x2a61f17d6Ab1288627D8E21D75712df07007dafb";

  const fuulFactory = await FuulFactory.deploy(
    manager,
    feeCollector,
    feeCurrency,
    erc20
  );

  await fuulFactory.deployed();

  console.log("FuulFactory deployed at:", fuulFactory.address);

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
