const { ethers } = require("hardhat");

async function main() {
   const [deployer] = await ethers.getSigners();
   const tokenContractFactory = await ethers.getContractFactory("SimpleDeFiToken");
   const token = await tokenContractFactory.deploy();
   await token.waitForDeployment();

   console.log("Simple DeFi Token Contract Address:", await token.getAddress());
   console.log("Deployer:", deployer.address);
   console.log(
      "Deployer ETH balance:",
      (await ethers.provider.getBalance(deployer.address)).toString()
   );
}

main().catch((error) => {
   console.error(error);
   process.exitCode = 1;
});
