import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../contexts/AppContext";
import { uploadFile, analyzeFile, getHistory } from "../api/client";
import CustomDashboard from "../components/CustomDashboard";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import "./DashboardPage.css";

export default function DashboardPage() {
    const navigate = useNavigate();
    const { uploadedFile, setUploadedFile, analysisResult, setAnalysisResult } = useApp();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeFilter, setActiveFilter] = useState("all");
    const fileInputRef = useRef(null);
    const [dragActive, setDragActive] = useState(false);
    
    // History State
    const [activeTab, setActiveTab] = useState("dashboard");
    const [historyData, setHistoryData] = useState(null);
    const [historyLoading, setHistoryLoading] = useState(false);
    
    // PDF Export State
    const [isExporting, setIsExporting] = useState(false);
    const printRef = useRef(null);

    const handleExportPdf = async () => {
        if (!printRef.current) return;
        setIsExporting(true);
        try {
            const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL("image/png");
            
            const pdf = new jsPDF("p", "mm", "a4");
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const imgHeight = (canvas.height * pdfWidth) / canvas.width;
            
            let heightLeft = imgHeight;
            let position = 0; // Top padding

            pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft > 0) {
                position = heightLeft - imgHeight; // Shift image up to next slice
                pdf.addPage();
                pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
                heightLeft -= pageHeight;
            }
            
            pdf.save(`dinapp_analysis_report_${new Date().toISOString().slice(0, 10)}.pdf`);
        } catch (err) {
            console.error("PDF Export Error:", err);
            setError("Failed to export PDF: " + err.message);
        } finally {
            setIsExporting(false);
        }
    };

    const loadHistory = async () => {
        if (historyData) return;
        setHistoryLoading(true);
        try {
            const res = await getHistory();
            setHistoryData(res.history);
        } catch(err) {
            setError(err.message);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleUpload = async (file) => {
        if (!file) return;
        setLoading(true);
        setError(null);
        try {
            const uploadRes = await uploadFile(file);
            setUploadedFile(uploadRes);
            const analysisRes = await analyzeFile(uploadRes.filename);
            setAnalysisResult(analysisRes);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        handleUpload(e.target.files[0]);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragActive(false);
        if (e.dataTransfer.files.length) {
            handleUpload(e.dataTransfer.files[0]);
        }
    };

    const filterChips = analysisResult
        ? analysisResult.columns.filter((col) => {
            const lower = col.toLowerCase();
            return ["ph", "nitrogen", "phosphorus", "potassium", "moisture", "temperature", "region"].some(
                (k) => lower.includes(k) || lower === "n" || lower === "p" || lower === "k"
            );
        })
        : [];

    const displayedRows = analysisResult
        ? activeFilter === "all"
            ? analysisResult.rows
            : analysisResult.rows
        : [];

    return (
        <div className="dashboard">
            {/* Hero banner */}
            <div className="dashboard__hero">
                <img src="/home.jpg" alt="Farm" className="dashboard__hero-img" />
                <div className="dashboard__hero-overlay" />
            </div>

            {/* Filter chips */}
            {analysisResult && (
                <div className="dashboard__filters animate-fade-in-up">
                    {filterChips.map((col) => (
                        <button
                            key={col}
                            className={`dashboard__chip ${activeFilter === col ? "dashboard__chip--active" : ""}`}
                            onClick={() => setActiveFilter(col === activeFilter ? "all" : col)}
                        >
                            {col}
                        </button>
                    ))}
                    <button className="dashboard__chip dashboard__chip--upload" onClick={() => fileInputRef.current?.click()}>
                        csv / xlsx
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                        </svg>
                    </button>
                    <button className="dashboard__chip dashboard__chip--analysis" onClick={handleExportPdf} disabled={isExporting}>
                        {isExporting ? "Exporting..." : "Export PDF"}
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginLeft: '6px'}}>
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                        </svg>
                    </button>
                </div>
            )}

            {/* Upload Area (shown when no data) */}
            {!analysisResult && !loading && (
                <div
                    className={`dashboard__upload-area animate-fade-in-up ${dragActive ? "dashboard__upload-area--drag" : ""}`}
                    onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <svg className="dashboard__upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                    </svg>
                    <p className="dashboard__upload-text">
                        <strong>Drop your CSV / Excel file here</strong>
                        <br />
                        <span>or click to browse</span>
                    </p>
                </div>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                style={{ display: "none" }}
            />

            {/* Loading */}
            {loading && (
                <div className="dashboard__loading glass animate-fade-in-up">
                    <div className="dashboard__spinner" />
                    <p>Loading ...</p>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="dashboard__error animate-fade-in-up">
                    <p>❌ {error}</p>
                </div>
            )}

            {/* Content: stats + Custom Dashboard side by side + Table below */}
            {analysisResult && (
                <div className="dashboard__content">
                    <div className="dashboard__tabs">
                        <button className={`dashboard__tab ${activeTab === 'dashboard' ? 'dashboard__tab--active' : ''}`} onClick={() => setActiveTab('dashboard')}>Dashboard</button>
                        <button className={`dashboard__tab ${activeTab === 'history' ? 'dashboard__tab--active' : ''}`} onClick={() => { setActiveTab('history'); loadHistory(); }}>History</button>
                        <button className="dashboard__tab" onClick={() => navigate("/advice")}>Advice</button>
                    </div>

                    {activeTab === 'dashboard' ? (
                        <>
                            {/* Hidden PDF Report Template */}
                            <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
                                <div ref={printRef} style={{ width: '1000px', background: '#f3f4f6', padding: '30px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                                        <h2 style={{ margin: 0, color: '#166534', fontSize: '24px' }}>Soil Analysis Report (DinApp)</h2>
                                        <p style={{ margin: '8px 0 0 0', color: '#6b7280' }}>Date: {new Date().toLocaleDateString()}</p>
                                    </div>
                                    
                                    {/* Top: Custom Dashboard */}
                                    <div style={{ width: '100%' }}>
                                        <CustomDashboard data={analysisResult} disableAnimation={true} hideDateFilter={true} />
                                    </div>

                                    {/* Bottom: Analysis Stats */}
                                    <div className="dashboard__summary card" style={{ width: '100%', padding: '24px', backgroundColor: '#fff' }}>
                                        <h3 style={{ color: '#166534', marginBottom: '16px', fontSize: '22px' }}>วิเคราะห์ธาตุอาหาร (NPK Insights):</h3>
                                        <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', color: '#374151', fontSize: '18px', lineHeight: '1.6' }}>
                                            {analysisResult.npk_insights?.indexOf("📈 ค่าเฉลี่ย:") !== -1 
                                                ? analysisResult.npk_insights.substring(analysisResult.npk_insights.indexOf("📈 ค่าเฉลี่ย:"))
                                                : analysisResult.npk_insights}
                                        </pre>
                                        
                                        {analysisResult.dl_analysis?.has_imputed_data && (
                                            <div style={{
                                                marginTop: '1.5rem',
                                                padding: '1rem',
                                                backgroundColor: '#fffbeb',
                                                borderLeft: '4px solid #f59e0b',
                                                borderRadius: '0 8px 8px 0',
                                                color: '#b45309',
                                                fontSize: '0.9rem',
                                                lineHeight: '1.5'
                                            }}>
                                                <strong>💡 ข้อแนะนำ:</strong> ข้อมูลของคุณไม่มีค่า N, P, K ทำให้ระบบต้องใช้ค่าตัวแทน (Default) การใช้ชุดตรวจดินราคาถูก (100-300 บาท) จะช่วยเพิ่มความแม่นยำได้
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Visible Dashboard Layout (Restored) */}
                            <div className="dashboard__grid" style={{ padding: '0 0 24px 0' }}>
                                {/* Left Column: Original Stats */}
                                <div className="dashboard__left-col">
                                    <div className="dashboard__summary card animate-fade-in-up">
                                        <h3>วิเคราะห์ธาตุอาหาร (NPK Insights):</h3>
                                        <pre className="dashboard__insights">{analysisResult.npk_insights}</pre>
                                        
                                        {analysisResult.dl_analysis?.has_imputed_data && (
                                            <div style={{
                                                marginTop: '1rem',
                                                padding: '1rem',
                                                backgroundColor: '#fffbeb',
                                                borderLeft: '4px solid #f59e0b',
                                                borderRadius: '0 8px 8px 0',
                                                color: '#b45309',
                                                fontSize: '0.9rem',
                                                lineHeight: '1.5'
                                            }}>
                                                <strong>💡 ข้อแนะนำ:</strong> ข้อมูลของคุณไม่มีค่า N, P, K ทำให้ระบบต้องใช้ค่าตัวแทน (Default) การใช้ชุดตรวจดินราคาถูก (100-300 บาท) จะช่วยเพิ่มความแม่นยำได้
                                            </div>
                                        )}
                                        
                                        <button className="btn-primary dashboard__ask-btn" onClick={() => navigate("/advice")} style={{ marginTop: analysisResult.dl_analysis?.has_imputed_data ? '1rem' : '0' }}>
                                            Ask AI More
                                        </button>
                                    </div>
                                </div>

                                {/* Right Column: Custom Dashboard */}
                                <div className="dashboard__right-col" style={{display: 'flex', flexDirection: 'column'}}>
                                    <CustomDashboard data={analysisResult} />
                                </div>
                            </div>

                    {/* Full Width Table (Not included in PDF) */}
                    <div className="dashboard__table-wrapper card animate-fade-in-up" style={{ animationDelay: "0.1s", marginTop: '24px' }}>
                        <div className="dashboard__table-scroll">
                            <table className="dashboard__table">
                                <thead>
                                    <tr>
                                {analysisResult.columns.map((col) => {
                                    const UNITS = {
                                        N: "mg/kg", P: "mg/kg", K: "mg/kg",
                                        Nitrogen: "mg/kg", Phosphorus: "mg/kg", Potassium: "mg/kg",
                                        temperature: "°C", Temperature: "°C",
                                        humidity: "%", Humidity: "%",
                                        ph: "", pH: "",
                                        rainfall: "mm", Rainfall: "mm",
                                    };
                                    const unit = UNITS[col];
                                    return (
                                        <th key={col}>
                                            {col}
                                            {unit && <div style={{ fontSize: '0.7rem', fontWeight: 400, opacity: 0.75, marginTop: '2px' }}>({unit})</div>}
                                        </th>
                                    );
                                })}
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayedRows.slice(0, 50).map((row, i) => (
                                        <tr key={i}>
                                            {analysisResult.columns.map((col) => (
                                                <td key={col}>{row[col] != null ? String(row[col]) : "-"}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <p className="dashboard__table-meta">
                            Showing {Math.min(50, displayedRows.length)} of {analysisResult.total_rows} rows
                        </p>
                    </div>
                        </>
                    ) : (
                        <div className="dashboard__history animate-fade-in-up">
                            {historyLoading && <div className="dashboard__loading glass"><div className="dashboard__spinner" /><p>Loading history ...</p></div>}
                            {historyData && historyData.length === 0 && <p style={{textAlign:'center', marginTop:'2rem'}}>No past analysis records found.</p>}
                            {historyData && historyData.length > 0 && (
                                <div className="dashboard__table-wrapper card" style={{ animationDelay: "0.1s" }}>
                                    <h3 style={{ marginBottom: "1rem" }}>Past Analysis Results</h3>
                                    <div className="dashboard__table-scroll">
                                        <table className="dashboard__table">
                                            <thead>
                                                <tr>
                                                    <th>Date</th>
                                                    <th>File</th>
                                                    <th>N</th>
                                                    <th>P</th>
                                                    <th>K</th>
                                                    <th>pH</th>
                                                    <th>Insights</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {historyData.map((h) => (
                                                    <tr key={h.id}>
                                                        <td>{new Date(h.timestamp).toLocaleDateString()}</td>
                                                        <td>{h.filename}</td>
                                                        <td>{h.n != null ? h.n.toFixed(2) : "-"}</td>
                                                        <td>{h.p != null ? h.p.toFixed(2) : "-"}</td>
                                                        <td>{h.k != null ? h.k.toFixed(2) : "-"}</td>
                                                        <td>{h.ph != null ? h.ph.toFixed(2) : "-"}</td>
                                                        <td style={{ maxWidth: "200px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                            {h.insights || "-"}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
