// const { expect } = require("chai");

// const { setupTest } = require("./before-each-test");

// describe("Fuul Factory", function () {
//   beforeEach(async function () {
//     const { fuulFactory, user1, user2, adminRole } = await setupTest(
//       (deployProject = false)
//     );

//     this.fuulFactory = fuulFactory;
//     this.user1 = user1;
//     this.user2 = user2;
//     this.adminRole = adminRole;

//     this.projectURI = "projectURI";
//   });

//   it("Should deploy Fuul Project and sets roles correctly", async function () {
//     const signer = this.user2.address;

//     await expect(
//       this.fuulFactory
//         .connect(this.user2)
//         .createFuulProject(signer, signer, this.projectURI, signer)
//     ).to.emit(this.fuulFactory, "ProjectCreated");

//     // Projects
//     expect(await this.fuulFactory.projectsCreated()).to.equal(1);

//     const addressDeployed = await this.fuulFactory.projects(1);

//     expect(addressDeployed).to.not.equal(ethers.constants.AddressZero);

//     const FuulProject = await ethers.getContractFactory("FuulProject");
//     const fuulProject = await FuulProject.attach(addressDeployed);

//     expect(await fuulProject.fuulFactory()).to.equal(this.fuulFactory.address);

//     expect(
//       await fuulProject.hasRole(this.adminRole, this.user2.address)
//     ).to.equal(true);

//     expect(await fuulProject.projectInfoURI()).to.equal(this.projectURI);
//     expect(await fuulProject.clientFeeCollector()).to.equal(signer);
//   });

//   it("Should change Fuul Manager address", async function () {
//     const newValue = this.user1.address;
//     await this.fuulFactory.setFuulManager(newValue);
//     expect(await this.fuulFactory.fuulManager()).to.equal(newValue);
//   });

//   it("Should fail to set new Fuul Manager address funds if not admin role", async function () {
//     const error = `AccessControl: account ${this.user2.address.toLowerCase()} is missing role ${
//       this.adminRole
//     }`;

//     await expect(
//       this.fuulFactory.connect(this.user2).setFuulManager(this.user2.address)
//     ).to.be.revertedWith(error);
//   });
// });
