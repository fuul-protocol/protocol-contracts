const { expect } = require("chai");

const { setupTest } = require("./before-each-test");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Fuul Project - Campaign management", function () {
  beforeEach(async function () {
    const { fuulProject, token, user1, user2, adminRole } = await setupTest();

    this.fuulProject = fuulProject;
    this.token = token;
    this.user1 = user1;
    this.user2 = user2;
    this.adminRole = adminRole;

    this.campaignURI = "campaignURI";
  });

  it("Should create campaign with correct data", async function () {
    expect(
      await this.fuulProject.createCampaign(
        this.campaignURI,
        this.token.address
      )
    )
      .to.emit(this.fuulProject, "CampaignCreated")
      .withArgs(this.user1.address, this.token.address, 1, 1, this.campaignURI);

    const tokenId = 1;

    // Campaign info
    expect(await this.fuulProject.campaignsCreated()).to.equal(1);

    const campaign = await this.fuulProject.campaigns(tokenId);

    expect(campaign.currency).to.equal(this.token.address);
    expect(campaign.deactivatedAt).to.equal(0);
    expect(campaign.campaignURI).to.equal(this.campaignURI);
  });

  it("Should deactivate and reactivate campaign", async function () {
    await this.fuulProject.createCampaign(this.campaignURI, this.token.address);

    const tokenId = 1;

    // Deactivate campaign
    await this.fuulProject.deactivateCampaign(1);

    const deactivatedCampaign = await this.fuulProject.campaigns(tokenId);

    const deactvatedAt = Number(deactivatedCampaign.deactivatedAt);

    expect(deactvatedAt).to.be.greaterThan(0);

    // Reactivate campaign
    await this.fuulProject.reactivateCampaign(1);

    const reactivatedCampaign = await this.fuulProject.campaigns(tokenId);

    expect(reactivatedCampaign.deactivatedAt).to.equal(0);
  });

  it("Should set new campaign URI", async function () {
    await this.fuulProject.createCampaign(this.campaignURI, this.token.address);

    const campaignId = 1;
    const newCampaignURI = "newTokenURI";

    expect(await this.fuulProject.setCampaignURI(campaignId, newCampaignURI))
      .to.emit(this.fuulProject, "CampaignMetadataUpdated")
      .withArgs(campaignId, newCampaignURI);

    const campaign = await this.fuulProject.campaigns(campaignId);

    expect(campaign.campaignURI).to.equal(newCampaignURI);
  });

  // Fail
  it("Should fail to to deactivate, reactivate and set campaign uri if campaign does not exist", async function () {
    const campaignId = 1;

    await expect(this.fuulProject.setCampaignURI(campaignId, this.campaignURI))
      .to.be.revertedWithCustomError(this.fuulProject, "CampaignNotExists")
      .withArgs(campaignId);

    await expect(this.fuulProject.deactivateCampaign(campaignId))
      .to.be.revertedWithCustomError(this.fuulProject, "CampaignNotExists")
      .withArgs(campaignId);

    await expect(this.fuulProject.reactivateCampaign(campaignId))
      .to.be.revertedWithCustomError(this.fuulProject, "CampaignNotExists")
      .withArgs(campaignId);
  });

  it("Should fail to create, activate and deactivate campaign and set campaignURI if not admin role", async function () {
    const error = `AccessControl: account ${this.user2.address.toLowerCase()} is missing role ${
      this.adminRole
    }`;

    await expect(
      this.fuulProject
        .connect(this.user2)
        .createCampaign(this.campaignURI, this.token.address)
    ).to.be.revertedWith(error);

    // Create campaign
    await this.fuulProject.createCampaign(this.campaignURI, this.token.address);

    await expect(
      this.fuulProject.connect(this.user2).setCampaignURI(1, this.campaignURI)
    ).to.be.revertedWith(error);

    await expect(
      this.fuulProject.connect(this.user2).deactivateCampaign(1)
    ).to.be.revertedWith(error);

    // Deactivate campaign

    await this.fuulProject.deactivateCampaign(1);

    await expect(
      this.fuulProject.connect(this.user2).reactivateCampaign(1)
    ).to.be.revertedWith(error);
  });
});

