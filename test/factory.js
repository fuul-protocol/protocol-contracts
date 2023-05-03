const { expect } = require("chai");

const { setupTest } = require("./before-each-test");

describe("Fuul Factory - Create projects", function () {
  beforeEach(async function () {
    const { fuulFactory, user1, user2, adminRole } = await setupTest(
      (deployProject = false)
    );

    this.fuulFactory = fuulFactory;
    this.user1 = user1;
    this.user2 = user2;
    this.adminRole = adminRole;

    this.projectURI = "projectURI";
  });

  it("Should deploy Fuul Project and sets roles correctly", async function () {
    const signer = this.user2.address;

    await expect(
      this.fuulFactory
        .connect(this.user2)
        .createFuulProject(signer, signer, this.projectURI, signer)
    ).to.emit(this.fuulFactory, "ProjectCreated");

    // Projects
    expect(await this.fuulFactory.totalProjectsCreated()).to.equal(1);

    const addressDeployed = await this.fuulFactory.projects(1);

    expect(addressDeployed).to.not.equal(ethers.constants.AddressZero);

    const FuulProject = await ethers.getContractFactory("FuulProject");
    const fuulProject = await FuulProject.attach(addressDeployed);

    expect(await fuulProject.fuulFactory()).to.equal(this.fuulFactory.address);

    expect(
      await fuulProject.hasRole(this.adminRole, this.user2.address)
    ).to.equal(true);

    expect(await fuulProject.projectInfoURI()).to.equal(this.projectURI);
    expect(await fuulProject.clientFeeCollector()).to.equal(signer);
  });

  it("Should change Fuul Manager address", async function () {
    const newValue = this.user1.address;
    await this.fuulFactory.setFuulManager(newValue);
    expect(await this.fuulFactory.fuulManager()).to.equal(newValue);
  });

  it("Should fail to set new Fuul Manager address funds if not admin role", async function () {
    const error = `AccessControl: account ${this.user2.address.toLowerCase()} is missing role ${
      this.adminRole
    }`;

    await expect(
      this.fuulFactory.connect(this.user2).setFuulManager(this.user2.address)
    ).to.be.revertedWith(error);
  });
});

describe("Fuul Factory - Fees management", function () {
  beforeEach(async function () {
    const { fuulFactory, user1, user2, adminRole } = await setupTest();

    this.fuulFactory = fuulFactory;
    this.user1 = user1;
    this.user2 = user2;
    this.adminRole = adminRole;

    this.newFee = 5;
  });

  it("Should set new fees", async function () {
    // Protocol Fees
    await this.fuulFactory.setProtocolFee(this.newFee);

    expect(await this.fuulFactory.protocolFee()).to.equal(this.newFee);

    // Client Fees
    await this.fuulFactory.setClientFee(this.newFee);

    expect(await this.fuulFactory.clientFee()).to.equal(this.newFee);

    // Attributor Fees
    await this.fuulFactory.setAttributorFee(this.newFee);

    expect(await this.fuulFactory.attributorFee()).to.equal(this.newFee);

    // NFT Fixed fees
    await this.fuulFactory.setNftFixedFeeAmounte(this.newFee);

    expect(await this.fuulFactory.nftFixedFeeAmount()).to.equal(this.newFee);

    // NFT fee currency
    await this.fuulFactory.setNftFeeCurrency(this.user1.address);

    expect(await this.fuulFactory.nftFeeCurrency()).to.equal(
      this.user1.address
    );

    // Protocol fee collector
    await this.fuulFactory.setProtocolFeeCollector(this.user1.address);

    expect(await this.fuulFactory.protocolFeeCollector()).to.equal(
      this.user1.address
    );
  });

  it("Should fail to set new fees if not admin role", async function () {
    const error = `AccessControl: account ${this.user2.address.toLowerCase()} is missing role ${
      this.adminRole
    }`;

    // Protocol Fee
    await expect(
      this.fuulFactory.connect(this.user2).setProtocolFee(this.newFee)
    ).to.be.revertedWith(error);

    // Client Fees
    await expect(
      this.fuulFactory.connect(this.user2).setClientFee(this.newFee)
    ).to.be.revertedWith(error);

    // Attributor Fees
    await expect(
      this.fuulFactory.connect(this.user2).setAttributorFee(this.newFee)
    ).to.be.revertedWith(error);

    // NFT Fixed fees
    await expect(
      this.fuulFactory.connect(this.user2).setNftFixedFeeAmounte(this.newFee)
    ).to.be.revertedWith(error);

    // NFT fee currency
    await expect(
      this.fuulFactory.connect(this.user2).setNftFeeCurrency(this.user1.address)
    ).to.be.revertedWith(error);

    // Protocol fee collector
    await expect(
      this.fuulFactory
        .connect(this.user2)
        .setProtocolFeeCollector(this.user1.address)
    ).to.be.revertedWith(error);
  });
});

describe("Fuul Factory - Token currency management", function () {
  beforeEach(async function () {
    const { fuulFactory, nft721, token, user1, user2, adminRole } =
      await setupTest();

    this.fuulFactory = fuulFactory;
    this.nft721 = nft721;
    this.token = token;
    this.user1 = user1;
    this.user2 = user2;
    this.adminRole = adminRole;

    this.newCurrency = this.nft721.address;
    this.limit = ethers.utils.parseEther("100");
  });

  it("Should add new currency", async function () {
    await this.fuulFactory.addCurrencyToken(this.newCurrency);

    expect(
      await this.fuulFactory.acceptedCurrencies(this.newCurrency)
    ).to.equal(true);
  });

  it("Should remove currency", async function () {
    const removeCurrency = this.token.address;
    await this.fuulFactory.removeCurrencyToken(removeCurrency);

    expect(await this.fuulFactory.acceptedCurrencies(removeCurrency)).to.equal(
      false
    );
  });

  it("Should fail to add and remove currency if not admin role", async function () {
    const error = `AccessControl: account ${this.user2.address.toLowerCase()} is missing role ${
      this.adminRole
    }`;

    // Add currency
    await expect(
      this.fuulFactory.connect(this.user2).addCurrencyToken(this.newCurrency)
    ).to.be.revertedWith(error);

    // Remove currency
    const removeCurrency = this.token.address;

    await expect(
      this.fuulFactory.connect(this.user2).removeCurrencyToken(removeCurrency)
    ).to.be.revertedWith(error);
  });

  it("Should fail to add currency if incorrect arguments are passed", async function () {
    // Token already accepted

    await expect(
      this.fuulFactory.addCurrencyToken(this.token.address)
    ).to.be.revertedWithCustomError(
      this.fuulFactory,
      "TokenCurrencyAlreadyAccepted"
    );
  });

  it("Should fail to remove currency and not accepted", async function () {
    await expect(
      this.fuulFactory.removeCurrencyToken(this.user2.address)
    ).to.be.revertedWithCustomError(
      this.fuulFactory,
      "TokenCurrencyNotAccepted"
    );
  });
});
