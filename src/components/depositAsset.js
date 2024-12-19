import React, { useState, useContext } from "react";
import { ethers } from "ethers";
import contractABI from "../contractAbi/lending_borrowing.json"; // Replace with your contract's ABI file
import { StateContext } from "./FetchStateVari";

const DepositAsset = ({ connectAccount }) => {
    const [userBalances, setUserBalances] = useState({
        matic: 0,
        link: 0,
        inrc: 0,
        rcoin: 0,
    });
    const [depositAmount, setDepositAmount] = useState("");
    const [depositSelectedToken, setDepositSelectedToken] = useState("");
    const [lendRcoinAmount, setLendRcoinAmount] = useState("");
    const { stateVariables } = useContext(StateContext);

    if (!stateVariables) {
        return <div>Loading...</div>;
    }

    const Lend_BorrowContractAddress =
        "0x277723FC71e66aE7058095Dc25932ffC0bCBDdbE";

    // Predefined token addresses
    const tokenOptions = [
        {
            name: "Matic Token",
            address: "0x31AA64e727aAaa95Ac6a3506b29eCF2912f60b0a",
        },
        {
            name: "LINK Token",
            address: "0x31AA64e727aAaa95Ac6a3506b29eCF2912f60b0a",
        },
        {
            name: "INRC Token",
            address: "0x47259A1fd4CE43F5E323706846dA691dE3d60321",
        },
        {
            name: "Rcoin Token",
            address: "0x38De1313FA9d30d0f0787364B682846168dF8803",
        },
    ];

    const depositAsset = async () => {
        if (!connectAccount || !depositAmount || !depositSelectedToken) {
            alert("Please connect wallet and fill in all fields.");
            return;
        }

        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(
                Lend_BorrowContractAddress,
                contractABI,
                signer
            );
            const tokenAmount = ethers.parseEther(depositAmount);

            const tx = await contract.depositAsset(
                tokenAmount,
                depositSelectedToken
            );
            await tx.wait(); // Wait for transaction confirmation

            alert("Deposit successful!");
            console.log("Transaction:", tx);
        } catch (error) {
            console.error("Deposit failed:", error);
            alert("Deposit failed!");
        }
    };

    const fetchBalances = async () => {
        if (!connectAccount) {
            alert("Please connect the wallet to fetch balances");
        }
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(
                Lend_BorrowContractAddress,
                contractABI,
                signer
            );
            const maticBalance = await contract.userMaticDeposits(
                connectAccount
            );
            const linkBalance = await contract.userLinkDeposits(connectAccount);
            const inrcBalance = await contract.userInrcDeposits(connectAccount);
            const rcoinBalance = await contract.userRcoinDeposits(
                connectAccount
            );

            setUserBalances({
                matic: ethers.formatEther(maticBalance),
                link: ethers.formatEther(linkBalance),
                inrc: ethers.formatEther(inrcBalance),
                rcoin: ethers.formatEther(rcoinBalance),
            });
        } catch (error) {
            console.error("Error fetching balances:", error);
            alert("Failed to fetch balances.");
        }
    };

    const handleLendRcoin = async () => {
        if (!connectAccount || !lendRcoinAmount) {
            alert("Please enter amount");
            return;
        }

        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(
                Lend_BorrowContractAddress,
                contractABI,
                signer
            );
            const parseAmount = ethers.parseUnits(lendRcoinAmount, 18);
            const tx = await contract.lendRcoin(parseAmount);
            alert("Transaction successfull");
            const recipt = await tx.wait();
            console.log("Transaction successfull", recipt);
        } catch (error) {
            console.error("Transaction failed", error);
            alert("Transaction failed, for more detail open console log");
        }
    };

    return (
        <section>
            <div>
                <h3>Deposit Assets</h3>
                <div>
                    <label>Select Asset:</label>
                    <select
                        value={depositSelectedToken}
                        onChange={(e) =>
                            setDepositSelectedToken(e.target.value)
                        }
                    >
                        <option value="">--Select Token--</option>
                        {tokenOptions.map((token, index) => (
                            <option key={index} value={token.address}>
                                {token.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label>Deposit Amount:</label>
                    <input
                        type="number"
                        placeholder="Enter Number"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                    />
                    <button className="btn-primary" onClick={depositAsset}>
                        Deposit
                    </button>
                </div>

                <div>
                    <h1>State Variable</h1>
                    <ul>
                        <li>
                            Optimal Utilization:{" "}
                            {stateVariables.optimalUtilization}
                        </li>
                        <li>
                            Base Interest Rate:{" "}
                            {stateVariables.baseInterestRate}
                        </li>
                        <li>Base APY Rate: {stateVariables.baseApyRate}</li>
                        <li>
                            Dynamic Interest: {stateVariables.dynamicInterest}%
                        </li>
                        <li>Dynamic APR: {stateVariables.dynamicApr}%</li>
                    </ul>
                </div>

                <div>
                    <h2>Lend Rcoin</h2>
                    <input
                        type="text"
                        placeholder="Enter amount to lend"
                        value={lendRcoinAmount}
                        onChange={(e) => setLendRcoinAmount(e.target.value)}
                    />
                    <button className="btn-primary" onClick={handleLendRcoin}>
                        Lend Rcoin
                    </button>
                </div>
                <h3>Your Balances</h3>
                <p>MATIC: {userBalances.matic}</p>
                <p>LINK: {userBalances.link}</p>
                <p>INRC: {userBalances.inrc}</p>
                <p>RCOIN: {userBalances.rcoin}</p>
                <button className="btn-primary" onClick={fetchBalances}>
                    {" "}
                    Fetch Balances
                </button>
            </div>
        </section>
    );
};

export default DepositAsset;
