// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "maticOracle.sol";
import "UsdcToInr.sol";

contract LendingBorrowingPool is Ownable {

    IChainlinkPriceOracle public maticPriceOracle;
    IChainlinkPriceOracle public linkPriceOracle;
    using SafeMath for uint256;

    // ERC20 tokens 
    IERC20 public maticToken;
    IERC20 public linkToken;
    IERC20 public inrcToken;
    IERC20 public rcoinToken;

    // Reference to the PriceContract for setting and getting the INRC price
    PriceContract public inrcPrice;

    // The loan-to-value (LTV) ratio (in percentage, e.g., 75 means 75% LTV)
    uint256 public optimalUtilization = uint256(8).mul(1e17); // 80% optimalUtilization ratio or threshold value
    uint256 public baseInterestRate = uint256(7).mul(1e16); // 7% annual base interest rate 18 decimal
    uint256 public constant SECONDS_IN_YEAR = 31536000;
    uint256 public baseApyRate = uint256(5).mul(1e16); // 7% annual interest rate (APY) 18 decimal
    uint256 public slope2 = uint256(10).mul(1e16); // 10% slope 18 decimal
    uint256 public slope1 = uint256(4).mul(1e16); // 4% slope 18 decimal
    uint256 liquidateAssetPercent = 2 * 1e17;
    uint256 liquidateLoanPercent = 3 * 1e17;
    uint256 public constant LTV_RATIO = 75;
    uint256 public totalBorrowedRcoin;
    uint256 public dynamicInterest;
    uint256 public dynamicApr;

    // Mapping to track user deposits and loans
    mapping(address => uint256) public userMaticDeposits; // MATIC deposited by users
    mapping(address => uint256) public userLinkDeposits; // LINK deposited by users
    mapping(address => uint256) public userInrcDeposits; // INRC deposited by users
    mapping(address => uint256) public userRcoinDeposits; // INRC deposited by users
    mapping(address => uint256) public userMaticLoans; // Rcoin loaned by users against Matic
    mapping(address => uint256) public userLinkLoans; // Rcoin loaned by users against Link
    mapping(address => uint256) public userInrcLoans; // Rcoin loaned by users against Inrc
    mapping(address => uint256) public maticLoanStartBlock; // Block number when the loan was taken
    mapping(address => uint256) public linkLoanStartBlock; // Block number when the loan was taken
    mapping(address => uint256) public inrcLoanStartBlock; // Block number when the loan was taken
    mapping(address => uint256) public depositMaticStartBlock; // Block number when the deposit was done
    mapping(address => uint256) public depositLinkStartBlock; // Block number when the deposit was done
    mapping(address => uint256) public depositInrStartBlock; // Block number when the deposit was done
    mapping(address => uint256) public depositRcoinStartBlock; // Block number when the deposit was done

    event CollateralMaticWithdrawn(address indexed user, uint256 amount);
    event CollateralLinkWithdrawn(address indexed user, uint256 amount);
    event CollateralInrcWithdrawn(address indexed user, uint256 amount);
    event RewardsCalculated(address indexed  user,address indexed token,uint256 reward);
    event RewardsClaimed(address indexed  user,     uint256 rewards);
    event AssetLiquidated(address indexed user, uint256 amount);
    event MaticDeposited(address indexed user, uint256 amount);
    event LinkDeposited(address indexed user, uint256 amount);
    event InrcDeposited(address indexed user, uint256 amount);
    event RcoinBorrowed(address indexed user, uint256 amount);
    event RcoinLended(address indexed user, uint256 amount);
    event LoanRepaid(address indexed user, uint256 amount);

    constructor(IERC20 _maticToken,IERC20 _inrcToken,IERC20 _linkToken, IERC20 _rcoinToken, IChainlinkPriceOracle _maticPriceOracle,IChainlinkPriceOracle _linkPriceOracle, PriceContract _InrcPrice ) Ownable(msg.sender) {
        maticPriceOracle = _maticPriceOracle;
        linkPriceOracle = _linkPriceOracle;
        rcoinToken = _rcoinToken;
        maticToken = _maticToken;
        linkToken = _linkToken;
        inrcToken = _inrcToken;
        inrcPrice = _InrcPrice;
    }

    function getInrcPrice() public view returns (uint256) {
        return inrcPrice.getPrice(); // Fetch the latest price dynamically
    }

    function getMaticPrice() public view returns (uint256) {
        int256 price = maticPriceOracle.latestAnswer();
        require(price > 0, "Invalid price: negative or zero value from oracle");
        return uint256(price); // Convert int256 to uint256
    }

    function getLinkPrice() public view returns (uint256) {
        int256 price = linkPriceOracle.latestAnswer();
        require(price > 0, "Invalid price: negative or zero value from oracle");
        return uint256(price);
    }

    // Owner provides initial pair of assets (MATIC and Rcoin) to the pool
    function provideAllAssets(uint256 maticAmount,uint256 linkAmount,uint256 inrcAmount, uint256 rcoinAmount) external onlyOwner {
        require(rcoinToken.transferFrom(msg.sender, address(this), rcoinAmount), "Initial Rcoin transfer failed");
        require(maticToken.transferFrom(msg.sender, address(this), maticAmount), "Initial MATIC transfer failed");
        require(linkToken.transferFrom(msg.sender, address(this), linkAmount), "Initial LINK transfer failed");
        require(inrcToken.transferFrom(msg.sender, address(this), inrcAmount), "Initial INRC transfer failed");
    }

    function provideSpecificAsset(uint256 amount, address token) external onlyOwner {
        if (token == address(maticToken)) {
            require(maticToken.transferFrom(msg.sender, address(this), amount), "Initial MATIC transfer failed");
        } else if (token == address(linkToken)) {
            require(linkToken.transferFrom(msg.sender, address(this), amount), "Initial LINK transfer failed");
        } else if (token == address(inrcToken)) {
            require(inrcToken.transferFrom(msg.sender, address(this), amount), "Initial INRC transfer failed");
        } else if (token == address(rcoinToken)) {
            require(rcoinToken.transferFrom(msg.sender, address(this), amount), "Initial RCOIN transfer failed");
        }else {
            revert("Unsupported token type");
        }
    }

    // Owner take assets from the pool
    function takeAllAssets(uint256 maticAmount,uint256 linkAmount,uint256 inrcAmount, uint256 rcoinAmount) external onlyOwner {
        require(maticToken.transfer(msg.sender, maticAmount), "Initial MATIC transfer failed");
        require(rcoinToken.transfer(msg.sender, rcoinAmount), "Initial Rcoin transfer failed");
        require(linkToken.transfer(msg.sender, linkAmount), "Initial LINK transfer failed");
        require(inrcToken.transfer(msg.sender, inrcAmount), "Initial INRC transfer failed");
    }

    function takeSpecficAsset(uint256 amount, address token) external onlyOwner {
        if (token == address(maticToken)) {
            require(maticToken.transfer(msg.sender, amount), "Initial MATIC transfer failed");
        } else if (token == address(linkToken)) {
            require(linkToken.transfer(msg.sender, amount), "Initial LINK transfer failed");
        } else if (token == address(inrcToken)) {
            require(inrcToken.transfer(msg.sender, amount), "Initial INRC transfer failed");
        }else if (token == address(rcoinToken)) {
            require(rcoinToken.transfer(msg.sender, amount), "Initial RCOIN transfer failed");
        } else {
            revert("Unsupported token type");
        }
    }

    // check that is it working when same user deposit again same token and see the apr
    function depositAsset(uint amount, address token) external {
        address user = msg.sender;
        require(amount > 0, "Amount must be greater than 0");
        if (token == address(maticToken)) {
            userMaticDeposits[user] = userMaticDeposits[user].add(amount);
            depositMaticStartBlock[user] = block.timestamp;
            require(maticToken.transferFrom(user, address(this), amount), "Transfer failed");
            emit MaticDeposited(user, amount);
        } else if (token == address(linkToken)) {
            userLinkDeposits[user] = userLinkDeposits[user].add(amount);
            depositLinkStartBlock[user] = block.timestamp;
            require(linkToken.transferFrom(user, address(this), amount), "Transfer failed");
            emit LinkDeposited(user, amount);
        } else if (token == address(inrcToken)) {
            userInrcDeposits[user] = userInrcDeposits[user].add(amount);
            depositInrStartBlock[user] = block.timestamp;
            require(inrcToken.transferFrom(user, address(this), amount), "Transfer failed");
            emit InrcDeposited(user, amount);
        } else {
            revert("Unsupported token type");
        }
        calculateApr(user, token);
    }

    function lendRcoin(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        userRcoinDeposits[msg.sender] = userRcoinDeposits[msg.sender].add(amount);
        depositRcoinStartBlock[msg.sender] = block.timestamp;
        require(rcoinToken.transferFrom(msg.sender, address(this), amount));
        emit RcoinLended(msg.sender, amount);
    }

    function calculateApr(address user, address token) public view returns (uint256) {
        uint256 userCollateral;
        uint256 accruedReward;
        uint256 timeElapsed;
        uint256 applicableApr = dynamicApr > 0 ? dynamicApr : baseApyRate;
        if (token == address(maticToken)) {
            userCollateral = userMaticDeposits[user]; //18decimal
            timeElapsed = block.timestamp.sub(depositMaticStartBlock[user]);
        } else if (token == address(linkToken)) {
            userCollateral = userLinkDeposits[user];
            timeElapsed = block.timestamp.sub(depositLinkStartBlock[user]);
        } else if (token == address(inrcToken)) {
            userCollateral = userInrcDeposits[user];
            timeElapsed = block.timestamp.sub(depositInrStartBlock[user]);
        } else if (token == address(rcoinToken)) {
            userCollateral = userRcoinDeposits[user];
            timeElapsed = block.timestamp.sub(depositRcoinStartBlock[user]);
        } else if (token == address(rcoinToken))  {
            userCollateral = userRcoinDeposits[user]; //18decimal
            timeElapsed = block.timestamp.sub(depositRcoinStartBlock[user]);
        }  else {
            revert("Unsupported token type");
        }
        // Return 0 if there is no collateral for the user
        if (userCollateral == 0) {
            return 0;
        }
        uint256 annualReward = userCollateral.mul(applicableApr).div(1e18);
        accruedReward = annualReward.mul(timeElapsed).div(SECONDS_IN_YEAR);
        return accruedReward; // This is the reward in USD (18 decimals)
    }

    function claimRewards(address token) external {
        uint256 rewards = calculateApr(msg.sender,token);
        require(rewards > 0, "No rewards to claim");
        if (token == address(maticToken)) {
            require(userMaticLoans[msg.sender] == 0, "Loan must be Repaid first");
            require(maticToken.transfer(msg.sender, rewards), "Reward transfer failed");
            depositMaticStartBlock[msg.sender] = block.timestamp;
        } else if (token == address(linkToken)) {
            require(userLinkLoans[msg.sender] == 0, "Loan must be Repaid first");
            require(linkToken.transfer(msg.sender, rewards), "Reward transfer failed");
            depositLinkStartBlock[msg.sender] = block.timestamp;
        } else if (token == address(inrcToken)) {
            require(userInrcLoans[msg.sender] == 0, "Loan must be Repaid first");
            require(inrcToken.transfer(msg.sender, rewards), "Reward transfer failed");
            depositInrStartBlock[msg.sender] = block.timestamp;
        } else if (token == address(rcoinToken)) {
            require(rcoinToken.transfer(msg.sender, rewards), "Reward transfer failed");
            depositRcoinStartBlock[msg.sender] = block.timestamp;
        } else {
            revert("Unsupported token type");
        }
        emit RewardsClaimed(msg.sender, rewards);
    }

    function withdrawMaticCollateral(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(userMaticLoans[msg.sender] == 0, "Loan must be repaid before withdrawal");
        require(userMaticDeposits[msg.sender] >= amount, "Insufficient collateral");
        userMaticDeposits[msg.sender] = userMaticDeposits[msg.sender].sub(amount);
        if (userMaticDeposits[msg.sender] == 0) {
            depositMaticStartBlock[msg.sender] = 0; // Reset the time reference
        } else {
            depositMaticStartBlock[msg.sender] = block.timestamp; // Update time reference
        }
        require(maticToken.transfer(msg.sender, amount), "Withdrawal failed");
        emit CollateralMaticWithdrawn(msg.sender, amount);
    }

    function withdrawLinkCollateral(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(userLinkLoans[msg.sender] == 0, "Loan must be repaid before withdrawal");
        require(userLinkDeposits[msg.sender] >= amount, "Insufficient collateral");
        userLinkDeposits[msg.sender] = userLinkDeposits[msg.sender].sub(amount);
        if (userLinkDeposits[msg.sender] == 0) {
            depositLinkStartBlock[msg.sender] = 0; // Reset the time reference
        } else {
            depositLinkStartBlock[msg.sender] = block.timestamp; // Update time reference
        }
        require(linkToken.transfer(msg.sender, amount), "Withdrawal failed");
        emit CollateralLinkWithdrawn(msg.sender, amount);
    }

    function withdrawInrcCollateral(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(userInrcLoans[msg.sender] == 0, "Loan must be repaid before withdrawal");
        require(userInrcDeposits[msg.sender] >= amount, "Insufficient collateral");
        userInrcDeposits[msg.sender] = userInrcDeposits[msg.sender].sub(amount);
        if (userInrcDeposits[msg.sender] == 0) {
            depositInrStartBlock[msg.sender] = 0; // Reset the time reference
        } else {
            depositInrStartBlock[msg.sender] = block.timestamp; // Update time reference
        }
        require(inrcToken.transfer(msg.sender, amount), "Withdrawal failed");
        emit CollateralLinkWithdrawn(msg.sender, amount);
    }

    function withdrawRcoinCollateral(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(userRcoinDeposits[msg.sender] >= amount, "Insufficient collateral");
        userRcoinDeposits[msg.sender] = userRcoinDeposits[msg.sender].sub(amount);
        if (userRcoinDeposits[msg.sender] == 0) {
            depositRcoinStartBlock[msg.sender] = 0; // Reset the time reference
        } else {
            depositRcoinStartBlock[msg.sender] = block.timestamp; // Update time reference
        }
        require(rcoinToken.transfer(msg.sender, amount), "Withdrawal failed");
        emit CollateralLinkWithdrawn(msg.sender, amount);
    }

    function calculateBorrowableRcoin(address user, address token) external view returns(uint256) {
        if (token == address(maticToken)) {
            uint256 maticDeposit = userMaticDeposits[user]; //18dec
            uint256 maticPrice = getMaticPrice(); //8dec
            uint256 maticPriceInUsd = maticPrice.mul(maticDeposit); // 8dec mul 18dec = 26dec
            require(maticPrice > 0, "Price must be greater than zero"); 
            if(maticDeposit == 0 ) {
                return 0;
            } else {
                uint256 maticPriceInEthdecimal = maticPriceInUsd.div(1e8); //now this is in 18 decimal 
                uint256 inrPrice = inrcPrice.getPrice(); //this is in 18 decimal
                uint256 maticValueInInr = maticPriceInEthdecimal.mul(inrPrice).div(1e18); // maticpr 18dec/ inrprice 18dec = 18 this is in 18 decimal
                uint256 maxLoanInInr = maticValueInInr.mul(LTV_RATIO).div(100);
                return maxLoanInInr;
            }
        } else if (token == address(linkToken)) {
            uint256 linkDeposit = userLinkDeposits[user]; //18dec
            uint256 linkPrice = getLinkPrice();
            uint256 linkPriceInUsd = linkPrice.mul(linkDeposit); // 8dec mul 18dec = 26dec
            require(linkPrice > 0, "Price must be greater than zero"); 
            if(linkDeposit == 0 ) {
                return 0;
            } else {
                uint256 linkPriceInEthdecimal = linkPriceInUsd.div(1e8); //now this is in 18 decimal 
                uint256 inrPrice = inrcPrice.getPrice(); //this is in 18 decimal
                uint256 linkValueInInr = linkPriceInEthdecimal.mul(inrPrice).div(1e18); // maticpr 18dec/ inrprice 18dec = 18 this is in 18 decimal
                uint256 maxLoanInInr = linkValueInInr.mul(LTV_RATIO).div(100);
                return maxLoanInInr;
            }
        } else if (token == address(inrcToken)) {
            uint256 inrcDeposit = userInrcDeposits[user]; //18dec
            if(inrcDeposit == 0 ) {
                return 0;
            } else {
                uint256 maxLoanInInr = inrcDeposit.mul(LTV_RATIO).div(100);
                return maxLoanInInr;
            }
        } else {
            revert("Unsupported token type");
        }
    }

    // Users borrow Rcoin based on their MATIC collateral
    function borrowRcoin(uint256 amount, address token) external {
        require(amount > 0, "Amount must be greater than 0");
        uint256 maxLoanAmount = this.calculateBorrowableRcoin(msg.sender, token);
        require(maxLoanAmount != 0, "User have not deposit the collatral");
        require(amount <= maxLoanAmount, "Loan exceeds collateral value");
        if (token == address(maticToken)) {
            userMaticLoans[msg.sender] = userMaticLoans[msg.sender].add(amount);
            maticLoanStartBlock[msg.sender] = block.timestamp; // Track when the loan was taken
        } else if (token == address(linkToken)) {
            userLinkLoans[msg.sender] = userLinkLoans[msg.sender].add(amount);
            linkLoanStartBlock[msg.sender] = block.timestamp; // Track when the loan was taken
        } else if (token == address(inrcToken)) {
            userInrcLoans[msg.sender] = userInrcLoans[msg.sender].add(amount);
            inrcLoanStartBlock[msg.sender] = block.timestamp; // Track when the loan was taken
        } else {
            revert("Unsupported token type");
        }
        require(rcoinToken.transfer(msg.sender, amount), "Transfer failed");
        totalBorrowedRcoin = totalBorrowedRcoin.add(amount);
        calculateDynamicApr();
        calculateDynamicInterest();
        emit RcoinBorrowed(msg.sender, amount);
    }

    function specificLoan(address token, address user) view public returns (uint256) {
        if (token == address(maticToken)) {
            uint256 userLoan = userMaticLoans[user];
            uint256 timeElapsed = block.timestamp.sub(maticLoanStartBlock[user]);
            uint256 interestAmount = userLoan.mul(dynamicInterest).mul(timeElapsed).div(SECONDS_IN_YEAR).div(1e20);
            uint256 totalRepayment = userLoan.add(interestAmount);
            if (totalRepayment == 0) {
                return 0;
            } else {
                return totalRepayment;
            }
        } else if (token == address(linkToken)) {
            uint256 userLoan = userLinkLoans[user]; //1000
            uint256 timeElapsed = block.timestamp.sub(linkLoanStartBlock[user]);
            uint256 interestAmount = userLoan.mul(dynamicInterest).mul(timeElapsed).div(SECONDS_IN_YEAR).div(1e20);
            uint256 totalRepayment = userLoan.add(interestAmount);
            if (totalRepayment == 0) {
                return 0;
            } else {
                return totalRepayment;
            }
        } else if (token == address(inrcToken)) {
            uint256 userLoan = userInrcLoans[user];
            uint256 timeElapsed = block.timestamp.sub(inrcLoanStartBlock[user]);
            uint256 interestAmount = userLoan.mul(dynamicInterest).mul(timeElapsed).div(SECONDS_IN_YEAR).div(1e20);
            uint256 totalRepayment = userLoan.add(interestAmount);
            if (totalRepayment == 0) {
                return 0;
            } else {
                return totalRepayment;
            }
        } else {
            revert("Unsupported token type");
        }
    }

    function repayLoanAmount(uint256 amount, address token) external returns(uint256) {
        calculateDynamicApr();
        calculateDynamicInterest();
        if(token == address(maticToken)) {
            userMaticLoans[msg.sender] = userMaticLoans[msg.sender].sub(amount);
            require(rcoinToken.transferFrom(msg.sender, address(this), amount), "Repayment failed");
            emit LoanRepaid(msg.sender, amount);

            totalBorrowedRcoin = totalBorrowedRcoin.sub(amount);
            return amount;
        } else if (token == address(linkToken)) {
            userLinkLoans[msg.sender] = userLinkLoans[msg.sender].sub(amount); 
            require(rcoinToken.transferFrom(msg.sender, address(this), amount), "RePayment failed");
            emit LoanRepaid(msg.sender, amount);

            totalBorrowedRcoin = totalBorrowedRcoin.sub(amount);
            return amount;
        } else if (token == address(inrcToken)) {
            userInrcLoans[msg.sender] =userInrcLoans[msg.sender].sub(amount);
            require(rcoinToken.transferFrom(msg.sender, address(this), amount), "RePayment failed");
            emit LoanRepaid(msg.sender, amount);

            totalBorrowedRcoin = totalBorrowedRcoin.sub(amount);
            return amount;
        } else {
            revert("Unsupported token type");
        }
    }

    // Users repay their loan, including interest
    function repayFullLoan(address token) external returns (uint256) {
        calculateDynamicApr();
        calculateDynamicInterest();
        if (token == address(maticToken)) {
            uint256 loanAmount= userMaticLoans[msg.sender];
            uint256 timeElapsed = block.timestamp.sub(maticLoanStartBlock[msg.sender]);
            uint256 interestAmount = loanAmount.mul(dynamicInterest).mul(timeElapsed).div(SECONDS_IN_YEAR).div(1e20);
            uint256 totalRepayment = loanAmount.add(interestAmount);
            require(rcoinToken.transferFrom(msg.sender, address(this), totalRepayment), "Repayment failed");
            emit LoanRepaid(msg.sender, totalRepayment);
            maticLoanStartBlock[msg.sender] = 0;
            totalBorrowedRcoin = totalBorrowedRcoin.sub(loanAmount);
            return userMaticLoans[msg.sender] = 0;
        } else if (token == address(linkToken)) {
            uint256 loanAmount = userLinkLoans[msg.sender];
            uint256 timeElapsed = block.timestamp.sub(linkLoanStartBlock[msg.sender]);
            uint256 interestAmount = loanAmount.mul(dynamicInterest).mul(timeElapsed).div(SECONDS_IN_YEAR).div(1e20);
            uint256 totalRepayment = loanAmount.add(interestAmount);
            require(rcoinToken.transferFrom(msg.sender, address(this), totalRepayment), "Repayment failed");
            emit LoanRepaid(msg.sender, totalRepayment);
            totalBorrowedRcoin = totalBorrowedRcoin.sub(loanAmount);
            return userLinkLoans[msg.sender] = 0;
        } else if (token == address(inrcToken)) {
            uint256 loanAmount = userInrcLoans[msg.sender];
            uint256 timeElapsed = block.timestamp.sub(inrcLoanStartBlock[msg.sender]);
            uint256 interestAmount = loanAmount.mul(dynamicInterest).mul(timeElapsed).div(SECONDS_IN_YEAR).div(1e20);
            uint256 totalRepayment = loanAmount.add(interestAmount);
            require(rcoinToken.transferFrom(msg.sender, address(this), totalRepayment), "Repayment failed");
            emit LoanRepaid(msg.sender, totalRepayment);
            totalBorrowedRcoin = totalBorrowedRcoin.sub(loanAmount);
            return userInrcLoans[msg.sender] = 0;
        } else {
            revert("Unsupported token type");
        }
    }

    // Get the user's current health factor (collateral/loan value)
    function getHealthFactor(address user, address token) public view returns (uint256) {
        uint256 UsdcToInr = inrcPrice.getPrice(); //price 84 In 18 decimal
        uint256 maticPriceInUsdc = getMaticPrice(); //price In 8 decimal
        uint256 linkPriceInUsdc = getLinkPrice(); //price In 8 decimal
        if (token == address(maticToken)) {
            uint256 collateralValue = userMaticDeposits[user]; //18 decimal
            uint256 collateralValueInusd = collateralValue.mul(maticPriceInUsdc).div(1e8);// collv 18dec matpr8dec tot 26dec
            uint256 collateralValueInInr = collateralValueInusd.mul(UsdcToInr).div(1e18); // 
            uint256 loanValue = this.specificLoan(token,user);
            uint256 maxLoanValue = collateralValueInInr.mul(LTV_RATIO).div(100);
            uint256 HealthFactor = maxLoanValue.mul(1e18) / loanValue;
            require(loanValue != 0,"No Loan, Health Factor is good"); // No loan, health factor is good
            return HealthFactor; // Health factor = collateral 8 ltv / loan
        } else if (token == address(linkToken)) {
            uint256 collateralValue = userLinkDeposits[user];
            uint256 collateralValueInusd = collateralValue.mul(linkPriceInUsdc).div(1e8);// collv 18dec matpr8dec tot 26dec
            uint256 collateralValueInInr = collateralValueInusd.mul(UsdcToInr).div(1e18);
            uint256 loanValue = this.specificLoan(token,user);
            uint256 maxLoanValue = collateralValueInInr.mul(LTV_RATIO).div(100);
            uint256 HealthFactor = maxLoanValue.mul(1e18) / loanValue;
            require(loanValue != 0,"No Loan, Health Factor is good"); // No loan, health factor is good  452
            return HealthFactor; // Health factor = collateral 8 ltv / loan
        } else if (token == address(inrcToken)) {
            uint256 collateralValue = userInrcDeposits[user];
            uint256 loanValue = this.specificLoan(token,user);
            uint256 maxLoanValue = collateralValue.mul(LTV_RATIO).div(100);
            uint256 HealthFactor = maxLoanValue.mul(1e18) / loanValue;
            require(loanValue != 0,"No Loan, Health Factor is good"); // No loan, health factor is good  452
            return HealthFactor; // Health factor = collateral 8 ltv / loan
        } else {
            revert("Unsupported token type");
        }
    }

    function liquidateMatic (address users) external onlyOwner {
        require(getHealthFactor(users, address(maticToken)) < 1e18, "Health factor is sufficient");
        uint256 liquidateAssest = userMaticDeposits[users].mul(liquidateAssetPercent).div(1e18);
        uint256 liquidateLoanpart = userMaticLoans[users].mul(liquidateLoanPercent).div(1e18);
        userMaticLoans[users] = userMaticLoans[users].sub(liquidateLoanpart);
        userMaticDeposits[users] = userMaticDeposits[users].sub(liquidateAssest);
        // maticRewardBalances[users] = 0;
        totalBorrowedRcoin = totalBorrowedRcoin.sub(liquidateLoanpart);
        // Transfer the liquidated assets to the pool
        require(maticToken.transfer(address(this), liquidateAssest), "Liquidation transfer failed");
        emit AssetLiquidated(users, liquidateAssest);
    }

    function liquidateLink (address users) external onlyOwner {
        require(getHealthFactor(users, address(linkToken)) < 1e18, "Health factor is sufficient");
        uint256 liquidateAssest = userLinkDeposits[users].mul(liquidateAssetPercent).div(1e18);
        uint256 liquidateLoanpart = userLinkLoans[users].mul(liquidateLoanPercent).div(1e18);
        userLinkLoans[users] = userLinkLoans[users].sub(liquidateLoanpart);
        userLinkDeposits[users] = userLinkDeposits[users].sub(liquidateAssest);
        totalBorrowedRcoin = totalBorrowedRcoin.sub(liquidateLoanpart);
        // Transfer the liquidated assets to the pool
        require(linkToken.transfer(address(this), liquidateAssest), "Liquidation transfer failed");
        emit AssetLiquidated(users, liquidateAssest);
    }

    function liquidateInrc (address users) external onlyOwner {
        require(getHealthFactor(users, address(inrcToken)) < 1e18, "Health factor is sufficient");
        uint256 liquidateAssest = userInrcDeposits[users].mul(liquidateAssetPercent).div(1e18);
        uint256 liquidateLoanpart = userInrcLoans[users].mul(liquidateLoanPercent).div(1e18);
        userInrcLoans[users] = userInrcLoans[users].sub(liquidateLoanpart);
        userInrcDeposits[users] = userInrcDeposits[users].sub(liquidateAssest);
        totalBorrowedRcoin = totalBorrowedRcoin.sub(liquidateLoanpart);
        require(inrcToken.transfer(address(this), liquidateAssest), "Liquidation transfer failed");
        emit AssetLiquidated(users, liquidateAssest);
    }

    function utilizationRatio() public view returns (uint256) {
        uint256 totalBorrowed = totalBorrowedRcoin; // Assume `totalBorrowedRcoin` tracks the borrowed Rcoin
        uint256 totalSupply = rcoinToken.totalSupply();// Get the total supply of Rcoin
        require(totalSupply > 0, "Total supply must be greater than 0");
        return totalBorrowed.mul(1e18).div(totalSupply); // Return the utilization ratio as a percentage
    }

    // Function to calculate dynamic APR based on utilization rate
    function calculateDynamicApr() public {
        uint256 totalBorrowed = totalBorrowedRcoin; // Assume `totalBorrowedRcoin` tracks the borrowed Rcoin
        uint256 totalSupply = rcoinToken.totalSupply(); // Get the total supply of Rcoin
        require(totalSupply > 0, "Total supply must be greater than 0");
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
        uint256 totalBorrowed = totalBorrowedRcoin; // Assume `totalBorrowedRcoin` tracks the borrowed Rcoin
        uint256 totalSupply = rcoinToken.totalSupply(); // Get the total supply of Rcoin
        require(totalSupply > 0, "Total supply must be greater than 0");
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
