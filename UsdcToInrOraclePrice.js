const { ethers } = require("ethers");

async function fetchModule() {
    const fetch = (await import("node-fetch")).default; // Dynamically import fetch

    // Replace with your Infura API URL or provider
    const INFURA_API_URL =
        "https://polygon-amoy.infura.io/v3/acb090facd8a4303995721ecef70b4eb";
    const PRIVATE_KEY =
        "b3d8880d9b0a85c56f25a55adacc7ff001b3ce8dbbfc34b9a54e9c30673681ec"; // Replace with your wallet private key

    // Replace with your deployed contract address
    const contractAddress = "0xCA4225A9C4Bd9876b9cAA82B859c0a27cBB7A54f";

    // Replace with your contract's ABI
    const contractABI = [
        {
            inputs: [
                {
                    internalType: "uint256",
                    name: "_price",
                    type: "uint256",
                },
            ],
            name: "setPrice",
            outputs: [],
            stateMutability: "nonpayable",
            type: "function",
        },
        {
            inputs: [],
            name: "getPrice",
            outputs: [
                {
                    internalType: "uint256",
                    name: "",
                    type: "uint256",
                },
            ],
            stateMutability: "view",
            type: "function",
        },
    ];

    // Create the provider and wallet
    const provider = new ethers.JsonRpcProvider(INFURA_API_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const priceContract = new ethers.Contract(
        contractAddress,
        contractABI,
        wallet
    );

    // Function to fetch the USDC to INR price
    async function getUsdcToInrPrice() {
        const response = await fetch(
            "https://api.coingecko.com/api/v3/simple/price?ids=usd-coin&vs_currencies=inr"
        );
        const data = await response.json();
        const priceInInr = data["usd-coin"].inr;
        console.log(`Current USDC to INR price: ₹${priceInInr}`);

        // Call the setPrice function of the smart contract to update the price
        await setPriceInContract(priceInInr);
    }

    // Function to set the price in the smart contract
    async function setPriceInContract(priceInInr) {
        const priceInWei = ethers.parseUnits(priceInInr.toString(), 18); // Convert to 18 decimals
        console.log("Setting price in contract...");

        try {
            // Get the current gas price
            const gasPrice = (await provider.getFeeData()).gasPrice;
            console.log(gasPrice);
            const gasLimit = 100000;

            // Send the transaction to set the price
            const tx = await priceContract.setPrice(priceInWei, {
                gasPrice: gasPrice,
                gasLimit: gasLimit,
            });
            console.log(`Transaction sent. Waiting for confirmation...`);
            const receipt = await tx.wait();
            console.log(
                `Price set successfully! Transaction hash: ${receipt.transactionHash}`
            );
        } catch (error) {
            console.error("Error setting price in contract:", error);
        }
    }
    // Fetch the price and set it in the contract
    getUsdcToInrPrice();
}

fetchModule();
