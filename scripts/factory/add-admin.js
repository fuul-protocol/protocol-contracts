const deployedAddress = require("../../deployment/fuulFactory.json");

async function main() {
  const address = deployedAddress.address;
  const FuulFactory = await ethers.getContractFactory("FuulFactory");
  const fuulFactory = await FuulFactory.attach(address);

  const adminRole = await fuulFactory.DEFAULT_ADMIN_ROLE();

  const newAdmin = "0xe91188000282D159209397948e104D4dd0616E66";

  await fuulFactory.grantRole(adminRole, newAdmin);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
