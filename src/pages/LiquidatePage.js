import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import LiquidationComponent from "../components/liquidate";
import HealthFactor from "../components/healthFator";
import DynamicRate from "../components/dynamicRate";

function Liquidate() {
    const [connectAccount, setConnectAccount] = useState(null);

    useEffect(() => {
        const savedAccount = localStorage.getItem("connectAccount");
        if (savedAccount) {
            setConnectAccount(savedAccount);
        }
    }, []);

    const connectWallet = async () => {
        if (window.ethereum) {
            try {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const accounts = await provider.send("eth_requestAccounts", []);
                setConnectAccount(accounts[0]);
                localStorage.setItem("connectedAccount", accounts[0]);
            } catch (error) {
                console.error("Error connecting wallet:", error);
                alert("Failed to connect wallet.");
            }
        } else {
            alert("Please install MetaMask!");
        }
    };

    const disconnectWallet = () => {
        setConnectAccount(null);
        localStorage.removeItem("connectedAccount");
    };

    return (
        <section className="appContainer">
            <div className="hero-block">
                <div>
                    <div className="connect-add">
                        <h1>Liquidate Component</h1>
                        <div>
                            <button
                                onClick={
                                    connectAccount
                                        ? disconnectWallet
                                        : connectWallet
                                }
                                className="btn-primary"
                            >
                                {connectAccount
                                    ? `Connected: ${connectAccount.slice(
                                          0,
                                          6
                                      )}...${connectAccount.slice(-4)}`
                                    : "Connect Wallet"}
                            </button>
                        </div>
                    </div>
                    <div>
                        <LiquidationComponent connectAccount={connectAccount} />
                        <HealthFactor connectAccount={connectAccount} />
                        <DynamicRate connectAccount={connectAccount} />
                    </div>
                </div>
            </div>
        </section>
    );
}

export default Liquidate;
