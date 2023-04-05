const deployContract = async function (contractName) {
  const ContractFactory = await hre.ethers.getContractFactory(contractName);
  const contract = await ContractFactory.deploy();

  await contract.deployed();
  return contract;
};

const deployMocks = async function () {
  // Deploy Mock Token Rewards
  const token = await deployContract("MockTokenRewards");

  // Deploy NFT 721 Rewards

  const nft721 = await deployContract("MockNFT721Rewards");

  // Deploy NFT 1155 Rewards
  const nft1155 = await deployContract("MockNFT1155Rewards");

  return { token, nft721, nft1155 };
};

const deployManager = async function (
  signerAddress,
  tokenAddress,
  limitAmount
) {
  const FuulManager = await hre.ethers.getContractFactory("FuulManager");
  const fuulManager = await FuulManager.deploy(
    signerAddress,
    tokenAddress,
    limitAmount,
    limitAmount
  );

  await fuulManager.deployed();

  return fuulManager;
};

const deployFactory = async function (fuulManagerAddress) {
  const FuulFactory = await hre.ethers.getContractFactory("FuulFactory");
  const fuulFactory = await FuulFactory.deploy(fuulManagerAddress);

  await fuulFactory.deployed();

  return fuulFactory;
};

const setupTest = async function (deployProject = true) {
  await hre.network.provider.send("hardhat_reset");

  const provider = hre.ethers.provider;

  [user1, user2, user3] = await hre.ethers.getSigners();

  // Deploy mocks

  const { token, nft721, nft1155 } = await deployMocks();

  // Deploy Manager

  const limitAmount = ethers.utils.parseEther("100");

  const fuulManager = await deployManager(
    user1.address,
    token.address,
    limitAmount
  );

  // Deploy Factory

  const fuulFactory = await deployFactory(fuulManager.address);

  const adminRole = await fuulFactory.DEFAULT_ADMIN_ROLE();

  let fuulProject;

  if (deployProject) {
    const signer = this.user2.address;
    await fuulFactory.createFuulProject(user1.address, signer);
    const addressDeployed = await fuulFactory.projects(1);

    const FuulProject = await ethers.getContractFactory("FuulProject");
    fuulProject = await FuulProject.attach(addressDeployed);
  }

  return {
    fuulFactory,
    fuulManager,
    fuulProject,
    token,
    nft721,
    nft1155,
    user1,
    user2,
    user3,
    adminRole,
    provider,
    limitAmount,
  };
};

module.exports = {
  setupTest,
};
