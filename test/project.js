const { expect } = require("chai");

const { setupTest } = require("./before-each-test");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Fuul Project - Admin variables", function () {
  beforeEach(async function () {
    const { fuulProject, adminRole, user2 } = await setupTest();

    this.fuulProject = fuulProject;
    this.user2 = user2;
    this.adminRole = adminRole;

    this.projectURI = "newProjectURI";
  });

  it("Should set new project URI", async function () {
    expect(await this.fuulProject.setProjectURI(this.projectURI))
      .to.emit(this.fuulProject, "ProjectInfoUpdated")
      .withArgs(this.projectURI);

    expect(await this.fuulProject.projectInfoURI()).to.equal(this.projectURI);
  });

  it("Should set variable after applying to remove", async function () {
    await this.fuulProject.applyToRemoveBudget();

    const lastApplication = await this.fuulProject.lastRemovalApplication();
    expect(lastApplication.toNumber()).to.be.greaterThan(0);
  });

  it("Should fail to set new project uri and apply to remove if not admin role", async function () {
    const error = `AccessControl: account ${this.user2.address.toLowerCase()} is missing role ${
      this.adminRole
    }`;

    await expect(
      this.fuulProject.connect(this.user2).setProjectURI(this.projectURI)
    ).to.be.revertedWith(error);

    await expect(
      this.fuulProject.connect(this.user2).applyToRemoveBudget()
    ).to.be.revertedWith(error);
  });
});

