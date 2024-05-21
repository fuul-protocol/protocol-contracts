const { expect } = require("chai");

const { setupTest } = require("./before-each-test");

describe("Fuul Factory - Create projects", function () {
    beforeEach(async function () {
        const { fuulFactory, fuulFactoryAddress, user1, user2, adminRole } = await setupTest(
            (deployProject = false)
        );

        this.fuulFactory = fuulFactory;
        this.fuulFactoryAddress = fuulFactoryAddress;
        this.user1 = user1;
        this.user2 = user2;
        this.adminRole = adminRole;

        this.projectURI = "projectURI";
    });

    it("Should deploy Fuul Project and sets roles correctly", async function () {
        const signer = this.user2.address;

        const tx = await this.fuulFactory
            .connect(this.user2)
            .createFuulProject(signer, signer, this.projectURI, signer);

        const receipt = await tx.wait();

        const log = receipt.logs?.filter((x) => {
            return x.fragment.name == "ProjectCreated";
        })[0];


        expect(log.fragment.name).to.equal("ProjectCreated");
        expect(log.args.projectId).to.equal(1);
        expect(log.args.eventSigner).to.equal(signer);
        expect(log.args.projectInfoURI).to.equal(this.projectURI);
        expect(log.args.clientFeeCollector).to.equal(signer);

        // Projects
        expect(await this.fuulFactory.totalProjectsCreated()).to.equal(1);

        const addressDeployed = log.args.deployedAddress;

        expect(addressDeployed).to.not.equal('0x0000000000000000000000000000000000000000');

        const FuulProject = await ethers.getContractFactory("FuulProject");
        const fuulProject = await FuulProject.attach(addressDeployed);

        expect(await fuulProject.fuulFactory()).to.equal(this.fuulFactoryAddress);

        expect(
            await fuulProject.hasRole(this.adminRole, this.user2.address)
        ).to.equal(true);

        expect(await fuulProject.projectInfoURI()).to.equal(this.projectURI);
        expect(await fuulProject.clientFeeCollector()).to.equal(signer);
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
        await this.fuulFactory.setNftFixedFeeAmount(this.newFee);

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
        const error = `AccessControl: account ${this.user2.address.toLowerCase()} is missing role ${this.adminRole
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
            this.fuulFactory.connect(this.user2).setNftFixedFeeAmount(this.newFee)
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
        const { fuulFactory, nft721Address, tokenAddress, user1, user2, adminRole } =
            await setupTest();

        this.fuulFactory = fuulFactory;
        this.tokenAddress = tokenAddress;
        this.user1 = user1;
        this.user2 = user2;
        this.adminRole = adminRole;

        this.newCurrency = nft721Address;
        this.newCurrencyType = 2;
        this.limit = ethers.parseEther("100");
    });

    it("Should add new currency", async function () {
        await this.fuulFactory.addCurrencyToken(
            this.newCurrency,
            this.newCurrencyType
        );

        const currency = await this.fuulFactory.acceptedCurrencies(
            this.newCurrency
        );

        expect(currency.isAccepted).to.equal(true);
        expect(currency.tokenType).to.equal(this.newCurrencyType);
    });

    it("Should remove currency", async function () {
        await this.fuulFactory.removeCurrencyToken(this.tokenAddress);

        const currency = await this.fuulFactory.acceptedCurrencies(this.tokenAddress);

        expect(currency.isAccepted).to.equal(false);
    });

    it("Should fail to add and remove currency if not admin role", async function () {
        const error = `AccessControl: account ${this.user2.address.toLowerCase()} is missing role ${this.adminRole
            }`;

        // Add currency
        await expect(
            this.fuulFactory
                .connect(this.user2)
                .addCurrencyToken(this.newCurrency, this.newCurrencyType)
        ).to.be.revertedWith(error);

        // Remove currency
        const removeCurrency = this.tokenAddress;

        await expect(
            this.fuulFactory.connect(this.user2).removeCurrencyToken(removeCurrency)
        ).to.be.revertedWith(error);
    });

    it("Should fail to add currency if incorrect arguments are passed", async function () {
        // Token already accepted

        await expect(
            this.fuulFactory.addCurrencyToken(this.tokenAddress, 1)
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

describe("Fuul Factory - Remove variables management", function () {
    beforeEach(async function () {
        const { fuulFactory, user1, user2, adminRole } = await setupTest();

        this.fuulFactory = fuulFactory;
        this.user1 = user1;
        this.user2 = user2;
        this.adminRole = adminRole;

        // 10 days
        this.newPeriod = 10 * 86400;
    });

    it("Should set new budget cooldown", async function () {
        await this.fuulFactory.setProjectBudgetCooldown(this.newPeriod);

        expect(await this.fuulFactory.projectBudgetCooldown()).to.equal(
            this.newPeriod
        );
    });

    it("Should set new budget removal period", async function () {
        await this.fuulFactory.setProjectRemoveBudgetPeriod(this.newPeriod);

        expect(await this.fuulFactory.projectRemoveBudgetPeriod()).to.equal(
            this.newPeriod
        );
    });

    it("Should fail to set new periods if not admin role", async function () {
        const error = `AccessControl: account ${this.user2.address.toLowerCase()} is missing role ${this.adminRole
            }`;

        // Set budget cooldown
        await expect(
            this.fuulFactory
                .connect(this.user2)
                .setProjectBudgetCooldown(this.newPeriod)
        ).to.be.revertedWith(error);

        // Set budget remove period
        await expect(
            this.fuulFactory
                .connect(this.user2)
                .setProjectRemoveBudgetPeriod(this.newPeriod)
        ).to.be.revertedWith(error);
    });

    it("Should fail to set budget cooldown if incorrect arguments are passed", async function () {
        const newPeriod = await this.fuulFactory.projectBudgetCooldown();

        await expect(
            this.fuulFactory.setProjectBudgetCooldown(newPeriod)
        ).to.be.revertedWithCustomError(this.fuulFactory, "InvalidArgument");
    });

    it("Should fail to set budget remove period if incorrect arguments are passed", async function () {
        const newPeriod = await this.fuulFactory.projectRemoveBudgetPeriod();

        await expect(
            this.fuulFactory.setProjectRemoveBudgetPeriod(newPeriod)
        ).to.be.revertedWithCustomError(this.fuulFactory, "InvalidArgument");

        const belowLimitPeriod = 1;

        await expect(
            this.fuulFactory.setProjectRemoveBudgetPeriod(belowLimitPeriod)
        ).to.be.revertedWithCustomError(this.fuulFactory, "InvalidArgument");
    });
});
