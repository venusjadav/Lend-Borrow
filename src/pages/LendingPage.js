import React, { useState } from "react";
import { BrowserProvider } from "ethers";
import DepositAsset from "../components/depositAsset";
import WithdrawAsset from "../components/withdrawAsset";
import CalculateApr from "../components/calculateApr";

function Lending() {
    const [connectAccount, setConnectAccount] = useState(null);

    const connectWallet = async () => {
        if (window.ethereum) {
            try {
                const provider = new BrowserProvider(window.ethereum);
                const account = await provider.send("eth_requestAccounts", []);
                setConnectAccount(account[0]);
            } catch (error) {
                console.error("Error connecting wallet:", error);
            }
        } else {
            alert("Please install Metamask!");
        }
    };

    return (
        <section className="appContainer">
            <div className="hero-block">
                <div>
                    <div className="connect-add">
                        <h1>Lending Page</h1>
                        <div>
                            <button
                                className="btn-primary"
                                onClick={connectWallet}
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
                    <div className="comp-blk">
                        <div className="comp-part-left">
                            <DepositAsset connectAccount={connectAccount} />
                        </div>
                        <div className="comp-part-right">
                            <WithdrawAsset connectAccount={connectAccount} />
                            <CalculateApr connectAccount={connectAccount} />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default Lending;
