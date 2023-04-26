// const { expect } = require("chai");

// const { setupTest } = require("./before-each-test");
// const { time } = require("@nomicfoundation/hardhat-network-helpers");

// describe("Fuul Project - Admin variables", function () {
//   beforeEach(async function () {
//     const { fuulProject, adminRole, user2 } = await setupTest();

//     this.fuulProject = fuulProject;
//     this.user2 = user2;
//     this.adminRole = adminRole;

//     this.projectURI = "newProjectURI";
//   });

//   it("Should set new project URI", async function () {
//     expect(await this.fuulProject.setProjectInfoURI(this.projectURI))
//       .to.emit(this.fuulProject, "ProjectInfoUpdated")
//       .withArgs(this.projectURI);

//     expect(await this.fuulProject.projectInfoURI()).to.equal(this.projectURI);
//   });

//   it("Should set variable after applying to remove", async function () {
//     await this.fuulProject.applyToRemoveBudget();

//     const lastApplication = await this.fuulProject.lastRemovalApplication();
//     expect(lastApplication.toNumber()).to.be.greaterThan(0);
//   });

//   it("Should fail to set new project uri and apply to remove if not admin role", async function () {
//     const error = `AccessControl: account ${this.user2.address.toLowerCase()} is missing role ${
//       this.adminRole
//     }`;

//     await expect(
//       this.fuulProject.connect(this.user2).setProjectInfoURI(this.projectURI)
//     ).to.be.revertedWith(error);

//     await expect(
//       this.fuulProject.connect(this.user2).applyToRemoveBudget()
//     ).to.be.revertedWith(error);
//   });
// });

// describe("Fuul Project - Deposit and remove fungible", function () {
//   beforeEach(async function () {
//     const {
//       fuulProject,
//       fuulManager,
//       token,
//       user1,
//       user2,
//       adminRole,
//       provider,
//     } = await setupTest();

//     this.fuulProject = fuulProject;
//     this.fuulManager = fuulManager;
//     this.token = token;
//     this.user1 = user1;
//     this.user2 = user2;
//     this.adminRole = adminRole;
//     this.provider = provider;

//     this.amount = ethers.utils.parseEther("1000");
//   });

//   it("Should deposit correctly & set correct values with currency = 0x", async function () {
//     await expect(
//       this.fuulProject.depositFungibleToken(
//         ethers.constants.AddressZero,
//         this.amount,
//         {
//           value: this.amount,
//         }
//       )
//     )
//       .to.emit(this.fuulProject, "BudgetDeposited")
//       .withArgs(
//         this.user1.address,
//         this.amount,
//         ethers.constants.AddressZero,
//         0,
//         [],
//         []
//       );

//     // Budget info

//     expect(
//       await this.fuulProject.budgets(ethers.constants.AddressZero)
//     ).to.equal(this.amount);

//     // Balance
//     const balance = await this.provider.getBalance(this.fuulProject.address);

//     await expect(balance).to.equal(this.amount);
//   });

//   it("Should remove correctly & set correct values with currency = 0x", async function () {
//     // Deposit
//     await this.fuulProject.depositFungibleToken(
//       ethers.constants.AddressZero,
//       this.amount,
//       {
//         value: this.amount,
//       }
//     );

//     // Apply to remove
//     await this.fuulProject.applyToRemoveBudget();

//     // Increase time

//     const projectBudgetCooldown =
//       await this.fuulManager.projectBudgetCooldown();

//     await time.increase(projectBudgetCooldown.toNumber() + 1);

//     // Remove
//     await this.fuulProject.removeFungibleBudget(
//       ethers.constants.AddressZero,
//       this.amount
//     );

//     // Budget info

//     expect(
//       await this.fuulProject.budgets(ethers.constants.AddressZero)
//     ).to.equal(0);

//     // Balance
//     const balance = await this.provider.getBalance(this.fuulProject.address);

//     await expect(balance).to.equal(0);
//   });

//   it("Fail to deposit if token is not accepted", async function () {
//     const token = this.user2.address;

//     await expect(
//       this.fuulProject.depositFungibleToken(token, this.amount)
//     ).to.be.revertedWithCustomError(
//       this.fuulProject,
//       "TokenCurrencyNotAccepted"
//     );
//   });

//   it("Fail to remove if not applied or cooldown is not over", async function () {
//     // Remove before applying

//     await expect(
//       this.fuulProject.removeFungibleBudget(this.token.address, this.amount)
//     ).to.be.revertedWithCustomError(this.fuulProject, "NoRemovalApplication");

