const { expect } = require("chai");
const { ethers } = require("hardhat");
const { toWei } = require("./Utils");

describe("SimpleDeFiToken", () => {
    let deployer, addr1, addr2, token;

    beforeEach(async () => {
        [deployer, addr1, addr2] = await ethers.getSigners();
        const tokenContractFactory = await ethers.getContractFactory("SimpleDeFiToken");
        token = await tokenContractFactory.deploy();
    });

    it("Should have correct name, symbol and total supply", async () => {
        expect(await token.name()).to.equal("Simple DeFi Token");
        expect(await token.symbol()).to.equal("SDFT");
        expect(await token.totalSupply()).to.equal(toWei(1000000));
    });

    it("Should transfer token from one to another", async () => {
        // Saldo inicial do deployer
        expect(await token.balanceOf(deployer.address)).to.equal(toWei(1000000));

        // Transferência
        await token.connect(deployer).transfer(addr1.address, toWei(5));

        // Verifica saldos
        expect(await token.balanceOf(addr1.address)).to.equal(toWei(5));
        expect(await token.balanceOf(deployer.address)).to.equal(toWei(999995));

        // Falha ao transferir mais do que o saldo — usando custom error do OpenZeppelin
        await expect(
            token.connect(addr1).transfer(addr2.address, toWei(10))
        ).to.be.revertedWithCustomError(token, "ERC20InsufficientBalance");
    });

    it("Should burn token automatically when calling transferWithAutoBurn", async () => {
        // Deployer transfere 1 token para addr1
        await token.connect(deployer).transfer(addr1.address, toWei(1));

        // addr1 envia 1 token para addr2 com auto-burn
        await token.connect(addr1).transferWithAutoBurn(addr2.address, toWei(1));

        // addr2 deve receber apenas 0.9 token
        expect(await token.balanceOf(addr2.address)).to.equal(toWei(0.9));

        // totalSupply deve ter sido reduzido em 0.1 token
        expect(await token.totalSupply()).to.equal(toWei(1000000 - 0.1));

        // addr1 deve ficar com saldo zero
        expect(await token.balanceOf(addr1.address)).to.equal(toWei(0));
    });
});
