async function main() {
  const [signer] = await ethers.getSigners();

  const address = "0x78108565287DA4Bb3D27D8e03d58d334fC27AF1a";
  const FuulProject = await ethers.getContractFactory("FuulProject");
  const fuulProject = await FuulProject.attach(address);

  const uri = await fuulProject.projectInfoURI();

  console.log(uri);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
