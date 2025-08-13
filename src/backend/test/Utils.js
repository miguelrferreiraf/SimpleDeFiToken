const { ethers } = require("hardhat");

function toWei(amount) {
    return ethers.parseUnits(amount.toString(), "ether");
}

function fromWei(amount) {
    return ethers.formatUnits(amount, "ether");
}

module.exports = {
    toWei,
    fromWei
};