describe("Fuul Project - Deposit and remove fungible", function () {
  beforeEach(async function () {
    const {
      fuulProject,
      fuulManager,
      token,
      user1,
      user2,
      adminRole,
      provider,
    } = await setupTest();

    this.fuulProject = fuulProject;
    this.fuulManager = fuulManager;
    this.token = token;
    this.user1 = user1;
    this.user2 = user2;
    this.adminRole = adminRole;
    this.provider = provider;

    this.campaignURI = "campaignURI";

    await this.fuulProject.createCampaign(this.campaignURI, this.token.address);
    await this.fuulProject.createCampaign(
      this.campaignURI,
      ethers.constants.AddressZero
    );

    this.erc20CampaignId = 1;
    this.nativeCampaignId = 2;

    this.amount = ethers.utils.parseEther("1000");
  });

  it("Should deposit correctly & set correct values with currency = 0x", async function () {
    await expect(
      this.fuulProject.depositFungibleToken(this.nativeCampaignId, 0, {
        value: this.amount,
      })
    )
      .to.emit(this.fuulProject, "BudgetDeposited")
      .withArgs(
        this.user1.address,
        this.amount,
        ethers.constants.AddressZero,
        this.nativeCampaignId,
        0,
        [],
        []
      );

    // Campaign info

    const campaign = await this.fuulProject.campaigns(this.nativeCampaignId);

    expect(campaign.totalDeposited).to.equal(this.amount);
    expect(campaign.currentBudget).to.equal(this.amount);

    // Balance
    const balance = await this.provider.getBalance(this.fuulProject.address);

    await expect(balance).to.equal(this.amount);
  });

  it("Should remove correctly & set correct values with currency = 0x", async function () {
    // Deposit
    await this.fuulProject.depositFungibleToken(this.nativeCampaignId, 0, {
      value: this.amount,
    });

    // Deactivate campaign
    await this.fuulProject.deactivateCampaign(this.nativeCampaignId);

    // Increase time

    const campaignBudgetCooldown =
      await this.fuulManager.campaignBudgetCooldown();

    await time.increase(campaignBudgetCooldown.toNumber() + 1);

    // Remove
    await this.fuulProject.removeFungibleBudget(
      this.nativeCampaignId,
      this.amount
    );

    // Campaign info

    const campaign = await this.fuulProject.campaigns(this.nativeCampaignId);

    expect(campaign.totalDeposited).to.equal(this.amount);
    expect(campaign.currentBudget).to.equal(0);

    // Balance
    const balance = await this.provider.getBalance(this.fuulProject.address);

    await expect(balance).to.equal(0);
  });

  it("Fail to deposit if campaign does not exist", async function () {
    const campaignId = 10;

    await expect(
      this.fuulProject.depositFungibleToken(campaignId, 0, {
        value: this.amount,
      })
    )
      .to.be.revertedWithCustomError(this.fuulProject, "CampaignNotExists")
      .withArgs(campaignId);
  });

  it("Fail to remove if not deactivated or cooldown is not over", async function () {
    // Remove before deactivating

    await expect(
      this.fuulProject.removeFungibleBudget(this.nativeCampaignId, this.amount)
    )
      .to.be.revertedWithCustomError(this.fuulProject, "CampaignNotInactive")
      .withArgs(this.nativeCampaignId);

    // Remove before cooldown is complete
    await this.fuulProject.deactivateCampaign(this.nativeCampaignId);

    await expect(
      this.fuulProject.removeFungibleBudget(this.nativeCampaignId, this.amount)
    ).to.be.revertedWithCustomError(
      this.fuulProject,
      "CooldownPeriodNotFinished"
    );
  });

  it("Should deposit correctly & set correct values with currency != 0x", async function () {
    // Approve
    await this.token.approve(
      this.fuulProject.address,
      ethers.utils.parseEther("40000000")
    );

    await expect(
      this.fuulProject.depositFungibleToken(this.erc20CampaignId, this.amount)
    )
      .to.emit(this.fuulProject, "BudgetDeposited")
      .withArgs(
        this.user1.address,
        this.amount,
        this.token.address,
        this.erc20CampaignId,
        1,
        [],
        []
      );

    // Campaign info

    const campaign = await this.fuulProject.campaigns(this.erc20CampaignId);

    expect(campaign.totalDeposited).to.equal(this.amount);
    expect(campaign.currentBudget).to.equal(this.amount);

    // Balance
    const balance = await this.token.balanceOf(this.fuulProject.address);

    await expect(balance).to.equal(this.amount);
  });

  it("Should remove correctly & set correct values with currency != 0x", async function () {
    // Approve
    await this.token.approve(
      this.fuulProject.address,
      ethers.utils.parseEther("40000000")
    );

    // Deposit
    await this.fuulProject.depositFungibleToken(
      this.erc20CampaignId,
      this.amount
    );

    // Deactivate campaign
    await this.fuulProject.deactivateCampaign(this.erc20CampaignId);

    // Increase time

    const campaignBudgetCooldown =
      await this.fuulManager.campaignBudgetCooldown();

    await time.increase(campaignBudgetCooldown.toNumber() + 1);

    // Remove
    await this.fuulProject.removeFungibleBudget(
      this.erc20CampaignId,
      this.amount
    );

    // Campaign info

    const campaign = await this.fuulProject.campaigns(this.erc20CampaignId);

    expect(campaign.totalDeposited).to.equal(this.amount);
    expect(campaign.currentBudget).to.equal(0);

    // Balance
    const balance = await this.token.balanceOf(this.fuulProject.address);

    await expect(balance).to.equal(0);
  });

  it("Should fail to deposit and remove if not admin role", async function () {
    const error = `AccessControl: account ${this.user2.address.toLowerCase()} is missing role ${
      this.adminRole
    }`;

    await expect(
      this.fuulProject
        .connect(this.user2)
        .depositFungibleToken(this.erc20CampaignId, this.amount)
    ).to.be.revertedWith(error);

    await expect(
      this.fuulProject
        .connect(this.user2)
        .removeFungibleBudget(this.erc20CampaignId, this.amount)
    ).to.be.revertedWith(error);
  });

  it("Should fail to deposit and remove if funds are freezed from Fuul Manager", async function () {
    await this.fuulManager.pauseAll();

    await expect(
      this.fuulProject.depositFungibleToken(this.erc20CampaignId, this.amount)
    ).to.be.revertedWithCustomError(this.fuulProject, "ManagerIsPaused");

    await expect(
      this.fuulProject.removeFungibleBudget(this.erc20CampaignId, this.amount)
    ).to.be.revertedWithCustomError(this.fuulProject, "ManagerIsPaused");
  });
});

