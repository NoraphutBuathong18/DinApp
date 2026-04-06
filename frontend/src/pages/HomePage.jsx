import { useNavigate } from "react-router-dom";
import { useApp } from "../contexts/AppContext";
import "./HomePage.css";

export default function HomePage() {
    const { setIsLoading } = useApp();
    const navigate = useNavigate();

    const handleAction = (path) => {
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            navigate(path);
        }, 800);
    };

    return (
        <div className="home">
            {/* Hero Section */}
            <section className="home__hero">
                <div className="home__hero-overlay" />
                <img src="/home.jpg" alt="Farm landscape" className="home__hero-bg" />
                <div className="home__hero-content animate-fade-in-up">
                    <div className="home__hero-actions">
                        <button onClick={() => handleAction("/dashboard")} className="btn-secondary home__hero-btn">
                            Browse Soil Data
                        </button>
                        <button onClick={() => handleAction("/dashboard")} className="btn-primary home__hero-btn home__hero-btn--accent">
                            Start Analysis
                        </button>
                    </div>
                </div>
            </section>

            {/* Policy Section */}
            <section className="home__policy">
                <h2 className="home__policy-title">Policy</h2>
                <div className="home__policy-grid">
                    {/* Privacy Policy */}
                    <div className="home__policy-card glass animate-fade-in-up">
                        <h3>นโยบายความเป็นส่วนตัวและการจัดการข้อมูล (Privacy Policy)</h3>
                        <ul>
                            <li>
                                <strong>การเก็บข้อมูล:</strong> ระบบจะเก็บข้อมูลเฉพาะค่าดิน พิกัดพื้นที่ หรือข้อมูลพืชที่ผู้ใช้ป้อนเข้ามาเพื่อใช้ในการประมวลผลผ่าน AI เท่านั้น
                            </li>
                            <li>
                                <strong>ความเป็นส่วนตัว:</strong> ข้อมูลของคุณจะไม่มีการเผยแพร่สู่สาธารณะ โดยไม่ได้รับอนุญาตและจะถูกนำไปใช้เพื่อพัฒนาความแม่นยำของระบบแนะนำเท่านั้น
                            </li>
                            <li>
                                <strong>การเชื่อมต่อ AI:</strong> ข้อมูลบางส่วนจะถูกส่งไปยังระบบ AI (Gemini API) เพื่อทำการวิเคราะห์ โดยไม่มีการระบุตัวตนของผู้ใช้งาน
                            </li>
                        </ul>
                    </div>

                    {/* Terms & Disclaimer */}
                    <div className="home__policy-card glass animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
                        <h3>ข้อกำหนดและข้อจำกัดความรับผิดชอบ (Terms & Disclaimer)</h3>
                        <ul>
                            <li>
                                <strong>ความแม่นยำ:</strong> คำแนะนำที่ได้รับจาก AI เป็นเพียงการประมวลผลจากข้อมูลที่มีอยู่เบื้องต้นเท่านั้นไม่ควรใช้เป็นเครื่องมือตัดสินใจทางธุรกิจเพียงอย่างเดียว
                            </li>
                            <li>
                                <strong>ข้อจำกัด:</strong> เนื่องจากระบบไม่ได้ใช้เซ็นเซอร์วัดค่าจริงในพื้นที่จึงผลลัพธ์อาจมีความคลาดเคลื่อนตามสภาพแวดล้อมที่เปลี่ยนแปลงไป
                            </li>
                            <li>
                                <strong>การใช้งาน:</strong> ใช้ตกลงที่จะใช้ข้อมูลนี้เพื่อการศึกษาหรือวางแผนเกษตรเบื้องต้นเท่านั้น
                            </li>
                        </ul>
                    </div>
                </div>
            </section>
        </div>
    );
}
