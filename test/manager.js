const { expect } = require("chai");

const { setupTest } = require("./before-each-test");

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

//   it("Should set new claim frequency", async function () {
//     await this.fuulManager.setClaimFrequency(this.newPeriod);

//     expect(await this.fuulManager.claimFrequency()).to.equal(this.newPeriod);
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

//     // Set claim freq
//     await expect(
//       this.fuulManager.connect(this.user2).setClaimFrequency(this.newPeriod)
//     ).to.be.revertedWith(error);

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

//   it("Should fail to set claim frequency if incorrect arguments are passed", async function () {
//     const newPeriod = await this.fuulManager.claimFrequency();

//     await expect(this.fuulManager.setClaimFrequency(newPeriod))
//       .to.be.revertedWithCustomError(this.fuulManager, "InvalidUintArgument")
//       .withArgs(newPeriod);
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
      adminRole,
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
    this.adminRole = adminRole;
    this.provider = provider;
    this.network = await provider.getNetwork();
    this.chainId = this.network.chainId;
    this.block = await this.provider.getBlock();

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

    // Voucher info

    this.voucher = {
      account: this.user2.address,
      deadline: this.block.timestamp + 1000000000000000,
      projectAddress: this.fuulProject.address,
    };

    this.domain = {
      name: "FuulManager",
      version: "1.0.0",
      chainId: this.chainId,
      verifyingContract: this.fuulManager.address,
    };

    this.types = {
      ClaimVoucher: [
        { name: "voucherId", type: "string" },
        { name: "projectAddress", type: "address" },
        { name: "campaignId", type: "uint256" },
        { name: "currency", type: "address" },
        { name: "account", type: "address" },
        { name: "amount", type: "uint256" },
        { name: "tokenIds", type: "uint256[]" },
        { name: "amounts", type: "uint256[]" },
        { name: "deadline", type: "uint256" },
      ],
    };
  });

  it("Should claim from different campaigns & currencies and set correct values", async function () {
    // Make vouchers and signatures

    const erc20Voucher = {
      ...this.voucher,
      voucherId: "f4c2fabc-ad62-11ed-afa1-0242ac120006",
      campaignId: this.erc20CampaignId,
      currency: this.token.address,
      amount: this.amount,
      tokenIds: [],
      amounts: [],
    };

    const erc20Signature = await this.user1._signTypedData(
      this.domain,
      this.types,
      erc20Voucher
    );

    const nativeVoucher = {
      ...this.voucher,
      voucherId: "f4c2fabc-ad62-11ed-afa1-0242ac120002",
      campaignId: this.nativeCampaignId,
      currency: ethers.constants.AddressZero,
      amount: this.amount,
      tokenIds: [],
      amounts: [],
    };

    const nativeSignature = await this.user1._signTypedData(
      this.domain,
      this.types,
      nativeVoucher
    );

    const erc721Voucher = {
      ...this.voucher,
      voucherId: "f4c2fabc-ad62-11ed-afa1-0242ac120013",
      campaignId: this.nft721CampaignId,
      currency: this.nft721.address,
      amount: 0,
      tokenIds: this.tokenIds,
      amounts: [],
    };

    const erc721Signature = await this.user1._signTypedData(
      this.domain,
      this.types,
      erc721Voucher
    );

    const erc1155Voucher = {
      ...this.voucher,
      voucherId: "f4c2fabc-ad62-11ed-afa1-0242ac120056",
      campaignId: this.nft1155CampaignId,
      currency: this.nft1155.address,
      amount: 0,
      tokenIds: this.tokenIds,
      amounts: this.amounts,
    };

    const erc1155Signature = await this.user1._signTypedData(
      this.domain,
      this.types,
      erc1155Voucher
    );

    const vouchers = [
      nativeVoucher,
      erc20Voucher,
      erc721Voucher,
      erc1155Voucher,
    ];

    const signatures = [
      nativeSignature,
      erc20Signature,
      erc721Signature,
      erc1155Signature,
    ];

    // Claim

    const balanceBeforeNative = await this.provider.getBalance(
      this.user2.address
    );

    await this.fuulManager.connect(this.user2).claim(vouchers, signatures);

    // Check balances

    // ERC20
    expect(await this.token.balanceOf(this.user2.address)).to.equal(
      this.amount
    );

    // Native
    const balanceAfterNative = await this.provider.getBalance(
      this.user2.address
    );

    const balanceDiffNative =
      ethers.utils.formatEther(balanceAfterNative.toString()) -
      ethers.utils.formatEther(balanceBeforeNative.toString());

    expect(balanceDiffNative).to.be.greaterThan(0);

    // ERC721
    for (let tokenId of this.tokenIds) {
      expect(await this.nft721.ownerOf(tokenId)).to.equal(this.user2.address);
    }

    // ERC1155

    for (i = 0; i < this.tokenIds.length; i++) {
      let tokenId = this.tokenIds[i];
      let amount = this.amounts[i];

      expect(
        await this.nft1155.balanceOf(this.user2.address, tokenId)
      ).to.equal(amount);
    }

    // Voucher redeemed

    for (let voucher of vouchers) {
      expect(
        await this.fuulManager.voucherRedeemed(voucher.voucherId)
      ).to.equal(true);
    }
    // Campaign balances

    erc20Campaign = await this.fuulProject.campaigns(this.erc20CampaignId);
    expect(erc20Campaign.totalDeposited).to.equal(this.amount);
    expect(erc20Campaign.currentBudget).to.equal(0);

    nativeCampaign = await this.fuulProject.campaigns(this.nativeCampaignId);
    expect(nativeCampaign.totalDeposited).to.equal(this.amount);
    expect(nativeCampaign.currentBudget).to.equal(0);

    nft721Campaign = await this.fuulProject.campaigns(this.nft721CampaignId);
    expect(nft721Campaign.totalDeposited).to.equal(this.tokenIds.length);
    expect(nft721Campaign.currentBudget).to.equal(0);

    nft1155Campaign = await this.fuulProject.campaigns(this.nft1155CampaignId);

    expect(nft1155Campaign.totalDeposited).to.equal(this.tokenAmount);
    expect(nft1155Campaign.currentBudget).to.equal(0);

    // Currency cumulative claims
    erc20Currency = await this.fuulManager.currencyTokens(this.token.address);

    expect(erc20Currency.cumulativeClaimPerCooldown).to.equal(this.amount);

    nativeCurrency = await this.fuulManager.currencyTokens(
      ethers.constants.AddressZero
    );
    expect(nativeCurrency.cumulativeClaimPerCooldown).to.equal(this.amount);

    nft721Currency = await this.fuulManager.currencyTokens(this.nft721.address);
    expect(nft721Currency.cumulativeClaimPerCooldown).to.equal(
      this.tokenIds.length
    );

    nft1155Currency = await this.fuulManager.currencyTokens(
      this.nft1155.address
    );
    expect(nft1155Currency.cumulativeClaimPerCooldown).to.equal(
      this.tokenAmount
    );

    // User claims

    erc20UserClaim = await this.fuulManager.usersClaims(
      this.user2.address,
      this.token.address
    );
    expect(erc20UserClaim.totalAmountClaimed).to.equal(this.amount);
    expect(Number(erc20UserClaim.lastClaimedAt)).to.be.greaterThan(0);

    nativeUserClaim = await this.fuulManager.usersClaims(
      this.user2.address,
      ethers.constants.AddressZero
    );
    expect(nativeUserClaim.totalAmountClaimed).to.equal(this.amount);
    expect(Number(nativeUserClaim.lastClaimedAt)).to.be.greaterThan(0);

    nft721UserClaim = await this.fuulManager.usersClaims(
      this.user2.address,
      this.nft721.address
    );
    expect(nft721UserClaim.totalAmountClaimed).to.equal(this.tokenIds.length);
    expect(Number(nft721UserClaim.lastClaimedAt)).to.be.greaterThan(0);

    nft1155UserClaim = await this.fuulManager.usersClaims(
      this.user2.address,
      this.nft1155.address
    );
    expect(nft1155UserClaim.totalAmountClaimed).to.equal(this.tokenAmount);
    expect(Number(nft1155UserClaim.lastClaimedAt)).to.be.greaterThan(0);
  });

  it("Should claim from different projects", async function () {
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

    // Make vouchers and signatures

    const firstVoucher = {
      ...this.voucher,
      voucherId: "f4c2fabc-ad62-11ed-afa1-0242ac120006",
      campaignId: this.erc20CampaignId,
      currency: this.token.address,
      amount: this.amount,
      tokenIds: [],
      amounts: [],
    };

    const firstSignature = await this.user1._signTypedData(
      this.domain,
      this.types,
      firstVoucher
    );

    const newVoucher = {
      ...this.voucher,
      voucherId: "f4c2fabc-ad62-11ed-afa1-0242ac120032",
      campaignId: this.erc20CampaignId,
      currency: this.token.address,
      amount: this.amount,
      tokenIds: [],
      amounts: [],
      projectAddress: newFuulProject.address,
    };

    const newSignature = await this.user1._signTypedData(
      this.domain,
      this.types,
      newVoucher
    );

    const vouchers = [firstVoucher, newVoucher];

    const signatures = [firstSignature, newSignature];

    // Claim

    await this.fuulManager.connect(this.user2).claim(vouchers, signatures);

    // Check balances

    const expectedBalance =
      2 * ethers.utils.formatEther(this.amount.toString());

    const balance = ethers.utils.parseEther(expectedBalance.toString());

    // ERC20
    expect(await this.token.balanceOf(this.user2.address)).to.equal(balance);

    // Voucher redeemed

    for (let voucher of vouchers) {
      expect(
        await this.fuulManager.voucherRedeemed(voucher.voucherId)
      ).to.equal(true);
    }
    // Campaign balances

    for (let project of [this.fuulProject, newFuulProject]) {
      let campaign = await project.campaigns(this.erc20CampaignId);
      expect(campaign.totalDeposited).to.equal(this.amount);
      expect(campaign.currentBudget).to.equal(0);
    }

    // Currency cumulative claims
    currency = await this.fuulManager.currencyTokens(this.token.address);

    expect(currency.cumulativeClaimPerCooldown).to.equal(balance);

    // User claims

    erc20UserClaim = await this.fuulManager.usersClaims(
      this.user2.address,
      this.token.address
    );
    expect(erc20UserClaim.totalAmountClaimed).to.equal(balance);
    expect(Number(erc20UserClaim.lastClaimedAt)).to.be.greaterThan(0);
  });
});
