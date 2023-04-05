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
//     const { fuulManager, token, user1, user2, adminRole } = await setupTest();

//     this.fuulManager = fuulManager;
//     this.token = token;
//     this.user1 = user1;
//     this.user2 = user2;
//     this.adminRole = adminRole;

//     this.newCurrency = this.user2.address;
//     this.tokenType = 1;
//     this.limit = ethers.utils.parseEther("100");
//   });

//   it("Should add new currency", async function () {
//     await this.fuulManager.addCurrencyToken(
//       this.newCurrency,
//       this.tokenType,
//       this.limit
//     );

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

//   it("Should set new currency type", async function () {
//     const tokenType = 2;
//     await this.fuulManager.setCurrencyTokenType(this.token.address, tokenType);

//     const currency = await this.fuulManager.currencyTokens(this.token.address);

//     expect(currency.tokenType).to.equal(tokenType);
//   });

//   it("Should set new currency limit", async function () {
//     const limit = 2;
//     await this.fuulManager.setCurrencyTokenLimit(this.token.address, limit);

//     const currency = await this.fuulManager.currencyTokens(this.token.address);

//     expect(currency.claimLimitPerCooldown).to.equal(limit);
//   });

//   it("Should fail to add, remove, set token type and set limit for a currency if not admin role", async function () {
//     const error = `AccessControl: account ${this.user2.address.toLowerCase()} is missing role ${
//       this.adminRole
//     }`;

//     // Add currency
//     await expect(
//       this.fuulManager
//         .connect(this.user2)
//         .addCurrencyToken(this.newCurrency, this.tokenType, this.limit)
//     ).to.be.revertedWith(error);

//     // Set token type

//     await expect(
//       this.fuulManager
//         .connect(this.user2)
//         .setCurrencyTokenType(this.newCurrency, this.tokenType)
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
//       this.fuulManager.addCurrencyToken(
//         this.token.address,
//         this.tokenType,
//         this.limit
//       )
//     )
//       .to.be.revertedWithCustomError(
//         this.fuulManager,
//         "TokenCurrencyAlreadyAccepted"
//       )
//       .withArgs(this.token.address);

//     // Limit = 0

//     await expect(
//       this.fuulManager.addCurrencyToken(this.newCurrency, this.tokenType, 0)
//     )
//       .to.be.revertedWithCustomError(this.fuulManager, "InvalidUintArgument")
//       .withArgs(0);
//   });

//   it("Should fail to remove currency and not accepted", async function () {
//     await expect(this.fuulManager.removeCurrencyToken(this.user2.address))
//       .to.be.revertedWithCustomError(
//         this.fuulManager,
//         "TokenCurrencyNotAccepted"
//       )
//       .withArgs(this.user2.address);
//   });

//   it("Should fail to set new token type if incorrect arguments are passed", async function () {
//     // Token not accepted

//     await expect(
//       this.fuulManager.setCurrencyTokenType(this.user2.address, this.tokenType)
//     )
//       .to.be.revertedWithCustomError(
//         this.fuulManager,
//         "TokenCurrencyNotAccepted"
//       )
//       .withArgs(this.user2.address);

//     // Same token type value
//     await expect(
//       this.fuulManager.setCurrencyTokenType(this.token.address, this.tokenType)
//     )
//       .to.be.revertedWithCustomError(
//         this.fuulManager,
//         "InvalidTokenTypeArgument"
//       )
//       .withArgs(this.tokenType);
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

describe("Fuul Manager - Emergency withdraw", function () {
  beforeEach(async function () {
    const {
      fuulManager,
      fuulProject,
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
    this.token = token;
    this.nft721 = nft721;
    this.nft1155 = nft1155;
    this.user1 = user1;
    this.user2 = user2;
    this.adminRole = adminRole;
    this.provider = provider;

    this.campaignURI = "campaignURI";
    this.amount = ethers.utils.parseEther("1000");

    this.tokenIds = [1, 2, 3, 4];

    this.amounts = [1, 2, 1, 2];

    // FuulProjectFungibleCurrencies
    this.FuulProjectFungibleCurrencies = [
      {
        deployedAddress: this.fuulProject.address,
        currencies: [this.token.address, ethers.constants.AddressZero],
      },
    ];
  });

  it("Should emergency withdraw all fungible tokens", async function () {
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

    // Balance Before

    const balanceBeforeToken = await this.token.balanceOf(this.user1.address);
    const balanceBeforeNative = await this.provider.getBalance(
      this.user1.address
    );

    await this.fuulManager.emergencyWithdrawFungibleTokensFromProjects(
      this.user1.address,
      this.FuulProjectFungibleCurrencies
    );

    // Balance After
    const balanceAfterToken = await this.token.balanceOf(this.user1.address);
    const balanceAfterNative = await this.provider.getBalance(
      this.user1.address
    );

    // Balance Difference

    const balanceDiffToken =
      ethers.utils.formatEther(balanceAfterToken.toString()) -
      ethers.utils.formatEther(balanceBeforeToken.toString());

    expect(ethers.utils.parseEther(balanceDiffToken.toString())).to.equal(
      this.amount
    );

    const balanceDiffNative =
      ethers.utils.formatEther(balanceAfterNative.toString()) -
      ethers.utils.formatEther(balanceBeforeNative.toString());

    expect(balanceDiffNative).to.be.greaterThan(0);

    // Conctract balance
    expect(await this.token.balanceOf(this.fuulProject.address)).to.equal(0);
    expect(await this.provider.getBalance(this.fuulProject.address)).to.equal(
      0
    );
  });

  it("Should fail to emergency remove fungible and NFTs if not admin role", async function () {
    const error = `AccessControl: account ${this.user2.address.toLowerCase()} is missing role ${
      this.adminRole
    }`;

    // Fungible
    await expect(
      this.fuulManager
        .connect(this.user2)
        .emergencyWithdrawFungibleTokensFromProjects(
          this.user1.address,
          this.FuulProjectFungibleCurrencies
        )
    ).to.be.revertedWith(error);

    // NFTs
    await expect(
      this.fuulManager
        .connect(this.user2)
        .emergencyWithdrawNFTsFromProject(
          this.user1.address,
          this.fuulProject.address,
          this.nft721.address,
          this.tokenIds,
          this.amounts
        )
    ).to.be.revertedWith(error);
  });
});
