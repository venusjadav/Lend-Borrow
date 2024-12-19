import React, { useState } from "react";
import { ethers, BrowserProvider } from "ethers";
import contractABI from "../contractAbi/lending_borrowing.json"; // Replace with your contract's ABI file

const LiquidationComponent = ({ connectAccount }) => {
    const [selectedTokenLq, setSelectedTokenLq] = useState("");
    const [userAddress, setUserAddress] = useState("");

    const Lend_BorrowContractAddress =
        "0x277723FC71e66aE7058095Dc25932ffC0bCBDdbE";

    const handleLiquidation = async () => {
        if (!connectAccount || !selectedTokenLq || !userAddress) {
            alert("Please select a token and provide the user address");
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

            let liquidate;
            if (selectedTokenLq === "matic") {
                liquidate = await contract.liquidateMatic(userAddress);
            } else if (selectedTokenLq === "link") {
                liquidate = await contract.liquidateLink(userAddress);
            } else if (selectedTokenLq === "inrc") {
                liquidate = await contract.liquidateInrc(userAddress);
            } else {
                alert("Invalid token selected");
                return;
            }

            await liquidate.wait();
            alert("Liquidation Successfull");
        } catch (error) {
            console.error("Liqudation failed:", error);
            alert("Liqudation failed, check console for more detail");
        }
    };

    return (
        <section>
            <div>
                <h3>Liquidation</h3>
                <div>
                    <label>User Addres</label>
                    <input
                        type="text"
                        value={userAddress}
                        onChange={(e) => setUserAddress(e.target.value)}
                        placeholder="Enter User Address"
                    />
                </div>
                <div>
                    <label>Select Token</label>
                    <select
                        value={selectedTokenLq}
                        onChange={(e) => setSelectedTokenLq(e.target.value)}
                    >
                        <option value="">--Select Token--</option>
                        <option value="matic">Matic</option>
                        <option value="link">Link</option>
                        <option value="inrc">Inrc</option>
                    </select>
                </div>
                <button className="btn-primary" onClick={handleLiquidation}>
                    Liquidate
                </button>
            </div>
        </section>
    );
};

export default LiquidationComponent;
