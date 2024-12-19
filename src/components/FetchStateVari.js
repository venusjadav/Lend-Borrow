import React, { createContext, useState, useEffect } from "react";
import { ethers } from "ethers";
import contractAbi from "../contractAbi/lending_borrowing.json";

const Lend_BorrowContractAddress = "0x277723FC71e66aE7058095Dc25932ffC0bCBDdbE";

export const StateContext = createContext();

const StateProvider = ({ children }) => {
    const [stateVariables, setStateVariables] = useState({
        optimalUtilization: 0,
        baseInterestRate: 0,
        SECONDS_IN_YEAR: 0,
        baseApyRate: 0,
        slope1: 0,
        slope2: 0,
        totalBorrowedRcoin: 0,
        dynamicInterest: 0,
        dynamicApr: 0,
    });

    useEffect(() => {
        const fetchStateVariables = async () => {
            try {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const contract = new ethers.Contract(
                    Lend_BorrowContractAddress,
                    contractAbi,
                    provider
                );

                // Fetch all state variables
                const optimalUtilization = await contract.optimalUtilization();
                const baseInterestRate = await contract.baseInterestRate();
                const SECONDS_IN_YEAR = await contract.SECONDS_IN_YEAR();
                const baseApyRate = await contract.baseApyRate();
                // const slope1 = await contract.slope1();
                // const slope2 = await contract.slope2();
                const totalBorrowedRcoin = await contract.totalBorrowedRcoin();
                const dynamicInterest = await contract.dynamicInterest();
                const dynamicApr = await contract.dynamicApr();

                // Update state
                setStateVariables({
                    optimalUtilization: ethers.formatEther(optimalUtilization),
                    baseInterestRate: ethers.formatEther(baseInterestRate),
                    SECONDS_IN_YEAR: SECONDS_IN_YEAR.toString(),
                    baseApyRate: ethers.formatEther(baseApyRate),
                    // slope1: ethers.formatEther(slope1),
                    // slope2: ethers.formatEther(slope2),
                    totalBorrowedRcoin: ethers.formatEther(totalBorrowedRcoin),
                    dynamicInterest: ethers.formatEther(dynamicInterest),
                    dynamicApr: ethers.formatEther(dynamicApr),
                });
            } catch (error) {
                console.error("Error fetching state variables:", error);
            }
        };

        fetchStateVariables();
        const interval = setInterval(fetchStateVariables, 10000);
        return () => clearInterval(interval);
    }, []);

    return (
        <StateContext.Provider value={{ stateVariables, setStateVariables }}>
            {children}
        </StateContext.Provider>
    );
};

export default StateProvider;
