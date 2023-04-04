// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockTokenRewards is ERC20 {
    constructor() ERC20("Token", "TOK") {
        _mint(msg.sender, 100000 ether);
    }

    function mint() external {
        _mint(msg.sender, 100000 ether);
    }
}
