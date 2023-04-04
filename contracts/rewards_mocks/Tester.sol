// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

contract Tester {
    uint256 public number;

    function sumNumber() external {
        number += 1;
    }

    function subtractNumber() external {
        number -= 1;
    }

    function duplicateNumber() external {
        number *= 2;
    }

    function triplicateNumber() external {
        number *= 3;
    }
}
