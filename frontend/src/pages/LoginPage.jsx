import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../contexts/AppContext";
import { requestOtp, verifyOtp } from "../api/client";
import "./AuthPage.css";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [step, setStep] = useState(1);
    const [error, setError] = useState("");
    const { login, setIsLoading } = useApp();
    const navigate = useNavigate();

    const handleRequestOtp = async (e) => {
        e.preventDefault();
        if (!email.trim()) return;
        
        setIsLoading(true);
        setError("");
        try {
            await requestOtp(email.trim());
            setStep(2);
        } catch (err) {
            setError(err.message || "Failed to request OTP");
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        if (!otp.trim()) return;

        setIsLoading(true);
        setError("");
        try {
            const data = await verifyOtp(email.trim(), otp.trim());
            login(data.user, data.access_token);
            navigate("/dashboard");
        } catch (err) {
            setError(err.message || "Invalid OTP");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth">
            <img src="/login.jpg" alt="" className="auth__bg" />
            <div className="auth__overlay" />
            <div className="auth__card glass animate-fade-in-up">
                <img src="/DinApp.png" alt="DinApp" className="auth__logo" />
                <h1 className="auth__title">Log in</h1>
                {error && <p style={{color: "red", textAlign: "center", marginBottom: "1rem"}}>{error}</p>}
                
                {step === 1 ? (
                    <form onSubmit={handleRequestOtp} className="auth__form">
                        <div className="auth__field">
                            <label htmlFor="login-email">Email</label>
                            <input
                                id="login-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                required
                            />
                        </div>
                        <button type="submit" className="btn-primary auth__submit">
                            Request OTP
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyOtp} className="auth__form">
                        <p style={{textAlign:"center", color: "#666", marginBottom:"15px", fontSize:"0.9rem"}}>
                            We sent a 6-digit code to <br/><strong>{email}</strong>
                        </p>
                        <div className="auth__field">
                            <label htmlFor="login-otp">OTP Code</label>
                            <input
                                id="login-otp"
                                type="text"
                                maxLength="6"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="Enter 6-digit code"
                                required
                            />
                        </div>
                        <button type="submit" className="btn-primary auth__submit">
                            Verify & Log in
                        </button>
                        <button type="button" onClick={() => setStep(1)} style={{marginTop: "10px", width: "100%", padding: "12px", background: "none", border: "1px solid #ccc", borderRadius: "100px", cursor: "pointer", color: "#666"}}>
                            Back / Resend
                        </button>
                    </form>
                )}
                
                {step === 1 && (
                    <p className="auth__switch">
                        Don't have an account?{" "}
                        <Link to="/signup">Sign up</Link>
                    </p>
                )}
            </div>
        </div>
    );
}
