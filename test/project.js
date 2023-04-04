const { expect } = require("chai");

const { setupTest } = require("./before-each-test");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Fuul Project - Set new signer", function () {
  beforeEach(async function () {
    const { fuulProject, user1, user2, adminRole } = await setupTest();

    this.fuulProject = fuulProject;
    this.user1 = user1;
    this.user2 = user2;
    this.adminRole = adminRole;
  });

  it("Should change Project signer address", async function () {
    const newValue = this.user1.address;
    await this.fuulProject.setProjectEventSigner(newValue);
    expect(await this.fuulProject.projectEventSigner()).to.equal(newValue);
  });

  it("Should fail to set new Project signer address if not admin role", async function () {
    const error = `AccessControl: account ${this.user2.address.toLowerCase()} is missing role ${
      this.adminRole
    }`;

    await expect(
      this.fuulProject
        .connect(this.user2)
        .setProjectEventSigner(this.user2.address)
    ).to.be.revertedWith(error);
  });
});

describe("Fuul Project - Campaign management", function () {
  beforeEach(async function () {
    const { fuulProject, token, user1, user2, adminRole } = await setupTest();

    this.fuulProject = fuulProject;
    this.token = token;
    this.user1 = user1;
    this.user2 = user2;
    this.adminRole = adminRole;

    this.tokenURI = "tokenURI";
  });

  it("Should create campaign with correct data", async function () {
    expect(
      await this.fuulProject.createCampaign(this.tokenURI, this.token.address)
    )
      .to.emit(this.fuulProject, "CampaignCreated")
      .withArgs(this.user1.address, this.token.address, 1, 1);

    const tokenId = 1;

    // Token Info
    expect(await this.fuulProject.ownerOf(tokenId)).to.equal(
      this.fuulProject.address
    );

    expect(await this.fuulProject.tokenURI(tokenId)).to.equal(this.tokenURI);

    // Campaign info
    expect(await this.fuulProject.campaignsCreated()).to.equal(1);

    const campaign = await this.fuulProject.campaignBalances(tokenId);

    expect(campaign.currency).to.equal(this.token.address);
    expect(campaign.deactivatedAt).to.equal(0);
  });

  it("Should deactivate and reactivate campaign", async function () {
    await this.fuulProject.createCampaign(this.tokenURI, this.token.address);

    const tokenId = 1;

    // Deactivate campaign
    await this.fuulProject.deactivateCampaign(1);

    const deactivatedCampaign = await this.fuulProject.campaignBalances(
      tokenId
    );

    const deactvatedAt = Number(deactivatedCampaign.deactivatedAt);

    expect(deactvatedAt).to.be.greaterThan(0);

    // Reactivate campaign
    await this.fuulProject.reactivateCampaign(1);

    const reactivatedCampaign = await this.fuulProject.campaignBalances(
      tokenId
    );

    expect(reactivatedCampaign.deactivatedAt).to.equal(0);
  });

  it("Should fail to create, activate and deactivate campaign and set tokenURI if not admin role", async function () {
    const error = `AccessControl: account ${this.user2.address.toLowerCase()} is missing role ${
      this.adminRole
    }`;

    await expect(
      this.fuulProject
        .connect(this.user2)
        .createCampaign(this.tokenURI, this.token.address)
    ).to.be.revertedWith(error);

    // Create campaign
    await this.fuulProject.createCampaign(this.tokenURI, this.token.address);

    await expect(
      this.fuulProject.connect(this.user2).setTokenURI(1, this.tokenURI)
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

    this.tokenURI = "tokenURI";

    await this.fuulProject.createCampaign(this.tokenURI, this.token.address);
    await this.fuulProject.createCampaign(
      this.tokenURI,
      ethers.constants.AddressZero
    );

    this.erc20CampaignTokenId = 1;
    this.nativeCampaignTokenId = 2;

    this.amount = ethers.utils.parseEther("1000");
  });

  it("Should deposit correctly & set correct values with currency = 0x", async function () {
    await expect(
      this.fuulProject.depositFungibleToken(this.nativeCampaignTokenId, 0, {
        value: this.amount,
      })
    )
      .to.emit(this.fuulProject, "BudgetDeposited")
      .withArgs(
        this.user1.address,
        this.amount,
        ethers.constants.AddressZero,
        this.nativeCampaignTokenId,
        0,
        [],
        []
      );

    // Campaign info

    const campaign = await this.fuulProject.campaignBalances(
      this.nativeCampaignTokenId
    );

    expect(campaign.totalDeposited).to.equal(this.amount);
    expect(campaign.currentBudget).to.equal(this.amount);

    // Balance
    const balance = await this.provider.getBalance(this.fuulProject.address);

    await expect(balance).to.equal(this.amount);
  });

  it("Should remove correctly & set correct values with currency = 0x", async function () {
    // Deposit
    await this.fuulProject.depositFungibleToken(this.nativeCampaignTokenId, 0, {
      value: this.amount,
    });

    // Deactivate campaign
    await this.fuulProject.deactivateCampaign(this.nativeCampaignTokenId);

    // Increase time

    const campaignBudgetCooldown =
      await this.fuulManager.campaignBudgetCooldown();

    await time.increase(campaignBudgetCooldown.toNumber() + 1);

    // Remove
    await this.fuulProject.removeFungibleBudget(
      this.nativeCampaignTokenId,
      this.amount
    );

    // Campaign info

    const campaign = await this.fuulProject.campaignBalances(
      this.nativeCampaignTokenId
    );

    expect(campaign.totalDeposited).to.equal(this.amount);
    expect(campaign.currentBudget).to.equal(0);

    // Balance
    const balance = await this.provider.getBalance(this.fuulProject.address);

    await expect(balance).to.equal(0);
  });

  it("Fail to remove if not deactivated or cooldown is not over", async function () {
    // Remove before deactivating

    await expect(
      this.fuulProject.removeFungibleBudget(
        this.nativeCampaignTokenId,
        this.amount
      )
    ).to.be.revertedWith("Campaign is active. Please deactivate it first");

    // Remove before cooldown is complete
    await this.fuulProject.deactivateCampaign(this.nativeCampaignTokenId);

    await expect(
      this.fuulProject.removeFungibleBudget(
        this.nativeCampaignTokenId,
        this.amount
      )
    ).to.be.revertedWith("Cooldown period not finished");
  });

  it("Should deposit correctly & set correct values with currency != 0x", async function () {
    // Approve
    await this.token.approve(
      this.fuulProject.address,
      ethers.utils.parseEther("40000000")
    );

    await expect(
      this.fuulProject.depositFungibleToken(
        this.erc20CampaignTokenId,
        this.amount
      )
    )
      .to.emit(this.fuulProject, "BudgetDeposited")
      .withArgs(
        this.user1.address,
        this.amount,
        this.token.address,
        this.erc20CampaignTokenId,
        1,
        [],
        []
      );

    // Campaign info

    const campaign = await this.fuulProject.campaignBalances(
      this.erc20CampaignTokenId
    );

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
      this.erc20CampaignTokenId,
      this.amount
    );

    // Deactivate campaign
    await this.fuulProject.deactivateCampaign(this.erc20CampaignTokenId);

    // Increase time

    const campaignBudgetCooldown =
      await this.fuulManager.campaignBudgetCooldown();

    await time.increase(campaignBudgetCooldown.toNumber() + 1);

    // Remove
    await this.fuulProject.removeFungibleBudget(
      this.erc20CampaignTokenId,
      this.amount
    );

    // Campaign info

    const campaign = await this.fuulProject.campaignBalances(
      this.erc20CampaignTokenId
    );

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
        .depositFungibleToken(this.erc20CampaignTokenId, this.amount)
    ).to.be.revertedWith(error);

    await expect(
      this.fuulProject
        .connect(this.user2)
        .removeFungibleBudget(this.erc20CampaignTokenId, this.amount)
    ).to.be.revertedWith(error);
  });

  it("Should fail to deposit and remove if funds are freezed from Fuul Manager", async function () {
    await this.fuulManager.pauseAll();

    await expect(
      this.fuulProject.depositFungibleToken(
        this.erc20CampaignTokenId,
        this.amount
      )
    ).to.be.revertedWith("Manager paused all");

    await expect(
      this.fuulProject.removeFungibleBudget(
        this.erc20CampaignTokenId,
        this.amount
      )
    ).to.be.revertedWith("Manager paused all");
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

    this.tokenURI = "tokenURI";

    // Add token

    this.tokenType = 2;

    await this.fuulManager.addCurrencyToken(
      nft721.address,
      this.tokenType,
      100
    );

    await this.fuulProject.createCampaign(this.tokenURI, this.nft721.address);

    this.campaignTokenId = 1;

    this.rewardTokenIds = [1, 2, 3, 4];

    // Approve
    await this.nft721.setApprovalForAll(this.fuulProject.address, true);
  });

  it("Should deposit correctly & set correct values", async function () {
    await expect(
      this.fuulProject.depositNFTToken(
        this.campaignTokenId,
        this.rewardTokenIds,
        []
      )
    )
      .to.emit(this.fuulProject, "BudgetDeposited")
      .withArgs(
        this.user1.address,
        this.rewardTokenIds.length,
        this.nft721.address,
        this.campaignTokenId,
        this.tokenType,
        this.rewardTokenIds,
        []
      );

    // Campaign info

    const campaign = await this.fuulProject.campaignBalances(
      this.campaignTokenId
    );

    expect(campaign.totalDeposited).to.equal(this.rewardTokenIds.length);
    expect(campaign.currentBudget).to.equal(this.rewardTokenIds.length);

    // Balance
    const balance = await this.nft721.balanceOf(this.fuulProject.address);

    await expect(balance).to.equal(this.rewardTokenIds.length);
  });

  it("Should remove correctly & set correct values", async function () {
    // Deposit
    await this.fuulProject.depositNFTToken(
      this.campaignTokenId,
      this.rewardTokenIds,
      []
    );

    // Deactivate campaign
    await this.fuulProject.deactivateCampaign(this.campaignTokenId);

    // Increase time

    const campaignBudgetCooldown =
      await this.fuulManager.campaignBudgetCooldown();

    await time.increase(campaignBudgetCooldown.toNumber() + 1);

    // Remove
    await this.fuulProject.removeNFTBudget(
      this.campaignTokenId,
      this.rewardTokenIds,
      []
    );

    // Campaign info

    const campaign = await this.fuulProject.campaignBalances(
      this.campaignTokenId
    );

    expect(campaign.totalDeposited).to.equal(this.rewardTokenIds.length);
    expect(campaign.currentBudget).to.equal(0);

    // Balance
    const balance = await this.nft721.balanceOf(this.fuulProject.address);

    await expect(balance).to.equal(0);
  });

  it("Fail to remove if not deactivated or cooldown is not over", async function () {
    // Remove before deactivating

    await expect(
      this.fuulProject.removeNFTBudget(
        this.campaignTokenId,
        this.rewardTokenIds,
        []
      )
    ).to.be.revertedWith("Campaign is active. Please deactivate it first");

    // Remove before cooldown is complete
    await this.fuulProject.deactivateCampaign(this.campaignTokenId);

    await expect(
      this.fuulProject.removeNFTBudget(
        this.campaignTokenId,
        this.rewardTokenIds,
        []
      )
    ).to.be.revertedWith("Cooldown period not finished");
  });

  it("Should fail to deposit and remove if not admin role", async function () {
    const error = `AccessControl: account ${this.user2.address.toLowerCase()} is missing role ${
      this.adminRole
    }`;

    await expect(
      this.fuulProject
        .connect(this.user2)
        .depositNFTToken(this.campaignTokenId, this.rewardTokenIds, [])
    ).to.be.revertedWith(error);

    await expect(
      this.fuulProject
        .connect(this.user2)
        .removeNFTBudget(this.campaignTokenId, this.rewardTokenIds, [])
    ).to.be.revertedWith(error);
  });

  it("Should fail to deposit and remove if funds are freezed from Fuul Manager", async function () {
    await this.fuulManager.pauseAll();

    await expect(
      this.fuulProject.depositNFTToken(
        this.campaignTokenId,
        this.rewardTokenIds,
        []
      )
    ).to.be.revertedWith("Manager paused all");

    await expect(
      this.fuulProject.removeNFTBudget(
        this.campaignTokenId,
        this.rewardTokenIds,
        []
      )
    ).to.be.revertedWith("Manager paused all");
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

    this.tokenURI = "tokenURI";

    // Add token
    this.tokenType = 3;

    await this.fuulManager.addCurrencyToken(
      nft1155.address,
      this.tokenType,
      100
    );

    await this.fuulProject.createCampaign(this.tokenURI, this.nft1155.address);

    this.campaignTokenId = 1;

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
        this.campaignTokenId,
        this.rewardTokenIds,
        this.amounts
      )
    )
      .to.emit(this.fuulProject, "BudgetDeposited")
      .withArgs(
        this.user1.address,
        this.tokenAmount,
        this.nft1155.address,
        this.campaignTokenId,
        this.tokenType,
        this.rewardTokenIds,
        this.amounts
      );

    // Campaign info

    const campaign = await this.fuulProject.campaignBalances(
      this.campaignTokenId
    );

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
      this.campaignTokenId,
      this.rewardTokenIds,
      this.amounts
    );

    // Deactivate campaign
    await this.fuulProject.deactivateCampaign(this.campaignTokenId);

    // Increase time

    const campaignBudgetCooldown =
      await this.fuulManager.campaignBudgetCooldown();

    await time.increase(campaignBudgetCooldown.toNumber() + 1);

    // Remove
    await this.fuulProject.removeNFTBudget(
      this.campaignTokenId,
      this.rewardTokenIds,
      this.amounts
    );

    // Campaign info

    const campaign = await this.fuulProject.campaignBalances(
      this.campaignTokenId
    );

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

  it("Fail to remove if not deactivated or cooldown is not over", async function () {
    // Remove before deactivating

    await expect(
      this.fuulProject.removeNFTBudget(
        this.campaignTokenId,
        this.rewardTokenIds,
        this.amounts
      )
    ).to.be.revertedWith("Campaign is active. Please deactivate it first");

    // Remove before cooldown is complete
    await this.fuulProject.deactivateCampaign(this.campaignTokenId);

    await expect(
      this.fuulProject.removeNFTBudget(
        this.campaignTokenId,
        this.rewardTokenIds,
        this.amounts
      )
    ).to.be.revertedWith("Cooldown period not finished");
  });
});

describe("Fuul Project - Claim", function () {
  beforeEach(async function () {
    const { fuulProject } = await setupTest();

    this.fuulProject = fuulProject;
  });

  it("Fail to claim if sender is not Fuul Manager", async function () {
    const voucher = {
      voucherId: "1",
      projectAddress: this.fuulProject.address,
      campaignTokenId: 1,
      currency: ethers.constants.AddressZero,
      tokenType: 0,
      account: this.fuulProject.address,
      amount: 1,
      rewardTokenIds: [],
      amounts: [],
      deadline: 123,
    };

    await expect(
      this.fuulProject.claimFromCampaign(voucher)
    ).to.be.revertedWith("Only Fuul manager can claim");
  });

  it("Fail to emergency withdraw if sender is not Fuul Manager", async function () {
    await expect(
      this.fuulProject.emergencyWithdrawFungibleTokens(
        this.fuulProject.address,
        ethers.constants.AddressZero
      )
    ).to.be.revertedWith("Only Fuul manager can withdraw");

    await expect(
      this.fuulProject.emergencyWithdrawNFTTokens(
        this.fuulProject.address,
        ethers.constants.AddressZero,
        [],
        []
      )
    ).to.be.revertedWith("Only Fuul manager can withdraw");
  });
});