describe("Fuul Project - Deposit and remove fungible", function () {
  beforeEach(async function () {
    const {
      fuulProject,
      fuulFactory,
      token,
      user1,
      user2,
      adminRole,
      provider,
    } = await setupTest();

    this.fuulProject = fuulProject;
    this.fuulFactory = fuulFactory;
    this.token = token;
    this.user1 = user1;
    this.user2 = user2;
    this.adminRole = adminRole;
    this.provider = provider;

    this.amount = ethers.utils.parseEther("1000");
  });

  it("Should deposit correctly & set correct values with currency = 0x", async function () {
    await expect(
      this.fuulProject.depositFungibleToken(
        ethers.constants.AddressZero,
        this.amount,
        {
          value: this.amount,
        }
      )
    )
      .to.emit(this.fuulProject, "FungibleBudgetDeposited")
      .withArgs(this.user1.address, this.amount, ethers.constants.AddressZero);

    // Budget info

    expect(
      await this.fuulProject.budgets(ethers.constants.AddressZero)
    ).to.equal(this.amount);

    // Balance
    const balance = await this.provider.getBalance(this.fuulProject.address);

    await expect(balance).to.equal(this.amount);
  });

  it("Should remove correctly & set correct values with currency = 0x", async function () {
    // Deposit
    await this.fuulProject.depositFungibleToken(
      ethers.constants.AddressZero,
      this.amount,
      {
        value: this.amount,
      }
    );

    // Apply to remove
    await this.fuulProject.applyToRemoveBudget();

    // Increase time

    const projectBudgetCooldown =
      await this.fuulFactory.projectBudgetCooldown();

    await time.increase(projectBudgetCooldown.toNumber() + 1);

    // Remove
    await expect(
      this.fuulProject.removeFungibleBudget(
        ethers.constants.AddressZero,
        this.amount
      )
    )
      .to.emit(this.fuulProject, "FungibleBudgetRemoved")
      .withArgs(this.user1.address, this.amount, ethers.constants.AddressZero);

    // Budget info

    expect(
      await this.fuulProject.budgets(ethers.constants.AddressZero)
    ).to.equal(0);

    // Balance
    const balance = await this.provider.getBalance(this.fuulProject.address);

    await expect(balance).to.equal(0);
  });

  it("Fail to deposit if token is not accepted", async function () {
    const token = this.user2.address;

    await expect(
      this.fuulProject.depositFungibleToken(token, this.amount)
    ).to.be.revertedWithCustomError(
      this.fuulProject,
      "TokenCurrencyNotAccepted"
    );
  });

  it("Fail to remove if not applied or cooldown is not over, or removal window ended", async function () {
    // Remove before applying

    await expect(
      this.fuulProject.removeFungibleBudget(this.token.address, this.amount)
    ).to.be.revertedWithCustomError(this.fuulProject, "NoRemovalApplication");

    // Remove before cooldown is complete
    await this.fuulProject.applyToRemoveBudget();

    await expect(
      this.fuulProject.removeFungibleBudget(this.token.address, this.amount)
    ).to.be.revertedWithCustomError(this.fuulProject, "OutsideRemovalWindow");

    // Remove outside window
    const removeInfo = await this.fuulFactory.getBudgetRemoveInfo();

    await time.increase(
      removeInfo[0].toNumber() + removeInfo[1].toNumber() + 1
    );

    await expect(
      this.fuulProject.removeFungibleBudget(this.token.address, this.amount)
    ).to.be.revertedWithCustomError(this.fuulProject, "OutsideRemovalWindow");
  });

  it("Should deposit correctly & set correct values with currency != 0x", async function () {
    // Approve
    await this.token.approve(
      this.fuulProject.address,
      ethers.utils.parseEther("40000000")
    );

    await expect(
      this.fuulProject.depositFungibleToken(this.token.address, this.amount)
    )
      .to.emit(this.fuulProject, "FungibleBudgetDeposited")
      .withArgs(this.user1.address, this.amount, this.token.address);

    // Budget info

    expect(await this.fuulProject.budgets(this.token.address)).to.equal(
      this.amount
    );

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
      this.token.address,
      this.amount
    );

    // Apply to remove
    await this.fuulProject.applyToRemoveBudget();

    // Increase time

    const projectBudgetCooldown =
      await this.fuulFactory.projectBudgetCooldown();

    await time.increase(projectBudgetCooldown.toNumber() + 1);

    // Remove
    await this.fuulProject.removeFungibleBudget(
      this.token.address,
      this.amount
    );

    // Budget info
    expect(await this.fuulProject.budgets(this.token.address)).to.equal(0);

    // Balance
    const balance = await this.token.balanceOf(this.fuulProject.address);

    await expect(balance).to.equal(0);
  });

  it("Should remove correctly & set correct values after removing token currency", async function () {
    // Approve
    await this.token.approve(
      this.fuulProject.address,
      ethers.utils.parseEther("40000000")
    );

    // Deposit
    await this.fuulProject.depositFungibleToken(
      this.token.address,
      this.amount
    );

    // Remove token currency
    await this.fuulFactory.removeCurrencyToken(this.token.address);

    // Apply to remove
    await this.fuulProject.applyToRemoveBudget();

    // Increase time

    const projectBudgetCooldown =
      await this.fuulFactory.projectBudgetCooldown();

    await time.increase(projectBudgetCooldown.toNumber() + 1);

    // Remove
    await this.fuulProject.removeFungibleBudget(
      this.token.address,
      this.amount
    );

    // Budget info
    expect(await this.fuulProject.budgets(this.token.address)).to.equal(0);

    // Balance
    const balance = await this.token.balanceOf(this.fuulProject.address);

    await expect(balance).to.equal(0);
  });

  it("Should fail to deposit with amount equals to zero", async function () {
    await expect(
      this.fuulProject.depositFungibleToken(this.token.address, 0)
    ).to.be.revertedWithCustomError(this.fuulProject, "ZeroAmount");
  });

  it("Should fail to deposit native token if amount differs to msg.value", async function () {
    await expect(
      this.fuulProject.depositFungibleToken(
        ethers.constants.AddressZero,
        this.amount
      )
    ).to.be.revertedWithCustomError(this.fuulProject, "IncorrectMsgValue");
  });

  it("Should fail to deposit and remove if not admin role", async function () {
    const error = `AccessControl: account ${this.user2.address.toLowerCase()} is missing role ${
      this.adminRole
    }`;

    await expect(
      this.fuulProject
        .connect(this.user2)
        .depositFungibleToken(this.token.address, this.amount)
    ).to.be.revertedWith(error);
  });

  it("Should fail to deposit if token currency is removed", async function () {
    await this.fuulFactory.removeCurrencyToken(this.token.address);
    await expect(
      this.fuulProject.depositFungibleToken(this.token.address, this.amount)
    ).to.be.revertedWithCustomError(
      this.fuulProject,
      "TokenCurrencyNotAccepted"
    );
  });
});

