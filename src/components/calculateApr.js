import React, { useState } from "react";
import { ethers } from "ethers";
import contractABI from "../contractAbi/lending_borrowing.json"; // Replace with your contract's ABI file
// import { toast } from "react-toastify"; // Optional: for user-friendly notifications

const CalculateApr = ({ connectAccount }) => {
    const [selectedTokenForApr, setSelectedTokenForApr] = useState("");
    const [reward, setReward] = useState("");
    // const [selectRewardToken, setSelectRewardToken] = useState("");
    const [claimToken, setClaimToken] = useState();
    const [message, setMessage] = useState("");

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

    const calculateApr = async () => {
        if (!connectAccount || !selectedTokenForApr) {
            alert("Please connect wallet and select a token address.");
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
            // Call the `calculateApr` function
            const apr = await contract.calculateApr(
                connectAccount,
                selectedTokenForApr
            );
            // await apr.wait();

            const formattedReward = ethers.formatEther(apr);
            // APR is returned in a big number; format it for display
            setReward(formattedReward);
            alert("APR calculation successful!");
        } catch (error) {
            console.error("Error calculating APR:", error);
            alert("Failed to calculate APR. Please try again.");
        }
    };

    const claimReward = async () => {
        if (!connectAccount || !claimToken) {
            setMessage("Please connect wallet and select a Token");
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
            const tx = await contract.claimRewards(claimToken);
            setMessage("Transaction submitted. Waiting for confrimation...");
            await tx.wait;
            setMessage("Rewards claimed Successfully");
        } catch (error) {
            console.error("Error claiming rewards", error);
            setMessage(
                "Failed to claim rewards. For more detail look in the console"
            );
        }
    };

    return (
        <section>
            <div>
                <div>
                    <h3>Calculate Apr</h3>
                    <label>Select Token Address</label>
                    <select
                        value={selectedTokenForApr}
                        onChange={(e) => setSelectedTokenForApr(e.target.value)}
                    >
                        <option value="">-- Select a Token --</option>
                        {tokenOptions.map((token, index) => (
                            <option key={index} value={token.address}>
                                {token.name}
                            </option>
                        ))}
                    </select>
                </div>
                <button className="btn-primary" onClick={calculateApr}>
                    Calculate Apr
                </button>

                {calculateApr && (
                    <div>
                        <h3>Calculated Apr:</h3>
                        <p>{reward}</p>
                    </div>
                )}
            </div>

            <div>
                <div>
                    <label>Select the Token:</label>
                    <select
                        value={claimToken}
                        onChange={(e) => setClaimToken(e.target.value)}
                    >
                        <option value="">--Select a Token </option>
                        {tokenOptions.map((token, index) => (
                            <option key={index} value={token.address}>
                                {token.name}
                            </option>
                        ))}
                    </select>
                </div>

                <button className="btn-primary" onClick={claimReward}>
                    Claim Rewards
                </button>

                {message && (
                    <div>
                        <h3>Status:</h3>
                        <p>{message}</p>
                    </div>
                )}
            </div>
        </section>
    );
};

export default CalculateApr;
