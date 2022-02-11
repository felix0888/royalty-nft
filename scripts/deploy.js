// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const { ethers } = require("hardhat");
const hre = require("hardhat");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account blance - before:", (await deployer.getBalance()).toString());

  const OricaNFT = await ethers.getContractFactory("OricaNFT");
  const oricaNFT = await OricaNFT.deploy("OricaNFT", "ORCT", 500);
  console.log("OricaNFT address:", oricaNFT.address);
  await oricaNFT.deployed();

  await hre.run("verify:verify", {
    address: oricaNFT.address,
    constructorArguments: [
      "OricaNFT",
      "ORCT",
      500
    ]
  });

  const Marketplace = await ethers.getContractFactory("Marketplace");
  const wbnb = "0xae13d989dac2f0debff460ac112a837c89baa7cd";
  const marketplace = await Marketplace.deploy(oricaNFT.address, wbnb);
  console.log("Marketplace address:", marketplace.address);
  await marketplace.deployed();

  await hre.run("verify:verify", {
    address: marketplace.address,
    constructorArguments: [
      oricaNFT.address,
      wbnb
    ]
  });

  console.log("Account blance - before:", (await deployer.getBalance()).toString());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
