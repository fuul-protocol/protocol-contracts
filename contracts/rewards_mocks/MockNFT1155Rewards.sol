// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract MockNFT1155Rewards is ERC1155 {
    uint256 public nextTokenId = 1;

    constructor() ERC1155("NFT") {
        mint(10);
    }

    function mint(uint256 amount) public {
        for (uint256 i = 0; i < amount; i++) {
            uint256 tokenId = nextTokenId;
            _mint(msg.sender, tokenId, 10, "");
            nextTokenId += 1;
        }
    }
}