describe("Fuul Project - Deposit and remove NFT 721", function () {
  beforeEach(async function () {
    const { fuulProject, fuulFactory, nft721, user1, user2, adminRole } =
      await setupTest();

    this.fuulProject = fuulProject;
    this.fuulFactory = fuulFactory;
    this.nft721 = nft721;
    this.user1 = user1;
    this.user2 = user2;
    this.adminRole = adminRole;

    // Add token

    await this.fuulFactory.addCurrencyToken(nft721.address, 2);

    this.tokenIds = [1, 2, 3, 4];

    // Approve
    await this.nft721.setApprovalForAll(this.fuulProject.address, true);
  });

  it("Should deposit correctly & set correct values", async function () {
    await expect(
      this.fuulProject.depositNFTToken(this.nft721.address, this.tokenIds, [])
    )
      .to.emit(this.fuulProject, "ERC721BudgetDeposited")
      .withArgs(
        this.user1.address,
        this.tokenIds.length,
        this.nft721.address,
        this.tokenIds
      );

    // Budget info
    expect(await this.fuulProject.budgets(this.nft721.address)).to.equal(
      this.tokenIds.length
    );

    // Balance
    const balance = await this.nft721.balanceOf(this.fuulProject.address);

    await expect(balance).to.equal(this.tokenIds.length);
  });

  it("Should remove correctly & set correct values", async function () {
    // Deposit
    await this.fuulProject.depositNFTToken(
      this.nft721.address,
      this.tokenIds,
      []
    );

    // Apply to remove
    await this.fuulProject.applyToRemoveBudget();

    // Increase time

    const projectBudgetCooldown =
      await this.fuulFactory.projectBudgetCooldown();

    await time.increase(projectBudgetCooldown.toNumber() + 1);

    // Remove
    // Remove
    await expect(
      this.fuulProject.removeNFTBudget(this.nft721.address, this.tokenIds, [])
    )
      .to.emit(this.fuulProject, "ERC721BudgetRemoved")
      .withArgs(
        this.user1.address,
        this.tokenIds.length,
        this.nft721.address,
        this.tokenIds
      );

    // Budget info
    expect(await this.fuulProject.budgets(this.nft721.address)).to.equal(0);

    // Balance
    const balance = await this.nft721.balanceOf(this.fuulProject.address);

    await expect(balance).to.equal(0);
  });

  it("Should remove correctly & set correct values after token removed", async function () {
    // Deposit
    await this.fuulProject.depositNFTToken(
      this.nft721.address,
      this.tokenIds,
      []
    );

    // Remove token
    await this.fuulFactory.removeCurrencyToken(this.nft721.address);

    // Apply to remove
    await this.fuulProject.applyToRemoveBudget();

    // Increase time

    const projectBudgetCooldown =
      await this.fuulFactory.projectBudgetCooldown();

    await time.increase(projectBudgetCooldown.toNumber() + 1);

    // Remove
    await this.fuulProject.removeNFTBudget(
      this.nft721.address,
      this.tokenIds,
      []
    );

    // Budget info
    expect(await this.fuulProject.budgets(this.nft721.address)).to.equal(0);

    // Balance
    const balance = await this.nft721.balanceOf(this.fuulProject.address);

    await expect(balance).to.equal(0);
  });

  it("Fail to deposit if token is not accepted", async function () {
    const token = this.user1.address;

    await expect(
      this.fuulProject.depositNFTToken(token, this.tokenIds, [])
    ).to.be.revertedWithCustomError(
      this.fuulProject,
      "TokenCurrencyNotAccepted"
    );
  });

  it("Fail to remove if not applied or cooldown is not over, or removal window ended", async function () {
    // Remove before applying

    await expect(
      this.fuulProject.removeNFTBudget(this.nft721.address, this.tokenIds, [])
    ).to.be.revertedWithCustomError(this.fuulProject, "NoRemovalApplication");

    // Apply to remove
    await this.fuulProject.applyToRemoveBudget();

    await expect(
      this.fuulProject.removeNFTBudget(this.nft721.address, this.tokenIds, [])
    ).to.be.revertedWithCustomError(this.fuulProject, "OutsideRemovalWindow");

    // Remove outside window

    // Increase time
    const removeInfo = await this.fuulFactory.getBudgetRemoveInfo();

    await time.increase(
      removeInfo[0].toNumber() + removeInfo[1].toNumber() + 1
    );

    await expect(
      this.fuulProject.removeNFTBudget(this.nft721.address, this.tokenIds, [])
    ).to.be.revertedWithCustomError(this.fuulProject, "OutsideRemovalWindow");
  });

  it("Should fail to deposit and remove if not admin role", async function () {
    const error = `AccessControl: account ${this.user2.address.toLowerCase()} is missing role ${
      this.adminRole
    }`;

    await expect(
      this.fuulProject
        .connect(this.user2)
        .depositNFTToken(this.nft721.address, this.tokenIds, [])
    ).to.be.revertedWith(error);

    await expect(
      this.fuulProject
        .connect(this.user2)
        .removeNFTBudget(this.nft721.address, this.tokenIds, [])
    ).to.be.revertedWith(error);
  });

  it("Should fail to deposit if token currency is removed", async function () {
    await this.fuulFactory.removeCurrencyToken(this.nft721.address);

    await expect(
      this.fuulProject.depositNFTToken(this.nft721.address, this.tokenIds, [])
    ).to.be.revertedWithCustomError(
      this.fuulProject,
      "TokenCurrencyNotAccepted"
    );
  });
});

