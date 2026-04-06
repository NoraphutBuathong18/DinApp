import { useApp } from "../contexts/AppContext";
import { useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import { uploadAvatar, deleteAccount } from "../api/client";
import "./AccountPage.css";

export default function AccountPage() {
    const { user, setUser, logout } = useApp();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    const handleDeleteAccount = async () => {
        if (!window.confirm("ต้องการลบบัญชีและข้อมูลทั้งหมดออกจากระบบใช่ไหม? การดำเนินการนี้ไม่สามารถย้อนกลับได้")) return;
        setIsDeleting(true);
        setDeleteError("");
        try {
            await deleteAccount();
            logout();
            navigate("/");
        } catch (err) {
            setDeleteError(err.message || "ลบบัญชีไม่สำเร็จ กรุณาลองใหม่");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            // Read file and compress using Canvas
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = async () => {
                    const canvas = document.createElement("canvas");
                    const size = 200; // max size
                    canvas.width = size;
                    canvas.height = size;
                    const ctx = canvas.getContext("2d");
                    
                    // Crop to square aspect ratio
                    const scale = Math.max(size / img.width, size / img.height);
                    const x = (size / scale - img.width) / 2;
                    const y = (size / scale - img.height) / 2;
                    
                    ctx.drawImage(img, x, y, img.width, img.height, 0, 0, size, size);
                    
                    const base64Str = canvas.toDataURL("image/jpeg", 0.8);
                    
                    // Upload
                    try {
                        const result = await uploadAvatar(base64Str);
                        const updatedUser = { ...user, profile_picture: result.profile_picture };
                        setUser(updatedUser);
                        localStorage.setItem("dinapp_user", JSON.stringify(updatedUser));
                    } catch (err) {
                        alert(err.message);
                    } finally {
                        setIsUploading(false);
                    }
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error(error);
            alert("Error compressing image");
            setIsUploading(false);
        }
    };

    return (
        <div className="account">
            <div className="account__bg-wrapper">
                <img src="/home.jpg" alt="" className="account__bg" />
                <div className="account__bg-overlay" />
            </div>

            <div className="account__card glass animate-fade-in-up">
                <h1 className="account__title">Account</h1>

                <div className="account__avatar-wrapper">
                    <img src={user?.profile_picture || "/Account.jpg"} alt="Profile" className="account__avatar" style={{ objectFit: "cover" }} />
                    <button 
                        className="account__avatar-edit" 
                        aria-label="Change photo"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                    >
                        {isUploading ? "..." : "📷"}
                    </button>
                    <input 
                        type="file" 
                        accept="image/*" 
                        ref={fileInputRef} 
                        style={{ display: "none" }} 
                        onChange={handleFileChange} 
                    />
                </div>

                <div className="account__info">
                    <div className="account__field">
                        <span className="account__label">Username:</span>
                        <span className="account__value">{user?.username || "Guest"}</span>
                    </div>
                    <div className="account__field">
                        <span className="account__label">Email:</span>
                        <span className="account__value">{user?.email || "—"}</span>
                    </div>
                </div>

                {deleteError && (
                    <p style={{ color: "#ef4444", textAlign: "center", marginBottom: "0.5rem", fontSize: "0.85rem" }}>
                        ❌ {deleteError}
                    </p>
                )}
                <button className="account__delete" onClick={handleDeleteAccount} disabled={isDeleting}>
                    {isDeleting ? "กำลังลบบัญชี..." : "Delete Account"}
                </button>

                <button className="btn-secondary account__logout" onClick={handleLogout}>
                    Log out
                </button>
            </div>
        </div>
    );
}
