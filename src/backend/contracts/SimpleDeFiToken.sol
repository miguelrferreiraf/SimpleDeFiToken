// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "hardhat/console.sol";

contract SimpleDeFiToken is ERC20 {
    constructor() ERC20("Simple DeFi Token", "SDFT") {
        _mint(msg.sender, 1e24); // 1 milhão de tokens (1e6 * 1e18)
    }

    function transferWithAutoBurn(address to, uint256 amount) public {
        require(balanceOf(msg.sender) >= amount, "Not enough tokens");

        uint256 burnAmount = amount / 10; // 10% burn

        console.log(
            "Burning %s from %s, balance is %s",
            burnAmount,
            to,
            balanceOf(to)
        );

        _burn(msg.sender, burnAmount); // queima do remetente
        _transfer(msg.sender, to, amount - burnAmount);
    }
}
