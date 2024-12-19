// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PriceContract {
    uint256 private price; // Variable to store the price

    // Function to set the price
    function setPrice(uint256 _price) public {
        price = _price;
    }

    // Function to get the price
    function getPrice() public view returns (uint256) {
        return price;
    }
}
