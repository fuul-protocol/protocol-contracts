const { expect } = require("chai");

const { setupTest } = require("./before-each-test");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

// describe("Fuul Manager - Remove variables management", function () {
//   beforeEach(async function () {
//     const { fuulManager, token, user1, user2, adminRole } = await setupTest();

//     this.fuulManager = fuulManager;
//     this.token = token;
//     this.user1 = user1;
//     this.user2 = user2;
//     this.adminRole = adminRole;

//     this.newPeriod = 5;
//   });

//   it("Should set new claim cooldown", async function () {
//     await this.fuulManager.setClaimCooldown(this.newPeriod);

//     expect(await this.fuulManager.claimCooldown()).to.equal(this.newPeriod);
//   });

//   it("Should set new budget cooldown", async function () {
//     await this.fuulManager.setCampaignBudgetCooldown(this.newPeriod);

//     expect(await this.fuulManager.campaignBudgetCooldown()).to.equal(
//       this.newPeriod
//     );
//   });

//   it("Should fail to set new periods if not admin role", async function () {
//     const error = `AccessControl: account ${this.user2.address.toLowerCase()} is missing role ${
//       this.adminRole
//     }`;

//     // Set claim cooldown
//     await expect(
//       this.fuulManager.connect(this.user2).setClaimCooldown(this.newPeriod)
//     ).to.be.revertedWith(error);

//     // Set budget cooldown
//     await expect(
//       this.fuulManager
//         .connect(this.user2)
//         .setCampaignBudgetCooldown(this.newPeriod)
//     ).to.be.revertedWith(error);
//   });

//   it("Should fail to set claim cooldown if incorrect arguments are passed", async function () {
//     const newPeriod = await this.fuulManager.claimCooldown();

//     await expect(this.fuulManager.setClaimCooldown(newPeriod))
//       .to.be.revertedWithCustomError(this.fuulManager, "InvalidUintArgument")
//       .withArgs(newPeriod);
//   });

//   it("Should fail to set budget cooldown if incorrect arguments are passed", async function () {
//     const newPeriod = await this.fuulManager.campaignBudgetCooldown();

//     await expect(this.fuulManager.setCampaignBudgetCooldown(newPeriod))
//       .to.be.revertedWithCustomError(this.fuulManager, "InvalidUintArgument")
//       .withArgs(newPeriod);
//   });
// });

// describe("Fuul Manager - Token currency management", function () {
//   beforeEach(async function () {
//     const { fuulManager, nft721, token, user1, user2, adminRole } =
//       await setupTest();

//     this.fuulManager = fuulManager;
//     this.nft721 = nft721;
//     this.token = token;
//     this.user1 = user1;
//     this.user2 = user2;
//     this.adminRole = adminRole;

//     this.newCurrency = this.nft721.address;
//     this.tokenType = 2;
//     this.limit = ethers.utils.parseEther("100");
//   });

//   it("Should add new currency", async function () {
//     await this.fuulManager.addCurrencyToken(this.newCurrency, this.limit);

//     const currency = await this.fuulManager.currencyTokens(this.newCurrency);

//     expect(currency.tokenType).to.equal(this.tokenType);
//     expect(currency.claimLimitPerCooldown).to.equal(this.limit);
//     expect(currency.cumulativeClaimPerCooldown).to.equal(0);
//     expect(Number(currency.claimCooldownPeriodStarted)).to.be.greaterThan(0);

//     // Individual functions
//     expect(await this.fuulManager.getTokenType(this.newCurrency)).to.equal(
//       this.tokenType
//     );

//     expect(
//       await this.fuulManager.isCurrencyTokenAccepted(this.newCurrency)
//     ).to.equal(true);
//   });

//   it("Should remove currency", async function () {
//     const removeCurrency = this.token.address;
//     await this.fuulManager.removeCurrencyToken(removeCurrency);

//     const currency = await this.fuulManager.currencyTokens(removeCurrency);

//     expect(currency.claimLimitPerCooldown).to.equal(0);
//     expect(currency.claimCooldownPeriodStarted).to.equal(0);
//   });

//   it("Should set new currency limit", async function () {
//     const limit = 2;
//     await this.fuulManager.setCurrencyTokenLimit(this.token.address, limit);

//     const currency = await this.fuulManager.currencyTokens(this.token.address);

//     expect(currency.claimLimitPerCooldown).to.equal(limit);
//   });

//   it("Should fail to add, remove and set limit for a currency if not admin role", async function () {
//     const error = `AccessControl: account ${this.user2.address.toLowerCase()} is missing role ${
//       this.adminRole
//     }`;

//     // Add currency
//     await expect(
//       this.fuulManager
//         .connect(this.user2)
//         .addCurrencyToken(this.newCurrency, this.limit)
//     ).to.be.revertedWith(error);

//     // Set token limit

//     await expect(
//       this.fuulManager
//         .connect(this.user2)
//         .setCurrencyTokenLimit(this.newCurrency, this.limit)
//     ).to.be.revertedWith(error);

