import { useState } from "react";
import { useApp } from "../contexts/AppContext";
import { chatWithAI } from "../api/client";
import Mascot from "../components/Mascot";
import "./AdvicePage.css";

export default function AdvicePage() {
    const { analysisResult, chatMessages, addChatMessage } = useApp();
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    const context = analysisResult?.npk_insights || "";

    const isDataLoaded = !!analysisResult;

    // Build flat soil averages from the analysis result
    const summary = analysisResult?.summary || {};
    const getMean = (keys) => {
        for (const k of keys) {
            if (summary[k]?.mean != null) return summary[k].mean;
        }
        return null;
    };
    const fmt = (v, dp = 1) => v != null ? Number(v).toFixed(dp) : "-";

    const healthObj = analysisResult?.dl_analysis?.health_summary || {};
    const healthOverall = typeof healthObj === "object" ? healthObj.overall : healthObj;
    const healthText = typeof healthObj === "object"
        ? `✅ ดี: ${healthObj.good_pct?.toFixed(1)}%  ⚠️ ปานกลาง: ${healthObj.moderate_pct?.toFixed(1)}%  ❌ แย่: ${healthObj.poor_pct?.toFixed(1)}%`
        : healthObj;
    const predictedCrop = analysisResult?.dl_analysis?.predicted_crop || "";

    const soilStats = [
        { label: "Nitrogen (N)",   value: fmt(getMean(["N","Nitrogen","nitrogen"])),    unit: "mg/kg", color: "#2e7d32", icon: "🌿" },
        { label: "Phosphorus (P)", value: fmt(getMean(["P","Phosphorus","phosphorus"])), unit: "mg/kg", color: "#e65100", icon: "⚗️" },
        { label: "Potassium (K)",  value: fmt(getMean(["K","Potassium","potassium"])),  unit: "mg/kg", color: "#6a1b9a", icon: "🔋" },
        { label: "pH",             value: fmt(getMean(["ph","pH","PH"]), 2),             unit: "",      color: "#00695c", icon: "🧪" },
        { label: "Humidity",       value: fmt(getMean(["humidity","Humidity"])),         unit: "%",     color: "#1565c0", icon: "💧" },
        { label: "Temperature",    value: fmt(getMean(["temperature","Temperature"])),   unit: "°C",    color: "#b71c1c", icon: "🌡️" },
        { label: "Rainfall",       value: fmt(getMean(["rainfall","Rainfall"])),         unit: "mm",    color: "#0277bd", icon: "🌧️" },
    ];

    const handleSend = async () => {
        if (!input.trim() || loading) return;
        const userMsg = input.trim();
        setInput("");
        addChatMessage("user", userMsg);
        setLoading(true);
        try {
            const res = await chatWithAI(userMsg, context);
            addChatMessage("ai", res.reply);
        } catch (err) {
            addChatMessage("ai", `❌ Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="advice">
            {/* Background image overlay */}
            <div className="advice__bg">
                <img src="/home.jpg" alt="Background" />
                <div className="advice__bg-overlay"></div>
            </div>

            <div className="advice__container">
                {/* Left Column: Data Display */}
                <div className="advice__left animate-fade-in-up">
                    {isDataLoaded ? (
                        <div className="advice__mini-cards">
                            {/* Health Summary */}
                            {healthOverall && (
                                <div className="advice__health-card">
                                    <span style={{ fontSize: '1.6rem' }}>🌱</span>
                                    <div>
                                        <div style={{ fontSize: '0.85rem', opacity: 0.85, marginBottom: '4px' }}>Soil Health: <strong style={{ fontSize: '1rem' }}>{healthOverall}</strong></div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 500, whiteSpace: 'pre-line', opacity: 0.95, lineHeight: 1.6 }}>{healthText}</div>
                                    </div>
                                </div>
                            )}
                            {predictedCrop && (
                                <div className="advice__health-card" style={{ background: 'rgba(67,160,71,0.12)' }}>
                                    <span style={{ fontSize: '1.2rem' }}>🌾</span>
                                    <div>
                                        <div style={{ fontSize: '0.7rem', opacity: 0.7, marginBottom: '2px' }}>Recommended Crop</div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{predictedCrop}</div>
                                    </div>
                                </div>
                            )}
                            {/* Stat cards grid */}
                            <div className="advice__mini-grid">
                                {soilStats.map((s) => (
                                    <div key={s.label} className="advice__mini-stat">
                                        <div className="advice__mini-icon" style={{ background: s.color + '22', color: s.color }}>
                                            {s.icon}
                                        </div>
                                        <div className="advice__mini-val">{s.value}<span className="advice__mini-unit">{s.unit}</span></div>
                                        <div className="advice__mini-label">{s.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="advice__no-data">
                            <span style={{ fontSize: '3rem' }}>🌱</span>
                            <p>อัปโหลดข้อมูลดินใน Dashboard ก่อนเพื่อดูค่าและถาม AI ได้เลยครับ</p>
                        </div>
                    )}
                </div>

                {/* Right Column: Chat Interface */}
                <div className="advice__right animate-fade-in-up" style={{ animationDelay: "0.2s", position: 'relative' }}>
                    {/* Mascot overlapping bottom-left corner */}
                    <div style={{ position: 'absolute', bottom: '62px', left: '-62px', zIndex: 10 }}>
                        <Mascot isTalking={loading} size={130} />
                    </div>
                    <div className="advice__chat-header">
                        <h2>DinApp AI</h2>
                        <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.75)', margin: 0 }}>
                            {loading ? "กำลังคิดอยู่..." : "พร้อมตอบคำถามดินและพืชครับ"}
                        </p>
                    </div>

                    <div className="advice__chat-box">
                        <div className="advice__messages">
                            {chatMessages.length === 0 && (
                                <p className="advice__empty">ถามคำถามเกี่ยวกับดินหรือพืชได้เลย!</p>
                            )}
                            {chatMessages.map((msg, i) => (
                                <div key={i} className={`advice__msg advice__msg--${msg.role}`}>
                                    <div className="advice__msg-bubble">
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="advice__msg advice__msg--ai">
                                    <div className="advice__msg-bubble advice__msg-loading">
                                        <span></span><span></span><span></span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="advice__input-wrap">
                            <input
                                className="advice__input"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask me"
                                type="text"
                            />
                            <button className="advice__send" onClick={handleSend} disabled={loading}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