describe("Fuul Project - Deposit and remove NFT 721", function () {
  beforeEach(async function () {
    const { fuulProject, fuulManager, nft721, user1, user2, adminRole } =
      await setupTest();

    this.fuulProject = fuulProject;
    this.fuulManager = fuulManager;
    this.nft721 = nft721;
    this.user1 = user1;
    this.user2 = user2;
    this.adminRole = adminRole;

    this.campaignURI = "campaignURI";

    // Add token

    this.tokenType = 2;

    await this.fuulManager.addCurrencyToken(
      nft721.address,
      this.tokenType,
      100
    );

    await this.fuulProject.createCampaign(
      this.campaignURI,
      this.nft721.address
    );

    this.campaignId = 1;

    this.rewardTokenIds = [1, 2, 3, 4];

    // Approve
    await this.nft721.setApprovalForAll(this.fuulProject.address, true);
  });

  it("Should deposit correctly & set correct values", async function () {
    await expect(
      this.fuulProject.depositNFTToken(this.campaignId, this.rewardTokenIds, [])
    )
      .to.emit(this.fuulProject, "BudgetDeposited")
      .withArgs(
        this.user1.address,
        this.rewardTokenIds.length,
        this.nft721.address,
        this.campaignId,
        this.tokenType,
        this.rewardTokenIds,
        []
      );

    // Campaign info

    const campaign = await this.fuulProject.campaigns(this.campaignId);

    expect(campaign.totalDeposited).to.equal(this.rewardTokenIds.length);
    expect(campaign.currentBudget).to.equal(this.rewardTokenIds.length);

    // Balance
    const balance = await this.nft721.balanceOf(this.fuulProject.address);

    await expect(balance).to.equal(this.rewardTokenIds.length);
  });

  it("Should remove correctly & set correct values", async function () {
    // Deposit
    await this.fuulProject.depositNFTToken(
      this.campaignId,
      this.rewardTokenIds,
      []
    );

    // Deactivate campaign
    await this.fuulProject.deactivateCampaign(this.campaignId);

    // Increase time

    const campaignBudgetCooldown =
      await this.fuulManager.campaignBudgetCooldown();

    await time.increase(campaignBudgetCooldown.toNumber() + 1);

    // Remove
    await this.fuulProject.removeNFTBudget(
      this.campaignId,
      this.rewardTokenIds,
      []
    );

    // Campaign info

    const campaign = await this.fuulProject.campaigns(this.campaignId);

    expect(campaign.totalDeposited).to.equal(this.rewardTokenIds.length);
    expect(campaign.currentBudget).to.equal(0);

    // Balance
    const balance = await this.nft721.balanceOf(this.fuulProject.address);

    await expect(balance).to.equal(0);
  });

  it("Fail to deposit if campaign does not exist", async function () {
    const campaignId = 10;

    await expect(
      this.fuulProject.depositNFTToken(campaignId, this.rewardTokenIds, [])
    )
      .to.be.revertedWithCustomError(this.fuulProject, "CampaignNotExists")
      .withArgs(campaignId);
  });

  it("Fail to remove if not deactivated or cooldown is not over", async function () {
    // Remove before deactivating

    await expect(
      this.fuulProject.removeNFTBudget(this.campaignId, this.rewardTokenIds, [])
    )
      .to.be.revertedWithCustomError(this.fuulProject, "CampaignNotInactive")
      .withArgs(this.campaignId);

    // Remove before cooldown is complete
    await this.fuulProject.deactivateCampaign(this.campaignId);

    await expect(
      this.fuulProject.removeNFTBudget(this.campaignId, this.rewardTokenIds, [])
    ).to.be.revertedWithCustomError(
      this.fuulProject,
      "CooldownPeriodNotFinished"
    );
  });

  it("Should fail to deposit and remove if not admin role", async function () {
    const error = `AccessControl: account ${this.user2.address.toLowerCase()} is missing role ${
      this.adminRole
    }`;

    await expect(
      this.fuulProject
        .connect(this.user2)
        .depositNFTToken(this.campaignId, this.rewardTokenIds, [])
    ).to.be.revertedWith(error);

    await expect(
      this.fuulProject
        .connect(this.user2)
        .removeNFTBudget(this.campaignId, this.rewardTokenIds, [])
    ).to.be.revertedWith(error);
  });

  it("Should fail to deposit and remove if funds are freezed from Fuul Manager", async function () {
    await this.fuulManager.pauseAll();

    await expect(
      this.fuulProject.depositNFTToken(this.campaignId, this.rewardTokenIds, [])
    ).to.be.revertedWithCustomError(this.fuulProject, "ManagerIsPaused");

    await expect(
      this.fuulProject.removeNFTBudget(this.campaignId, this.rewardTokenIds, [])
    ).to.be.revertedWithCustomError(this.fuulProject, "ManagerIsPaused");
  });
});

