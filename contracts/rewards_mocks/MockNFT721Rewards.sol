// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract MockNFT721Rewards is ERC721 {
    uint256 public nextTokenId = 1;

    constructor() ERC721("NFT", "NFT") {
        mint(10);
    }

    function mint(uint256 amount) public {
        for (uint256 i = 0; i < amount; i++) {
            uint256 tokenId = nextTokenId;
            nextTokenId += 1;

            _safeMint(msg.sender, tokenId);
        }
    }
}
