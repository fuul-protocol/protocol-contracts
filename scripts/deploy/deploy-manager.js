const { writeFileSync } = require("fs");
const deployVariables = require("./deploy-variables.js")
const { ethers } = require("hardhat");

async function main() {
  const [deployer, user1] = await ethers.getSigners();

  const network = "baseSepolia";

  console.log("Deploying contracts with the account:", deployer.address);

  const FuulManager = await hre.ethers.getContractFactory("FuulManager");

  const networkDeployVariables = deployVariables[network];

  const attributor = networkDeployVariables.attributor

  const pauser = user1.address;

  const unpauser = networkDeployVariables.contractAdmin

  const erc20 = networkDeployVariables.erc20

  const limit = ethers.parseEther("100000");

  const fuulManager = await FuulManager.deploy(
    attributor,
    pauser,
    unpauser,
    erc20,
    limit,
    limit
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
