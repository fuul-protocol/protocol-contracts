const { writeFileSync } = require("fs");
const deployVariables = require("./deploy-variables.js")


async function main() {

  const deployer = await hre.deployer.getWallet(0);

  const network = "abstract";

  console.log("Deploying contracts with the account:", deployer.address);

  const networkDeployVariables = deployVariables[network];

  const fuulManagerAddress = networkDeployVariables.fuulManagerAddress;

  const protocolFeeCollector = networkDeployVariables.protocolFeeCollector;

  const nftFeeCurrency = ethers.ZeroAddress;

  const erc20 = networkDeployVariables.erc20

  const fuulFactory = await hre.deployer.deploy("zkFuulFactory", [
    fuulManagerAddress,
    protocolFeeCollector,
    nftFeeCurrency,
    erc20]
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
