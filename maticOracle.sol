// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Define the Chainlink price oracle interface
interface IChainlinkPriceOracle {
    function latestAnswer() external view returns (int256);
}

contract ChainlinkPriceOracle is IChainlinkPriceOracle {
    // Hardcoded address of the Chainlink price feed contract Matic/Usdc
    address public constant ORACLE_ADDRESS = 0x001382149eBa3441043c1c66972b4772963f5D43; // Replace with the actual address

    // Retrieve the latest price from the Chainlink oracle
    function latestAnswer() external view override returns (int256) {
        // Call the Chainlink oracle to get the latest price
        return IChainlinkPriceOracle(ORACLE_ADDRESS).latestAnswer();
    }
}
