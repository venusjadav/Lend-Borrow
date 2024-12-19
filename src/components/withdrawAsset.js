import React, { useState } from "react";
import { ethers } from "ethers";
import contractABI from "../contractAbi/lending_borrowing.json"; // Replace with your contract's ABI file

const WithdrawAsset = ({ connectAccount }) => {
    const [withdrawMaticAmount, setWithdrawMaticAmount] = useState("");
    const [withdrawLinkAmount, setWithdrawLinkAmount] = useState("");
    const [withdrawRcoinAmount, setWithdrawRcoinAmount] = useState("");
    const [withdrawInrcAmount, setWithdrawInrcAmount] = useState("");

    const Lend_BorrowContractAddress =
        "0x277723FC71e66aE7058095Dc25932ffC0bCBDdbE";

    const withdrawMatic = async () => {
        if (!connectAccount || !withdrawMaticAmount) {
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
            const tokenAmount = ethers.parseEther(withdrawMaticAmount);
            const tx = await contract.withdrawMaticCollateral(tokenAmount);
            await tx.wait(); // Wait for transaction confirmation
            alert("Withdrawal successful!");
            console.log("Transaction:", tx);
        } catch (error) {
            console.error("Withdrawal failed:", error);
            alert("Withdrawal failed!");
        }
    };

    const withdrawLink = async () => {
        if (!connectAccount || !withdrawLinkAmount) {
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
            const tokenAmount = ethers.parseEther(withdrawLinkAmount);
            const tx = await contract.withdrawLinkCollateral(tokenAmount);
            await tx.wait(); // Wait for transaction confirmation
            alert("Withdrawal successful!");
            console.log("Transaction:", tx);
        } catch (error) {
            console.error("Withdrawal failed:", error);
            alert("Withdrawal failed!");
        }
    };

    const withdrawInrc = async () => {
        if (!connectAccount || !withdrawInrcAmount) {
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
            const tokenAmount = ethers.parseEther(withdrawInrcAmount);
            const tx = await contract.withdrawInrcCollateral(tokenAmount);
            await tx.wait(); // Wait for transaction confirmation
            alert("Withdrawal successful!");
            console.log("Transaction:", tx);
        } catch (error) {
            console.error("Withdrawal failed:", error);
            alert("Withdrawal failed!");
        }
    };

    const withdrawRcoin = async () => {
        if (!connectAccount || !withdrawRcoinAmount) {
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
            const tokenAmount = ethers.parseEther(withdrawRcoinAmount);
            const tx = await contract.withdrawRcoinCollateral(tokenAmount);
            await tx.wait(); // Wait for transaction confirmation
            alert("Withdrawal successful!");
            console.log("Transaction:", tx);
        } catch (error) {
            console.error("Withdrawal failed:", error);
            alert("Withdrawal failed!");
        }
    };

    return (
        <div>
            <h3>Withdraw Assets</h3>
            <div>
                <label>Withdraw Matic:</label>
                <input
                    type="number"
                    placeholder="Enter Number"
                    value={withdrawMaticAmount}
                    onChange={(e) => setWithdrawMaticAmount(e.target.value)}
                />
                <button className="btn-primary" onClick={withdrawMatic}>
                    Withdraw
                </button>
            </div>
            <div>
                <label>Withdraw Link:</label>
                <input
                    type="number"
                    placeholder="Enter Number"
                    value={withdrawLinkAmount}
                    onChange={(e) => setWithdrawLinkAmount(e.target.value)}
                />
                <button className="btn-primary" onClick={withdrawLink}>
                    Withdraw
                </button>
            </div>
            <div>
                <label>Withdraw Inrc:</label>
                <input
                    type="number"
                    placeholder="Enter Number"
                    value={withdrawInrcAmount}
                    onChange={(e) => setWithdrawInrcAmount(e.target.value)}
                />
                <button className="btn-primary" onClick={withdrawInrc}>
                    Withdraw
                </button>
            </div>
            <div>
                <label>Withdraw Rcoin:</label>
                <input
                    type="number"
                    placeholder="Enter Number"
                    value={withdrawRcoinAmount}
                    onChange={(e) => setWithdrawRcoinAmount(e.target.value)}
                />
                <button className="btn-primary" onClick={withdrawRcoin}>
                    Withdraw
                </button>
            </div>
        </div>
    );
};

export default WithdrawAsset;