describe("Fuul Project - Deposit and remove unmatching token types", function () {
  beforeEach(async function () {
    const { fuulProject, fuulFactory, token, nft721, nft1155 } =
      await setupTest();

    this.fuulProject = fuulProject;
    this.fuulFactory = fuulFactory;
    this.token = token;
    this.nft721 = nft721;
    this.nft1155 = nft1155;

    this.fungibleCurrency = ethers.constants.AddressZero;

    // Deposit funginbe
    this.amount = ethers.utils.parseEther("1000");

    await this.fuulProject.depositFungibleToken(
      this.fungibleCurrency,
      this.amount,
      {
        value: this.amount,
      }
    );

    // Deposit NFTs
    await this.nft721.setApprovalForAll(this.fuulProject.address, true);

    this.tokenIds = [1, 2, 3, 4, 5];

    await this.fuulFactory.addCurrencyToken(this.nft721.address, 2);

    await this.fuulProject.depositNFTToken(
      this.nft721.address,
      this.tokenIds,
      []
    );

    // Apply to remove
    await this.fuulProject.applyToRemoveBudget();

    // Increase time

    const projectBudgetCooldown =
      await this.fuulFactory.projectBudgetCooldown();

    await time.increase(projectBudgetCooldown.toNumber() + 1);
  });

  it("Should fail to remove fungible if currency is an NFT", async function () {
    await expect(
      this.fuulProject.removeFungibleBudget(this.nft721.address, 1)
    ).to.be.revertedWithCustomError(this.fuulProject, "InvalidCurrency");
  });

  it("Should fail to remove NFT if token type is invalid", async function () {
    await expect(
      this.fuulProject.removeNFTBudget(this.fungibleCurrency, this.tokenIds, [])
    ).to.be.revertedWithCustomError(this.fuulProject, "InvalidCurrency");
  });

  it("Should fail to remove NFT if currency is fungible", async function () {
    await expect(
      this.fuulProject.removeNFTBudget(this.fungibleCurrency, this.tokenIds, [])
    ).to.be.reverted;

    await expect(
      this.fuulProject.removeNFTBudget(this.token.address, this.tokenIds, [])
    ).to.be.revertedWithCustomError(this.fuulProject, "InvalidCurrency");
  });

  it("Should fail to deposit NFT if currency is fungible", async function () {
    await expect(
      this.fuulProject.depositNFTToken(this.fungibleCurrency, this.tokenIds, [])
    ).to.be.revertedWithCustomError(this.fuulProject, "InvalidCurrency");

    await expect(
      this.fuulProject.depositNFTToken(this.token.address, this.tokenIds, [])
    ).to.be.revertedWithCustomError(this.fuulProject, "InvalidCurrency");
  });

  it("Should fail to deposit fungible if currency is an NFT", async function () {
    await expect(
      this.fuulProject.depositFungibleToken(this.nft721.address, 1)
    ).to.be.revertedWithCustomError(this.fuulProject, "InvalidCurrency");
  });
});