//     // Remove before cooldown is complete
//     await this.fuulProject.applyToRemoveBudget();

//     await expect(
//       this.fuulProject.removeFungibleBudget(this.token.address, this.amount)
//     ).to.be.revertedWithCustomError(
//       this.fuulProject,
//       "CooldownPeriodNotFinished"
//     );
//   });

//   it("Should deposit correctly & set correct values with currency != 0x", async function () {
//     // Approve
//     await this.token.approve(
//       this.fuulProject.address,
//       ethers.utils.parseEther("40000000")
//     );

//     await expect(
//       this.fuulProject.depositFungibleToken(this.token.address, this.amount)
//     )
//       .to.emit(this.fuulProject, "BudgetDeposited")
//       .withArgs(this.user1.address, this.amount, this.token.address, 1, [], []);

//     // Budget info

//     expect(await this.fuulProject.budgets(this.token.address)).to.equal(
//       this.amount
//     );

//     // Balance
//     const balance = await this.token.balanceOf(this.fuulProject.address);

//     await expect(balance).to.equal(this.amount);
//   });

//   it("Should remove correctly & set correct values with currency != 0x", async function () {
//     // Approve
//     await this.token.approve(
//       this.fuulProject.address,
//       ethers.utils.parseEther("40000000")
//     );

//     // Deposit
//     await this.fuulProject.depositFungibleToken(
//       this.token.address,
//       this.amount
//     );

//     // Apply to remove
//     await this.fuulProject.applyToRemoveBudget();

//     // Increase time

//     const projectBudgetCooldown =
//       await this.fuulManager.projectBudgetCooldown();

//     await time.increase(projectBudgetCooldown.toNumber() + 1);

//     // Remove
//     await this.fuulProject.removeFungibleBudget(
//       this.token.address,
//       this.amount
//     );

//     // Budget info
//     expect(await this.fuulProject.budgets(this.token.address)).to.equal(0);

//     // Balance
//     const balance = await this.token.balanceOf(this.fuulProject.address);

//     await expect(balance).to.equal(0);
//   });

//   it("Should remove correctly & set correct values after removing token currency", async function () {
//     // Approve
//     await this.token.approve(
//       this.fuulProject.address,
//       ethers.utils.parseEther("40000000")
//     );

//     // Deposit
//     await this.fuulProject.depositFungibleToken(
//       this.token.address,
//       this.amount
//     );

//     // Remove token currency
//     await this.fuulManager.removeCurrencyToken(this.token.address);

//     // Apply to remove
//     await this.fuulProject.applyToRemoveBudget();

//     // Increase time

//     const projectBudgetCooldown =
//       await this.fuulManager.projectBudgetCooldown();

//     await time.increase(projectBudgetCooldown.toNumber() + 1);

//     // Remove
//     await this.fuulProject.removeFungibleBudget(
//       this.token.address,
//       this.amount
//     );

//     // Budget info
//     expect(await this.fuulProject.budgets(this.token.address)).to.equal(0);

//     // Balance
//     const balance = await this.token.balanceOf(this.fuulProject.address);

//     await expect(balance).to.equal(0);
//   });

//   it("Should fail to deposit with amount equals to zero", async function () {
//     await expect(
//       this.fuulProject.depositFungibleToken(this.token.address, 0)
//     ).to.be.revertedWithCustomError(this.fuulProject, "ZeroAmount");
//   });

//   it("Should fail to deposit native token if amount differs to msg.value", async function () {
//     await expect(
//       this.fuulProject.depositFungibleToken(
//         ethers.constants.AddressZero,
//         this.amount
//       )
//     ).to.be.revertedWithCustomError(this.fuulProject, "IncorrectMsgValue");
//   });

//   it("Should fail to deposit and remove if not admin role", async function () {
//     const error = `AccessControl: account ${this.user2.address.toLowerCase()} is missing role ${
//       this.adminRole
//     }`;

//     await expect(
//       this.fuulProject
//         .connect(this.user2)
//         .depositFungibleToken(this.token.address, this.amount)
//     ).to.be.revertedWith(error);
//   });

//   it("Should fail to deposit if token currency is removed", async function () {
//     await this.fuulManager.removeCurrencyToken(this.token.address);
//     await expect(
//       this.fuulProject.depositFungibleToken(this.token.address, this.amount)
//     ).to.be.revertedWithCustomError(
//       this.fuulProject,
//       "TokenCurrencyNotAccepted"
//     );
//   });
// });

// describe("Fuul Project - Deposit and remove NFT 721", function () {
//   beforeEach(async function () {
//     const { fuulProject, fuulManager, nft721, user1, user2, adminRole } =
//       await setupTest();

