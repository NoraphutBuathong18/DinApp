import "./Layout.css";
import { Outlet, useLocation } from "react-router-dom";
import { useApp } from "../contexts/AppContext";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import UserManual from "./UserManual";

export default function Layout() {
    const { sidebarOpen } = useApp();
    const location = useLocation();
    const isLanding =
        location.pathname === "/" ||
        location.pathname === "/login" ||
        location.pathname === "/signup";

    return (
        <div className="layout">
            <Navbar />
            {!isLanding && <Sidebar />}
            <main
                className={`layout__main ${isLanding ? "" : "layout__main--with-sidebar"} ${!isLanding && sidebarOpen ? "layout__main--sidebar-open" : ""
                    }`}
            >
                <Outlet />
            </main>
            <UserManual />
        </div>
    );
}