//     // Remove currency
//     const removeCurrency = this.token.address;

//     await expect(
//       this.fuulManager.connect(this.user2).removeCurrencyToken(removeCurrency)
//     ).to.be.revertedWith(error);
//   });

//   it("Should fail to add currency if incorrect arguments are passed", async function () {
//     // Token already accepted

//     await expect(
//       this.fuulManager.addCurrencyToken(this.token.address, this.limit)
//     )
//       .to.be.revertedWithCustomError(
//         this.fuulManager,
//         "TokenCurrencyAlreadyAccepted"
//       )
//       .withArgs(this.token.address);

//     // Limit = 0

//     await expect(this.fuulManager.addCurrencyToken(this.newCurrency, 0))
//       .to.be.revertedWithCustomError(this.fuulManager, "InvalidUintArgument")
//       .withArgs(0);

//     // EOA Address
//     await expect(
//       this.fuulManager.addCurrencyToken(this.user2.address, this.limit)
//     )
//       .to.be.revertedWithCustomError(this.fuulManager, "InvalidAddressArgument")
//       .withArgs(this.user2.address);
//   });

//   it("Should fail to remove currency and not accepted", async function () {
//     await expect(this.fuulManager.removeCurrencyToken(this.user2.address))
//       .to.be.revertedWithCustomError(
//         this.fuulManager,
//         "TokenCurrencyNotAccepted"
//       )
//       .withArgs(this.user2.address);
//   });

//   it("Should fail to set new token limit if incorrect arguments are passed", async function () {
//     // Token not accepted

//     await expect(
//       this.fuulManager.setCurrencyTokenLimit(this.user2.address, this.limit)
//     )
//       .to.be.revertedWithCustomError(
//         this.fuulManager,
//         "TokenCurrencyNotAccepted"
//       )
//       .withArgs(this.user2.address);

//     // Same token type value
//     await expect(
//       this.fuulManager.setCurrencyTokenLimit(this.token.address, this.limit)
//     )
//       .to.be.revertedWithCustomError(this.fuulManager, "InvalidUintArgument")
//       .withArgs(this.limit);

//     // Limit = 0
//     await expect(this.fuulManager.setCurrencyTokenLimit(this.token.address, 0))
//       .to.be.revertedWithCustomError(this.fuulManager, "InvalidUintArgument")
//       .withArgs(0);
//   });
// });

// describe("Fuul Manager - Emergency withdraw", function () {
//   beforeEach(async function () {
//     const {
//       fuulManager,
//       fuulProject,
//       token,
//       nft721,
//       nft1155,
//       user1,
//       user2,
//       adminRole,
//       provider,
//     } = await setupTest();

//     this.fuulManager = fuulManager;
//     this.fuulProject = fuulProject;
//     this.token = token;
//     this.nft721 = nft721;
//     this.nft1155 = nft1155;
//     this.user1 = user1;
//     this.user2 = user2;
//     this.adminRole = adminRole;
//     this.provider = provider;

//     this.campaignURI = "campaignURI";
//     this.amount = ethers.utils.parseEther("1000");

//     this.tokenIds = [1, 2, 3, 4];

//     this.amounts = [1, 2, 1, 2];

//     // FuulProjectFungibleCurrencies
//     this.FuulProjectFungibleCurrencies = [
//       {
//         deployedAddress: this.fuulProject.address,
//         currencies: [this.token.address, ethers.constants.AddressZero],
//       },
//     ];
//   });

//   it("Should emergency withdraw all fungible tokens", async function () {
//     // Create ERC20 campaign and deposit in Fuul project
//     await this.fuulProject.createCampaign(this.campaignURI, this.token.address);

//     this.erc20CampaignId = 1;

//     // Approve
//     await this.token.approve(
//       this.fuulProject.address,
//       ethers.utils.parseEther("40000000")
//     );

//     await this.fuulProject.depositFungibleToken(
//       this.erc20CampaignId,
//       this.amount
//     );

//     // Create Native campaign and deposit in Fuul project

//     await this.fuulProject.createCampaign(
//       this.campaignURI,
//       ethers.constants.AddressZero
//     );

//     this.nativeCampaignId = 2;

//     this.fuulProject.depositFungibleToken(this.nativeCampaignId, 0, {
//       value: this.amount,
//     });

//     // Balance Before

//     const balanceBeforeToken = await this.token.balanceOf(this.user1.address);
//     const balanceBeforeNative = await this.provider.getBalance(
//       this.user1.address
//     );

//     await this.fuulManager.emergencyWithdrawFungibleTokensFromProjects(
//       this.user1.address,
//       this.FuulProjectFungibleCurrencies
//     );

//     // Balance After
//     const balanceAfterToken = await this.token.balanceOf(this.user1.address);
//     const balanceAfterNative = await this.provider.getBalance(
//       this.user1.address
//     );

