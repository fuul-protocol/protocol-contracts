async function main() {
  const [signer] = await ethers.getSigners();

  const address = "0x09f312aa2B138e68d45E3Ff583147eB74f44582b";
  const FuulManager = await ethers.getContractFactory("FuulManager");
  const fuulManager = await FuulManager.attach(address);

  amount = ethers.utils.parseEther("100");

  const proofWithoutProject = ethers.utils.formatBytes32String("proof");

  const projectAddress = "0x24FeCDDAd66fA78e661DD399b5012865C33C97AA";

  const proof = ethers.utils.solidityKeccak256(
    ["bytes32", "address"],
    [proofWithoutProject, projectAddress]
  );

  // Attribute in new project
  const attributionEntity = {
    projectAddress,
    projectAttributions: [
      {
        partner: "0xbeeb8bdcf25dfce6a6d96098cbd8563e5d41ab31",
        endUser: "0x3cdbe7ea95a9f8c4d44c7bb6b72d7612cabeaa88",
        proof,
        proofWithoutProject,
        currency: "0x2a61f17d6Ab1288627D8E21D75712df07007dafb",
        amountToPartner: amount,
        amountToEndUser: amount,
      },
    ],
  };

  await fuulManager.attributeConversions(
    [attributionEntity],
    "0xbeeb8bdcf25dfce6a6d96098cbd8563e5d41ab31"
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
