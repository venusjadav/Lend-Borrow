import React, { useState } from "react";
import { ethers, BrowserProvider } from "ethers";
import contractABI from "../contractAbi/lending_borrowing.json"; // Replace with your contract's ABI file

const HealthFactor = ({ connectAccount }) => {
    const [healthFactor, setHealthFactor] = useState("");
    const [selectTokenHF, setSelectedTokenHF] = useState("");

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
            address: "0xf0B519405Adae70416d450694092e6e0EcFe3bf4",
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

    const CalculateHealthFactor = async () => {
        if (!connectAccount || !selectTokenHF) {
            alert("Please Connect Wallet or select a token");
            return;
        }

        try {
            const provider = new BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(
                Lend_BorrowContractAddress,
                contractABI,
                signer
            );
            const healthFa = await contract.getHealthFactor(
                connectAccount,
                selectTokenHF
            );

            setHealthFactor(ethers.formatUnits(healthFa, 18));
            // alert("Calculated HealthFactor");
        } catch (error) {
            console.error("Error calculating Health Factor", error);
            alert("Failder to calculate Health Factor");
        }
    };

    return (
        <section>
            <div>
                <h3>Health Factor</h3>
                <div>
                    <label>Select Token</label>
                    <select
                        value={selectTokenHF}
                        onChange={(e) => setSelectedTokenHF(e.target.value)}
                    >
                        <option>--Select a Token</option>
                        {tokenOptions.map((token, index) => (
                            <option key={index} value={token.address}>
                                {token.name}
                            </option>
                        ))}
                    </select>
                </div>
                <button className="btn-primary" onClick={CalculateHealthFactor}>
                    Health Factor
                </button>
                {CalculateHealthFactor !== null && (
                    <div>
                        <h3>Calculate Health Factor</h3>
                        <p>{Number(healthFactor).toFixed(4)}</p>
                    </div>
                )}
            </div>
        </section>
    );
};

export default HealthFactor;
