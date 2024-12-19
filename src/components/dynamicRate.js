import React, { useState, useEffect, useCallback } from "react";
import { ethers, BrowserProvider } from "ethers";
import contractABI from "../contractAbi/lending_borrowing.json"; // Replace with your contract's ABI file

const DynamicRate = ({ connectAccount }) => {
    const [dynamicInterest, setDynamicInterest] = useState(null);
    const [dynamicApr, setDynamicApr] = useState(null);
    const [utiRatio, setUtiRatio] = useState("");

    const Lend_BorrowContractAddress =
        "0x277723FC71e66aE7058095Dc25932ffC0bCBDdbE";

    const utilizationRatio = async () => {
        if (!connectAccount) {
            alert("Please Connect Wallet");
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
            const utilizationR = await contract.utilizationRatio();

            setUtiRatio(ethers.formatUnits(utilizationR, 18));
            alert("Calculated HealthFactor");
        } catch (error) {
            console.error("Error calculating Health Factor", error);
            alert("Failder to calculate Health Factor");
        }
    };

    const fetchDynamicValues = useCallback(async () => {
        try {
            const provider = new BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(
                Lend_BorrowContractAddress,
                contractABI,
                signer
            );
            const interest = await contract.dynamicInterest();
            const apr = await contract.dynamicApr();
            setDynamicInterest(ethers.formatUnits(interest, 18));
            setDynamicApr(ethers.formatUnits(apr, 18));
        } catch (error) {
            console.error("Error fetching values:", error);
        }
    }, []);

    useEffect(() => {
        fetchDynamicValues(); // Initial fetch
        const intervalId = setInterval(fetchDynamicValues, 10000);

        return () => clearInterval(intervalId); // Cleanup
    }, [fetchDynamicValues]);

    return (
        <section>
            <div>
                <h3>Calculate Utilization Ratio</h3>
                <button className="btn-primary" onClick={utilizationRatio}>
                    Utilization Ratio
                </button>
                <p>{utiRatio}</p>
            </div>

            <div>
                <h2>Dynamic Rates</h2>
                <p>
                    <strong>Dynamic Interest:</strong>{" "}
                    {dynamicInterest !== null ? dynamicInterest : "Loading..."}
                </p>
                <p>
                    <strong>Dynamic APR:</strong>{" "}
                    {dynamicApr !== null ? dynamicApr : "Loading..."}
                </p>
            </div>
        </section>
    );
};

export default DynamicRate;