//     this.fuulProject = fuulProject;
//     this.fuulManager = fuulManager;
//     this.nft721 = nft721;
//     this.user1 = user1;
//     this.user2 = user2;
//     this.adminRole = adminRole;

//     this.tokenType = 2;

//     // Add token

//     await this.fuulManager.addCurrencyToken(nft721.address, 100);

//     this.tokenIds = [1, 2, 3, 4];

//     // Approve
//     await this.nft721.setApprovalForAll(this.fuulProject.address, true);
//   });

//   it("Should deposit correctly & set correct values", async function () {
//     await expect(
//       this.fuulProject.depositNFTToken(this.nft721.address, this.tokenIds, [])
//     )
//       .to.emit(this.fuulProject, "BudgetDeposited")
//       .withArgs(
//         this.user1.address,
//         this.tokenIds.length,
//         this.nft721.address,
//         this.tokenType,
//         this.tokenIds,
//         []
//       );

//     // Budget info
//     expect(await this.fuulProject.budgets(this.nft721.address)).to.equal(
//       this.tokenIds.length
//     );

//     // Balance
//     const balance = await this.nft721.balanceOf(this.fuulProject.address);

//     await expect(balance).to.equal(this.tokenIds.length);
//   });

//   it("Should remove correctly & set correct values", async function () {
//     // Deposit
//     await this.fuulProject.depositNFTToken(
//       this.nft721.address,
//       this.tokenIds,
//       []
//     );

//     // Apply to remove
//     await this.fuulProject.applyToRemoveBudget();

//     // Increase time

//     const projectBudgetCooldown =
//       await this.fuulManager.projectBudgetCooldown();

//     await time.increase(projectBudgetCooldown.toNumber() + 1);

//     // Remove
//     await this.fuulProject.removeNFTBudget(
//       this.nft721.address,
//       this.tokenIds,
//       []
//     );

//     // Budget info
//     expect(await this.fuulProject.budgets(this.nft721.address)).to.equal(0);

//     // Balance
//     const balance = await this.nft721.balanceOf(this.fuulProject.address);

//     await expect(balance).to.equal(0);
//   });

//   it("Should remove correctly & set correct values after token removed", async function () {
//     // Deposit
//     await this.fuulProject.depositNFTToken(
//       this.nft721.address,
//       this.tokenIds,
//       []
//     );

//     // Remove token
//     await this.fuulManager.removeCurrencyToken(this.nft721.address);

//     // Apply to remove
//     await this.fuulProject.applyToRemoveBudget();

//     // Increase time

//     const projectBudgetCooldown =
//       await this.fuulManager.projectBudgetCooldown();

//     await time.increase(projectBudgetCooldown.toNumber() + 1);

//     // Remove
//     await this.fuulProject.removeNFTBudget(
//       this.nft721.address,
//       this.tokenIds,
//       []
//     );

//     // Budget info
//     expect(await this.fuulProject.budgets(this.nft721.address)).to.equal(0);

//     // Balance
//     const balance = await this.nft721.balanceOf(this.fuulProject.address);

//     await expect(balance).to.equal(0);
//   });

//   it("Fail to deposit if token is not accepted", async function () {
//     const token = this.user1.address;

//     await expect(
//       this.fuulProject.depositNFTToken(token, this.tokenIds, [])
//     ).to.be.revertedWithCustomError(
//       this.fuulProject,
//       "TokenCurrencyNotAccepted"
//     );
//   });

//   it("Fail to remove if not applied or cooldown is not over", async function () {
//     // Remove before applying

//     await expect(
//       this.fuulProject.removeNFTBudget(this.nft721.address, this.tokenIds, [])
//     ).to.be.revertedWithCustomError(this.fuulProject, "NoRemovalApplication");

//     // Apply to remove
//     await this.fuulProject.applyToRemoveBudget();

//     await expect(
//       this.fuulProject.removeNFTBudget(this.nft721.address, this.tokenIds, [])
//     ).to.be.revertedWithCustomError(
//       this.fuulProject,
//       "CooldownPeriodNotFinished"
//     );
//   });

//   it("Should fail to deposit and remove if not admin role", async function () {
//     const error = `AccessControl: account ${this.user2.address.toLowerCase()} is missing role ${
//       this.adminRole
//     }`;

//     await expect(
//       this.fuulProject
//         .connect(this.user2)
//         .depositNFTToken(this.nft721.address, this.tokenIds, [])
//     ).to.be.revertedWith(error);