describe("Fuul Project - Deposit and remove NFT 1155", function () {
  beforeEach(async function () {
    const { fuulProject, fuulManager, nft1155, user1, user2, adminRole } =
      await setupTest();

    this.fuulProject = fuulProject;
    this.fuulManager = fuulManager;
    this.nft1155 = nft1155;
    this.user1 = user1;
    this.user2 = user2;
    this.adminRole = adminRole;

    this.campaignURI = "campaignURI";

    // Add token
    this.tokenType = 3;

    await this.fuulManager.addCurrencyToken(
      nft1155.address,
      this.tokenType,
      100
    );

    await this.fuulProject.createCampaign(
      this.campaignURI,
      this.nft1155.address
    );

    this.campaignId = 1;

    this.rewardTokenIds = [1, 2, 3, 4];

    this.amounts = [1, 2, 1, 2];

    this.tokenAmount = this.amounts.reduce(function (a, b) {
      return a + b;
    });

    // Approve
    await this.nft1155.setApprovalForAll(this.fuulProject.address, true);
  });

  it("Should deposit correctly & set correct values", async function () {
    await expect(
      this.fuulProject.depositNFTToken(
        this.campaignId,
        this.rewardTokenIds,
        this.amounts
      )
    )
      .to.emit(this.fuulProject, "BudgetDeposited")
      .withArgs(
        this.user1.address,
        this.tokenAmount,
        this.nft1155.address,
        this.campaignId,
        this.tokenType,
        this.rewardTokenIds,
        this.amounts
      );

    // Campaign info

    const campaign = await this.fuulProject.campaigns(this.campaignId);

    expect(campaign.totalDeposited).to.equal(this.tokenAmount);
    expect(campaign.currentBudget).to.equal(this.tokenAmount);

    // Balance
    for (i = 0; i < this.rewardTokenIds.length; i++) {
      let tokenId = this.rewardTokenIds[i];
      let amount = this.amounts[i];

      expect(
        await this.nft1155.balanceOf(this.fuulProject.address, tokenId)
      ).to.equal(amount);
    }
  });

  it("Should remove correctly & set correct values", async function () {
    // Deposit
    await this.fuulProject.depositNFTToken(
      this.campaignId,
      this.rewardTokenIds,
      this.amounts
    );

    // Deactivate campaign
    await this.fuulProject.deactivateCampaign(this.campaignId);

    // Increase time

    const campaignBudgetCooldown =
      await this.fuulManager.campaignBudgetCooldown();

    await time.increase(campaignBudgetCooldown.toNumber() + 1);

    // Remove
    await this.fuulProject.removeNFTBudget(
      this.campaignId,
      this.rewardTokenIds,
      this.amounts
    );

    // Campaign info

    const campaign = await this.fuulProject.campaigns(this.campaignId);

    expect(campaign.totalDeposited).to.equal(this.tokenAmount);
    expect(campaign.currentBudget).to.equal(0);

    // Balance
    for (i = 0; i < this.rewardTokenIds.length; i++) {
      let tokenId = this.rewardTokenIds[i];

      expect(
        await this.nft1155.balanceOf(this.fuulProject.address, tokenId)
      ).to.equal(0);
    }
  });
});

