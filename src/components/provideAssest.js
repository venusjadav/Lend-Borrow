import React, { useState } from "react";
import contractAbi from "../contractAbi/lending_borrowing.json";
import { ethers, Contract, BrowserProvider } from "ethers";

const ProvideAsset = ({ connectedAccount }) => {
    const [maticDepositAmount, setMaticDepositAmount] = useState("");
    const [linkDepositAmount, setLinkDepositAmount] = useState("");
    const [inrcDepositAmount, setInrcDepositAmount] = useState("");
    const [rcoinDepositAmount, setRcoinDepositAmount] = useState("");
    const [provideSpecificAmount, setProvideAmount] = useState("");
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

    // Function to provide all assets
    const provideAllAssets = async () => {
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

            const maticInWei = ethers.parseUnits(maticDepositAmount, 18);
            const linkInWei = ethers.parseUnits(linkDepositAmount, 18);
            const inrcInWei = ethers.parseUnits(inrcDepositAmount, 18);
            const rcoinInWei = ethers.parseUnits(rcoinDepositAmount, 18);

            const tx = await contract.provideAllAssets(
                maticInWei,
                linkInWei,
                inrcInWei,
                rcoinInWei
            );
            await tx.wait();
            alert("Assests provided successfully!");
        } catch (error) {
            console.error("Error providing all assets:", error);
            alert("Failed to provide assets. Check console for details");
        }
    };

    // Function to provide specific asset
    const provideSpecificAsset = async () => {
        if (!connectedAccount || !selectedToken || !provideSpecificAmount) {
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

            const amountInWei = ethers.parseUnits(provideSpecificAmount, 18);
            const tx = await contract.provideSpecificAsset(
                amountInWei,
                selectedToken
            );
            await tx.wait();
            alert("Specific asset provided successfully!");
        } catch (error) {
            console.error("Error providing specific asset:", error);
            alert(
                "Failed to provide specific asset. Check console for details."
            );
        }
    };

    return (
        <section>
            <div>
                <h1>Lending and Borrowing Contract</h1>

                <h3>Provide All Assets</h3>
                <input
                    type="number"
                    value={maticDepositAmount}
                    onChange={(e) => setMaticDepositAmount(e.target.value)}
                    placeholder="MATIC Amount"
                />
                <input
                    type="number"
                    value={linkDepositAmount}
                    onChange={(e) => setLinkDepositAmount(e.target.value)}
                    placeholder="LINK Amount"
                />
                <input
                    type="number"
                    value={inrcDepositAmount}
                    onChange={(e) => setInrcDepositAmount(e.target.value)}
                    placeholder="INRC Amount"
                />
                <input
                    type="number"
                    value={rcoinDepositAmount}
                    onChange={(e) => setRcoinDepositAmount(e.target.value)}
                    placeholder="RCOIN Amount"
                />
                <button className="btn-primary" onClick={provideAllAssets}>
                    {" "}
                    Provide All Assets
                </button>

                <h3>Provide Specific Asset</h3>
                <input
                    type="number"
                    value={provideSpecificAmount}
                    onChange={(e) => setProvideAmount(e.target.value)}
                    placeholder="Amount"
                />
                {/* Dropdown for token selection */}
                <select
                    value={selectedToken}
                    onChange={(e) => setSelectedToken(e.target.value)}
                >
                    <option value="" disabled>
                        {" "}
                        Select Token
                    </option>
                    (
                    {tokens.map((token) => (
                        <option key={token.address} value={token.address}>
                            {token.name}
                        </option>
                    ))}
                </select>
                <button className="btn-primary" onClick={provideSpecificAsset}>
                    Provide Specific Asset
                </button>
            </div>
        </section>
    );
};

export default ProvideAsset;
