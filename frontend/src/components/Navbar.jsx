import { Link, useLocation } from "react-router-dom";
import { useApp } from "../contexts/AppContext";
import "./Navbar.css";

export default function Navbar() {
    const { user, sidebarOpen, setSidebarOpen } = useApp();
    const location = useLocation();

    const isLanding = location.pathname === "/" || location.pathname === "/login" || location.pathname === "/signup";

    return (
        <nav className={`navbar ${isLanding ? "navbar--landing" : ""}`}>
            {/* Left section */}
            <div className="navbar__left">
                {!isLanding && (
                    <button
                        className="navbar__hamburger"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        aria-label="Toggle menu"
                    >
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>
                )}
            </div>

            {/* Logo */}
            <Link to="/" className="navbar__logo">
                <img src="/DinApp.png" alt="DinApp" className="navbar__logo-img" />
            </Link>

            {/* Right section */}
            <div className="navbar__right">
                {isLanding ? (
                    <>
                        <Link to="/login" className="btn-secondary navbar__btn">
                            Log in
                        </Link>
                        <Link to="/signup" className="btn-primary navbar__btn">
                            Sign up
                        </Link>
                    </>
                ) : (
                    <>
                        <div className="navbar__search">
                            <input type="text" placeholder="Search" className="navbar__search-input" />
                            <svg className="navbar__search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                        </div>
                        <Link to="/account" className="navbar__avatar">
                            <img src={user?.profile_picture || "/User.png"} alt="User" style={{ objectFit: 'cover' }} />
                        </Link>
                        <button 
                            className="btn-secondary navbar__btn" 
                            style={{ padding: '6px 16px', fontSize: '0.85rem' }}
                            onClick={() => {
                                localStorage.removeItem('token');
                                window.location.href = '/login';
                            }}
                        >
                            Log out
                        </button>
                    </>
                )}
            </div>
        </nav>
    );
}
