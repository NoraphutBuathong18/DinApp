import { createContext, useContext, useState, useEffect } from "react";

const AppContext = createContext(null);

export function AppProvider({ children }) {
    // User state loaded from local storage
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem("dinapp_user");
        return savedUser ? JSON.parse(savedUser) : null;
    });

    // Soil data state
    const [uploadedFile, setUploadedFile] = useState(null); // { filename, size_bytes }
    const [analysisResult, setAnalysisResult] = useState(null); // full analysis response
    const [chatMessages, setChatMessages] = useState([]); // [{ role, content }]

    // Sidebar state
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Global loading state
    const [isLoading, setIsLoading] = useState(false);

    const login = (userData, token) => {
        setUser(userData);
        localStorage.setItem("dinapp_token", token);
        localStorage.setItem("dinapp_user", JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        setUploadedFile(null);
        setAnalysisResult(null);
        setChatMessages([]);
        localStorage.removeItem("dinapp_token");
        localStorage.removeItem("dinapp_user");
    };

    const addChatMessage = (role, content) => {
        setChatMessages((prev) => [...prev, { role, content }]);
    };

    return (
        <AppContext.Provider
            value={{
                user,
                setUser,
                login,
                logout,
                uploadedFile,
                setUploadedFile,
                analysisResult,
                setAnalysisResult,
                chatMessages,
                setChatMessages,
                addChatMessage,
                sidebarOpen,
                setSidebarOpen,
                isLoading,
                setIsLoading,
            }}
        >
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error("useApp must be used within AppProvider");
    return ctx;
}
