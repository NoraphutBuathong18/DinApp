import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import AdvicePage from "./pages/AdvicePage";
import AccountPage from "./pages/AccountPage";
import LoadingScreen from "./components/LoadingScreen";
import { useApp } from "./contexts/AppContext";

export default function App() {
  const { isLoading } = useApp();

  return (
    <BrowserRouter>
      {isLoading && <LoadingScreen />}
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/advice" element={<AdvicePage />} />
          <Route path="/account" element={<AccountPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
