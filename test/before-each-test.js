const deployContract = async function (contractName) {
  const ContractFactory = await hre.ethers.getContractFactory(contractName);
  const contract = await ContractFactory.deploy();

  await contract.waitForDeployment();
  return contract;
};

const deployMocks = async function () {
  // Deploy Mock Token Rewards
  const token = await deployContract("MockTokenRewards");

  // Deploy Mock Fee Token Currency
  const nftFeeCurrency = await deployContract("MockTokenRewards");

  // Deploy NFT 721 Rewards

  const nft721 = await deployContract("MockNFT721Rewards");

  // Deploy NFT 1155
  const nft1155 = await deployContract("MockNFT1155Rewards");

  return { token, nftFeeCurrency, nft721, nft1155 };
};

const deployManager = async function (
  signerAddress,
  pauserAddress,
  unpauserAddress,
  tokenAddress,
  limitAmount
) {
  const FuulManager = await hre.ethers.getContractFactory("FuulManager");
  const fuulManager = await FuulManager.deploy(
    signerAddress,
    pauserAddress,
    unpauserAddress,
    tokenAddress,
    limitAmount,
    limitAmount
  );

  await fuulManager.waitForDeployment();

  return fuulManager;
};

const deployFactory = async function (
  fuulManagerAddress,
  protocolFeeCollector,
  nftFeeCurrency,
  tokenAddress
) {
  const FuulFactory = await hre.ethers.getContractFactory("FuulFactory");
  const fuulFactory = await FuulFactory.deploy(
    fuulManagerAddress,
    protocolFeeCollector,
    nftFeeCurrency,
    tokenAddress
  );

  await fuulFactory.waitForDeployment();

  return fuulFactory;
};

const deployzkFactory = async function (
  fuulManagerAddress,
  protocolFeeCollector,
  nftFeeCurrency,
  tokenAddress
) {
  const FuulFactory = await hre.ethers.getContractFactory("zkFuulFactory");
  const fuulFactory = await FuulFactory.deploy(
    fuulManagerAddress,
    protocolFeeCollector,
    nftFeeCurrency,
    tokenAddress
  );

  await fuulFactory.waitForDeployment();

  return fuulFactory;
};

const setupTest = async function (deployProject = true, is_zk = false) {
  await hre.network.provider.send("hardhat_reset");

  const provider = hre.ethers.provider;

  [
    user1,
    user2,
    user3,
    user4,
    user5,
    protocolFeeCollector,
    clientFeeCollector,
  ] = await hre.ethers.getSigners();

  // Deploy mocks

  const { token, nftFeeCurrency, nft721, nft1155 } = await deployMocks();

  const tokenAddress = await token.getAddress()
  const nftFeeCurrencyAddress = await nftFeeCurrency.getAddress()
  const nft721Address = await nft721.getAddress()
  const nft1155Address = await nft1155.getAddress()

  // Deploy Manager

  const limitAmount = ethers.parseEther("10000");

  const fuulManager = await deployManager(
    user1.address,
    user1.address,
    user1.address,
    tokenAddress,
    limitAmount
  );

  const fuulManagerAddress = await fuulManager.getAddress()

  // Deploy Factory

  let fuulFactory;

  if (is_zk) {
    fuulFactory = await deployFactory(
      fuulManagerAddress,
      protocolFeeCollector.address,
      nftFeeCurrencyAddress,
      tokenAddress
    );
  }
  else {
    fuulFactory = await deployzkFactory(
      fuulManagerAddress,
      protocolFeeCollector.address,
      nftFeeCurrencyAddress,
      tokenAddress
    );

  }
  const fuulFactoryAddress = await fuulFactory.getAddress()


  const adminRole = await fuulFactory.DEFAULT_ADMIN_ROLE();
  const managerRole = await fuulFactory.MANAGER_ROLE();

  let fuulProject;
  let fuulProjectAddress;

  if (deployProject) {
    const signer = this.user2.address;
    const tx = await fuulFactory.createFuulProject(
      user1.address,
      signer,
      "projectURI",
      clientFeeCollector.address
    );

    const receipt = await tx.wait();

    const log = receipt.logs?.filter((x) => {
      return x.fragment.name == "ProjectCreated";
    })[0];

    fuulProjectAddress = log.args.deployedAddress;

    const FuulProject = await ethers.getContractFactory("FuulProject");
    fuulProject = await FuulProject.attach(fuulProjectAddress);
  }



  return {
    fuulFactory,
    fuulFactoryAddress,
    fuulManager,
    fuulManagerAddress,
    fuulProject,
    fuulProjectAddress,
    token,
    tokenAddress,
    nft721,
    nft721Address,
    nft1155,
    nft1155Address,
    user1,
    user2,
    user3,
    user4,
    user5,
    adminRole,
    managerRole,
    provider,
    limitAmount,
    protocolFeeCollector,
    nftFeeCurrency,
    nftFeeCurrencyAddress,
    clientFeeCollector,
  };
};

module.exports = {
  setupTest,
};
