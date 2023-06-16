async function main() {
  const [signer] = await ethers.getSigners();

  const address = "0x09f312aa2B138e68d45E3Ff583147eB74f44582b";
  const FuulManager = await ethers.getContractFactory("FuulManager");
  const fuulManager = await FuulManager.attach(address);

  const attributorRole = await fuulManager.ATTRIBUTOR_ROLE();

  await fuulManager.grantRole(
    attributorRole,
    "0xe91188000282D159209397948e104D4dd0616E66"
  );

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
