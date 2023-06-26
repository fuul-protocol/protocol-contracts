async function main() {
  const [signer] = await ethers.getSigners();

  const address = "0x7943fc4305d773d04c48093b99b45d46945fde3e";
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
