async function main() {
  const [signer] = await ethers.getSigners();

  const address = "0xe432a8623d23e92dd13ae94fcb5cbdb91db348d6";
  const FuulProject = await ethers.getContractFactory("FuulProject");
  const fuulProject = await FuulProject.attach(address);

  const uri = await fuulProject.availableToClaim(
    "0x3cdbe7ea95a9f8c4d44c7bb6b72d7612cabeaa88",
    "0x2a61f17d6Ab1288627D8E21D75712df07007dafb"
  );

  console.log(uri);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
