const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BSCIAM System", function () {
  let bsciamToken;
  let bsciamAuth;
  let owner;
  let user1;
  let user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy BSCIAM Token
    const BSCIAMToken = await ethers.getContractFactory("BSCIAMToken");
    bsciamToken = await BSCIAMToken.deploy();
    await bsciamToken.deployed();

    // Deploy BSCIAM Auth
    const BSCIAMAuth = await ethers.getContractFactory("BSCIAMAuth");
    bsciamAuth = await BSCIAMAuth.deploy(bsciamToken.address);
    await bsciamAuth.deployed();

    // Add auth contract as minter
    await bsciamToken.addMinter(bsciamAuth.address);
  });

  describe("BSCIAM Token", function () {
    it("Should have correct initial supply", async function () {
      const totalSupply = await bsciamToken.totalSupply();
      expect(totalSupply).to.equal(ethers.utils.parseEther("1000000")); // 1 million tokens
    });

    it("Should allow minting by authorized minter", async function () {
      const mintAmount = ethers.utils.parseEther("100");
      await bsciamAuth.mint(user1.address, mintAmount);
      
      const balance = await bsciamToken.balanceOf(user1.address);
      expect(balance).to.equal(mintAmount);
    });

    it("Should not allow minting by unauthorized address", async function () {
      await expect(
        bsciamToken.connect(user1).mint(user2.address, ethers.utils.parseEther("100"))
      ).to.be.revertedWith("Not authorized to mint");
    });
  });

  describe("BSCIAM Authentication", function () {
    beforeEach(async function () {
      // Transfer some tokens to user1 for registration
      await bsciamToken.transfer(user1.address, ethers.utils.parseEther("100"));
      
      // Approve auth contract to spend tokens
      await bsciamToken.connect(user1).approve(bsciamAuth.address, ethers.utils.parseEther("100"));
    });

    it("Should allow user registration", async function () {
      await bsciamAuth.connect(user1).registerUser("alice", "alice@example.com");
      
      const userProfile = await bsciamAuth.getUserProfile(user1.address);
      expect(userProfile.username).to.equal("alice");
      expect(userProfile.email).to.equal("alice@example.com");
      expect(userProfile.isActive).to.be.true;
    });

    it("Should not allow duplicate username", async function () {
      await bsciamAuth.connect(user1).registerUser("alice", "alice@example.com");
      
      await expect(
        bsciamAuth.connect(user2).registerUser("alice", "bob@example.com")
      ).to.be.revertedWith("Username already taken");
    });

    it("Should charge registration fee", async function () {
      const initialBalance = await bsciamToken.balanceOf(user1.address);
      
      await bsciamAuth.connect(user1).registerUser("alice", "alice@example.com");
      
      const finalBalance = await bsciamToken.balanceOf(user1.address);
      const registrationFee = ethers.utils.parseEther("10");
      
      expect(initialBalance.sub(finalBalance)).to.equal(registrationFee);
    });

    it("Should allow access requests after registration", async function () {
      await bsciamAuth.connect(user1).registerUser("alice", "alice@example.com");
      
      await bsciamAuth.connect(user1).requestAccess("database", "read");
      
      const requests = await bsciamAuth.getUserAccessRequests(user1.address);
      expect(requests.length).to.equal(1);
      expect(requests[0].resource).to.equal("database");
      expect(requests[0].action).to.equal("read");
    });

    it("Should allow owner to approve access requests", async function () {
      await bsciamAuth.connect(user1).registerUser("alice", "alice@example.com");
      await bsciamAuth.connect(user1).requestAccess("database", "read");
      
      await bsciamAuth.approveAccess(user1.address, 0, true);
      
      const request = await bsciamAuth.getAccessRequest(user1.address, 0);
      expect(request.isProcessed).to.be.true;
      expect(request.isApproved).to.be.true;
    });

    it("Should update reputation score on approval", async function () {
      await bsciamAuth.connect(user1).registerUser("alice", "alice@example.com");
      
      const initialProfile = await bsciamAuth.getUserProfile(user1.address);
      expect(initialProfile.reputationScore).to.equal(100);
      
      await bsciamAuth.updateReputation(user1.address, 50);
      
      const updatedProfile = await bsciamAuth.getUserProfile(user1.address);
      expect(updatedProfile.reputationScore).to.equal(150);
    });
  });
});