describe("Fuul Project - Deposit and remove NFT 1155", function () {
  beforeEach(async function () {
    const { fuulProject, fuulFactory, nft1155, user1 } = await setupTest();

    this.fuulProject = fuulProject;
    this.fuulFactory = fuulFactory;
    this.nft1155 = nft1155;
    this.user1 = user1;

    // Add token

    await this.fuulFactory.addCurrencyToken(nft1155.address, 3);

    this.tokenIds = [1, 2, 3, 4];

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
        this.nft1155.address,
        this.tokenIds,
        this.amounts
      )
    )
      .to.emit(this.fuulProject, "ERC1155BudgetDeposited")
      .withArgs(
        this.user1.address,
        this.tokenAmount,
        this.nft1155.address,
        this.tokenIds,
        this.amounts
      );

    // Budget info
    expect(await this.fuulProject.budgets(this.nft1155.address)).to.equal(
      this.tokenAmount
    );

    // Balance
    for (i = 0; i < this.tokenIds.length; i++) {
      let tokenId = this.tokenIds[i];
      let amount = this.amounts[i];

      expect(
        await this.nft1155.balanceOf(this.fuulProject.address, tokenId)
      ).to.equal(amount);
    }
  });

  it("Should remove correctly & set correct values", async function () {
    // Deposit
    await this.fuulProject.depositNFTToken(
      this.nft1155.address,
      this.tokenIds,
      this.amounts
    );

    // Apply to remove
    await this.fuulProject.applyToRemoveBudget();

    // Increase time

    const projectBudgetCooldown =
      await this.fuulFactory.projectBudgetCooldown();

    await time.increase(projectBudgetCooldown.toNumber() + 1);

    // Remove
    await this.fuulProject.removeNFTBudget(
      this.nft1155.address,
      this.tokenIds,
      this.amounts
    );

    // Budget info
    expect(await this.fuulProject.budgets(this.nft1155.address)).to.equal(0);

    // Balance
    for (i = 0; i < this.tokenIds.length; i++) {
      let tokenId = this.tokenIds[i];

      expect(
        await this.nft1155.balanceOf(this.fuulProject.address, tokenId)
      ).to.equal(0);
    }
  });
});

describe("Fuul Project - Fuul Manager functions", function () {
  beforeEach(async function () {
    const { fuulProject, fuulFactory, user1, user2, managerRole } =
      await setupTest();

    this.fuulProject = fuulProject;
    this.fuulFactory = fuulFactory;

    this.managerRole = managerRole;
    this.user1 = user1;
    this.user2 = user2;
  });

  it("Fail to attribute and claim if sender is not Fuul Manager", async function () {
    const attribution = {
      currency: this.user1.address,
      partner: this.user1.address,
      endUser: this.user1.address,
      amountToPartner: 1,
      amountToEndUser: 1,
      proof:
        "0x70726f6f66000000000000000000000000000000000000000000000000000000",
    };

    // Attribute
    await expect(
      this.fuulProject.attributeConversions([attribution], this.user1.address)
    ).to.be.revertedWithCustomError(this.fuulFactory, "Unauthorized");

    // Claim
    await expect(
      this.fuulProject.claimFromProject(
        this.user1.address,
        this.user1.address,
        [],
        []
      )
    ).to.be.revertedWithCustomError(this.fuulFactory, "Unauthorized");
  });
});

