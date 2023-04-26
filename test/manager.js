const { expect } = require("chai");

const { setupTest } = require("./before-each-test");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

// describe("Fuul Manager - Remove variables management", function () {
//   beforeEach(async function () {
//     const { fuulManager, user1, user2, adminRole } = await setupTest();

//     this.fuulManager = fuulManager;
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
//     await this.fuulManager.setProjectBudgetCooldown(this.newPeriod);

//     expect(await this.fuulManager.projectBudgetCooldown()).to.equal(
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
//         .setProjectBudgetCooldown(this.newPeriod)
//     ).to.be.revertedWith(error);
//   });

//   it("Should fail to set claim cooldown if incorrect arguments are passed", async function () {
//     const newPeriod = await this.fuulManager.claimCooldown();

//     await expect(
//       this.fuulManager.setClaimCooldown(newPeriod)
//     ).to.be.revertedWithCustomError(this.fuulManager, "InvalidArgument");
//   });

//   it("Should fail to set budget cooldown if incorrect arguments are passed", async function () {
//     const newPeriod = await this.fuulManager.projectBudgetCooldown();

//     await expect(
//       this.fuulManager.setProjectBudgetCooldown(newPeriod)
//     ).to.be.revertedWithCustomError(this.fuulManager, "InvalidArgument");
//   });
// });

// describe("Fuul Manager - Fees management", function () {
//   beforeEach(async function () {
//     const { fuulManager, user1, user2, adminRole } = await setupTest();

//     this.fuulManager = fuulManager;
//     this.user1 = user1;
//     this.user2 = user2;
//     this.adminRole = adminRole;

//     this.newFee = 5;
//   });

//   it("Should set new fees", async function () {
//     // Protocol Fees
//     await this.fuulManager.setProtocolFee(this.newFee);

//     expect(await this.fuulManager.protocolFee()).to.equal(this.newFee);

//     // Client Fees
//     await this.fuulManager.setClientFee(this.newFee);

//     expect(await this.fuulManager.clientFee()).to.equal(this.newFee);

//     // Attributor Fees
//     await this.fuulManager.setAttributorFee(this.newFee);

//     expect(await this.fuulManager.attributorFee()).to.equal(this.newFee);

//     // NFT Fixed fees
//     await this.fuulManager.setNftFixedFeeAmounte(this.newFee);

//     expect(await this.fuulManager.nftFixedFeeAmount()).to.equal(this.newFee);

//     // NFT fee currency
//     await this.fuulManager.setNftFeeCurrency(this.user1.address);

//     expect(await this.fuulManager.nftFeeCurrency()).to.equal(
//       this.user1.address
//     );

//     // Protocol fee collector
//     await this.fuulManager.setProtocolFeeCollector(this.user1.address);

//     expect(await this.fuulManager.protocolFeeCollector()).to.equal(
//       this.user1.address
//     );
//   });

//   it("Should fail to set new fees if not admin role", async function () {
//     const error = `AccessControl: account ${this.user2.address.toLowerCase()} is missing role ${
//       this.adminRole
//     }`;

//     // Protocol Fee
//     await expect(
//       this.fuulManager.connect(this.user2).setProtocolFee(this.newFee)
//     ).to.be.revertedWith(error);

//     // Client Fees
//     await expect(
//       this.fuulManager.connect(this.user2).setClientFee(this.newFee)
//     ).to.be.revertedWith(error);

//     // Attributor Fees
//     await expect(
//       this.fuulManager.connect(this.user2).setAttributorFee(this.newFee)
//     ).to.be.revertedWith(error);

//     // NFT Fixed fees
//     await expect(
//       this.fuulManager.connect(this.user2).setNftFixedFeeAmounte(this.newFee)
//     ).to.be.revertedWith(error);

//     // NFT fee currency
//     await expect(
//       this.fuulManager.connect(this.user2).setNftFeeCurrency(this.user1.address)
//     ).to.be.revertedWith(error);

//     // Protocol fee collector
//     await expect(
//       this.fuulManager
//         .connect(this.user2)
//         .setProtocolFeeCollector(this.user1.address)
//     ).to.be.revertedWith(error);
//   });
// });

// describe("Fuul Manager - Token currency management", function () {
//   beforeEach(async function () {
//     const { fuulManager, nft721, token, user1, user2, adminRole, limitAmount } =
//       await setupTest();

