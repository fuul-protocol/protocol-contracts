const { writeFileSync } = require("fs");
const deployVariables = require("./deploy-variables.js")

async function main() {

  const network = "zkSyncEra";

  const deployer = await hre.deployer.getWallet(0);
  // const pauser = await hre.deployer.getWallet(1);
  const pauser = "0xf3F207Ee9e130830D51e46Ba701f4bCB52403A39"

  console.log("Deploying contracts with the account:", deployer.address);

  const networkDeployVariables = deployVariables[network];

  const attributor = networkDeployVariables.attributor

  const unpauser = networkDeployVariables.contractAdmin

  const erc20 = networkDeployVariables.erc20

  const limit = ethers.parseEther("100000");

  const fuulManager = await hre.deployer.deploy("FuulManager",
    [attributor,
      pauser,
      unpauser,
      erc20,
      limit,
      limit]
  );

  await fuulManager.waitForDeployment();

  const deployedAddress = await fuulManager.getAddress()

  console.log("FuulManager deployed at:", deployedAddress);

  writeFileSync(
    `deployment/fuulManager-${network}.json`,
    JSON.stringify(
      {
        address: deployedAddress,
        args: [attributor, pauser, unpauser, erc20, limit, limit],
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
