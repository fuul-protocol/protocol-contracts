const deployedAddress = require("../../deployment/fuulManager.json");

async function main() {
  const address = deployedAddress.address;
  const FuulManager = await ethers.getContractFactory("FuulManager");
  const fuulManager = await FuulManager.attach(address);

  const attributorRole = await fuulManager.ATTRIBUTOR_ROLE();

  const newAttributor = "0xe91188000282D159209397948e104D4dd0616E66";

  await fuulManager.grantRole(attributorRole, newAttributor);

  // const test = await fuulFactory.hasManagerRole(
  //   "0xe4566e2504eee95169fdae9c124357c80669dd5c"
  // );

  // console.log(test);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