//     await expect(
//       this.fuulProject
//         .connect(this.user2)
//         .removeNFTBudget(this.nft721.address, this.tokenIds, [])
//     ).to.be.revertedWith(error);
//   });

//   it("Should fail to deposit if token currency is removed", async function () {
//     await this.fuulManager.removeCurrencyToken(this.nft721.address);

//     await expect(
//       this.fuulProject.depositNFTToken(this.nft721.address, this.tokenIds, [])
//     ).to.be.revertedWithCustomError(
//       this.fuulProject,
//       "TokenCurrencyNotAccepted"
//     );
//   });
// });

// describe("Fuul Project - Deposit and remove NFT 1155", function () {
//   beforeEach(async function () {
//     const { fuulProject, fuulManager, nft1155, user1, user2, adminRole } =
//       await setupTest();

//     this.fuulProject = fuulProject;
//     this.fuulManager = fuulManager;
//     this.nft1155 = nft1155;
//     this.user1 = user1;
//     this.user2 = user2;
//     this.adminRole = adminRole;

//     this.tokenType = 3;

//     // Add token

//     await this.fuulManager.addCurrencyToken(nft1155.address, 100);

//     this.tokenIds = [1, 2, 3, 4];

//     this.amounts = [1, 2, 1, 2];

//     this.tokenAmount = this.amounts.reduce(function (a, b) {
//       return a + b;
//     });

//     // Approve
//     await this.nft1155.setApprovalForAll(this.fuulProject.address, true);
//   });

//   it("Should deposit correctly & set correct values", async function () {
//     await expect(
//       this.fuulProject.depositNFTToken(
//         this.nft1155.address,
//         this.tokenIds,
//         this.amounts
//       )
//     )
//       .to.emit(this.fuulProject, "BudgetDeposited")
//       .withArgs(
//         this.user1.address,
//         this.tokenAmount,
//         this.nft1155.address,
//         this.tokenType,
//         this.tokenIds,
//         this.amounts
//       );

//     // Budget info
//     expect(await this.fuulProject.budgets(this.nft1155.address)).to.equal(
//       this.tokenAmount
//     );

//     // Balance
//     for (i = 0; i < this.tokenIds.length; i++) {
//       let tokenId = this.tokenIds[i];
//       let amount = this.amounts[i];

//       expect(
//         await this.nft1155.balanceOf(this.fuulProject.address, tokenId)
//       ).to.equal(amount);
//     }
//   });

//   it("Should remove correctly & set correct values", async function () {
//     // Deposit
//     await this.fuulProject.depositNFTToken(
//       this.nft1155.address,
//       this.tokenIds,
//       this.amounts
//     );

//     // Apply to remove
//     await this.fuulProject.applyToRemoveBudget();

//     // Increase time

//     const projectBudgetCooldown =
//       await this.fuulManager.projectBudgetCooldown();

//     await time.increase(projectBudgetCooldown.toNumber() + 1);

//     // Remove
//     await this.fuulProject.removeNFTBudget(
//       this.nft1155.address,
//       this.tokenIds,
//       this.amounts
//     );

//     // Budget info
//     expect(await this.fuulProject.budgets(this.nft1155.address)).to.equal(0);

//     // Balance
//     for (i = 0; i < this.tokenIds.length; i++) {
//       let tokenId = this.tokenIds[i];

//       expect(
//         await this.nft1155.balanceOf(this.fuulProject.address, tokenId)
//       ).to.equal(0);
//     }
//   });
// });

// describe("Fuul Project - Fuul Manager functions", function () {
//   beforeEach(async function () {
//     const { fuulProject, fuulManager, user1 } = await setupTest();

//     this.fuulProject = fuulProject;
//     this.fuulManager = fuulManager;
//     this.user1 = user1;
//   });

//   it("Fail to attribute and claim if sender is not Fuul Manager", async function () {
//     const attribution = {
//       currency: this.user1.address,
//       partner: this.user1.address,
//       endUser: this.user1.address,
//       amountToPartner: 1,
//       amountToEndUser: 1,
//     };

//     // Attribute
//     await expect(
//       this.fuulProject.attributeTransactions([attribution], this.user1.address)
//     ).to.be.revertedWithCustomError(this.fuulProject, "Unauthorized");

//     // Claim
//     await expect(
//       this.fuulProject.claimFromProject(
//         this.user1.address,
//         this.user1.address,
//         [],
//         []
//       )
//     ).to.be.revertedWithCustomError(this.fuulProject, "Unauthorized");
//   });
// });

// Fee currency
