import { Link } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  return (
    <div className="navbar">

      <Link to="/" className="logo">
        InstaClone
      </Link>

      <input className="search" placeholder="Search..." />

      <div className="nav-icons">
        <Link to="/">🏠</Link>
        <Link to="/login">💬</Link>
        <Link to="/register">❤️</Link>
        <span>👤</span>
      </div>

    </div>
  );
}

export default Navbar;