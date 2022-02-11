const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BigNumber } = require("ethers");

const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";

describe("OricaNFT", function () {
  const name = "OricaNFT";
  const symbol = "ORCT";
  let OricaNFT, oricaNFT;
  let deployer, alice, bob, signers;
  const tokenURI = "https://ipfs.io/Qmsdfu89su0s80d0g";

  beforeEach(async function() {
    [deployer, alice, bob, signers] = await ethers.getSigners();
    OricaNFT = await ethers.getContractFactory("OricaNFT");
    oricaNFT = await OricaNFT.deploy(name, symbol, 500);
  });

  describe("deployment", function() {
    it("should set the owner", async function() {
      expect(await oricaNFT.owner()).to.equal(deployer.address);
    });

    it("should set the name, symbol of the token", async function() {
      expect(await oricaNFT.name()).to.equal(name);
      expect(await oricaNFT.symbol()).to.equal(symbol);
    });
  });

  describe("setDefaultRoyaltyInfo", function() {
    it("should false if non-owner tries", async function() {
      await expect(
        oricaNFT.connect(alice).setDefaultRoyaltyInfo(bob.address, 500)
      ).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });
  });

  describe("safeMint", function() {
    it("should fail if _sioReceiver is zero address", async function() {
      await expect(
        oricaNFT.connect(alice).safeMint(500, ADDRESS_ZERO, 1000, tokenURI)
      ).to.be.revertedWith(
        "OricaNFT: invalid SIO receiver"
      );
    });

    it("should fail if _sioFeeInBips is greater than 100 percent(10000)", async function() {
      await expect(
        oricaNFT.connect(alice).safeMint(500, bob.address, 20000, tokenURI)
      ).to.be.revertedWith(
        "OricaNFT: SIO fee exceed Royalty"
      );
    });

    it("should fail if _tokenURI is empty", async function() {
      await expect(
        oricaNFT.connect(alice).safeMint(500, bob.address, 1000, "")
      ).to.be.revertedWith(
        "OricaNFT: invalid Token URI"
      );
    });

    it("should mint a new token and set tokenURI", async function() {
      await oricaNFT.connect(alice).safeMint(500, bob.address, 1000, tokenURI);
      expect(await oricaNFT.balanceOf(alice.address)).to.equal(1);
      expect(await oricaNFT.ownerOf(1)).to.equal(alice.address);
      expect(await oricaNFT.tokenURI(1)).to.equal(tokenURI);
    });

    it("should set the royalty fee information", async function() {
      await oricaNFT.connect(alice).safeMint(500, bob.address, 1000, tokenURI);

      var royaltyReceiver, royaltyAmount;
      [royaltyReceiver, royaltyAmount] = await oricaNFT.royaltyInfo(1, getBigNumber(1000));
      expect(royaltyReceiver).to.equal(alice.address);
      expect(royaltyAmount).to.equal(getBigNumber(50));
    });

    it("should set the sio fee information", async function() {
      await oricaNFT.connect(alice).safeMint(500, bob.address, 1000, tokenURI);

      var sioReceiver, sioAmount;
      [sioReceiver, sioAmount] = await oricaNFT.sioInfo(1, getBigNumber(1000));
      expect(sioReceiver).to.equal(bob.address);
      expect(sioAmount).to.equal(getBigNumber(100));
    });
  });

  function getBigNumber(num) {
    return BigNumber.from(num).mul(
      BigNumber.from((1e18).toString())
    );
  }
});
