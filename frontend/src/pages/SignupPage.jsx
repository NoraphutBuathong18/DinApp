import { Link } from "react-router-dom";
import "./AuthPage.css";

export default function SignupPage() {
    return (
        <div className="auth">
            <img src="/login.jpg" alt="" className="auth__bg" />
            <div className="auth__overlay" />
            <div className="auth__card glass animate-fade-in-up">
                <img src="/DinApp.png" alt="DinApp" className="auth__logo" />
                <h1 className="auth__title">Sign up</h1>
                <div style={{textAlign: "center", marginBottom: "30px", color: "#444", lineHeight: "1.6"}}>
                    <p>DinApp uses a secure, passwordless authentication system.</p>
                    <p>You don't need to create a password to sign up.</p>
                    <p><strong>Just log in with your email address to get started!</strong></p>
                </div>
                <Link to="/login" className="btn-primary auth__submit" style={{display: "block", textAlign:"center", textDecoration:"none"}}>
                    Go to Log In
                </Link>
            </div>
        </div>
    );
}
