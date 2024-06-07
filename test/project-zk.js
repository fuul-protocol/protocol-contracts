const { expect } = require("chai");

const { setupTest } = require("./before-each-test");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Fuul Project - Admin variables", function () {
    beforeEach(async function () {
        const { fuulProject, adminRole, user2 } = await setupTest(is_zk = true);

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
        expect(Number(lastApplication)).to.be.greaterThan(0);
    });

    it("Should fail to set new project uri and apply to remove if not admin role", async function () {
        const error = `AccessControl: account ${this.user2.address.toLowerCase()} is missing role ${this.adminRole
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
            fuulProjectAddress,
            fuulFactory,
            token,
            tokenAddress,
            user1,
            user2,
            adminRole,
            provider,
        } = await setupTest(is_zk = true);

        this.fuulProject = fuulProject;
        this.fuulProjectAddress = fuulProjectAddress;
        this.fuulFactory = fuulFactory;
        this.token = token;
        this.tokenAddress = tokenAddress;
        this.user1 = user1;
        this.user2 = user2;
        this.adminRole = adminRole;
        this.provider = provider;

        this.amount = ethers.parseEther("1000");
    });

    it("Should deposit correctly & set correct values with currency = 0x", async function () {
        await expect(
            this.fuulProject.depositFungibleToken(
                ethers.ZeroAddress,
                this.amount,
                {
                    value: this.amount,
                }
            )
        )
            .to.emit(this.fuulProject, "FungibleBudgetDeposited")
            .withArgs(this.amount, ethers.ZeroAddress);

        // Budget info

        expect(
            await this.fuulProject.budgets(ethers.ZeroAddress)
        ).to.equal(this.amount);

        // Balance
        const balance = await this.provider.getBalance(this.fuulProjectAddress);

        await expect(balance).to.equal(this.amount);
    });

    it("Should remove correctly & set correct values with currency = 0x", async function () {
        // Deposit
        await this.fuulProject.depositFungibleToken(
            ethers.ZeroAddress,
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

        await time.increase(Number(projectBudgetCooldown) + 1);

        // Remove
        await expect(
            this.fuulProject.removeFungibleBudget(
                ethers.ZeroAddress,
                this.amount
            )
        )
            .to.emit(this.fuulProject, "FungibleBudgetRemoved")
            .withArgs(this.amount, ethers.ZeroAddress);

        // Budget info

        expect(
            await this.fuulProject.budgets(ethers.ZeroAddress)
        ).to.equal(0);

        // Balance
        const balance = await this.provider.getBalance(this.fuulProjectAddress);

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
            this.fuulProject.removeFungibleBudget(this.tokenAddress, this.amount)
        ).to.be.revertedWithCustomError(this.fuulProject, "NoRemovalApplication");

        // Remove before cooldown is complete
        await this.fuulProject.applyToRemoveBudget();

        await expect(
            this.fuulProject.removeFungibleBudget(this.tokenAddress, this.amount)
        ).to.be.revertedWithCustomError(this.fuulProject, "OutsideRemovalWindow");

        // Remove outside window
        const removeInfo = await this.fuulFactory.getBudgetRemoveInfo();

        await time.increase(
            Number(removeInfo[0]) + Number(removeInfo[1]) + 1
        );

        await expect(
            this.fuulProject.removeFungibleBudget(this.tokenAddress, this.amount)
        ).to.be.revertedWithCustomError(this.fuulProject, "OutsideRemovalWindow");
    });

    it("Should deposit correctly & set correct values with currency != 0x", async function () {
        // Approve
        await this.token.approve(
            this.fuulProjectAddress,
            ethers.parseEther("40000000")
        );

        await expect(
            this.fuulProject.depositFungibleToken(this.tokenAddress, this.amount)
        )
            .to.emit(this.fuulProject, "FungibleBudgetDeposited")
            .withArgs(this.amount, this.tokenAddress);

        // Budget info

        expect(await this.fuulProject.budgets(this.tokenAddress)).to.equal(
            this.amount
        );

        // Balance
        const balance = await this.token.balanceOf(this.fuulProjectAddress);

        await expect(balance).to.equal(this.amount);
    });

    it("Should remove correctly & set correct values with currency != 0x", async function () {
        // Approve
        await this.token.approve(
            this.fuulProjectAddress,
            ethers.parseEther("40000000")
        );

        // Deposit
        await this.fuulProject.depositFungibleToken(
            this.tokenAddress,
            this.amount
        );

        // Apply to remove
        await this.fuulProject.applyToRemoveBudget();

        // Increase time

        const projectBudgetCooldown =
            await this.fuulFactory.projectBudgetCooldown();

        await time.increase(Number(projectBudgetCooldown) + 1);

        // Remove
        await this.fuulProject.removeFungibleBudget(
            this.tokenAddress,
            this.amount
        );

        // Budget info
        expect(await this.fuulProject.budgets(this.tokenAddress)).to.equal(0);

        // Balance
        const balance = await this.token.balanceOf(this.fuulProjectAddress);

        await expect(balance).to.equal(0);
    });

    it("Should remove correctly & set correct values after removing token currency", async function () {
        // Approve
        await this.token.approve(
            this.fuulProjectAddress,
            ethers.parseEther("40000000")
        );

        // Deposit
        await this.fuulProject.depositFungibleToken(
            this.tokenAddress,
            this.amount
        );

        // Remove token currency
        await this.fuulFactory.removeCurrencyToken(this.tokenAddress);

        // Apply to remove
        await this.fuulProject.applyToRemoveBudget();

        // Increase time

        const projectBudgetCooldown =
            await this.fuulFactory.projectBudgetCooldown();

        await time.increase(Number(projectBudgetCooldown) + 1);

        // Remove
        await this.fuulProject.removeFungibleBudget(
            this.tokenAddress,
            this.amount
        );

        // Budget info
        expect(await this.fuulProject.budgets(this.tokenAddress)).to.equal(0);

        // Balance
        const balance = await this.token.balanceOf(this.fuulProjectAddress);

        await expect(balance).to.equal(0);
    });

    it("Should fail to deposit with amount equals to zero", async function () {
        await expect(
            this.fuulProject.depositFungibleToken(this.tokenAddress, 0)
        ).to.be.revertedWithCustomError(this.fuulProject, "ZeroAmount");
    });

    it("Should fail to deposit native token if amount differs to msg.value", async function () {
        await expect(
            this.fuulProject.depositFungibleToken(
                ethers.ZeroAddress,
                this.amount
            )
        ).to.be.revertedWithCustomError(this.fuulProject, "IncorrectMsgValue");
    });

    it("Should fail to deposit and remove if not admin role", async function () {
        const error = `AccessControl: account ${this.user2.address.toLowerCase()} is missing role ${this.adminRole
            }`;

        await expect(
            this.fuulProject
                .connect(this.user2)
                .depositFungibleToken(this.tokenAddress, this.amount)
        ).to.be.revertedWith(error);
    });

    it("Should fail to deposit if token currency is removed", async function () {
        await this.fuulFactory.removeCurrencyToken(this.tokenAddress);
        await expect(
            this.fuulProject.depositFungibleToken(this.tokenAddress, this.amount)
        ).to.be.revertedWithCustomError(
            this.fuulProject,
            "TokenCurrencyNotAccepted"
        );
    });
});

describe("Fuul Project - Deposit and remove NFT 721", function () {
    beforeEach(async function () {
        const { fuulProject, fuulProjectAddress, fuulFactory, nft721, nft721Address, user1, user2, adminRole } =
            await setupTest(is_zk = true);

        this.fuulProject = fuulProject;
        this.fuulProjectAddress = fuulProjectAddress;
        this.fuulFactory = fuulFactory;
        this.nft721 = nft721;
        this.nft721Address = nft721Address;
        this.user1 = user1;
        this.user2 = user2;
        this.adminRole = adminRole;

        // Add token

        await this.fuulFactory.addCurrencyToken(this.nft721Address, 2);

        this.tokenIds = [1, 2, 3, 4];

        // Approve
        await this.nft721.setApprovalForAll(this.fuulProjectAddress, true);
    });

    it("Should deposit correctly & set correct values", async function () {
        await expect(
            this.fuulProject.depositNFTToken(this.nft721Address, this.tokenIds, [])
        )
            .to.emit(this.fuulProject, "ERC721BudgetDeposited")
            .withArgs(this.tokenIds.length, this.nft721Address, this.tokenIds);

        // Budget info
        expect(await this.fuulProject.budgets(this.nft721Address)).to.equal(
            this.tokenIds.length
        );

        // Balance
        const balance = await this.nft721.balanceOf(this.fuulProjectAddress);

        await expect(balance).to.equal(this.tokenIds.length);
    });

    it("Should remove correctly & set correct values", async function () {
        // Deposit
        await this.fuulProject.depositNFTToken(
            this.nft721Address,
            this.tokenIds,
            []
        );

        // Apply to remove
        await this.fuulProject.applyToRemoveBudget();

        // Increase time

        const projectBudgetCooldown =
            await this.fuulFactory.projectBudgetCooldown();

        await time.increase(Number(projectBudgetCooldown) + 1);

        // Remove
        // Remove
        await expect(
            this.fuulProject.removeNFTBudget(this.nft721Address, this.tokenIds, [])
        )
            .to.emit(this.fuulProject, "ERC721BudgetRemoved")
            .withArgs(this.tokenIds.length, this.nft721Address, this.tokenIds);

        // Budget info
        expect(await this.fuulProject.budgets(this.nft721Address)).to.equal(0);

        // Balance
        const balance = await this.nft721.balanceOf(this.fuulProjectAddress);

        await expect(balance).to.equal(0);
    });

    it("Should remove correctly & set correct values after token removed", async function () {
        // Deposit
        await this.fuulProject.depositNFTToken(
            this.nft721Address,
            this.tokenIds,
            []
        );

        // Remove token
        await this.fuulFactory.removeCurrencyToken(this.nft721Address);

        // Apply to remove
        await this.fuulProject.applyToRemoveBudget();

        // Increase time

        const projectBudgetCooldown =
            await this.fuulFactory.projectBudgetCooldown();

        await time.increase(Number(projectBudgetCooldown) + 1);

        // Remove
        await this.fuulProject.removeNFTBudget(
            this.nft721Address,
            this.tokenIds,
            []
        );

        // Budget info
        expect(await this.fuulProject.budgets(this.nft721Address)).to.equal(0);

        // Balance
        const balance = await this.nft721.balanceOf(this.fuulProjectAddress);

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
            this.fuulProject.removeNFTBudget(this.nft721Address, this.tokenIds, [])
        ).to.be.revertedWithCustomError(this.fuulProject, "NoRemovalApplication");

        // Apply to remove
        await this.fuulProject.applyToRemoveBudget();

        await expect(
            this.fuulProject.removeNFTBudget(this.nft721Address, this.tokenIds, [])
        ).to.be.revertedWithCustomError(this.fuulProject, "OutsideRemovalWindow");

        // Remove outside window

        // Increase time
        const removeInfo = await this.fuulFactory.getBudgetRemoveInfo();

        await time.increase(
            Number(removeInfo[0]) + Number(removeInfo[1]) + 1
        );

        await expect(
            this.fuulProject.removeNFTBudget(this.nft721Address, this.tokenIds, [])
        ).to.be.revertedWithCustomError(this.fuulProject, "OutsideRemovalWindow");
    });

    it("Should fail to deposit and remove if not admin role", async function () {
        const error = `AccessControl: account ${this.user2.address.toLowerCase()} is missing role ${this.adminRole
            }`;

        await expect(
            this.fuulProject
                .connect(this.user2)
                .depositNFTToken(this.nft721Address, this.tokenIds, [])
        ).to.be.revertedWith(error);

        await expect(
            this.fuulProject
                .connect(this.user2)
                .removeNFTBudget(this.nft721Address, this.tokenIds, [])
        ).to.be.revertedWith(error);
    });

    it("Should fail to deposit if token currency is removed", async function () {
        await this.fuulFactory.removeCurrencyToken(this.nft721Address);

        await expect(
            this.fuulProject.depositNFTToken(this.nft721Address, this.tokenIds, [])
        ).to.be.revertedWithCustomError(
            this.fuulProject,
            "TokenCurrencyNotAccepted"
        );
    });
});

describe("Fuul Project - Deposit and remove unmatching token types", function () {
    beforeEach(async function () {
        const { fuulProject, fuulProjectAddress, fuulFactory, token, tokenAddress, nft721, nft721Address, nft1155, nft1155Address } =
            await setupTest(is_zk = true);

        this.fuulProject = fuulProject;
        this.fuulProjectAddress = fuulProjectAddress;
        this.fuulFactory = fuulFactory;
        this.token = token;
        this.tokenAddress = tokenAddress;
        this.nft721 = nft721;
        this.nft721Address = nft721Address;
        this.nft1155 = nft1155;
        this.nft1155Address = nft1155Address;


        this.fungibleCurrency = ethers.ZeroAddress;

        // Deposit funginbe
        this.amount = ethers.parseEther("1000");

        await this.fuulProject.depositFungibleToken(
            this.fungibleCurrency,
            this.amount,
            {
                value: this.amount,
            }
        );

        // Deposit NFTs
        await this.nft721.setApprovalForAll(this.fuulProjectAddress, true);

        this.tokenIds = [1, 2, 3, 4, 5];

        await this.fuulFactory.addCurrencyToken(this.nft721Address, 2);

        await this.fuulProject.depositNFTToken(
            this.nft721Address,
            this.tokenIds,
            []
        );

        // Apply to remove
        await this.fuulProject.applyToRemoveBudget();

        // Increase time

        const projectBudgetCooldown =
            await this.fuulFactory.projectBudgetCooldown();

        await time.increase(Number(projectBudgetCooldown) + 1);
    });

    it("Should fail to remove fungible if currency is an NFT", async function () {
        await expect(
            this.fuulProject.removeFungibleBudget(this.nft721Address, 1)
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
            this.fuulProject.removeNFTBudget(this.tokenAddress, this.tokenIds, [])
        ).to.be.revertedWithCustomError(this.fuulProject, "InvalidCurrency");
    });

    it("Should fail to deposit NFT if currency is fungible", async function () {
        await expect(
            this.fuulProject.depositNFTToken(this.fungibleCurrency, this.tokenIds, [])
        ).to.be.revertedWithCustomError(this.fuulProject, "InvalidCurrency");

        await expect(
            this.fuulProject.depositNFTToken(this.tokenAddress, this.tokenIds, [])
        ).to.be.revertedWithCustomError(this.fuulProject, "InvalidCurrency");
    });

    it("Should fail to deposit fungible if currency is an NFT", async function () {
        await expect(
            this.fuulProject.depositFungibleToken(this.nft721Address, 1)
        ).to.be.revertedWithCustomError(this.fuulProject, "InvalidCurrency");
    });
});

describe("Fuul Project - Deposit and remove NFT 1155", function () {
    beforeEach(async function () {
        const { fuulProject, fuulProjectAddress, fuulFactory, nft1155, nft1155Address, user1 } = await setupTest(is_zk = true);

        this.fuulProject = fuulProject;
        this.fuulProjectAddress = fuulProjectAddress;
        this.fuulFactory = fuulFactory;
        this.nft1155 = nft1155;
        this.nft1155Address = nft1155Address;
        this.user1 = user1;

        // Add token

        await this.fuulFactory.addCurrencyToken(nft1155Address, 3);

        this.tokenIds = [1, 2, 3, 4];

        this.amounts = [1, 2, 1, 2];

        this.tokenAmount = this.amounts.reduce(function (a, b) {
            return a + b;
        });

        // Approve
        await this.nft1155.setApprovalForAll(this.fuulProjectAddress, true);
    });

    it("Should deposit correctly & set correct values", async function () {
        await expect(
            this.fuulProject.depositNFTToken(
                this.nft1155Address,
                this.tokenIds,
                this.amounts
            )
        )
            .to.emit(this.fuulProject, "ERC1155BudgetDeposited")
            .withArgs(
                this.user1.address,
                this.tokenAmount,
                this.nft1155Address,
                this.tokenIds,
                this.amounts
            );

        // Budget info
        expect(await this.fuulProject.budgets(this.nft1155Address)).to.equal(
            this.tokenAmount
        );

        // Balance
        for (i = 0; i < this.tokenIds.length; i++) {
            let tokenId = this.tokenIds[i];
            let amount = this.amounts[i];

            expect(
                await this.nft1155.balanceOf(this.fuulProjectAddress, tokenId)
            ).to.equal(amount);
        }
    });

    it("Should remove correctly & set correct values", async function () {
        // Deposit
        await this.fuulProject.depositNFTToken(
            this.nft1155Address,
            this.tokenIds,
            this.amounts
        );

        // Apply to remove
        await this.fuulProject.applyToRemoveBudget();

        // Increase time

        const projectBudgetCooldown =
            await this.fuulFactory.projectBudgetCooldown();

        await time.increase(Number(projectBudgetCooldown) + 1);

        // Remove
        await this.fuulProject.removeNFTBudget(
            this.nft1155Address,
            this.tokenIds,
            this.amounts
        );

        // Budget info
        expect(await this.fuulProject.budgets(this.nft1155Address)).to.equal(0);

        // Balance
        for (i = 0; i < this.tokenIds.length; i++) {
            let tokenId = this.tokenIds[i];

            expect(
                await this.nft1155.balanceOf(this.fuulProjectAddress, tokenId)
            ).to.equal(0);
        }
    });
});

describe("Fuul Project - Fuul Manager functions", function () {
    beforeEach(async function () {
        const { fuulProject, fuulFactory, user1, user2, managerRole } =
            await setupTest(is_zk = true);

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
            proofWithoutProject:
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
                1,
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
            fuulProjectAddress,
            fuulFactory,
            user1,
            user2,
            adminRole,
            nftFeeCurrency,
            nftFeeCurrencyAddress
        } = await setupTest(is_zk = true);

        this.fuulProject = fuulProject;
        this.fuulProjectAddress = fuulProjectAddress;

        this.fuulFactory = fuulFactory;

        this.nftFeeCurrency = nftFeeCurrency;
        this.nftFeeCurrencyAddress = nftFeeCurrencyAddress;

        this.user1 = user1;
        this.user2 = user2;
        this.adminRole = adminRole;

        this.amount = ethers.parseEther("1000");
    });

    it("Should deposit correctly & set correct values", async function () {
        // Approve
        await this.nftFeeCurrency.approve(
            this.fuulProjectAddress,
            ethers.parseEther("40000000")
        );

        await expect(this.fuulProject.depositFeeBudget(this.amount))
            .to.emit(this.fuulProject, "FeeBudgetDeposited")
            .withArgs(this.user1.address, this.amount, this.nftFeeCurrencyAddress);

        // Budget info

        expect(
            await this.fuulProject.nftFeeBudget(this.nftFeeCurrencyAddress)
        ).to.equal(this.amount);

        // Balance

        await expect(
            await this.nftFeeCurrency.balanceOf(this.fuulProjectAddress)
        ).to.equal(this.amount);
    });

    it("Should remove correctly & set correct values", async function () {
        // Approve
        await this.nftFeeCurrency.approve(
            this.fuulProjectAddress,
            ethers.parseEther("40000000")
        );

        // Deposit
        await this.fuulProject.depositFeeBudget(this.amount);

        // Apply to remove
        await this.fuulProject.applyToRemoveBudget();

        // Increase time

        const projectBudgetCooldown =
            await this.fuulFactory.projectBudgetCooldown();

        await time.increase(Number(projectBudgetCooldown) + 1);

        // Remove
        await this.fuulProject.removeFeeBudget(
            this.nftFeeCurrencyAddress,
            this.amount
        );

        // Budget info
        expect(
            await this.fuulProject.nftFeeBudget(this.nftFeeCurrencyAddress)
        ).to.equal(0);

        // Balance

        await expect(
            await this.nftFeeCurrency.balanceOf(this.fuulProjectAddress)
        ).to.equal(0);
    });

    it("Fail to remove if not applied or cooldown is not over, or removal window ended", async function () {
        // Remove before applying

        await expect(
            this.fuulProject.removeFeeBudget(this.nftFeeCurrencyAddress, this.amount)
        ).to.be.revertedWithCustomError(this.fuulProject, "NoRemovalApplication");

        // Remove before cooldown is complete
        await this.fuulProject.applyToRemoveBudget();

        await expect(
            this.fuulProject.removeFeeBudget(this.nftFeeCurrencyAddress, this.amount)
        ).to.be.revertedWithCustomError(this.fuulProject, "OutsideRemovalWindow");

        // Increase time
        const removeInfo = await this.fuulFactory.getBudgetRemoveInfo();

        await time.increase(
            Number(removeInfo[0]) + Number(removeInfo[1]) + 1
        );

        await expect(
            this.fuulProject.removeFeeBudget(this.nftFeeCurrencyAddress, this.amount)
        ).to.be.revertedWithCustomError(this.fuulProject, "OutsideRemovalWindow");
    });

    it("Should remove correctly & set correct values after changing fee currency", async function () {
        // Approve
        await this.nftFeeCurrency.approve(
            this.fuulProjectAddress,
            ethers.parseEther("40000000")
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

        await time.increase(Number(projectBudgetCooldown) + 1);

        // Remove
        await this.fuulProject.removeFeeBudget(
            this.nftFeeCurrencyAddress,
            this.amount
        );

        // Budget info
        expect(
            await this.fuulProject.nftFeeBudget(this.nftFeeCurrencyAddress)
        ).to.equal(0);

        // Balance

        await expect(
            await this.nftFeeCurrency.balanceOf(this.fuulProjectAddress)
        ).to.equal(0);
    });

    it("Should fail to deposit with amount equals to zero", async function () {
        await expect(
            this.fuulProject.depositFeeBudget(0)
        ).to.be.revertedWithCustomError(this.fuulProject, "ZeroAmount");
    });

    it("Should fail to deposit and remove if not admin role", async function () {
        const error = `AccessControl: account ${this.user2.address.toLowerCase()} is missing role ${this.adminRole
            }`;

        await expect(
            this.fuulProject.connect(this.user2).depositFeeBudget(this.amount)
        ).to.be.revertedWith(error);
    });
});
