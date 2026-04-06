import "./LoadingScreen.css";

export default function LoadingScreen() {
    return (
        <div className="loading-screen">
            <img src="/home.jpg" alt="" className="loading-screen__bg" />
            <div className="loading-screen__overlay" />
            <div className="loading-screen__content glass animate-fade-in-up">
                <div className="loading-screen__card">
                    <h2 className="loading-screen__text">Loading ...</h2>
                </div>
            </div>
        </div>
    );
}
