const API_BASE = "/api";
const DEFAULT_TIMEOUT_MS = 10000; // 10 seconds

/**
 * Central API client for communicating with the FastAPI backend.
 * Uses the Vite proxy in development (/api → http://localhost:8000).
 */

function getAuthHeaders(baseHeaders = {}) {
    const token = localStorage.getItem("dinapp_token");
    if (token) {
        return { ...baseHeaders, "Authorization": `Bearer ${token}` };
    }
    return baseHeaders;
}

/**
 * Wraps fetch with an AbortController timeout.
 * Throws a user-friendly error when the server does not respond in time.
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, { ...options, signal: controller.signal });
        return res;
    } catch (err) {
        if (err.name === "AbortError") {
            throw new Error("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง");
        }
        throw new Error("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาตรวจสอบอินเทอร์เน็ต");
    } finally {
        clearTimeout(timer);
    }
}

export async function uploadFile(file) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetchWithTimeout(`${API_BASE}/upload/`, {
        method: "POST",
        body: formData,
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Upload failed");
    }

    return res.json();
}

export async function analyzeFile(filename) {
    const res = await fetchWithTimeout(`${API_BASE}/analyze/`, {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ filename }),
    }, 30000); // Analysis may take longer — 30s timeout

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "การวิเคราะห์ดินล้มเหลว กรุณาลองใหม่อีกครั้ง");
    }

    return res.json();
}

export async function chatWithAI(message, context = "") {
    const res = await fetchWithTimeout(`${API_BASE}/chat/`, {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ message, context }),
    }, 20000);

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Chat failed");
    }

    return res.json();
}

export async function requestOtp(email) {
    const res = await fetchWithTimeout(`${API_BASE}/auth/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
    });
    if (!res.ok) {
        let err;
        try { err = await res.json(); } catch(e) { err = {detail: "ไม่พบบัญชีผู้ใช้นี้ในระบบ"}; }
        throw new Error(err.detail || "ไม่สามารถส่ง OTP ได้ กรุณาลองใหม่");
    }
    return res.json();
}

export async function verifyOtp(email, otp) {
    const res = await fetchWithTimeout(`${API_BASE}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
    });
    if (!res.ok) {
        let err;
        try { err = await res.json(); } catch(e) { err = {detail: "รหัส OTP ไม่ถูกต้องหรือหมดอายุแล้ว"}; }
        throw new Error(err.detail || "รหัส OTP ไม่ถูกต้องหรือหมดอายุแล้ว");
    }
    return res.json();
}

export async function getHistory() {
    const res = await fetch(`${API_BASE}/history/`, {
        method: "GET",
        headers: getAuthHeaders(),
    });
    
    if (!res.ok) {
        throw new Error("Failed to fetch history");
    }
    return res.json();
}

export async function uploadAvatar(base64Image) {
    const res = await fetchWithTimeout(`${API_BASE}/users/me/avatar`, {
        method: "PUT",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ profile_picture: base64Image }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to upload avatar");
    }
    return res.json();
}

/** TC21 fix: ลบบัญชีผู้ใช้และข้อมูลที่เกี่ยวข้องทั้งหมดออกจาก DB */
export async function deleteAccount() {
    const res = await fetchWithTimeout(`${API_BASE}/users/me`, {
        method: "DELETE",
        headers: getAuthHeaders(),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "ลบบัญชีไม่สำเร็จ กรุณาลองใหม่");
    }
    return res.json();
}