describe("Fuul Project - Claim", function () {
  beforeEach(async function () {
    const { fuulProject, fuulManager, user1 } = await setupTest();

    this.fuulProject = fuulProject;
    this.fuulManager = fuulManager;
    this.user1 = user1;
  });

  it("Fail to claim and emergency withdraw if sender is not Fuul Manager", async function () {
    const voucher = {
      voucherId: "1",
      projectAddress: this.fuulProject.address,
      campaignId: 1,
      currency: ethers.constants.AddressZero,
      tokenType: 0,
      account: this.fuulProject.address,
      amount: 1,
      tokenIds: [],
      amounts: [],
      deadline: 123,
    };

    await expect(this.fuulProject.claimFromCampaign(voucher))
      .to.be.revertedWithCustomError(this.fuulProject, "Unauthorized")
      .withArgs(this.user1.address, this.fuulManager.address);

    await expect(
      this.fuulProject.emergencyWithdrawFungibleTokens(
        this.fuulProject.address,
        ethers.constants.AddressZero
      )
    )
      .to.be.revertedWithCustomError(this.fuulProject, "Unauthorized")
      .withArgs(this.user1.address, this.fuulManager.address);

    await expect(
      this.fuulProject.emergencyWithdrawNFTTokens(
        this.fuulProject.address,
        ethers.constants.AddressZero,
        [],
        []
      )
    )
      .to.be.revertedWithCustomError(this.fuulProject, "Unauthorized")
      .withArgs(this.user1.address, this.fuulManager.address);
  });
});