describe("Fuul Project - Deposit and remove fee budget", function () {
  beforeEach(async function () {
    const {
      fuulProject,
      fuulFactory,
      user1,
      user2,
      adminRole,
      nftFeeCurrency,
    } = await setupTest();

    this.fuulProject = fuulProject;
    this.fuulFactory = fuulFactory;

    this.nftFeeCurrency = nftFeeCurrency;
    this.user1 = user1;
    this.user2 = user2;
    this.adminRole = adminRole;

    this.amount = ethers.utils.parseEther("1000");
  });

  it("Should deposit correctly & set correct values", async function () {
    // Approve
    await this.nftFeeCurrency.approve(
      this.fuulProject.address,
      ethers.utils.parseEther("40000000")
    );

    await expect(this.fuulProject.depositFeeBudget(this.amount))
      .to.emit(this.fuulProject, "FeeBudgetDeposited")
      .withArgs(this.user1.address, this.amount, this.nftFeeCurrency.address);

    // Budget info

    expect(
      await this.fuulProject.nftFeeBudget(this.nftFeeCurrency.address)
    ).to.equal(this.amount);

    // Balance

    await expect(
      await this.nftFeeCurrency.balanceOf(this.fuulProject.address)
    ).to.equal(this.amount);
  });

  it("Should remove correctly & set correct values", async function () {
    // Approve
    await this.nftFeeCurrency.approve(
      this.fuulProject.address,
      ethers.utils.parseEther("40000000")
    );

    // Deposit
    await this.fuulProject.depositFeeBudget(this.amount);

    // Apply to remove
    await this.fuulProject.applyToRemoveBudget();

    // Increase time

    const projectBudgetCooldown =
      await this.fuulFactory.projectBudgetCooldown();

    await time.increase(projectBudgetCooldown.toNumber() + 1);

    // Remove
    await this.fuulProject.removeFeeBudget(
      this.nftFeeCurrency.address,
      this.amount
    );

    // Budget info
    expect(
      await this.fuulProject.nftFeeBudget(this.nftFeeCurrency.address)
    ).to.equal(0);

    // Balance

    await expect(
      await this.nftFeeCurrency.balanceOf(this.fuulProject.address)
    ).to.equal(0);
  });

  it("Fail to remove if not applied or cooldown is not over, or removal window ended", async function () {
    // Remove before applying

    await expect(
      this.fuulProject.removeFeeBudget(this.nftFeeCurrency.address, this.amount)
    ).to.be.revertedWithCustomError(this.fuulProject, "NoRemovalApplication");

    // Remove before cooldown is complete
    await this.fuulProject.applyToRemoveBudget();

    await expect(
      this.fuulProject.removeFeeBudget(this.nftFeeCurrency.address, this.amount)
    ).to.be.revertedWithCustomError(this.fuulProject, "OutsideRemovalWindow");

    // Increase time
    const removeInfo = await this.fuulFactory.getBudgetRemoveInfo();

    await time.increase(
      removeInfo[0].toNumber() + removeInfo[1].toNumber() + 1
    );

    await expect(
      this.fuulProject.removeFeeBudget(this.nftFeeCurrency.address, this.amount)
    ).to.be.revertedWithCustomError(this.fuulProject, "OutsideRemovalWindow");
  });

  it("Should remove correctly & set correct values after changing fee currency", async function () {
    // Approve
    await this.nftFeeCurrency.approve(
      this.fuulProject.address,
      ethers.utils.parseEther("40000000")
    );

    // Deposit
    await this.fuulProject.depositFeeBudget(this.amount);

    // Change currency
    await this.fuulFactory.setNftFeeCurrency(this.user1.address);

    // Apply to remove
    await this.fuulProject.applyToRemoveBudget();

    // Increase time

    const projectBudgetCooldown =
      await this.fuulFactory.projectBudgetCooldown();

    await time.increase(projectBudgetCooldown.toNumber() + 1);

    // Remove
    await this.fuulProject.removeFeeBudget(
      this.nftFeeCurrency.address,
      this.amount
    );

    // Budget info
    expect(
      await this.fuulProject.nftFeeBudget(this.nftFeeCurrency.address)
    ).to.equal(0);

    // Balance

    await expect(
      await this.nftFeeCurrency.balanceOf(this.fuulProject.address)
    ).to.equal(0);
  });

  it("Should fail to deposit with amount equals to zero", async function () {
    await expect(
      this.fuulProject.depositFeeBudget(0)
    ).to.be.revertedWithCustomError(this.fuulProject, "ZeroAmount");
  });

  it("Should fail to deposit and remove if not admin role", async function () {
    const error = `AccessControl: account ${this.user2.address.toLowerCase()} is missing role ${
      this.adminRole
    }`;

    await expect(
      this.fuulProject.connect(this.user2).depositFeeBudget(this.amount)
    ).to.be.revertedWith(error);
  });
});
