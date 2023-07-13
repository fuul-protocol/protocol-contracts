const deployedAddress = require("../../deployment/fuulFactory.json");

async function main() {
  const address = deployedAddress.address;
  const FuulFactory = await ethers.getContractFactory("FuulFactory");
  const fuulFactory = await FuulFactory.attach(address);

  const managerRole = await fuulFactory.MANAGER_ROLE();

  // await fuulFactory.grantRole(
  //   managerRole,
  //   "0xe4566e2504eee95169fdae9c124357c80669dd5c"
  // );

  const test = await fuulFactory.hasManagerRole(
    "0xe4566e2504eee95169fdae9c124357c80669dd5c"
  );

  console.log(test);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
