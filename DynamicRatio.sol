// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DynamicAprCalculator {
    uint256 public baseApyRate = 5 * 10**16; // 5% APR in 18 decimals
    uint256 public baseInterestRate = 7 * 10**16; // 5% APR in 18 decimals
    uint256 public slope1 = 4 * 10**16; // 4% Slope1 in 18 decimals
    uint256 public slope2 = 10 * 10**16; // 10% Slope2 in 18 decimals
    uint256 public optimalUtilization = 8 * 10**17; // 80% Optimal Utilization in 18 decimals
    // uint256 public utilizationRate; // Utilization rate in 18 decimals
    uint256 public dynamicApr; // Dynamic APR in 18 decimals
    uint256 public dynamicInterest; // Dynamic APR in 18 decimals
    uint256 public totalSupply = 1000 * 10**18; // Example total supply (e.g., 1000 units)
    uint256 public totalBorrowed; // Total borrowed amount in 18 decimals

    mapping(address => uint256) public userBorrowedAmounts; // User's borrowed amounts
    mapping(address => uint256) public borrowTimestamps; // User's borrow timestamps

    uint256 constant SECONDS_IN_YEAR = 31536000;

    // Function to set the total borrowed amount (for testing purposes)
    function setTotalBorrowed(uint256 amount) external {
        totalBorrowed = amount;
        calculateDynamicApr();
    }

    // Function to simulate borrowing
    function borrow(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");

        // Update user's borrowed amount and timestamp
        userBorrowedAmounts[msg.sender] += amount;
        borrowTimestamps[msg.sender] = block.timestamp;

        // Update total borrowed amount
        totalBorrowed += amount;

        // Recalculate dynamic APR
        calculateDynamicApr();
        calculateDynamicInterest();
    }

    function repay(uint256 amount) external  {
        require(amount > 0, "Amount must be greater than 0");
        totalBorrowed -= amount;
        calculateDynamicApr();
        calculateDynamicInterest();
    }

    // Function to get the current utilization rate (for external checks)
    function getUtilizationRatio() public view returns (uint256) {
        if (totalSupply == 0) {
            return 0;
        }
        return (totalBorrowed * 1e18) / totalSupply;
    }
    
    // Function to calculate dynamic APR based on utilization rate
    function calculateDynamicApr() public {
        // uint256 totalSupply = rcoinToken.totalSupply(); // Get the total supply of Rcoin
        // uint256 totalBorrowed = totalBorrowedRcoin; // Assume `totalBorrowedRcoin` tracks the borrowed Rcoin
        require(totalSupply > 0, "Total supply must be greater than 0");
        // Calculate utilization rate in 18 decimals
        uint256 utilizationRate = (totalBorrowed * 1e18) / totalSupply;
        if (utilizationRate <= optimalUtilization) {
            // Low utilization range: R = Rbase + slope1 * U
            dynamicApr = baseApyRate + (slope1 * utilizationRate) / 1e18;
        } else {
            // High utilization range: R = Rbase + slope1 * U + slope2 * (U - Uoptimal)
            uint256 excessUtilization = utilizationRate - optimalUtilization;
            dynamicApr = baseApyRate
                + (slope1 * utilizationRate) / 1e18
                + (slope2 * excessUtilization) / 1e18;
        }
    }

    // Function to calculate dynamic APR based on utilization rate
    function calculateDynamicInterest() public {
        // uint256 totalSupply = rcoinToken.totalSupply(); // Get the total supply of Rcoin
        // uint256 totalBorrowed = totalBorrowedRcoin; // Assume `totalBorrowedRcoin` tracks the borrowed Rcoin
        require(totalSupply > 0, "Total supply must be greater than 0");
        // Calculate utilization rate in 18 decimals
        uint256 utilizationRate = (totalBorrowed * 1e18) / totalSupply;
        if (utilizationRate <= optimalUtilization) {
            // Low utilization range: R = Rbase + slope1 * U
            dynamicInterest = baseInterestRate + (slope1 * utilizationRate) / 1e18;
        } else {
            // High utilization range: R = Rbase + slope1 * U + slope2 * (U - Uoptimal)
            uint256 excessUtilization = utilizationRate - optimalUtilization;
            dynamicInterest = baseInterestRate
                + (slope1 * utilizationRate) / 1e18
                + (slope2 * excessUtilization) / 1e18;
        }
    }

}
