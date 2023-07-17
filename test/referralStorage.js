const { expect } = require("chai");

const { setupReferralStorageTest } = require("./before-each-test");

describe("Ref Storage - Register", function () {
  beforeEach(async function () {
    const { fuulReferralStorage, user1 } = await setupReferralStorageTest();

    this.fuulReferralStorage = fuulReferralStorage;
    this.user1 = user1;

    this.stringCode = "code";
    this.code = ethers.utils.formatBytes32String(this.stringCode);
  });

  it("Should register new code", async function () {
    expect(await this.fuulReferralStorage.registerCode(this.code))
      .to.emit(this.fuulReferralStorage, "CodeRegistered")
      .withArgs(this.user1.address, this.code);

    expect(await this.fuulReferralStorage.codeOwners(this.code)).to.equal(
      this.user1.address
    );
  });

  it("Should fail to register if code is empty", async function () {
    const code = ethers.utils.formatBytes32String("");
    await expect(
      this.fuulReferralStorage.registerCode(code)
    ).to.be.revertedWithCustomError(this.fuulReferralStorage, "InvalidCode");
  });

  it("Should fail to register if code is already used", async function () {
    await this.fuulReferralStorage.registerCode(this.code);

    await expect(
      this.fuulReferralStorage.registerCode(this.code)
    ).to.be.revertedWithCustomError(this.fuulReferralStorage, "AlreadyExists");
  });
});

describe("Ref Storage - Update code owner", function () {
  beforeEach(async function () {
    const { fuulReferralStorage, adminRole, user1, user2 } =
      await setupReferralStorageTest();

    this.fuulReferralStorage = fuulReferralStorage;
    this.user1 = user1;
    this.user2 = user2;
    this.adminRole = adminRole;

    this.stringCode = "code";
    this.code = ethers.utils.formatBytes32String(this.stringCode);

    await this.fuulReferralStorage.registerCode(this.code);
  });

  it("Should update code owner", async function () {
    expect(
      await this.fuulReferralStorage.updateCodeOwner(
        this.code,
        this.user2.address
      )
    )
      .to.emit(this.fuulReferralStorage, "CodeOwnerUpdated")
      .withArgs(this.user1.address, this.user2.address, this.code);

    expect(await this.fuulReferralStorage.codeOwners(this.code)).to.equal(
      this.user2.address
    );
  });

  it("Should admin update owner", async function () {
    const code = ethers.utils.formatBytes32String("newCode");

    await this.fuulReferralStorage.connect(this.user2).registerCode(code);

    expect(
      await this.fuulReferralStorage.adminUpdateCodeOwner(
        code,
        this.user2.address
      )
    )
      .to.emit(this.fuulReferralStorage, "CodeOwnerUpdated")
      .withArgs(this.user1.address, this.user2.address, code);

    expect(await this.fuulReferralStorage.codeOwners(code)).to.equal(
      this.user2.address
    );
  });

  it("Should fail to update owner if zero address", async function () {
    await expect(
      this.fuulReferralStorage.updateCodeOwner(
        this.code,
        ethers.constants.AddressZero
      )
    ).to.be.revertedWithCustomError(this.fuulReferralStorage, "ZeroAddress");
  });

  it("Should fail to update owner if user is not the owner", async function () {
    await expect(
      this.fuulReferralStorage
        .connect(this.user2)
        .updateCodeOwner(this.code, this.user2.address)
    ).to.be.revertedWithCustomError(this.fuulReferralStorage, "Unauthorized");
  });

  it("Should fail to admin update owner if code is unregistered", async function () {
    const code = ethers.utils.formatBytes32String("newCode");
    await expect(
      this.fuulReferralStorage.adminUpdateCodeOwner(code, this.user2.address)
    ).to.be.revertedWithCustomError(this.fuulReferralStorage, "NotExists");
  });

  it("Should fail to admin update code owner if not admin role", async function () {
    const error = `AccessControl: account ${this.user2.address.toLowerCase()} is missing role ${
      this.adminRole
    }`;

    await expect(
      this.fuulReferralStorage
        .connect(this.user2)
        .adminUpdateCodeOwner(this.code, this.user2.address)
    ).to.be.revertedWith(error);
  });
});

describe("Ref Storage - Remove code", function () {
  beforeEach(async function () {
    const { fuulReferralStorage, adminRole, user1, user2 } =
      await setupReferralStorageTest();

    this.fuulReferralStorage = fuulReferralStorage;
    this.user1 = user1;
    this.user2 = user2;
    this.adminRole = adminRole;

    this.stringCode = "code";
    this.code = ethers.utils.formatBytes32String(this.stringCode);

    await this.fuulReferralStorage.registerCode(this.code);
  });

  it("Should remove code owner", async function () {
    expect(await this.fuulReferralStorage.removeCode(this.code))
      .to.emit(this.fuulReferralStorage, "CodeOwnerUpdated")
      .withArgs(this.user1.address, ethers.constants.AddressZero, this.code);

    expect(await this.fuulReferralStorage.codeOwners(this.code)).to.equal(
      ethers.constants.AddressZero
    );
  });

  it("Should admin remove code owner", async function () {
    const code = ethers.utils.formatBytes32String("newCode");

    await this.fuulReferralStorage.connect(this.user2).registerCode(code);

    expect(await this.fuulReferralStorage.adminRemoveCode(code))
      .to.emit(this.fuulReferralStorage, "CodeOwnerUpdated")
      .withArgs(this.user1.address, ethers.constants.AddressZero, code);

    expect(await this.fuulReferralStorage.codeOwners(code)).to.equal(
      ethers.constants.AddressZero
    );
  });

  it("Should fail to remove code if user is not the owner", async function () {
    await expect(
      this.fuulReferralStorage.connect(this.user2).removeCode(this.code)
    ).to.be.revertedWithCustomError(this.fuulReferralStorage, "Unauthorized");
  });

  it("Should fail to admin remove code owner if code is unregistered", async function () {
    const code = ethers.utils.formatBytes32String("newCode");
    await expect(
      this.fuulReferralStorage.adminRemoveCode(code)
    ).to.be.revertedWithCustomError(this.fuulReferralStorage, "NotExists");
  });

  it("Should fail to admin remove code owner if not admin role", async function () {
    const error = `AccessControl: account ${this.user2.address.toLowerCase()} is missing role ${
      this.adminRole
    }`;

    await expect(
      this.fuulReferralStorage.connect(this.user2).adminRemoveCode(this.code)
    ).to.be.revertedWith(error);
  });
});
