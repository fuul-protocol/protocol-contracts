const { expect } = require("chai");

const { setupTest } = require("./before-each-test");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Fuul Manager - Claim variables management", function () {
  beforeEach(async function () {
    const { fuulManager, user1, user2, adminRole } = await setupTest();

    this.fuulManager = fuulManager;
    this.user1 = user1;
    this.user2 = user2;
    this.adminRole = adminRole;

    this.newPeriod = 5;
  });

  it("Should set new claim cooldown", async function () {
    await this.fuulManager.setClaimCooldown(this.newPeriod);

    expect(await this.fuulManager.claimCooldown()).to.equal(this.newPeriod);
  });

  it("Should fail to set new periods if not admin role", async function () {
    const error = `AccessControl: account ${this.user2.address.toLowerCase()} is missing role ${
      this.adminRole
    }`;

    // Set claim cooldown
    await expect(
      this.fuulManager.connect(this.user2).setClaimCooldown(this.newPeriod)
    ).to.be.revertedWith(error);
  });

  it("Should fail to set claim cooldown if incorrect arguments are passed", async function () {
    const newPeriod = await this.fuulManager.claimCooldown();

    await expect(
      this.fuulManager.setClaimCooldown(newPeriod)
    ).to.be.revertedWithCustomError(this.fuulManager, "InvalidArgument");
  });
});