//     this.fuulManager = fuulManager;
//     this.nft721 = nft721;
//     this.token = token;
//     this.user1 = user1;
//     this.user2 = user2;
//     this.adminRole = adminRole;
//     this.limitAmount = limitAmount;

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
//     expect(currency.isActive).to.equal(true);

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

//     expect(currency.isActive).to.equal(false);
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
//     ).to.be.revertedWithCustomError(
//       this.fuulManager,
//       "TokenCurrencyAlreadyAccepted"
//     );

//     // Limit = 0

//     await expect(
//       this.fuulManager.addCurrencyToken(this.newCurrency, 0)
//     ).to.be.revertedWithCustomError(this.fuulManager, "InvalidArgument");

//     // EOA Address
//     await expect(
//       this.fuulManager.addCurrencyToken(this.user2.address, this.limitAmount)
//     ).to.be.revertedWithCustomError(this.fuulManager, "InvalidArgument");
//   });

//   it("Should fail to remove currency and not accepted", async function () {
//     await expect(
//       this.fuulManager.removeCurrencyToken(this.user2.address)
//     ).to.be.revertedWithCustomError(
//       this.fuulManager,
//       "TokenCurrencyNotAccepted"
//     );
//   });

//   it("Should fail to set new token limit if incorrect arguments are passed", async function () {
//     // Same token type value
//     await expect(
//       this.fuulManager.setCurrencyTokenLimit(
//         this.token.address,
//         this.limitAmount
//       )
//     ).to.be.revertedWithCustomError(this.fuulManager, "InvalidArgument");

//     // Limit = 0
//     await expect(
//       this.fuulManager.setCurrencyTokenLimit(this.token.address, 0)
//     ).to.be.revertedWithCustomError(this.fuulManager, "InvalidArgument");
//   });
// });

