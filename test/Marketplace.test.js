const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BigNumber } = require("ethers");

const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";

describe("OricaNFT", function () {
  const name = "OricaNFT";
  const symbol = "ORCT";
  let OricaNFT, oricaNFT;
  let Marketplace, marketplace;
  let MockERC20, mockERC20;
  let deployer, alice, bob, carol, david, signers;

  const mockInitialSupply = getBigNumber(1000000);
  const tokenURI = "https://ipfs.io/Qmsdfu89su0s80d0g";

  beforeEach(async function() {
    [deployer, alice, bob, carol, david, signers] = await ethers.getSigners();
    OricaNFT = await ethers.getContractFactory("OricaNFT");
    oricaNFT = await OricaNFT.deploy(name, symbol, 500);
    MockERC20 = await ethers.getContractFactory("MockERC20");
    mockERC20 = await MockERC20.deploy("Mock Token", "MCT", mockInitialSupply);
    Marketplace = await ethers.getContractFactory("Marketplace");
    marketplace = await Marketplace.deploy(oricaNFT.address, mockERC20.address);

    await mockERC20.connect(deployer).transfer(alice.address, getBigNumber(10000));
    await mockERC20.connect(deployer).transfer(bob.address, getBigNumber(10000));
    await mockERC20.connect(deployer).transfer(carol.address, getBigNumber(10000));
    await mockERC20.connect(deployer).transfer(david.address, getBigNumber(10000));
  });

  describe("deployment", function() {
    it("should set the marketplace and payment token", async function() {
      expect(await marketplace.oricaNFT()).to.equal(oricaNFT.address);
      expect(await marketplace.paymentToken()).to.equal(mockERC20.address);
    });
  });

  describe("setForSale", function() {
    beforeEach(async function() {
      oricaNFT.connect(alice).safeMint(500, bob.address, 1000, tokenURI);
    });

    it("should be reverted if token doesn't exist", async function() {
      await expect(
        marketplace.connect(alice).setForSale(100, getBigNumber(1000), true)
      ).to.revertedWith(
        "ERC721: owner query for nonexistent token"
      );
    });

    it("should fail if non token owner tries", async function() {
      await expect(
        marketplace.connect(bob).setForSale(1, getBigNumber(1000), false)
      ).to.be.revertedWith(
        "MarketPlace: not token owner"
      );
    });

    it("should fail if token contract not approved marketplace", async function() {
      await expect(
        marketplace.connect(alice).setForSale(1, getBigNumber(1000), true)
      ).to.be.revertedWith(
        "Marketplace: not approved"
      );
    });

    it("should fail if user tries to add the token to marketplace already on", async function() {
      await oricaNFT.connect(alice).setApprovalForAll(marketplace.address, true);
      await marketplace.connect(alice).setForSale(1, getBigNumber(1000), true);
      await expect(
        marketplace.connect(alice).setForSale(1, getBigNumber(2000), true)
      ).to.be.revertedWith(
        "MarketPlace: already on sale"
      );
    });

    it("should fail if user tries to remove the token from marketplace already not on", async function() {
      await oricaNFT.connect(alice).setApprovalForAll(marketplace.address, true);
      await expect(
        marketplace.connect(alice).setForSale(1, getBigNumber(1000), false)
      ).to.be.revertedWith(
        "MarketPlace: already not on sale"
      );
    });

    it("should fail if price is 0 when adding to marketplace", async function() {
      await oricaNFT.connect(alice).setApprovalForAll(marketplace.address, true);
      await expect(
        marketplace.connect(alice).setForSale(1, 0, true)
      ).to.be.revertedWith(
        "MarketPlace: invalid price"
      );
    });

    it("should set the token price", async function() {
      await oricaNFT.connect(alice).setApprovalForAll(marketplace.address, true);
      await marketplace.connect(alice).setForSale(1, getBigNumber(1000), true);
      expect(await marketplace.tokenPrice(1)).to.equal(getBigNumber(1000));
    });

    it("should reset the token price", async function() {
      await oricaNFT.connect(alice).setApprovalForAll(marketplace.address, true);
      await marketplace.connect(alice).setForSale(1, getBigNumber(1000), true);
      await marketplace.connect(alice).setForSale(1, 0, false);
      expect(await marketplace.tokenPrice(1)).to.equal(0);
    });
  });

  describe("purchase", function() {
    beforeEach(async function() {
      oricaNFT.connect(alice).safeMint(500, bob.address, 1000, tokenURI);
      await oricaNFT.connect(alice).setApprovalForAll(marketplace.address, true);
      await marketplace.connect(alice).setForSale(1, getBigNumber(1000), true);
    });

    it("should fail if token doesn't exist", async function() {
      await expect(
        marketplace.connect(carol).purchase(100, getBigNumber(1000))
      ).to.revertedWith(
        "ERC721: owner query for nonexistent token"
      );
    });

    it("should fail if token is not no sale", async function() {
      await marketplace.connect(alice).setForSale(1, 0, false);
      await expect(
        marketplace.connect(carol).purchase(1, getBigNumber(1000))
      ).to.be.revertedWith(
        "Marketplace: not on sale"
      );
    });

    it("should fail if user tries with token less than price", async function() {
      await mockERC20.connect(carol).approve(marketplace.address, getBigNumber(1000));
      await expect(
        marketplace.connect(carol).purchase(1, getBigNumber(500))
      ).to.be.revertedWith(
        "Marketplace: insufficient funds"
      );
    });

    it("should transfer the token to the buyer", async function() {
      var aliceNFTBalance = await oricaNFT.balanceOf(alice.address);
      var bobNFTBalance = await oricaNFT.balanceOf(bob.address);
      var carolNFTBalance = await oricaNFT.balanceOf(carol.address);
      expect(await oricaNFT.ownerOf(1)).to.equal(alice.address);
      await mockERC20.connect(carol).approve(marketplace.address, getBigNumber(1000));

      await marketplace.connect(carol).purchase(1, getBigNumber(1000));
      expect(await oricaNFT.balanceOf(alice.address)).to.equal(aliceNFTBalance - 1);
      expect(await oricaNFT.balanceOf(bob.address)).to.equal(bobNFTBalance);
      expect(await oricaNFT.balanceOf(carol.address)).to.equal(carolNFTBalance + 1);
      expect(await oricaNFT.ownerOf(1)).to.equal(carol.address);
    });

    it("should pay to the owner, royalty receiver and sio receiver(previous owner == royalty receiver)", async function() {
      await mockERC20.connect(carol).approve(marketplace.address, getBigNumber(1000));
      await marketplace.connect(carol).purchase(1, getBigNumber(1000));
      expect(await mockERC20.balanceOf(marketplace.address)).to.equal(0);
      /**
       * sale price: 1000(from carol - buyer)
       * royalty: 50
       * sio: 5(to bob - sio receiver)
       * sale price - royalty = 950(to alice - token owner)
       * royalty - sio = 45(to alice - royalty receiver)
       */
      expect(await mockERC20.balanceOf(alice.address)).to.equal(getBigNumber(10995)); // salePrice(except royalty)950 and royalty(except sio)45 goes to alice
      expect(await mockERC20.balanceOf(bob.address)).to.equal(getBigNumber(10005)); // sio(10% of royalty)5 goes to bob
      expect(await mockERC20.balanceOf(carol.address)).to.equal(getBigNumber(9000)); // salePrice1000 is decreased for purchase
      expect(await marketplace.tokenPrice(1)).to.equal(0);
    });

    it("should pay to previous owner, royalty receiver and sio receiver(previous owner != royalty receiver)", async function() {
      await mockERC20.connect(carol).approve(marketplace.address, getBigNumber(1000));
      await marketplace.connect(carol).purchase(1, getBigNumber(1000));
      // balances are same as above test case at the moment

      await oricaNFT.connect(carol).setApprovalForAll(marketplace.address, true);
      await marketplace.connect(carol).setForSale(1, getBigNumber(2000), true);
      await mockERC20.connect(david).approve(marketplace.address, getBigNumber(2000));
      await marketplace.connect(david).purchase(1, getBigNumber(2000));

      /**
       * sale price: 2000(from david - buyer)
       * royalty: 100
       * sio: 10(to bob - sio receiver)
       * sale price - royalty = 1900(to carol - token owner)
       * royalty - sio = 90(to alice - royalty receiver)
       */
      expect(await mockERC20.balanceOf(marketplace.address)).to.equal(0);
      expect(await mockERC20.balanceOf(alice.address)).to.equal(getBigNumber(11085));
      expect(await mockERC20.balanceOf(bob.address)).to.equal(getBigNumber(10015));
      expect(await mockERC20.balanceOf(carol.address)).to.equal(getBigNumber(10900));
      expect(await mockERC20.balanceOf(david.address)).to.equal(getBigNumber(8000));
    });
  });

  function getBigNumber(num) {
    return BigNumber.from(num).mul(
      BigNumber.from((1e18).toString())
    );
  }
});
