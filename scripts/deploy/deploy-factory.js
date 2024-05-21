const { writeFileSync } = require("fs");
const deployVariables = require("./deploy-variables.js")


async function main() {
  const [deployer] = await ethers.getSigners();

  const network = "baseSepolia";

  console.log("Deploying contracts with the account:", deployer.address);

  const FuulFactory = await hre.ethers.getContractFactory("FuulFactory");

  const networkDeployVariables = deployVariables[network];

  const fuulManagerAddress = networkDeployVariables.fuulManagerAddress;

  const protocolFeeCollector = networkDeployVariables.protocolFeeCollector;

  const nftFeeCurrency = ethers.ZeroAddress;

  const erc20 = networkDeployVariables.erc20

  const fuulFactory = await FuulFactory.deploy(
    fuulManagerAddress,
    protocolFeeCollector,
    nftFeeCurrency,
    erc20
  );

  await fuulFactory.waitForDeployment();

  const deployedAddress = await fuulFactory.getAddress()

  console.log("FuulFactory deployed at:", deployedAddress);

  writeFileSync(
    `deployment/fuulFactory-${network}.json`,
    JSON.stringify(
      {
        address: deployedAddress,
        args: [fuulManagerAddress, protocolFeeCollector, nftFeeCurrency, erc20],
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