describe("Fuul Manager - Attribute", function () {
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
      user4,
      limitAmount,
      nftFeeCurrency,
      protocolFeeCollector,
      clientFeeCollector,
    } = await setupTest();

    this.fuulManager = fuulManager;
    this.fuulProject = fuulProject;
    this.fuulFactory = fuulFactory;
    this.token = token;
    this.nft721 = nft721;
    this.nft1155 = nft1155;
    this.user1 = user1;
    this.user2 = user2;
    this.clientFeeCollector = clientFeeCollector;
    this.attributor = user4;
    this.nftFeeCurrency = nftFeeCurrency;
    this.protocolFeeCollector = protocolFeeCollector;

    this.projectURI = "projectURI";

    this.limitAmount = limitAmount;

    this.amount = ethers.utils.parseEther("1000");

    this.tokenIds = [1, 2, 3, 4];

    this.amounts = [1, 2, 1, 2];

    this.tokenAmount = this.amounts.reduce(function (a, b) {
      return a + b;
    });

    // Deposit ERC20

    await this.token.approve(
      this.fuulProject.address,
      ethers.utils.parseEther("40000000")
    );

    await this.fuulProject.depositFungibleToken(
      this.token.address,
      this.amount
    );

    // Deposit Native

    await this.fuulProject.depositFungibleToken(
      ethers.constants.AddressZero,
      this.amount,
      {
        value: this.amount,
      }
    );

    // Deposit ERC721
    await this.fuulManager.addCurrencyToken(nft721.address, 100);

    await this.nft721.setApprovalForAll(this.fuulProject.address, true);

    await this.fuulProject.depositNFTToken(nft721.address, this.tokenIds, []);

    // Deposit ERC1155

    await this.fuulManager.addCurrencyToken(nft1155.address, 100);

    await this.nft1155.setApprovalForAll(this.fuulProject.address, true);

    await this.fuulProject.depositNFTToken(
      this.nft1155.address,
      this.tokenIds,
      this.amounts
    );

    // Deposit Fee Budget
    await this.nftFeeCurrency.approve(
      this.fuulProject.address,
      ethers.utils.parseEther("40000000")
    );
    await this.fuulProject.depositFeeBudget(this.amount);

    // Attribution template
    this.attributionTemplate = {
      partner: this.user2.address,
      endUser: this.user3.address,
      amountToPartner: 1,
      amountToEndUser: 1,
    };
  });

  it("Should attribute from different projects, campaigns & currencies and set correct values", async function () {
    // Create a new project and campaign

    await this.fuulFactory
      .connect(this.user2)
      .createFuulProject(
        this.user1.address,
        this.user1.address,
        this.projectURI,
        this.client.address
      );

    const newFuulProjectAddress = await this.fuulFactory.projects(2);

    const NewFuulProject = await ethers.getContractFactory("FuulProject");
    const newFuulProject = await NewFuulProject.attach(newFuulProjectAddress);

    // Approve
    await this.token.approve(
      newFuulProject.address,
      ethers.utils.parseEther("40000000")
    );

    await newFuulProject.depositFungibleToken(this.token.address, this.amount);

    // Attibution entities
    const attributionEntities = [
      {
        projectAddress: this.fuulProject.address,
        projectAttributions: [
          { ...this.attributionTemplate, currency: this.token.address },
          {
            ...this.attributionTemplate,
            currency: ethers.constants.AddressZero,
          },
          { ...this.attributionTemplate, currency: this.nft721.address },
          { ...this.attributionTemplate, currency: this.nft1155.address },
        ],
      },
      {
        projectAddress: newFuulProject.address,
        projectAttributions: [
          { ...this.attributionTemplate, currency: this.token.address },
        ],
      },
    ];

    // Attribute
    await this.fuulManager.attributeTransactions(
      attributionEntities,
      this.attributor.address
    );

    // Check balances

    // First Project

    //   let receiver = att.receivers[i];
    //   let amount = att.amounts[i];

    //   let campaign = await this.fuulProject.campaigns(campaignId);
    //   expect(campaign.currentBudget).to.equal(0);

    //   let userEarnings = await this.fuulProject.usersEarnings(
    //     receiver,
    //     campaignId
    //   );
    //   expect(userEarnings.totalEarnings).to.equal(amount);
    //   expect(userEarnings.availableToClaim).to.equal(amount);
    // }

    // New

    // for (i = 0; i < attributeChecks[1].campaignIds.length; i++) {
    //   let att = attributeChecks[1];
    //   let campaignId = att.campaignIds[i];

    //   let receiver = att.receivers[i];
    //   let amount = att.amounts[i];

    //   let campaign = await newFuulProject.campaigns(campaignId);
    //   expect(campaign.currentBudget).to.equal(0);

    //   let userEarnings = await newFuulProject.usersEarnings(
    //     receiver,
    //     campaignId
    //   );
    //   expect(userEarnings.totalEarnings).to.equal(amount);
    //   expect(userEarnings.availableToClaim).to.equal(amount);
    // }
  });

  // it("Should fail to attribute if campaign has insufficient balance", async function () {
  //   const attributeCheck = { ...this.attributeCheck };
  //   attributeCheck.amounts[0] = this.limitAmount;
  //   await expect(this.fuulManager.attributeTransactions([attributeCheck])).to.be
  //     .revertedWithPanic;
  // });

  // it("Should fail to attribute if not attributor role", async function () {
  //   const attributorRole = await this.fuulManager.ATTRIBUTOR_ROLE();
  //   const error = `AccessControl: account ${this.user2.address.toLowerCase()} is missing role ${attributorRole}`;

  //   await expect(
  //     this.fuulManager
  //       .connect(this.user2)
  //       .attributeTransactions([this.attributeCheck])
  //   ).to.be.revertedWith(error);
  // });

  // it("Should fail to attribute if contract is paused", async function () {
  //   await this.fuulManager.pauseAll();

  //   await expect(
  //     this.fuulManager.attributeTransactions([this.attributeCheck])
  //   ).to.be.revertedWith("Pausable: paused");
  // });
});

// describe("Fuul Manager - Claim", function () {
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
//       provider,
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
//     this.provider = provider;

//     this.limitAmount = limitAmount;

//     this.projectURI = "projectURI";

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

//     await this.fuulProject.depositFungibleToken(
//       this.nativeCampaignId,
//       this.amount,
//       {
//         value: this.amount,
//       }
//     );

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

//     await this.fuulManager.attributeTransactions([this.attributeCheck]);
//   });

//   it("Should claim erc20 from different projects, campaigns & currencies and set correct values", async function () {
//     // Create a new project and campaign

//     await this.fuulFactory
//       .connect(this.user2)
//       .createFuulProject(
//         this.user1.address,
//         this.user1.address,
//         this.projectURI
//       );

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