describe("Fuul Manager - Token currency management", function () {
  beforeEach(async function () {
    const { fuulManager, nft721, token, user1, user2, adminRole, limitAmount } =
      await setupTest();

    this.fuulManager = fuulManager;
    this.nft721 = nft721;
    this.token = token;
    this.user1 = user1;
    this.user2 = user2;
    this.adminRole = adminRole;
    this.limitAmount = limitAmount;

    this.newCurrency = this.nft721.address;
    this.limit = ethers.utils.parseEther("100");
  });

  it("Should add new currency", async function () {
    await this.fuulManager.addCurrencyLimit(this.newCurrency, this.limit);

    const currency = await this.fuulManager.currencyLimits(this.newCurrency);

    expect(currency.claimLimitPerCooldown).to.equal(this.limit);
    expect(currency.cumulativeClaimPerCooldown).to.equal(0);
    expect(Number(currency.claimCooldownPeriodStarted)).to.be.greaterThan(0);
  });

  it("Should set new currency limit", async function () {
    const limit = 2;
    await this.fuulManager.setCurrencyTokenLimit(this.token.address, limit);

    const currency = await this.fuulManager.currencyLimits(this.token.address);

    expect(currency.claimLimitPerCooldown).to.equal(limit);
  });

  it("Should fail to add and set limit for a currency if not admin role", async function () {
    const error = `AccessControl: account ${this.user2.address.toLowerCase()} is missing role ${
      this.adminRole
    }`;

    // Add currency
    await expect(
      this.fuulManager
        .connect(this.user2)
        .addCurrencyLimit(this.newCurrency, this.limit)
    ).to.be.revertedWith(error);

    // Set token limit

    await expect(
      this.fuulManager
        .connect(this.user2)
        .setCurrencyTokenLimit(this.newCurrency, this.limit)
    ).to.be.revertedWith(error);
  });

  it("Should fail to add currency if incorrect arguments are passed", async function () {
    // Limit = 0

    await expect(
      this.fuulManager.addCurrencyLimit(this.newCurrency, 0)
    ).to.be.revertedWithCustomError(this.fuulManager, "InvalidArgument");
  });

  it("Should fail to set new token limit if incorrect arguments are passed", async function () {
    // Same token type value
    await expect(
      this.fuulManager.setCurrencyTokenLimit(
        this.token.address,
        this.limitAmount
      )
    ).to.be.revertedWithCustomError(this.fuulManager, "InvalidArgument");
  });
});

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
      user3,
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
    this.partner = user2;
    this.endUser = user3;
    this.clientFeeCollector = clientFeeCollector;
    this.attributor = user4;
    this.nftFeeCurrency = nftFeeCurrency;
    this.protocolFeeCollector = protocolFeeCollector;

    this.projectURI = "projectURI";

    this.limitAmount = limitAmount;

    this.amount = ethers.utils.parseEther("1000");

    this.attributedAmount = ethers.utils.parseEther("500");

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
    await this.fuulFactory.addCurrencyToken(nft721.address, 2);

    await this.nft721.setApprovalForAll(this.fuulProject.address, true);

    await this.fuulProject.depositNFTToken(nft721.address, this.tokenIds, []);

    // Deposit ERC1155

    await this.fuulFactory.addCurrencyToken(nft1155.address, 3);

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

    this.proofWithoutProject = ethers.utils.formatBytes32String("proof");

    const proof = ethers.utils.solidityKeccak256(
      ["bytes32", "address"],
      [this.proofWithoutProject, this.fuulProject.address]
    );

    // Attribution template
    this.attributionTemplate = {
      partner: this.partner.address,
      endUser: this.endUser.address,
      proof,
      proofWithoutProject: this.proofWithoutProject,
    };

    this.feesInfo = await this.fuulFactory.getAllFees();

    this.nftFixedFeeAmountInEth = ethers.utils.formatEther(
      this.feesInfo.nftFixedFeeAmount.toString()
    );
  });

  it("Should attribute from different currencies and set correct values for users and fee collectors", async function () {
    // Attibution entities

    const proofs = [];
    for (let i = 1; i < 4; i++) {
      let proofWOProject = ethers.utils.formatBytes32String("proof" + i);
      let proof = ethers.utils.solidityKeccak256(
        ["bytes32", "address"],
        [proofWOProject, this.fuulProject.address]
      );

      proofs.push([proofWOProject, proof]);
    }

    const attributionEntity = {
      projectAddress: this.fuulProject.address,
      projectAttributions: [
        {
          ...this.attributionTemplate,
          currency: this.token.address,
          amountToPartner: this.attributedAmount,
          amountToEndUser: this.attributedAmount,
        },
        {
          ...this.attributionTemplate,
          currency: ethers.constants.AddressZero,
          amountToPartner: this.attributedAmount,
          amountToEndUser: this.attributedAmount,
          proofWithoutProject: proofs[0][0],
          proof: proofs[0][1],
        },
        {
          ...this.attributionTemplate,
          currency: this.nft721.address,
          amountToPartner: this.tokenIds.length / 2,
          amountToEndUser: this.tokenIds.length / 2,
          proofWithoutProject: proofs[1][0],
          proof: proofs[1][1],
        },
        {
          ...this.attributionTemplate,
          currency: this.nft1155.address,
          amountToPartner: this.tokenAmount / 2,
          amountToEndUser: this.tokenAmount / 2,
          proofWithoutProject: proofs[2][0],
          proof: proofs[2][1],
        },
      ],
    };

    // Attribute
    await this.fuulManager.attributeConversions(
      [attributionEntity],
      this.attributor.address
    );

    // Check data

    for (let att of attributionEntity.projectAttributions) {
      // Budget
      let budget = await this.fuulProject.budgets(att.currency);
      expect(budget).to.equal(0);

      // Proof
      expect(await this.fuulProject.attributionProofs(att.proof)).to.equal(
        true
      );

      if ([this.nft721.address, this.nft1155.address].includes(att.currency)) {
        // For NFTs fees are separated

        // Partner and end user
        expect(
          await this.fuulProject.availableToClaim(
            this.partner.address,
            att.currency
          )
        ).to.equal(att.amountToPartner);

        expect(
          await this.fuulProject.availableToClaim(
            this.endUser.address,
            att.currency
          )
        ).to.equal(att.amountToEndUser);

        // Fee collectors

        // Fees will be double because it gets from attributing nft721 and nft1155 at the same time

        // Attributor
        const attributorFee =
          (2 * this.nftFixedFeeAmountInEth * this.feesInfo.attributorFee) /
          10000;

        expect(
          await this.fuulProject.availableToClaim(
            this.attributor.address,
            this.feesInfo.nftFeeCurrency
          )
        ).to.equal(ethers.utils.parseEther(attributorFee.toString()));

        // Client
        const clientFee =
          (2 * this.nftFixedFeeAmountInEth * this.feesInfo.clientFee) / 10000;

        expect(
          await this.fuulProject.availableToClaim(
            this.clientFeeCollector.address,
            this.feesInfo.nftFeeCurrency
          )
        ).to.equal(ethers.utils.parseEther(clientFee.toString()));

        // Protocol
        const protocolFee =
          (2 * this.nftFixedFeeAmountInEth * this.feesInfo.protocolFee) / 10000;

        expect(
          await this.fuulProject.availableToClaim(
            this.protocolFeeCollector.address,
            this.feesInfo.nftFeeCurrency
          )
        ).to.equal(ethers.utils.parseEther(protocolFee.toString()));
      } else {
        const amountToEndUserInEth = Number(
          ethers.utils.formatEther(att.amountToEndUser.toString())
        );
        const amountToPartnerInEth = Number(
          ethers.utils.formatEther(att.amountToPartner.toString())
        );
        // Fee collectors
        // For fungible, fees will be charged in the same currency
        // Attributor
        const totalAmountInEth = amountToPartnerInEth + amountToEndUserInEth;
        const attributorFee =
          (totalAmountInEth * this.feesInfo.attributorFee) / 10000;
        expect(
          await this.fuulProject.availableToClaim(
            this.attributor.address,
            att.currency
          )
        ).to.equal(ethers.utils.parseEther(attributorFee.toString()));
        // Client
        const clientFee = (totalAmountInEth * this.feesInfo.clientFee) / 10000;
        expect(
          await this.fuulProject.availableToClaim(
            this.clientFeeCollector.address,
            att.currency
          )
        ).to.equal(ethers.utils.parseEther(clientFee.toString()));

        // Protocol
        const protocolFee =
          (totalAmountInEth * this.feesInfo.protocolFee) / 10000;
        expect(
          await this.fuulProject.availableToClaim(
            this.protocolFeeCollector.address,
            att.currency
          )
        ).to.equal(ethers.utils.parseEther(protocolFee.toString()));

        // Partner and end user
        const netEachAmountInEth =
          (totalAmountInEth - (protocolFee + attributorFee + clientFee)) / 2;
        expect(
          await this.fuulProject.availableToClaim(
            this.partner.address,
            att.currency
          )
        ).to.equal(ethers.utils.parseEther(netEachAmountInEth.toString()));
        expect(
          await this.fuulProject.availableToClaim(
            this.endUser.address,
            att.currency
          )
        ).to.equal(ethers.utils.parseEther(netEachAmountInEth.toString()));
      }
    }
  });

  it("Should attribute from different projects and set correct values for users and fee collectors", async function () {
    // Create a new project

    const tx = await this.fuulFactory.createFuulProject(
      this.user1.address,
      this.user1.address,
      this.projectURI,
      this.clientFeeCollector.address
    );

    const receipt = await tx.wait();

    const event = receipt.events?.filter((x) => {
      return x.event == "ProjectCreated";
    })[0];

    const newFuulProjectAddress = event.args.deployedAddress;

    const NewFuulProject = await ethers.getContractFactory("FuulProject");
    const newFuulProject = await NewFuulProject.attach(newFuulProjectAddress);

    const currency = ethers.constants.AddressZero;

    await newFuulProject.depositFungibleToken(currency, this.amount, {
      value: this.amount,
    });

    // Attibution entities
    const attributionEntities = [
      {
        projectAddress: this.fuulProject.address,
        projectAttributions: [
          {
            ...this.attributionTemplate,
            currency,
            amountToPartner: this.attributedAmount,
            amountToEndUser: this.attributedAmount,
          },
        ],
      },
      {
        projectAddress: newFuulProject.address,
        projectAttributions: [
          {
            ...this.attributionTemplate,
            currency,
            amountToPartner: this.attributedAmount,
            amountToEndUser: this.attributedAmount,
            proofWithoutProject: this.proofWithoutProject,
            proof: ethers.utils.solidityKeccak256(
              ["bytes32", "address"],
              [this.proofWithoutProject, newFuulProject.address]
            ),
          },
        ],
      },
    ];

    // Attribute
    await this.fuulManager.attributeConversions(
      attributionEntities,
      this.attributor.address
    );

    // Check proofs
    expect(
      await this.fuulProject.attributionProofs(this.attributionTemplate.proof)
    ).to.equal(true);

    // Check balances

    const amountToEndUserInEth = Number(
      ethers.utils.formatEther(
        attributionEntities[0].projectAttributions[0].amountToEndUser.toString()
      )
    );

    const amountToPartnerInEth = Number(
      ethers.utils.formatEther(
        attributionEntities[0].projectAttributions[0].amountToPartner.toString()
      )
    );

    // Fee collectors

    // Attributor

    const totalAmountInEth = amountToPartnerInEth + amountToEndUserInEth;
    const attributorFee =
      (totalAmountInEth * this.feesInfo.attributorFee) / 10000;

    // Client
    const clientFee = (totalAmountInEth * this.feesInfo.clientFee) / 10000;

    // Protocol
    const protocolFee = (totalAmountInEth * this.feesInfo.protocolFee) / 10000;

    const netEachAmountInEth =
      (totalAmountInEth - (protocolFee + attributorFee + clientFee)) / 2;

    for (let project of [this.fuulProject, newFuulProject]) {
      // Attributor
      expect(
        await project.availableToClaim(this.attributor.address, currency)
      ).to.equal(ethers.utils.parseEther(attributorFee.toString()));

      // Client
      expect(
        await project.availableToClaim(
          this.clientFeeCollector.address,
          currency
        )
      ).to.equal(ethers.utils.parseEther(clientFee.toString()));

      // Protocol
      expect(
        await project.availableToClaim(
          this.protocolFeeCollector.address,
          currency
        )
      ).to.equal(ethers.utils.parseEther(protocolFee.toString()));

      // Partner and end user

      expect(
        await project.availableToClaim(this.partner.address, currency)
      ).to.equal(ethers.utils.parseEther(netEachAmountInEth.toString()));

      expect(
        await project.availableToClaim(this.endUser.address, currency)
      ).to.equal(ethers.utils.parseEther(netEachAmountInEth.toString()));
    }
  });

  it("Should fail to attribute if campaign has insufficient balance", async function () {
    const attributionEntity = {
      projectAddress: this.fuulProject.address,
      projectAttributions: [
        {
          ...this.attributionTemplate,
          currency: this.token.address,
          amountToPartner: this.amount,
          amountToEndUser: this.amount,
        },
      ],
    };
    await expect(this.fuulManager.attributeConversions([attributionEntity])).to
      .be.revertedWithPanic;
  });

  it("Should fail to attribute if not attributor role", async function () {
    const attributorRole = await this.fuulManager.ATTRIBUTOR_ROLE();
    const error = `AccessControl: account ${this.partner.address.toLowerCase()} is missing role ${attributorRole}`;

    const attributionEntity = {
      projectAddress: this.fuulProject.address,
      projectAttributions: [
        {
          ...this.attributionTemplate,
          currency: this.token.address,
          amountToPartner: this.amount,
          amountToEndUser: this.amount,
        },
      ],
    };

    await expect(
      this.fuulManager
        .connect(this.partner)
        .attributeConversions([attributionEntity], this.attributor.address)
    ).to.be.revertedWith(error);
  });

  it("Should fail to attribute if contract is paused", async function () {
    await this.fuulManager.pauseAll();

    const attributionEntity = {
      projectAddress: this.fuulProject.address,
      projectAttributions: [
        {
          ...this.attributionTemplate,
          currency: this.token.address,
          amountToPartner: this.amount,
          amountToEndUser: this.amount,
        },
      ],
    };

    await expect(
      this.fuulManager.attributeConversions(
        [attributionEntity],
        this.attributor.address
      )
    ).to.be.revertedWith("Pausable: paused");
  });
});

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
      limitAmount,
      nftFeeCurrency,
      protocolFeeCollector,
      clientFeeCollector,
      provider,
    } = await setupTest();

    this.provider = provider;
    this.fuulManager = fuulManager;
    this.fuulProject = fuulProject;
    this.fuulFactory = fuulFactory;
    this.token = token;
    this.nft721 = nft721;
    this.nft1155 = nft1155;
    this.user1 = user1;
    this.partner = user2;
    this.endUser = user3;
    this.clientFeeCollector = clientFeeCollector;
    this.attributor = user4;
    this.nftFeeCurrency = nftFeeCurrency;
    this.protocolFeeCollector = protocolFeeCollector;

    this.projectURI = "projectURI";

    this.limitAmount = limitAmount;

    this.amount = ethers.utils.parseEther("1000");

    this.attributedAmount = ethers.utils.parseEther("500");

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
    await this.fuulFactory.addCurrencyToken(nft721.address, 2);

    await this.fuulManager.addCurrencyLimit(nft721.address, this.tokenAmount);

    await this.nft721.setApprovalForAll(this.fuulProject.address, true);

    await this.fuulProject.depositNFTToken(nft721.address, this.tokenIds, []);

    // Deposit ERC1155

    await this.fuulFactory.addCurrencyToken(nft1155.address, 3);

    await this.fuulManager.addCurrencyLimit(nft1155.address, this.tokenAmount);

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

    const proofs = [];
    for (let i = 1; i < 5; i++) {
      let proofWOProject = ethers.utils.formatBytes32String("proof" + i);
      let proof = ethers.utils.solidityKeccak256(
        ["bytes32", "address"],
        [proofWOProject, this.fuulProject.address]
      );

      proofs.push([proofWOProject, proof]);
    }

    const proofWithoutProject = ethers.utils.formatBytes32String("proof");

    // Attribute
    this.attributionTemplate = {
      partner: this.partner.address,
      endUser: this.endUser.address,
      proofWithoutProject,
      proof: ethers.utils.solidityKeccak256(
        ["bytes32", "address"],
        [proofWithoutProject, this.fuulProject.address]
      ),
    };

    this.attributionEntity = {
      projectAddress: this.fuulProject.address,
      projectAttributions: [
        {
          ...this.attributionTemplate,
          currency: this.token.address,
          amountToPartner: this.attributedAmount,
          amountToEndUser: this.attributedAmount,
          proofWithoutProject: proofs[0][0],
          proof: proofs[0][1],
        },
        {
          ...this.attributionTemplate,
          currency: ethers.constants.AddressZero,
          amountToPartner: this.attributedAmount,
          amountToEndUser: this.attributedAmount,
          proofWithoutProject: proofs[1][0],
          proof: proofs[1][1],
        },
        {
          ...this.attributionTemplate,
          currency: this.nft721.address,
          amountToPartner: 2,
          amountToEndUser: 2,
          proofWithoutProject: proofs[2][0],
          proof: proofs[2][1],
        },
        {
          ...this.attributionTemplate,
          currency: this.nft1155.address,
          amountToPartner: 2,
          amountToEndUser: 2,
          proofWithoutProject: proofs[3][0],
          proof: proofs[3][1],
        },
      ],
    };

    await this.fuulManager.attributeConversions(
      [this.attributionEntity],
      this.attributor.address
    );
  });

  it("Should claim erc20 from different projects and set correct values", async function () {
    // Create a new project

    const currency = this.token.address;

    const tx = await this.fuulFactory.createFuulProject(
      this.user1.address,
      this.user1.address,
      this.projectURI,
      this.clientFeeCollector.address
    );

    const receipt = await tx.wait();

    const event = receipt.events?.filter((x) => {
      return x.event == "ProjectCreated";
    })[0];

    const newFuulProjectAddress = event.args.deployedAddress;

    const NewFuulProject = await ethers.getContractFactory("FuulProject");
    const newFuulProject = await NewFuulProject.attach(newFuulProjectAddress);

    await this.token.approve(
      newFuulProject.address,
      ethers.utils.parseEther("40000000")
    );

    await newFuulProject.depositFungibleToken(currency, this.amount);

    const proofWithoutProject = ethers.utils.formatBytes32String("proof");
    const proof = ethers.utils.solidityKeccak256(
      ["bytes32", "address"],
      [proofWithoutProject, newFuulProject.address]
    );

    // Attribute in new project
    const attributionEntity = {
      projectAddress: newFuulProject.address,
      projectAttributions: [
        {
          ...this.attributionTemplate,
          currency,
          amountToPartner: this.attributedAmount,
          amountToEndUser: this.attributedAmount,
          proofWithoutProject,
          proof,
        },
      ],
    };

    await this.fuulManager.attributeConversions(
      [attributionEntity],
      this.attributor.address
    );

    // Claim ERC20

    const claimer = this.partner;

    const projectClaimAmount = await this.fuulProject.availableToClaim(
      claimer.address,
      currency
    );

    claimChecks = [
      {
        projectAddress: this.fuulProject.address,
        currency,
        amount: projectClaimAmount,
        tokenIds: [],
        amounts: [],
      },
      {
        projectAddress: newFuulProject.address,
        currency,
        amount: projectClaimAmount,
        tokenIds: [],
        amounts: [],
      },
    ];

    await this.fuulManager.connect(claimer).claim(claimChecks);

    // Check users balances in project contracts

    // Project 1
    expect(
      await this.fuulProject.availableToClaim(claimer.address, currency)
    ).to.equal(0);

    // Project 1
    expect(
      await newFuulProject.availableToClaim(claimer.address, currency)
    ).to.equal(0);

    // Check users claims in manager contracts

    const amountEth = ethers.utils.formatEther(projectClaimAmount);

    const expectedAmount = ethers.utils.parseEther(
      (Number(amountEth) * 2).toString()
    );

    expect(
      await this.fuulManager.usersClaims(claimer.address, currency)
    ).to.equal(expectedAmount);

    // Set currency info

    const currencyObject = await this.fuulManager.currencyLimits(currency);

    expect(currencyObject.cumulativeClaimPerCooldown).to.equal(expectedAmount);
    expect(Number(currencyObject.claimCooldownPeriodStarted)).to.be.greaterThan(
      0
    );

    // User balance
    expect(await this.token.balanceOf(claimer.address)).to.equal(
      expectedAmount
    );
  });

  it("Should claim native tokens and set correct values", async function () {
    const currency = ethers.constants.AddressZero;
    const claimer = this.partner;
    const claimAmount = await this.fuulProject.availableToClaim(
      claimer.address,
      currency
    );

    claimChecks = [
      {
        projectAddress: this.fuulProject.address,
        currency,
        amount: claimAmount,
        tokenIds: [],
        amounts: [],
      },
    ];

    const balanceBefore = await this.provider.getBalance(claimer.address);

    await this.fuulManager.connect(claimer).claim(claimChecks);

    const balanceAfter = await this.provider.getBalance(claimer.address);

    // Check users balances in project contracts

    expect(
      await this.fuulProject.availableToClaim(claimer.address, currency)
    ).to.equal(0);

    // Check users claims in manager contracts

    expect(
      await this.fuulManager.usersClaims(claimer.address, currency)
    ).to.equal(claimAmount);

    // Set currency info

    const currencyObject = await this.fuulManager.currencyLimits(currency);

    expect(currencyObject.cumulativeClaimPerCooldown).to.equal(claimAmount);
    expect(Number(currencyObject.claimCooldownPeriodStarted)).to.be.greaterThan(
      0
    );

    // User & contract balance
    const balanceDiff =
      ethers.utils.formatEther(balanceAfter.toString()) -
      ethers.utils.formatEther(balanceBefore.toString());

    expect(balanceDiff).to.be.greaterThan(0);
  });

  it("Should claim nfts 721 and 1155 and set correct values", async function () {
    const claimer = this.partner;

    const tokenIds = [1, 2];
    const amounts = [1, 1];

    claimChecks = [
      {
        projectAddress: this.fuulProject.address,
        currency: this.nft721.address,
        amount: tokenIds.length,
        tokenIds,
        amounts: [],
      },
      {
        projectAddress: this.fuulProject.address,
        currency: this.nft1155.address,
        amount: tokenIds.length,
        tokenIds,
        amounts: amounts,
      },
    ];

    await this.fuulManager.connect(claimer).claim(claimChecks);

    // Check users balances in project contracts

    const currencies = [this.nft721.address, this.nft1155.address];
    for (let currency of currencies) {
      expect(
        await this.fuulProject.availableToClaim(claimer.address, currency)
      ).to.equal(0);

      expect(
        await this.fuulManager.usersClaims(claimer.address, currency)
      ).to.equal(tokenIds.length);

      // Set currency info

      const currencyObject = await this.fuulManager.currencyLimits(currency);

      expect(currencyObject.cumulativeClaimPerCooldown).to.equal(
        tokenIds.length
      );
      expect(
        Number(currencyObject.claimCooldownPeriodStarted)
      ).to.be.greaterThan(0);
    }

    // User balance
    expect(await this.nft721.balanceOf(claimer.address)).to.equal(2);

    expect(await this.nft1155.balanceOf(claimer.address, tokenIds[0])).to.equal(
      amounts[0]
    );
    expect(await this.nft1155.balanceOf(claimer.address, tokenIds[1])).to.equal(
      amounts[1]
    );
  });

  it("Should claim after removing token", async function () {
    const claimer = this.partner;

    const currency = this.nft721.address;

    // Remove token

    await this.fuulFactory.removeCurrencyToken(currency);

    const tokenIds = [1, 2];

    // Claim

    claimChecks = [
      {
        projectAddress: this.fuulProject.address,
        currency,
        amount: tokenIds.length,
        tokenIds,
        amounts: [],
      },
    ];

    // Claim
    await this.fuulManager.connect(claimer).claim(claimChecks);

    // Check users balances in project contract

    expect(
      await this.fuulProject.availableToClaim(claimer.address, currency)
    ).to.equal(0);

    expect(
      await this.fuulManager.usersClaims(claimer.address, currency)
    ).to.equal(tokenIds.length);

    // Check users claims in manager contracts

    expect(
      await this.fuulManager.usersClaims(claimer.address, currency)
    ).to.equal(tokenIds.length);

    // User balance
    const balance = await this.nft721.balanceOf(claimer.address);

    await expect(balance).to.equal(tokenIds.length);

    for (let token of tokenIds) {
      expect(await this.nft721.ownerOf(token)).to.equal(claimer.address);
    }
  });

  it("Should claim over the limit after passing cooldown period", async function () {
    const currency = this.token.address;

    // Claim
    const claimer = this.partner;
    const claimAmount = await this.fuulProject.availableToClaim(
      claimer.address,
      currency
    );

    claimChecks = [
      {
        projectAddress: this.fuulProject.address,
        currency,
        amount: claimAmount,
        tokenIds: [],
        amounts: [],
      },
    ];

    await this.fuulManager.connect(claimer).claim(claimChecks);

    // Deposit and attribute new

    await this.fuulProject.depositFungibleToken(currency, this.limitAmount);

    // Attribute

    const attributionEntity = {
      projectAddress: this.fuulProject.address,
      projectAttributions: [
        {
          ...this.attributionTemplate,
          currency,
          amountToPartner: this.limitAmount,
          amountToEndUser: 0,
        },
      ],
    };

    await this.fuulManager.attributeConversions(
      [attributionEntity],
      this.attributor.address
    );

    // Increase time
    const cooldown = await this.fuulManager.claimCooldown();

    await time.increase(cooldown.toNumber() + 1);

    // Claim again

    const claimAmountAfter = await this.fuulProject.availableToClaim(
      claimer.address,
      currency
    );

    claimChecks = [
      {
        projectAddress: this.fuulProject.address,
        currency,
        amount: claimAmountAfter,
        tokenIds: [],
        amounts: [],
      },
    ];

    await this.fuulManager.connect(claimer).claim(claimChecks);

    expect(
      await this.fuulProject.availableToClaim(claimer.address, currency)
    ).to.equal(0);
  });

  it("Should fail when user has nothing to claim", async function () {
    claimChecks = [
      {
        projectAddress: this.fuulProject.address,
        currency: this.token.address,
        amount: 1,
        tokenIds: [],
        amounts: [],
      },
    ];

    await expect(this.fuulManager.claim(claimChecks)).to.be.reverted;
  });

  it("Should fail to claim if contract is paused", async function () {
    await this.fuulManager.pauseAll();

    claimChecks = [
      {
        projectAddress: this.fuulProject.address,
        currency: this.token.address,
        amount: 1,
        tokenIds: [],
        amounts: [],
      },
    ];

    await expect(this.fuulManager.claim(claimChecks)).to.be.revertedWith(
      "Pausable: paused"
    );
  });

  it("Should fail to claim over the limit", async function () {
    const currency = this.token.address;

    amount = 2 * this.limitAmount;

    amountInEth = 2 * ethers.utils.formatEther(this.limitAmount);

    amount = ethers.utils.parseEther(amountInEth.toString());

    await this.fuulProject.depositFungibleToken(currency, amount);

    // Attribute

    const attributionEntity = {
      projectAddress: this.fuulProject.address,
      projectAttributions: [
        {
          ...this.attributionTemplate,
          currency,
          amountToPartner: amount,
          amountToEndUser: 0,
        },
      ],
    };

    await this.fuulManager.attributeConversions(
      [attributionEntity],
      this.attributor.address
    );

    // Claim
    const claimer = this.partner;
    const claimAmount = await this.fuulProject.availableToClaim(
      claimer.address,
      currency
    );

    claimChecks = [
      {
        projectAddress: this.fuulProject.address,
        currency,
        amount: claimAmount,
        tokenIds: [],
        amounts: [],
      },
    ];
    await expect(
      this.fuulManager.connect(claimer).claim(claimChecks)
    ).to.be.revertedWithCustomError(this.fuulManager, "OverTheLimit");
  });

  it("Should fail to claim over the limit in 2 txs", async function () {
    const currency = this.token.address;

    // Claim
    const claimer = this.partner;
    const claimAmount = await this.fuulProject.availableToClaim(
      claimer.address,
      currency
    );

    claimChecks = [
      {
        projectAddress: this.fuulProject.address,
        currency,
        amount: claimAmount,
        tokenIds: [],
        amounts: [],
      },
    ];

    await this.fuulManager.connect(claimer).claim(claimChecks);

    // Deposit and attribute new

    // Add fees to limit amount
    const limitEth = ethers.utils.formatEther(this.limitAmount);

    const protocolFee = await this.fuulFactory.protocolFee();
    const clientFee = await this.fuulFactory.clientFee();
    const attributorFee = await this.fuulFactory.attributorFee();

    const totalFee =
      (protocolFee.toNumber() +
        clientFee.toNumber() +
        attributorFee.toNumber()) /
      10000;

    const limitWithFeesEth = limitEth * (1 + totalFee);

    const limitWithFees = ethers.utils.parseEther(limitWithFeesEth.toString());

    await this.fuulProject.depositFungibleToken(currency, limitWithFees);

    // Attribute

    const attributionEntity = {
      projectAddress: this.fuulProject.address,
      projectAttributions: [
        {
          ...this.attributionTemplate,
          currency,
          amountToPartner: limitWithFees,
          amountToEndUser: 0,
        },
      ],
    };

    await this.fuulManager.attributeConversions(
      [attributionEntity],
      this.attributor.address
    );

    // Claim again
    const claimAmountAfter = await this.fuulProject.availableToClaim(
      claimer.address,
      currency
    );

    console.log("claimed", ethers.utils.formatEther(claimAmountAfter));

    claimChecks = [
      {
        projectAddress: this.fuulProject.address,
        currency,
        amount: claimAmountAfter,
        tokenIds: [],
        amounts: [],
      },
    ];
    await expect(
      this.fuulManager.connect(claimer).claim(claimChecks)
    ).to.be.revertedWithCustomError(this.fuulManager, "OverTheLimit");
  });
});
