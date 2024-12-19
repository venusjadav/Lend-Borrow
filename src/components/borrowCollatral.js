import React, { useState } from "react";
import { ethers } from "ethers";
import contractABI from "../contractAbi/lending_borrowing.json"; // Replace with your contract's ABI file
import { toast } from "react-toastify"; // Optional: for user-friendly notifications

const BorrowComponent = () => {
    const [signer, setSigner] = useState("");
    const [account, setAccount] = useState("");
    const [selectTokenBorrow, setSelectTokenBorrow] = useState("");
    const [calculateBorrowableRcoin, setcalculateBorrowableRcoin] =
        useState("");
    const [borrowAmount, setBorrowAmount] = useState("");
    const [borrowSelectedToken, setBorrowSelectedToken] = useState("");
    const [tokenAddressSPLoan, setTokenAddressSpLoan] = useState("");
    const [specificLoanAmount, setSpecificLoanAmount] = useState(null);
    const [loading, setloading] = useState(false);
    const [repayAmount, setRepayAmount] = useState("");
    const [selectRepayToken, setSelectRepayToken] = useState("");
    const [selectFullRepaytoken, setSelectFullRepaytoken] = useState("");

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

    const initializeEthers = async () => {
        if (window.ethereum) {
            try {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const ethSigner = await provider.getSigner();
                const accounts = await provider.send("eth_requestAccounts", []);
                // setProvider(provider);
                setSigner(ethSigner);
                setAccount(accounts[0]);
                toast.success("Wallet connected!");
            } catch (error) {
                console.error("Error connecting wallet:", error);
                toast.error("Failed to connect wallet.");
            }
        } else {
            toast.error("Please install MetaMask!");
        }
    };

    const BorrowRcoin = async () => {
        if (!signer || !borrowAmount || !borrowSelectedToken) {
            toast.error("Please connect wallet and fill in all fields.");
            return;
        }

        try {
            const contract = new ethers.Contract(
                Lend_BorrowContractAddress,
                contractABI,
                signer
            );
            const tokenAmount = ethers.parseEther(borrowAmount);

            const tx = await contract.borrowRcoin(
                tokenAmount,
                borrowSelectedToken
            );
            await tx.wait();

            toast.success("Borrow Successful!");
            console.log("Transaction:", tx);
        } catch (error) {
            console.error("Borrow Failed", error);
            toast.error("Borrow failed");
        }
    };

    const CalculateBorrowableRcoin = async () => {
        if (!signer || !selectTokenBorrow) {
            alert("Please connect wallet and select a token");
            return;
        }

        try {
            const contract = new ethers.Contract(
                Lend_BorrowContractAddress,
                contractABI,
                signer
            );
            const borrowable = await contract.calculateBorrowableRcoin(
                account,
                selectTokenBorrow
            );

            setcalculateBorrowableRcoin(ethers.formatUnits(borrowable, 18));
            alert("Borrwable Rcoin Calculated successfully");
        } catch (error) {
            console.error("Error calculating borrowable rcoin", error);
            alert("Failed to calculate borrowable rcoin amount");
        }
    };

    const getSpecificLoan = async () => {
        if (!tokenAddressSPLoan || !account) {
            toast.error("Please select a token");
            return;
        }

        try {
            setloading(true);

            const contract = new ethers.Contract(
                Lend_BorrowContractAddress,
                contractABI,
                signer
            );

            const loan = await contract.specificLoan(
                tokenAddressSPLoan,
                account
            );
            setSpecificLoanAmount(ethers.formatEther(loan));
            toast.success("Loan fetched successfully");
        } catch (error) {
            console.error("Error fetching Loan:", error);
            toast.error(
                "Failed to fetch loan detail, Check console for details"
            );
        } finally {
            setloading(false);
        }
    };

    const RepayLoanAmount = async () => {
        if (!signer || !repayAmount || !selectRepayToken) {
            toast.error("Please provide the amount or select the token");
            return;
        }

        try {
            // const tokenAddress = ethers.getAddress(selectRepayToken);

            const contract = new ethers.Contract(
                Lend_BorrowContractAddress,
                contractABI,
                signer
            );

            const amountInWei = ethers.parseEther(repayAmount);

            const repay = await contract.repayLoanAmount(
                amountInWei,
                selectRepayToken
            );
            await repay.wait();

            toast.success("Loan repayment successful");
            console.log("Transaction:", repay);
        } catch (error) {
            console.error("Error repaying Loan:", error);
            toast.error(
                "Failed to repay loan , Check concole for more details"
            );
        }
    };

    const RepayFullLoan = async () => {
        if (!signer || !selectFullRepaytoken) {
            toast.error("Please select the token");
            return;
        }

        try {
            const contract = new ethers.Contract(
                Lend_BorrowContractAddress,
                contractABI,
                signer
            );

            const repayLoan = await contract.repayFullLoan(
                selectFullRepaytoken
            );
            await repayLoan.wait();

            toast.success("Full loan has been paid");
            console.log("Transation success", repayLoan);
        } catch (error) {
            console.error("Error repaying Loan:", error);
            toast.error("Failed to repay loan, Check console for more detail");
        }
    };

    return (
        <section>
            <div>
                <div className="connect-add">
                    <h2>Borrow Component</h2>
                    <button className="btn-primary" onClick={initializeEthers}>
                        {account
                            ? `Connected: ${account.slice(
                                  0,
                                  6
                              )}...${account.slice(-4)}`
                            : "Connect Wallet"}
                    </button>
                </div>
                <div className="comp-blk">
                    <div className="comp-part-left">
                        <div>
                            <h3>Borrow Rcoin:</h3>
                            <div>
                                <label>Select Asset:</label>
                                <select
                                    value={borrowSelectedToken}
                                    onChange={(e) =>
                                        setBorrowSelectedToken(e.target.value)
                                    }
                                >
                                    <option value="">--Select Token--</option>
                                    {tokenOptions.map((token, index) => (
                                        <option
                                            key={index}
                                            value={token.address}
                                        >
                                            {token.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label>Borrow Amount</label>
                                <input
                                    type="number"
                                    placeholder="Enter Number"
                                    value={borrowAmount}
                                    onChange={(e) =>
                                        setBorrowAmount(e.target.value)
                                    }
                                />
                                <button
                                    className="btn-primary"
                                    onClick={BorrowRcoin}
                                >
                                    Borrow
                                </button>
                            </div>
                        </div>
                        <h3>Calculate Borrowable Rcoin</h3>
                        <div>
                            <label>Select Token</label>
                            <select
                                value={selectTokenBorrow}
                                onChange={(e) =>
                                    setSelectTokenBorrow(e.target.value)
                                }
                            >
                                <option>--Select a Token </option>
                                {tokenOptions.map((token, index) => (
                                    <option key={index} value={token.address}>
                                        {token.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button
                            className="btn-primary"
                            onClick={CalculateBorrowableRcoin}
                        >
                            Calculate Borrowable Rcoin
                        </button>

                        {calculateBorrowableRcoin !== null && (
                            <div>
                                <h3>Borrowable Rcoin</h3>
                                <p>{calculateBorrowableRcoin}</p>
                            </div>
                        )}
                    </div>
                    <div className="comp-part-right">
                        <div>
                            <h3>Fetch Specific Loan</h3>
                            <div>
                                <label>Select Token:</label>
                                <select
                                    vlaue={tokenAddressSPLoan}
                                    onChange={(e) =>
                                        setTokenAddressSpLoan(e.target.value)
                                    }
                                >
                                    <option value="">--Select Token--</option>
                                    {tokenOptions.map((token, index) => (
                                        <option
                                            key={index}
                                            value={token.address}
                                        >
                                            {token.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <button
                                className="btn-primary"
                                onClick={getSpecificLoan}
                                disabled={loading}
                            >
                                {loading ? "Fetching..." : "Get Loan"}
                            </button>
                            {specificLoanAmount !== null && (
                                <div>
                                    <h4>Loan Amount</h4>
                                    <p>{specificLoanAmount} </p>
                                </div>
                            )}
                        </div>
                        <div>
                            <h3>Repay Loan Amount</h3>
                            <div>
                                <label>Select Token:</label>
                                <select
                                    value={selectRepayToken}
                                    onChange={(e) =>
                                        setSelectRepayToken(e.target.value)
                                    }
                                >
                                    <option value="">--Select Token--</option>
                                    {tokenOptions.map((token, index) => (
                                        <option
                                            key={index}
                                            value={token.address}
                                        >
                                            {token.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label> Repay Amount:</label>
                                <input
                                    type="number"
                                    placeholder="Enter Number"
                                    value={repayAmount}
                                    onChange={(e) =>
                                        setRepayAmount(e.target.value)
                                    }
                                />
                                <button
                                    className="btn-primary"
                                    onClick={RepayLoanAmount}
                                >
                                    Repay Loan
                                </button>
                            </div>
                        </div>
                        <div>
                            <h3>Repay Full Loan</h3>
                            <div>
                                <select
                                    value={selectFullRepaytoken}
                                    onChange={(e) =>
                                        setSelectFullRepaytoken(e.target.value)
                                    }
                                >
                                    <option value="">--Select Token--</option>
                                    {tokenOptions.map((token, index) => (
                                        <option
                                            key={index}
                                            value={token.address}
                                        >
                                            {token.name}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    className="btn-primary"
                                    onClick={RepayFullLoan}
                                >
                                    Repay Full Loan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default BorrowComponent;