//     // Balance Difference

//     const balanceDiffToken =
//       ethers.utils.formatEther(balanceAfterToken.toString()) -
//       ethers.utils.formatEther(balanceBeforeToken.toString());

//     expect(ethers.utils.parseEther(balanceDiffToken.toString())).to.equal(
//       this.amount
//     );

//     const balanceDiffNative =
//       ethers.utils.formatEther(balanceAfterNative.toString()) -
//       ethers.utils.formatEther(balanceBeforeNative.toString());

//     expect(balanceDiffNative).to.be.greaterThan(0);

//     // Conctract balance
//     expect(await this.token.balanceOf(this.fuulProject.address)).to.equal(0);
//     expect(await this.provider.getBalance(this.fuulProject.address)).to.equal(
//       0
//     );
//   });

//   it("Should emergency withdraw 721 NFTs", async function () {
//     await this.fuulManager.addCurrencyToken(this.nft721.address, 100);

//     for (let tokenId of this.tokenIds) {
//       // Transfer token to contract
//       await this.nft721.transferFrom(
//         this.user1.address,
//         this.fuulProject.address,
//         tokenId
//       );
//       expect(await this.nft721.ownerOf(tokenId)).to.equal(
//         this.fuulProject.address
//       );
//     }

//     await this.fuulManager.emergencyWithdrawNFTsFromProject(
//       this.user1.address,
//       this.fuulProject.address,
//       this.nft721.address,
//       this.tokenIds,
//       []
//     );

//     for (let tokenId of this.tokenIds) {
//       expect(await this.nft721.ownerOf(tokenId)).to.equal(this.user1.address);
//     }
//   });

//   it("Should emergency withdraw 1155 NFTs", async function () {
//     await this.fuulManager.addCurrencyToken(this.nft1155.address, 100);

//     await this.nft1155.safeBatchTransferFrom(
//       this.user1.address,
//       this.fuulProject.address,
//       this.tokenIds,
//       this.amounts,
//       []
//     );

//     for (i = 0; i < this.tokenIds.length; i++) {
//       let tokenId = this.tokenIds[i];
//       let amount = this.amounts[i];

//       expect(
//         await this.nft1155.balanceOf(this.fuulProject.address, tokenId)
//       ).to.equal(amount);
//     }

//     await this.fuulManager.emergencyWithdrawNFTsFromProject(
//       this.user2.address,
//       this.fuulProject.address,
//       this.nft1155.address,
//       this.tokenIds,
//       this.amounts
//     );

//     for (i = 0; i < this.tokenIds.length; i++) {
//       let tokenId = this.tokenIds[i];
//       let amount = this.amounts[i];

//       expect(
//         await this.nft1155.balanceOf(this.user2.address, tokenId)
//       ).to.equal(amount);
//     }
//   });

//   it("Should fail to emergency remove fungible and NFTs if not admin role", async function () {
//     const error = `AccessControl: account ${this.user2.address.toLowerCase()} is missing role ${
//       this.adminRole
//     }`;

//     // Fungible
//     await expect(
//       this.fuulManager
//         .connect(this.user2)
//         .emergencyWithdrawFungibleTokensFromProjects(
//           this.user1.address,
//           this.FuulProjectFungibleCurrencies
//         )
//     ).to.be.revertedWith(error);

//     // NFTs
//     await expect(
//       this.fuulManager
//         .connect(this.user2)
//         .emergencyWithdrawNFTsFromProject(
//           this.user1.address,
//           this.fuulProject.address,
//           this.nft721.address,
//           this.tokenIds,
//           this.amounts
//         )
//     ).to.be.revertedWith(error);
//   });
// });

// describe("Fuul Manager - Attribute", function () {
//   beforeEach(async function () {
//     const {
//       fuulManager,
//       fuulProject,
//       fuulFactory,
//       token,
//       nft721,
//       nft1155,
//       user1,
//       user2,
//       user3,
//       user4,
//       user5,
//       limitAmount,
//     } = await setupTest();

//     this.fuulManager = fuulManager;
//     this.fuulProject = fuulProject;
//     this.fuulFactory = fuulFactory;
//     this.token = token;
//     this.nft721 = nft721;
//     this.nft1155 = nft1155;
//     this.user1 = user1;
//     this.user2 = user2;
//     this.user3 = user3;
//     this.user4 = user4;
//     this.user5 = user5;

//     this.limitAmount = limitAmount;

//     this.campaignURI = "campaignURI";
//     this.amount = ethers.utils.parseEther("1000");

//     this.tokenIds = [1, 2, 3, 4];

//     this.amounts = [1, 2, 1, 2];

//     this.tokenAmount = this.amounts.reduce(function (a, b) {
//       return a + b;
//     });

//     // Create campaigns and deposit

//     // Create ERC20 campaign and deposit in Fuul project
//     await this.fuulProject.createCampaign(this.campaignURI, this.token.address);

//     this.erc20CampaignId = 1;