//     // Attribute in new project
//     await this.fuulManager.attributeTransactions([newAttributeCheck]);

//     // Claim

//     const currency = this.token.address;
//     const claimer = this.user2;
//     const amount = this.amount;

//     claimChecks = [
//       {
//         projectAddress: this.fuulProject.address,
//         campaignId: this.erc20CampaignId,
//         tokenIds: [],
//         amounts: [],
//       },
//       {
//         projectAddress: newFuulProject.address,
//         campaignId: this.erc20CampaignId,
//         tokenIds: [],
//         amounts: [],
//       },
//     ];

//     await this.fuulManager.connect(claimer).claim(claimChecks);

//     // Check users balances in project contracts

//     const projects = [this.fuulProject, newFuulProject];
//     for (i = 0; i < projects; i++) {
//       let project = projects[i];
//       let check = claimChecks[i];

//       let userEarnings = await project.usersEarnings(
//         claimer.address,
//         check.campaignId
//       );
//       expect(userEarnings.totalEarnings).to.equal(amount);
//       expect(userEarnings.availableToClaim).to.equal(0);
//     }

//     // Check users claims in manager contracts

//     const amountEth = ethers.utils.formatEther(amount.toString());

//     const expectedAmount = ethers.utils.parseEther(
//       (Number(amountEth) * 2).toString()
//     );

//     expect(expectedAmount).to.equal(
//       await this.fuulManager.usersClaims(claimer.address, currency)
//     );

//     // Set currency info

//     const currencyObject = await this.fuulManager.currencyTokens(currency);

//     expect(currencyObject.cumulativeClaimPerCooldown).to.equal(expectedAmount);
//     expect(Number(currencyObject.claimCooldownPeriodStarted)).to.be.greaterThan(
//       0
//     );

//     // User balance
//     expect(await this.token.balanceOf(claimer.address)).to.equal(
//       expectedAmount
//     );
//   });

//   it("Should claim native and set correct values", async function () {
//     claimChecks = [
//       {
//         projectAddress: this.fuulProject.address,
//         campaignId: this.nativeCampaignId,
//         tokenIds: [],
//         amounts: [],
//       },
//     ];

//     const currency = ethers.constants.AddressZero;
//     const claimer = this.user3;
//     const amount = this.amount;

//     // Balance before
//     const balanceBefore = await this.provider.getBalance(claimer.address);

//     // Claim
//     await this.fuulManager.connect(claimer).claim(claimChecks);

//     // Check users balances in project contract

//     let userEarnings = await this.fuulProject.usersEarnings(
//       claimer.address,
//       claimChecks[0].campaignId
//     );
//     expect(userEarnings.totalEarnings).to.equal(amount);
//     expect(userEarnings.availableToClaim).to.equal(0);

//     // Check users claims in manager contracts

//     expect(
//       await this.fuulManager.usersClaims(user3.address, currency)
//     ).to.equal(amount);

//     // Set currency info

//     const currencyObject = await this.fuulManager.currencyTokens(currency);

//     expect(currencyObject.cumulativeClaimPerCooldown).to.equal(amount);
//     expect(Number(currencyObject.claimCooldownPeriodStarted)).to.be.greaterThan(
//       0
//     );

//     // User balance
//     const balanceAfter = await this.provider.getBalance(claimer.address);

//     const balanceDiff =
//       ethers.utils.formatEther(balanceAfter.toString()) -
//       ethers.utils.formatEther(balanceBefore.toString());

//     expect(balanceDiff).to.be.greaterThan(0);
//   });

//   it("Should claim nfts721 and set correct values", async function () {
//     claimChecks = [
//       {
//         projectAddress: this.fuulProject.address,
//         campaignId: this.nft721CampaignId,
//         tokenIds: this.tokenIds,
//         amounts: [],
//       },
//     ];

//     const currency = this.nft721.address;
//     const claimer = this.user4;
//     const amount = this.tokenIds.length;

//     // Claim
//     await this.fuulManager.connect(claimer).claim(claimChecks);

//     // Check users balances in project contract

//     let userEarnings = await this.fuulProject.usersEarnings(
//       claimer.address,
//       claimChecks[0].campaignId
//     );
//     expect(userEarnings.totalEarnings).to.equal(amount);
//     expect(userEarnings.availableToClaim).to.equal(0);

