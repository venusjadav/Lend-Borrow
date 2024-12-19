import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Homepage";
import Lending from "./pages/LendingPage";
import Borrow from "./pages/BorrowPage";
import Liquidate from "./pages/LiquidatePage";
import StateProvider from "./components/FetchStateVari";

function App() {
    return (
        <StateProvider>
            <section>
                <Router>
                    <Navbar />
                    <div>
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/lend" element={<Lending />} />
                            <Route path="/borrow" element={<Borrow />} />
                            <Route path="/liquidate" element={<Liquidate />} />
                        </Routes>
                    </div>
                </Router>
                <footer style={{ textAlign: "center", marginTop: "40px" }}>
                    <p>&copy; 2024 Your Company. All rights reserved.</p>
                </footer>
            </section>
        </StateProvider>
    );
}

export default App;