//     // Approve
//     await this.token.approve(
//       this.fuulProject.address,
//       ethers.utils.parseEther("40000000")
//     );

//     await this.fuulProject.depositFungibleToken(
//       this.erc20CampaignId,
//       this.amount
//     );

//     // Create Native campaign and deposit in Fuul project

//     await this.fuulProject.createCampaign(
//       this.campaignURI,
//       ethers.constants.AddressZero
//     );

//     this.nativeCampaignId = 2;

//     this.fuulProject.depositFungibleToken(this.nativeCampaignId, 0, {
//       value: this.amount,
//     });

//     // Create 721 campaign and deposit in Fuul project

//     await this.fuulManager.addCurrencyToken(nft721.address, 100);

//     await this.fuulProject.createCampaign(
//       this.campaignURI,
//       this.nft721.address
//     );

//     this.nft721CampaignId = 3;

//     await this.nft721.setApprovalForAll(this.fuulProject.address, true);

//     await this.fuulProject.depositNFTToken(
//       this.nft721CampaignId,
//       this.tokenIds,
//       []
//     );

//     // Create 1155 campaign and deposit in Fuul project

//     await this.fuulManager.addCurrencyToken(nft1155.address, 100);

//     await this.fuulProject.createCampaign(
//       this.campaignURI,
//       this.nft1155.address
//     );

//     this.nft1155CampaignId = 4;

//     await this.nft1155.setApprovalForAll(this.fuulProject.address, true);

//     await this.fuulProject.depositNFTToken(
//       this.nft1155CampaignId,
//       this.tokenIds,
//       this.amounts
//     );

//     this.attributeCheck = {
//       projectAddress: this.fuulProject.address,
//       campaignIds: [
//         this.erc20CampaignId,
//         this.nativeCampaignId,
//         this.nft721CampaignId,
//         this.nft1155CampaignId,
//       ],
//       receivers: [
//         this.user2.address,
//         this.user3.address,
//         this.user4.address,
//         this.user5.address,
//       ],
//       amounts: [
//         this.amount,
//         this.amount,
//         this.tokenIds.length,
//         this.tokenAmount,
//       ],
//     };
//   });

//   it("Should attribute from different projects, campaigns & currencies and set correct values", async function () {
//     // Create a new project and campaign

//     await this.fuulFactory
//       .connect(this.user2)
//       .createFuulProject(this.user1.address, this.user1.address);

//     const newFuulProjectAddress = await this.fuulFactory.projects(2);

//     const NewFuulProject = await ethers.getContractFactory("FuulProject");
//     const newFuulProject = await NewFuulProject.attach(newFuulProjectAddress);

//     // Create ERC20 campaign and deposit in Fuul project
//     await newFuulProject.createCampaign(this.campaignURI, this.token.address);

//     // Approve
//     await this.token.approve(
//       newFuulProject.address,
//       ethers.utils.parseEther("40000000")
//     );

//     await newFuulProject.depositFungibleToken(
//       this.erc20CampaignId,
//       this.amount
//     );

//     // Make checks

//     const newAttributeCheck = {
//       projectAddress: newFuulProject.address,
//       campaignIds: [this.erc20CampaignId],
//       receivers: [this.user2.address],
//       amounts: [this.amount],
//     };
//     const attributeChecks = [this.attributeCheck, newAttributeCheck];

//     // Attribute
//     await this.fuulManager.attributeTransactions(attributeChecks);

//     // Check campaign balances

//     // First

//     for (i = 0; i < attributeChecks[0].campaignIds.length; i++) {
//       let att = attributeChecks[0];
//       let campaignId = att.campaignIds[i];

//       let receiver = att.receivers[i];
//       let amount = att.amounts[i];

//       let campaign = await this.fuulProject.campaigns(campaignId);
//       expect(campaign.currentBudget).to.equal(0);

//       let userEarnings = await this.fuulProject.usersEarnings(
//         receiver,
//         campaignId
//       );
//       expect(userEarnings.totalEarnings).to.equal(amount);
//       expect(userEarnings.availableToClaim).to.equal(amount);
//     }

//     // New

//     for (i = 0; i < attributeChecks[1].campaignIds.length; i++) {
//       let att = attributeChecks[1];
//       let campaignId = att.campaignIds[i];

//       let receiver = att.receivers[i];
//       let amount = att.amounts[i];

//       let campaign = await newFuulProject.campaigns(campaignId);
//       expect(campaign.currentBudget).to.equal(0);

//       let userEarnings = await newFuulProject.usersEarnings(
//         receiver,
//         campaignId
//       );
//       expect(userEarnings.totalEarnings).to.equal(amount);
//       expect(userEarnings.availableToClaim).to.equal(amount);
//     }
//   });

//   it("Should fail to attribute if campaign has insufficient balance", async function () {
//     const attributeCheck = { ...this.attributeCheck };
//     attributeCheck.amounts[0] = this.limitAmount;
//     await expect(this.fuulManager.attributeTransactions([attributeCheck])).to.be
//       .revertedWithPanic;
//   });

