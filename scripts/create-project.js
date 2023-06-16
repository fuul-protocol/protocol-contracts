async function main() {
  const [signer] = await ethers.getSigners();

  const address = "0x7943fc4305d773d04c48093b99b45d46945fde3e";
  const FuulFactory = await ethers.getContractFactory("FuulFactory");
  const fuulFactory = await FuulFactory.attach(address);

  const uri =
    "https://fuul-metadata-production.s3.amazonaws.com/e604cb51-78dd-4f73-a790-113d37ecb5bd-c0bbcaef-364e-4776-8543-de2f60f209e1/2023-05-31T19%3A48%3A59.258Z.json";

  await fuulFactory.createFuulProject(
    signer.address,
    signer.address,
    uri,
    signer.address
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
