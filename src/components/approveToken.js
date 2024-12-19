// Fix the Calculate apr function and the claim reward function
// Make component for the function then make the pages to use that component
// pages will em approve, lend, borrow,liquidate

import React, { useState } from "react";
import { ethers, Contract, BrowserProvider } from "ethers";

const ApproveToken = ({ connectedAccount }) => {
    // const [account, setAccount] = useState(null);
    const [contractAddress, setContractAddress] = useState("");
    const [amount, setAmount] = useState("");

    const Lend_BorrowContractAddress =
        "0x277723FC71e66aE7058095Dc25932ffC0bCBDdbE";

    const popularContracts = [
        {
            name: "RCOIN",
            address: "0x38De1313FA9d30d0f0787364B682846168dF8803",
        },
        {
            name: "INRC",
            address: "0x47259A1fd4CE43F5E323706846dA691dE3d60321",
        },
        {
            name: "LINK",
            address: "0xf0B519405Adae70416d450694092e6e0EcFe3bf4",
        },
        {
            name: "MATIC",
            address: "0x31AA64e727aAaa95Ac6a3506b29eCF2912f60b0a",
        },
    ];

    const approveToken = async () => {
        if (!contractAddress || !amount) {
            alert("Please fill in all fields.");
            return;
        }

        if (!connectedAccount) {
            alert("Please connect your wallet.");
            return;
        }

        try {
            // const provider = new BrowserProvider(window.ethereum);
            // const signer = await provider.getSigner();

            // // Erc20 Token ABI for  "approve"
            // const contractAbi = [
            //     "function approve(address spender, uint256 amount) public returns(bool)",
            // ];

            // const tokenContract = new Contract(
            //     contractAddress,
            //     contractAbi,
            //     signer
            // );

            // const amountInWei = ethers.parseUnits(amount, 18);
            // const tx = await tokenContract.approve(
            //     Lend_BorrowContractAddress,
            //     amountInWei
            // );
            // const recepit = await tx.wait();
            // console.log(recepit);
            // console.log("Estimate gas:", tx.toString());

            // await tx.wait();

            console.log("Initializing provider...");
            const provider = new BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            console.log("Signer initialized:", signer);

            const contractAbi = [
                "function approve(address spender, uint256 amount) public returns(bool)",
            ];
            const tokenContract = new Contract(
                contractAddress,
                contractAbi,
                signer
            );
            console.log("Token contract initialized:", tokenContract);

            const amountInWei = ethers.parseUnits(amount, 18);
            console.log("Amount in Wei:", amountInWei);

            const tx = await tokenContract.approve(
                Lend_BorrowContractAddress,
                amountInWei
            );
            console.log("Transaction sent to MetaMask:", tx);
            const receipt = await tx.wait();
            console.log("Transaction successful:", receipt);

            alert("Approval Successful!");
        } catch (error) {
            console.error("Error approving token:", error);
            alert("Approval failed. Check console for the detils");
        }
    };

    return (
        <section>
            <div>
                <h2>Approve Token for Contact</h2>
                <div className="app-block">
                    <div>
                        <h3>Select Contract Address:</h3>
                        <div
                            style={{
                                display: "flex",
                                gap: "10px",
                                flexWrap: "wrap",
                            }}
                        >
                            {popularContracts.map((contract) => (
                                <button
                                    className="btn-primary"
                                    key={contract.address}
                                    onClick={() =>
                                        setContractAddress(contract.address)
                                    }
                                >
                                    {contract.name}
                                </button>
                            ))}
                        </div>
                        {contractAddress && (
                            <p>
                                Selected Contract Address:{""}{" "}
                                <strong>{contractAddress}</strong>
                            </p>
                        )}
                    </div>
                    <div style={{ marginTop: "20px" }}>
                        <div>
                            <label>Token Address:</label>
                            <input
                                style={{ color: "#fff" }}
                                type="text"
                                value={Lend_BorrowContractAddress}
                                disabled
                            />
                        </div>
                        <div>
                            <label> Amount to Approve:</label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="Enter amount"
                            />
                            <button
                                className="btn-primary"
                                onClick={approveToken}
                                style={{ marginTop: "20px" }}
                            >
                                Approve
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ApproveToken;