//   it("Should fail to attribute if not attributor role", async function () {
//     const attributorRole = await this.fuulManager.ATTRIBUTOR_ROLE();
//     const error = `AccessControl: account ${this.user2.address.toLowerCase()} is missing role ${attributorRole}`;

//     await expect(
//       this.fuulManager
//         .connect(this.user2)
//         .attributeTransactions([this.attributeCheck])
//     ).to.be.revertedWith(error);
//   });

//   it("Should fail to attribute if contract is paused", async function () {
//     await this.fuulManager.pauseAll();

//     await expect(
//       this.fuulManager.attributeTransactions([this.attributeCheck])
//     ).to.be.revertedWith("Pausable: paused");
//   });
// });

describe("Fuul Manager - Claim", function () {
  beforeEach(async function () {
    const {
      fuulManager,
      fuulProject,
      fuulFactory,
      token,
      nft721,
      nft1155,
      user1,
      user2,
      user3,
      user4,
      user5,
      limitAmount,
      provider,
    } = await setupTest();

    this.fuulManager = fuulManager;
    this.fuulProject = fuulProject;
    this.fuulFactory = fuulFactory;
    this.token = token;
    this.nft721 = nft721;
    this.nft1155 = nft1155;
    this.user1 = user1;
    this.user2 = user2;
    this.user3 = user3;
    this.user4 = user4;
    this.user5 = user5;
    this.provider = provider;

    this.limitAmount = limitAmount;

    this.campaignURI = "campaignURI";
    this.amount = ethers.utils.parseEther("1000");

    this.tokenIds = [1, 2, 3, 4];

    this.amounts = [1, 2, 1, 2];

    this.tokenAmount = this.amounts.reduce(function (a, b) {
      return a + b;
    });

    // Create campaigns and deposit

    // Create ERC20 campaign and deposit in Fuul project
    await this.fuulProject.createCampaign(this.campaignURI, this.token.address);

    this.erc20CampaignId = 1;

    // Approve
    await this.token.approve(
      this.fuulProject.address,
      ethers.utils.parseEther("40000000")
    );

    await this.fuulProject.depositFungibleToken(
      this.erc20CampaignId,
      this.amount
    );

    // Create Native campaign and deposit in Fuul project

    await this.fuulProject.createCampaign(
      this.campaignURI,
      ethers.constants.AddressZero
    );

    this.nativeCampaignId = 2;

    this.fuulProject.depositFungibleToken(this.nativeCampaignId, 0, {
      value: this.amount,
    });

    // Create 721 campaign and deposit in Fuul project

    await this.fuulManager.addCurrencyToken(nft721.address, 100);

    await this.fuulProject.createCampaign(
      this.campaignURI,
      this.nft721.address
    );

    this.nft721CampaignId = 3;

    await this.nft721.setApprovalForAll(this.fuulProject.address, true);

    await this.fuulProject.depositNFTToken(
      this.nft721CampaignId,
      this.tokenIds,
      []
    );

    // Create 1155 campaign and deposit in Fuul project

    await this.fuulManager.addCurrencyToken(nft1155.address, 100);

    await this.fuulProject.createCampaign(
      this.campaignURI,
      this.nft1155.address
    );

    this.nft1155CampaignId = 4;

    await this.nft1155.setApprovalForAll(this.fuulProject.address, true);

    await this.fuulProject.depositNFTToken(
      this.nft1155CampaignId,
      this.tokenIds,
      this.amounts
    );

    this.attributeCheck = {
      projectAddress: this.fuulProject.address,
      campaignIds: [
        this.erc20CampaignId,
        this.nativeCampaignId,
        this.nft721CampaignId,
        this.nft1155CampaignId,
      ],
      receivers: [
        this.user2.address,
        this.user3.address,
        this.user4.address,
        this.user5.address,
      ],
      amounts: [
        this.amount,
        this.amount,
        this.tokenIds.length,
        this.tokenAmount,
      ],
    };

    await this.fuulManager.attributeTransactions([this.attributeCheck]);
  });

  it("Should claim erc20 from different projects, campaigns & currencies and set correct values", async function () {
    // Create a new project and campaign

    await this.fuulFactory
      .connect(this.user2)
      .createFuulProject(this.user1.address, this.user1.address);

    const newFuulProjectAddress = await this.fuulFactory.projects(2);

    const NewFuulProject = await ethers.getContractFactory("FuulProject");
    const newFuulProject = await NewFuulProject.attach(newFuulProjectAddress);

    // Create ERC20 campaign and deposit in Fuul project
    await newFuulProject.createCampaign(this.campaignURI, this.token.address);

    // Approve
    await this.token.approve(
      newFuulProject.address,
      ethers.utils.parseEther("40000000")
    );

    await newFuulProject.depositFungibleToken(
      this.erc20CampaignId,
      this.amount
    );

    // Make checks

    const newAttributeCheck = {
      projectAddress: newFuulProject.address,
      campaignIds: [this.erc20CampaignId],
      receivers: [this.user2.address],
      amounts: [this.amount],
    };

    // Attribute in new project
    await this.fuulManager.attributeTransactions([newAttributeCheck]);

    // Claim

    const currency = this.token.address;
    const claimer = this.user2;
    const amount = this.amount;

    claimChecks = [
      {
        projectAddress: this.fuulProject.address,
        campaignId: this.erc20CampaignId,
        tokenIds: [],
        amounts: [],
      },
      {
        projectAddress: newFuulProject.address,
        campaignId: this.erc20CampaignId,
        tokenIds: [],
        amounts: [],
      },
    ];

    await this.fuulManager.connect(claimer).claim(claimChecks);

    // Check users balances in project contracts

    const projects = [this.fuulProject, newFuulProject];
    for (i = 0; i < projects; i++) {
      let project = projects[i];
      let check = claimChecks[i];

      let userEarnings = await project.usersEarnings(
        claimer.address,
        check.campaignId
      );
      expect(userEarnings.totalEarnings).to.equal(amount);
      expect(userEarnings.availableToClaim).to.equal(0);
    }

    // Check users claims in manager contracts

    const amountEth = ethers.utils.formatEther(amount.toString());

    const expectedAmount = ethers.utils.parseEther(
      (Number(amountEth) * 2).toString()
    );

    expect(expectedAmount).to.equal(
      await this.fuulManager.usersClaims(claimer.address, currency)
    );

    // Set currency info

    const currencyObject = await this.fuulManager.currencyTokens(currency);

    expect(currencyObject.cumulativeClaimPerCooldown).to.equal(expectedAmount);
    expect(Number(currencyObject.claimCooldownPeriodStarted)).to.be.greaterThan(
      0
    );

    // User balance
    expect(await this.token.balanceOf(claimer.address)).to.equal(
      expectedAmount
    );
  });

  it("Should claim native and set correct values", async function () {
    claimChecks = [
      {
        projectAddress: this.fuulProject.address,
        campaignId: this.nativeCampaignId,
        tokenIds: [],
        amounts: [],
      },
    ];

    const currency = ethers.constants.AddressZero;
    const claimer = this.user3;
    const amount = this.amount;

    // Balance before
    const balanceBefore = await this.provider.getBalance(claimer.address);

    // Claim
    await this.fuulManager.connect(claimer).claim(claimChecks);

    // Check users balances in project contract

    let userEarnings = await this.fuulProject.usersEarnings(
      claimer.address,
      claimChecks[0].campaignId
    );
    expect(userEarnings.totalEarnings).to.equal(amount);
    expect(userEarnings.availableToClaim).to.equal(0);

    // Check users claims in manager contracts

    expect(
      await this.fuulManager.usersClaims(user3.address, currency)
    ).to.equal(amount);

    // Set currency info

    const currencyObject = await this.fuulManager.currencyTokens(currency);

    expect(currencyObject.cumulativeClaimPerCooldown).to.equal(amount);
    expect(Number(currencyObject.claimCooldownPeriodStarted)).to.be.greaterThan(
      0
    );

    // User balance
    const balanceAfter = await this.provider.getBalance(claimer.address);

    const balanceDiff =
      ethers.utils.formatEther(balanceAfter.toString()) -
      ethers.utils.formatEther(balanceBefore.toString());

    expect(balanceDiff).to.be.greaterThan(0);
  });

  it("Should claim nfts721 and set correct values", async function () {
    claimChecks = [
      {
        projectAddress: this.fuulProject.address,
        campaignId: this.nft721CampaignId,
        tokenIds: this.tokenIds,
        amounts: [],
      },
    ];

    const currency = this.nft721.address;
    const claimer = this.user4;
    const amount = this.tokenIds.length;

    // Claim
    await this.fuulManager.connect(claimer).claim(claimChecks);

    // Check users balances in project contract

    let userEarnings = await this.fuulProject.usersEarnings(
      claimer.address,
      claimChecks[0].campaignId
    );
    expect(userEarnings.totalEarnings).to.equal(amount);
    expect(userEarnings.availableToClaim).to.equal(0);

    // Check users claims in manager contracts

    expect(
      await this.fuulManager.usersClaims(claimer.address, currency)
    ).to.equal(amount);

    // Set currency info

    const currencyObject = await this.fuulManager.currencyTokens(currency);

    expect(currencyObject.cumulativeClaimPerCooldown).to.equal(amount);
    expect(Number(currencyObject.claimCooldownPeriodStarted)).to.be.greaterThan(
      0
    );

    // User balance
    const balance = await this.nft721.balanceOf(claimer.address);

    await expect(balance).to.equal(amount);
  });

  it("Should claim nfts1155 and set correct values", async function () {
    claimChecks = [
      {
        projectAddress: this.fuulProject.address,
        campaignId: this.nft1155CampaignId,
        tokenIds: this.tokenIds,
        amounts: this.amounts,
      },
    ];

    const currency = this.nft1155.address;
    const claimer = this.user5;
    const amount = this.tokenAmount;

    // Claim
    await this.fuulManager.connect(claimer).claim(claimChecks);

    // Check users balances in project contract

    let userEarnings = await this.fuulProject.usersEarnings(
      claimer.address,
      claimChecks[0].campaignId
    );
    expect(userEarnings.totalEarnings).to.equal(amount);
    expect(userEarnings.availableToClaim).to.equal(0);

    // Check users claims in manager contracts

    expect(
      await this.fuulManager.usersClaims(claimer.address, currency)
    ).to.equal(amount);

    // Set currency info

    const currencyObject = await this.fuulManager.currencyTokens(currency);

    expect(currencyObject.cumulativeClaimPerCooldown).to.equal(amount);
    expect(Number(currencyObject.claimCooldownPeriodStarted)).to.be.greaterThan(
      0
    );

    // User balance
    for (i = 0; i < this.tokenIds.length; i++) {
      expect(
        await this.nft1155.balanceOf(claimer.address, this.tokenIds[i])
      ).to.equal(this.amounts[i]);
    }
  });

  it("Should claim over the limit after cooling period is passed", async function () {
    // Create a new project and campaign

    await this.fuulFactory
      .connect(this.user2)
      .createFuulProject(this.user1.address, this.user1.address);

    const newFuulProjectAddress = await this.fuulFactory.projects(2);

    const NewFuulProject = await ethers.getContractFactory("FuulProject");
    const newFuulProject = await NewFuulProject.attach(newFuulProjectAddress);

    // Create ERC20 campaign and deposit in Fuul project
    await newFuulProject.createCampaign(this.campaignURI, this.token.address);

    // Approve
    await this.token.approve(
      newFuulProject.address,
      ethers.utils.parseEther("40000000")
    );

    await newFuulProject.depositFungibleToken(
      this.erc20CampaignId,
      this.amount
    );

    // Make checks

    const newAttributeCheck = {
      projectAddress: newFuulProject.address,
      campaignIds: [this.erc20CampaignId],
      receivers: [this.user2.address],
      amounts: [this.amount],
    };

    // Attribute in new project
    await this.fuulManager.attributeTransactions([newAttributeCheck]);

    // Claim

    const currency = this.token.address;
    const claimer = this.user2;
    const amount = this.amount;

    claimChecks = [
      {
        projectAddress: this.fuulProject.address,
        campaignId: this.erc20CampaignId,
        tokenIds: [],
        amounts: [],
      },
      {
        projectAddress: newFuulProject.address,
        campaignId: this.erc20CampaignId,
        tokenIds: [],
        amounts: [],
      },
    ];

    await this.fuulManager.connect(claimer).claim(claimChecks);

    // Check users balances in project contracts

    const projects = [this.fuulProject, newFuulProject];
    for (i = 0; i < projects; i++) {
      let project = projects[i];
      let check = claimChecks[i];

      let userEarnings = await project.usersEarnings(
        claimer.address,
        check.campaignId
      );
      expect(userEarnings.totalEarnings).to.equal(amount);
      expect(userEarnings.availableToClaim).to.equal(0);
    }

    // Check users claims in manager contracts

    const amountEth = ethers.utils.formatEther(amount.toString());

    const expectedAmount = ethers.utils.parseEther(
      (Number(amountEth) * 2).toString()
    );

    expect(expectedAmount).to.equal(
      await this.fuulManager.usersClaims(claimer.address, currency)
    );

    // Set currency info

    const currencyObject = await this.fuulManager.currencyTokens(currency);

    expect(currencyObject.cumulativeClaimPerCooldown).to.equal(expectedAmount);
    expect(Number(currencyObject.claimCooldownPeriodStarted)).to.be.greaterThan(
      0
    );

    // User balance
    expect(await this.token.balanceOf(claimer.address)).to.equal(
      expectedAmount
    );
  });

  it("Should fail when user has nothing to claim", async function () {
    claimChecks = [
      {
        projectAddress: this.fuulProject.address,
        campaignId: this.nft1155CampaignId,
        tokenIds: this.tokenIds,
        amounts: this.amounts,
      },
    ];

    await expect(this.fuulManager.connect(this.user2).claim(claimChecks))
      .to.be.revertedWithCustomError(this.fuulProject, "IncorrectBalance")
      .withArgs(0);
  });

  it("Should fail to claim if contract is paused", async function () {
    await this.fuulManager.pauseAll();

    claimChecks = [
      {
        projectAddress: this.fuulProject.address,
        campaignId: this.nft1155CampaignId,
        tokenIds: this.tokenIds,
        amounts: this.amounts,
      },
    ];

    await expect(
      this.fuulManager.connect(this.user2).claim(claimChecks)
    ).to.be.revertedWith("Pausable: paused");
  });

  // it("", async function () {
  //   await this.fuulProject.depositFungibleToken(
  //     this.erc20CampaignId,
  //     this.limitAmount
  //   );
  //   await this.fuulManager
  //     .connect(this.user2)
  //     .claim([this.erc20Voucher], [this.erc20Signature]);

  //   const claimCooldown = await this.fuulManager.claimCooldown();

  //   await time.increase(claimCooldown.toNumber() + 1);

  //   const newAmount =
  //     ethers.utils.formatEther(this.limitAmount) -
  //     ethers.utils.formatEther(this.erc20Voucher.amount) +
  //     1;

  //   const newVoucher = { ...this.erc20Voucher };

  //   newVoucher.voucherId = "f4c2fabc-ad62-11ed-afa1-0242ac120055";
  //   newVoucher.amount = ethers.utils.parseEther(newAmount.toString());
  //   newVoucher.account = this.user3.address;

  //   const newSignature = await this.user1._signTypedData(
  //     this.domain,
  //     this.types,
  //     newVoucher
  //   );

  //   await this.fuulManager
  //     .connect(this.user3)
  //     .claim([newVoucher], [newSignature]);

  //   // Balance
  //   expect(await this.token.balanceOf(this.user3.address)).to.equal(
  //     newVoucher.amount
  //   );

  //   // Daily Limits
  //   const currency = await this.fuulManager.currencyTokens(this.token.address);

  //   expect(currency.cumulativeClaimPerCooldown).to.equal(newVoucher.amount);
  // });

  // Claim after token deactivated

  // it("Should fail to claim if amount is over the daily limit in same tx but 2 vouchers", async function () {
  //   await this.fuulProject.depositFungibleToken(
  //     this.erc20CampaignId,
  //     this.limitAmount
  //   );
  //   const newAmount =
  //     ethers.utils.formatEther(this.limitAmount) -
  //     ethers.utils.formatEther(this.erc20Voucher.amount) +
  //     0.1;

  //   const newVoucher = { ...this.erc20Voucher };

  //   newVoucher.voucherId = "f4c2fabc-ad62-11ed-afa1-0242ac120055";
  //   newVoucher.amount = ethers.utils.parseEther(newAmount.toString());

  //   const newSignature = await this.user1._signTypedData(
  //     this.domain,
  //     this.types,
  //     newVoucher
  //   );

  //   await expect(
  //     this.fuulManager
  //       .connect(this.user2)
  //       .claim(
  //         [this.erc20Voucher, newVoucher],
  //         [this.erc20Signature, newSignature]
  //       )
  //   ).to.be.revertedWithCustomError(this.fuulManager, "OverTheLimit");
  // });

  // it("Should fail to claim if amount is over the daily limit in 2 tx", async function () {
  //   await this.fuulProject.depositFungibleToken(
  //     this.erc20CampaignId,
  //     this.limitAmount
  //   );
  //   const newAmount =
  //     ethers.utils.formatEther(this.limitAmount) -
  //     ethers.utils.formatEther(this.erc20Voucher.amount) +
  //     0.1;

  //   const newVoucher = { ...this.erc20Voucher };

  //   newVoucher.voucherId = "f4c2fabc-ad62-11ed-afa1-0242ac120055";
  //   newVoucher.amount = ethers.utils.parseEther(newAmount.toString());
  //   newVoucher.account = this.user1.address;

  //   const newSignature = await this.user1._signTypedData(
  //     this.domain,
  //     this.types,
  //     newVoucher
  //   );

  //   await this.fuulManager
  //     .connect(this.user2)
  //     .claim([this.erc20Voucher], [this.erc20Signature]);

  //   await expect(
  //     this.fuulManager.claim([newVoucher], [newSignature])
  //   ).to.be.revertedWithCustomError(this.fuulManager, "OverTheLimit");
  // });

  // it("Should fail to claim if amount is over the daily limit in one transaction", async function () {
  //   await this.fuulProject.depositFungibleToken(
  //     this.erc20CampaignId,
  //     this.limitAmount
  //   );

  //   const limitEth = ethers.utils.formatEther(this.limitAmount.toString());

  //   const overTheLimitEth = Number(limitEth) + 0.1;

  //   const overTheLimit = ethers.utils.parseEther(overTheLimitEth.toString());

  //   const newVoucher = { ...this.erc20Voucher };

  //   newVoucher.amount = overTheLimit;

  //   const newSignature = await this.user1._signTypedData(
  //     this.domain,
  //     this.types,
  //     newVoucher
  //   );

  //   await expect(
  //     this.fuulManager.connect(this.user2).claim([newVoucher], [newSignature])
  //   )
  //     .to.be.revertedWithCustomError(this.fuulManager, "OverTheLimit")
  //     .withArgs(overTheLimit, this.limitAmount);
  // });
});
