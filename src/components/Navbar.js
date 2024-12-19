import React from "react";
import { NavLink } from "react-router-dom";

function Navbar() {
    return (
        <nav className="nav-bar">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/lend">Lending</NavLink>
            <NavLink to="/borrow">Borrowing</NavLink>
            <NavLink to="/liquidate">Liquidate</NavLink>
        </nav>
    );
}

export default Navbar;