//     // Check users claims in manager contracts

//     expect(
//       await this.fuulManager.usersClaims(claimer.address, currency)
//     ).to.equal(amount);

//     // Set currency info

//     const currencyObject = await this.fuulManager.currencyTokens(currency);

//     expect(currencyObject.cumulativeClaimPerCooldown).to.equal(amount);
//     expect(Number(currencyObject.claimCooldownPeriodStarted)).to.be.greaterThan(
//       0
//     );

//     // User balance
//     const balance = await this.nft721.balanceOf(claimer.address);

//     await expect(balance).to.equal(amount);
//   });

//   it("Should claim nfts1155 and set correct values", async function () {
//     claimChecks = [
//       {
//         projectAddress: this.fuulProject.address,
//         campaignId: this.nft1155CampaignId,
//         tokenIds: this.tokenIds,
//         amounts: this.amounts,
//       },
//     ];

//     const currency = this.nft1155.address;
//     const claimer = this.user5;
//     const amount = this.tokenAmount;

//     // Claim
//     await this.fuulManager.connect(claimer).claim(claimChecks);

//     // Check users balances in project contract

//     let userEarnings = await this.fuulProject.usersEarnings(
//       claimer.address,
//       claimChecks[0].campaignId
//     );
//     expect(userEarnings.totalEarnings).to.equal(amount);
//     expect(userEarnings.availableToClaim).to.equal(0);

//     // Check users claims in manager contracts

//     expect(
//       await this.fuulManager.usersClaims(claimer.address, currency)
//     ).to.equal(amount);

//     // Set currency info

//     const currencyObject = await this.fuulManager.currencyTokens(currency);

//     expect(currencyObject.cumulativeClaimPerCooldown).to.equal(amount);
//     expect(Number(currencyObject.claimCooldownPeriodStarted)).to.be.greaterThan(
//       0
//     );

//     // User balance
//     for (i = 0; i < this.tokenIds.length; i++) {
//       expect(
//         await this.nft1155.balanceOf(claimer.address, this.tokenIds[i])
//       ).to.equal(this.amounts[i]);
//     }
//   });

//   it("Should claim over the limit after cooling period is passed", async function () {
//     // Create a new project and campaign

//     await this.fuulFactory
//       .connect(this.user2)
//       .createFuulProject(
//         this.user1.address,
//         this.user1.address,
//         this.projectURI
//       );

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

//     // Attribute in new project
//     await this.fuulManager.attributeTransactions([newAttributeCheck]);

//     // Claim

//     const currency = this.token.address;
//     const claimer = this.user2;
//     const amount = this.amount;

//     claimChecks = [
//       {
//         projectAddress: this.fuulProject.address,
//         campaignId: this.erc20CampaignId,
//         tokenIds: [],
//         amounts: [],
//       },
//       {
//         projectAddress: newFuulProject.address,
//         campaignId: this.erc20CampaignId,
//         tokenIds: [],
//         amounts: [],
//       },
//     ];

//     await this.fuulManager.connect(claimer).claim(claimChecks);

//     // Check users balances in project contracts

//     const projects = [this.fuulProject, newFuulProject];
//     for (i = 0; i < projects; i++) {
//       let project = projects[i];
//       let check = claimChecks[i];

//       let userEarnings = await project.usersEarnings(
//         claimer.address,
//         check.campaignId
//       );
//       expect(userEarnings.totalEarnings).to.equal(amount);
//       expect(userEarnings.availableToClaim).to.equal(0);
//     }

//     // Check users claims in manager contracts

//     const amountEth = ethers.utils.formatEther(amount.toString());

//     const expectedAmount = ethers.utils.parseEther(
//       (Number(amountEth) * 2).toString()
//     );

//     expect(expectedAmount).to.equal(
//       await this.fuulManager.usersClaims(claimer.address, currency)
//     );

//     // Set currency info

//     const currencyObject = await this.fuulManager.currencyTokens(currency);

//     expect(currencyObject.cumulativeClaimPerCooldown).to.equal(expectedAmount);
//     expect(Number(currencyObject.claimCooldownPeriodStarted)).to.be.greaterThan(
//       0
//     );

//     // User balance
//     expect(await this.token.balanceOf(claimer.address)).to.equal(
//       expectedAmount
//     );
//   });

//   it("Should claim after removing token", async function () {
//     // Remove token

