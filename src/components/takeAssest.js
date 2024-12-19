import React, { useState } from "react";
import contractAbi from "../contractAbi/lending_borrowing.json";
import { ethers, Contract, BrowserProvider } from "ethers";

const TakeAssest = ({ connectedAccount }) => {
    const [maticWithdrawAmount, setMaticWithdrawAmount] = useState("");
    const [linkWithdrawAmount, setLinkWithdrawAmount] = useState("");
    const [inrcWithdrawAmount, setInrcWithdrawAmount] = useState("");
    const [rcoinWithdrawAmount, setRcoinWithdrawAmount] = useState("");
    const [takeSpecificAmount, setTakeAmount] = useState("");
    const [selectedToken, setSelectedToken] = useState("");

    const Lend_BorrowContractAddress =
        "0x277723FC71e66aE7058095Dc25932ffC0bCBDdbE";

    // Token Address
    const tokens = [
        {
            name: "MATIC",
            address: "0x31AA64e727aAaa95Ac6a3506b29eCF2912f60b0a",
        },
        {
            name: "LINK",
            address: "0xf0B519405Adae70416d450694092e6e0EcFe3bf4",
        },
        {
            name: "INRC",
            address: "0x47259A1fd4CE43F5E323706846dA691dE3d60321",
        },
        {
            name: "RCOIN",
            address: "0x38De1313FA9d30d0f0787364B682846168dF8803",
        },
    ];

    // Function to take all assets
    const takeAllAssets = async () => {
        if (!connectedAccount) {
            alert("Please connect your wallet");
            return;
        }
        try {
            const provider = new BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            const contract = new Contract(
                Lend_BorrowContractAddress,
                contractAbi,
                signer
            );

            const maticInWei = ethers.parseUnits(maticWithdrawAmount, 18);
            const linkInWei = ethers.parseUnits(linkWithdrawAmount, 18);
            const inrcInWei = ethers.parseUnits(inrcWithdrawAmount, 18);
            const rcoinInWei = ethers.parseUnits(rcoinWithdrawAmount, 18);

            const tx = await contract.takeAllAssets(
                maticInWei,
                linkInWei,
                inrcInWei,
                rcoinInWei
            );
            await tx.wait();
            alert("Assets taken successfully!");
        } catch (error) {
            console.error("Error taking all assets:", error);
            alert("Failed to take assets. Check console for details.");
        }
    };

    // Function to take specific asset
    const takeSpecificAsset = async () => {
        if (!connectedAccount || !selectedToken || !takeSpecificAmount) {
            alert("Please fill in all fields.");
            return;
        }

        try {
            const provider = new BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            const contract = new Contract(
                Lend_BorrowContractAddress,
                contractAbi,
                signer
            );

            const amountInWei = ethers.parseUnits(takeSpecificAmount, 18);
            const tx = await contract.takeSpecficAsset(
                amountInWei,
                selectedToken
            );
            await tx.wait();
            alert("Specific asset taken successfully!");
        } catch (error) {
            console.error("Error taking specific asset:", error);
            alert("Failed to take specific asset. Check console for details.");
        }
    };

    return (
        <section>
            <div>
                <h3>Take All Assets</h3>
                <input
                    type="number"
                    value={maticWithdrawAmount}
                    onChange={(e) => setMaticWithdrawAmount(e.target.value)}
                    placeholder="MATIC Amount"
                />
                <input
                    type="number"
                    value={linkWithdrawAmount}
                    onChange={(e) => setLinkWithdrawAmount(e.target.value)}
                    placeholder="LINK Amount"
                />
                <input
                    type="number"
                    value={inrcWithdrawAmount}
                    onChange={(e) => setInrcWithdrawAmount(e.target.value)}
                    placeholder="INRC Amount"
                />
                <input
                    type="number"
                    value={rcoinWithdrawAmount}
                    onChange={(e) => setRcoinWithdrawAmount(e.target.value)}
                    placeholder="RCOIN Amount"
                />
                <button className="btn-primary" onClick={takeAllAssets}>
                    Take All Assets
                </button>

                <h3>Take Specific Asset</h3>
                <input
                    type="text"
                    value={takeSpecificAmount}
                    onChange={(e) => setTakeAmount(e.target.value)}
                    placeholder="Amount"
                />
                {/* Dropdown for token selection */}

                <select
                    value={selectedToken}
                    onChange={(e) => setSelectedToken(e.target.value)}
                >
                    <option value="" disabled>
                        Select Token
                    </option>
                    (
                    {tokens.map((taktoken) => (
                        <option key={taktoken.address} value={taktoken.address}>
                            {taktoken.name}
                        </option>
                    ))}
                </select>
                <button className="btn-primary" onClick={takeSpecificAsset}>
                    Take Specific Asset
                </button>
            </div>
        </section>
    );
};

export default TakeAssest;
