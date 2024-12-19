// src/pages/HomePage.js

import React, { useState } from "react";
import { BrowserProvider } from "ethers";
import ApproveToken from "../components/approveToken";
import ProvideAsset from "../components/provideAssest";
import TakeAssest from "../components/takeAssest";

const HomePage = () => {
    const [connectedAccount, setConnectedAccount] = useState(null);

    const connectWallet = async () => {
        if (window.ethereum) {
            try {
                const provider = new BrowserProvider(window.ethereum);
                const account = await provider.send("eth_requestAccounts", []);
                setConnectedAccount(account[0]);
                localStorage.setItem("connectedAccount", account[0]);
            } catch (error) {
                console.error("Error connecting wallet:", error);
            }
        } else {
            alert("Please install Metamask!");
        }
    };

    const disconnectWallet = () => {
        setConnectedAccount(null);
        localStorage.removeItem("connectedAccount");
    };

    return (
        <section className="appContainer">
            <div className="hero-block">
                <div className="connect-add">
                    <h1>Home Page</h1>
                    <div>
                        <button
                            onClick={
                                connectedAccount
                                    ? disconnectWallet
                                    : connectWallet
                            }
                            className="btn-primary"
                        >
                            {connectedAccount
                                ? `Connected: ${connectedAccount.slice(
                                      0,
                                      6
                                  )}...${connectedAccount.slice(-4)}`
                                : "Connect Wallet"}
                        </button>
                    </div>
                </div>
                <ApproveToken connectedAccount={connectedAccount} />
                <ProvideAsset connectedAccount={connectedAccount} />
                <TakeAssest connectedAccount={connectedAccount} />
            </div>
        </section>
    );
};

export default HomePage;