//     const currency = this.nft721.address;

//     await this.fuulManager.removeCurrencyToken(currency);

//     // Claim

//     claimChecks = [
//       {
//         projectAddress: this.fuulProject.address,
//         campaignId: this.nft721CampaignId,
//         tokenIds: this.tokenIds,
//         amounts: [],
//       },
//     ];

//     const claimer = this.user4;
//     const amount = this.tokenIds.length;

//     // Claim
//     await this.fuulManager.connect(claimer).claim(claimChecks);

//     // Check users balances in project contract

//     let userEarnings = await this.fuulProject.usersEarnings(
//       claimer.address,
//       claimChecks[0].campaignId
//     );
//     expect(userEarnings.totalEarnings).to.equal(amount);
//     expect(userEarnings.availableToClaim).to.equal(0);

//     // Check users claims in manager contracts

//     expect(
//       await this.fuulManager.usersClaims(claimer.address, currency)
//     ).to.equal(amount);

//     // Set currency info

//     const currencyObject = await this.fuulManager.currencyTokens(currency);

//     expect(currencyObject.cumulativeClaimPerCooldown).to.equal(amount);
//     expect(Number(currencyObject.claimCooldownPeriodStarted)).to.be.greaterThan(
//       0
//     );

//     // User balance
//     const balance = await this.nft721.balanceOf(claimer.address);

//     await expect(balance).to.equal(amount);
//   });

//   it("Should fail when user has nothing to claim", async function () {
//     claimChecks = [
//       {
//         projectAddress: this.fuulProject.address,
//         campaignId: this.nft1155CampaignId,
//         tokenIds: this.tokenIds,
//         amounts: this.amounts,
//       },
//     ];

//     await expect(
//       this.fuulManager.connect(this.user2).claim(claimChecks)
//     ).to.be.revertedWithCustomError(this.fuulProject, "ZeroAmount");
//   });

//   it("Should fail to claim if contract is paused", async function () {
//     await this.fuulManager.pauseAll();

//     claimChecks = [
//       {
//         projectAddress: this.fuulProject.address,
//         campaignId: this.nft1155CampaignId,
//         tokenIds: this.tokenIds,
//         amounts: this.amounts,
//       },
//     ];

//     await expect(
//       this.fuulManager.connect(this.user2).claim(claimChecks)
//     ).to.be.revertedWith("Pausable: paused");
//   });

//   it("Should fail to claim over the limit in one tx", async function () {
//     await this.fuulProject.depositFungibleToken(
//       this.erc20CampaignId,
//       this.limitAmount
//     );
//     // Attribute
//     attributeCheck = {
//       projectAddress: this.fuulProject.address,
//       campaignIds: [this.erc20CampaignId],
//       receivers: [this.user2.address],
//       amounts: [this.limitAmount],
//     };

//     await this.fuulManager.attributeTransactions([attributeCheck]);

//     // Claim
//     const claimer = this.user2;

//     claimChecks = [
//       {
//         projectAddress: this.fuulProject.address,
//         campaignId: this.erc20CampaignId,
//         tokenIds: [],
//         amounts: [],
//       },
//     ];
//     await expect(
//       this.fuulManager.connect(claimer).claim(claimChecks)
//     ).to.be.revertedWithCustomError(this.fuulManager, "OverTheLimit");
//   });

//   it("Should fail to claim over the limit in 2 tx", async function () {
//     await this.fuulProject.depositFungibleToken(
//       this.erc20CampaignId,
//       this.limitAmount
//     );

//     // Claim
//     const claimer = this.user2;

//     claimChecks = [
//       {
//         projectAddress: this.fuulProject.address,
//         campaignId: this.erc20CampaignId,
//         tokenIds: [],
//         amounts: [],
//       },
//     ];

//     await this.fuulManager.connect(claimer).claim(claimChecks);

//     // Attribute
//     attributeCheck = {
//       projectAddress: this.fuulProject.address,
//       campaignIds: [this.erc20CampaignId],
//       receivers: [this.user2.address],
//       amounts: [this.limitAmount],
//     };

//     await this.fuulManager.attributeTransactions([attributeCheck]);
//     await expect(
//       this.fuulManager.connect(claimer).claim(claimChecks)
//     ).to.be.revertedWithCustomError(this.fuulManager, "OverTheLimit");
//   });
// });
