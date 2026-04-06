import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line, Legend
} from 'recharts';
import { Droplet, Thermometer, Database, TestTube, Calendar } from 'lucide-react';
import './CustomDashboard.css';

const CustomDashboard = ({ data, disableAnimation = false }) => {
    // 1. Get Selected Year State
    const [selectedYear, setSelectedYear] = useState('All');

    if (!data || !data.dl_analysis || !data.dl_analysis.averages) {
        return (
            <div className={`custom-dashboard card ${disableAnimation ? '' : 'animate-fade-in-up'}`}>
                <p style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    ไม่มีข้อมูลสำหรับแสดงผล Dashboard กรุณาอัปโหลดไฟล์ใหม่
                </p>
            </div>
        );
    }

    // 2. Extract Date Column and Available Years
    const dateColumn = data.columns.find(c => c.toLowerCase().includes('date') || c.toLowerCase().includes('time') || c.toLowerCase() === 'timestamp');
    
    const availableYears = useMemo(() => {
        if (!dateColumn || !data.rows) return [];
        const years = new Set();
        data.rows.forEach(row => {
            const val = row[dateColumn];
            if (val) {
                const year = new Date(val).getFullYear();
                if (!isNaN(year)) years.add(year);
            }
        });
        return Array.from(years).sort((a,b) => b - a); // Newest first
    }, [data.rows, dateColumn]);

    // 3. Filter Data Based on Year
    const filteredRows = useMemo(() => {
        if (!data.rows) return [];
        if (selectedYear === 'All' || !dateColumn) return data.rows;
        
        return data.rows.filter(row => {
            const val = row[dateColumn];
            if (!val) return false;
            return new Date(val).getFullYear().toString() === selectedYear.toString();
        });
    }, [data.rows, selectedYear, dateColumn]);

    // 4. Compute Averages based on Filtered Data
    const displayStats = useMemo(() => {
        if (selectedYear === 'All') {
            return {
                N: data.dl_analysis.averages.N,
                P: data.dl_analysis.averages.P,
                K: data.dl_analysis.averages.K,
                temperature: data.dl_analysis.averages.temperature,
                humidity: data.dl_analysis.averages.humidity,
                total: data.total_rows,
                health: data.dl_analysis.health_summary?.overall || 'Unknown'
            };
        }

        // Compute for selected year
        if (filteredRows.length === 0) return { N:0, P:0, K:0, temperature:0, humidity:0, total:0, health:'Unknown' };

        const sum = filteredRows.reduce((acc, row) => {
            // Support 'N' or 'Nitrogen' forms depending on how parser returned it
            acc.N += (Number(row.N) || Number(row.n) || Number(row.Nitrogen) || 0);
            acc.P += (Number(row.P) || Number(row.p) || Number(row.Phosphorus) || 0);
            acc.K += (Number(row.K) || Number(row.k) || Number(row.Potassium) || 0);
            
            // Env Support
            // Looking at the codebase, CSV columns mapped to 'temperature', 'humidity'
            // We search dynamically or blindly fall back to exact match
            const tMap = row.temperature || row.Temperature || row.temp || 0;
            const hMap = row.humidity || row.Humidity || row.hum || 0;
            
            acc.temp += Number(tMap);
            acc.hum += Number(hMap);
            return acc;
        }, { N:0, P:0, K:0, temp:0, hum:0 });

        const count = filteredRows.length;
        return {
            N: sum.N / count,
            P: sum.P / count,
            K: sum.K / count,
            temperature: sum.temp / count,
            humidity: sum.hum / count,
            total: count,
            health: "Filtered" // Model only runs once upfront, so for now generic status
        };
    }, [data, filteredRows, selectedYear]);

    // 5. Data for NPK Bar Chart
    const npkData = [
        { name: 'Nitrogen (N)', value: Number((displayStats.N || 0).toFixed(1)), fill: '#3b82f6' },
        { name: 'Phosphorus (P)', value: Number((displayStats.P || 0).toFixed(1)), fill: '#8b5cf6' },
        { name: 'Potassium (K)', value: Number((displayStats.K || 0).toFixed(1)), fill: '#f59e0b' }
    ];

    // 6. Data for Environment Line Chart
    // isMonthlyGrouped: true when we aggregate all rows into per-month averages
    const { envData, isMonthlyGrouped } = useMemo(() => {
        if (dateColumn && filteredRows.length > 20) {
            // GROUP BY MONTH: aggregate rows into monthly averages → max 12 unique X-axis labels
            const monthMap = {};
            filteredRows.forEach(row => {
                const val = row[dateColumn];
                if (!val) return;
                const d = new Date(val);
                // sortKey for ordering; display label = short month name only (e.g. "Jan")
                const sortKey = d.getFullYear() * 100 + d.getMonth();
                const label = d.toLocaleDateString('en-GB', { month: 'short' }); // "Jan" "Feb" ...
                const mapKey = sortKey; // use numeric key to avoid collisions across years
                if (!monthMap[mapKey]) {
                    monthMap[mapKey] = { name: label, tempSum: 0, humSum: 0, count: 0, sortKey };
                }
                monthMap[mapKey].tempSum += Number(row.temperature || row.Temperature || 0);
                monthMap[mapKey].humSum  += Number(row.humidity    || row.Humidity    || 0);
                monthMap[mapKey].count   += 1;
            });
            const data = Object.values(monthMap)
                .sort((a, b) => a.sortKey - b.sortKey)
                .map(m => ({
                    name: m.name,
                    Temperature: Number((m.tempSum / m.count).toFixed(1)),
                    Humidity:    Number((m.humSum  / m.count).toFixed(1)),
                }));
            return { envData: data, isMonthlyGrouped: true };
        }

        // NO date column OR small dataset: raw rows (up to 50) with numeric / day-month label
        const data = filteredRows.slice(0, 50).map((row, index) => {
            let dStr = index + 1;
            if (dateColumn && row[dateColumn]) {
                const d = new Date(row[dateColumn]);
                dStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }); // "05 Jan"
            }
            return {
                name: dStr,
                Temperature: Number(row.temperature || row.Temperature || 0),
                Humidity:    Number(row.humidity    || row.Humidity    || 0),
            };
        });
        return { envData: data, isMonthlyGrouped: false };
    }, [filteredRows, dateColumn]);

    return (
        <div className={`custom-dashboard ${disableAnimation ? '' : 'animate-fade-in-up'}`} style={{ animationDelay: disableAnimation ? "0s" : "0.2s" }}>
            
            {/* Year Filter Header */}
            {availableYears.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '10px', background: 'white', padding: '15px 20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <Calendar size={20} color="#64748b" />
                    <span style={{ fontWeight: 600, color: '#334155', fontSize: '1rem', whiteSpace: 'nowrap' }}>เทียบข้อมูลความเปลี่ยนแปลง: </span>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button 
                            onClick={() => setSelectedYear('All')}
                            style={{ padding: '6px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: 500, transition: 'all 0.2s',
                                    background: selectedYear === 'All' ? '#16a34a' : '#f1f5f9', color: selectedYear === 'All' ? 'white' : '#475569' }}
                        >
                            ทั้งหมด (All Time)
                        </button>
                        {availableYears.map(year => (
                            <button 
                                key={year}
                                onClick={() => setSelectedYear(year)}
                                style={{ padding: '6px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: 500, transition: 'all 0.2s',
                                        background: selectedYear === year ? '#16a34a' : '#f1f5f9', color: selectedYear === year ? 'white' : '#475569' }}
                            >
                                ปี {year}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Header Stats */}
            <div className="custom-dashboard__stats">
                <div className="stat-card">
                    <div className="stat-icon" style={{ backgroundColor: '#eff6ff', color: '#3b82f6' }}><Database size={24} /></div>
                    <div className="stat-info">
                        <span className="stat-value">{displayStats.total}</span>
                        <span className="stat-label">Samples Tested</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ backgroundColor: '#f0fdf4', color: '#22c55e' }}><TestTube size={24} /></div>
                    <div className="stat-info">
                        <span className="stat-value">{selectedYear === 'All' ? displayStats.health : (displayStats.total > 0 ? "Filtered" : "-")}</span>
                        <span className="stat-label">Soil Health</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ backgroundColor: '#fff7ed', color: '#f97316' }}><Thermometer size={24} /></div>
                    <div className="stat-info">
                        <span className="stat-value">{displayStats.temperature?.toFixed(1) || 0}°C</span>
                        <span className="stat-label">Avg Temp</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ backgroundColor: '#f0f9ff', color: '#0ea5e9' }}><Droplet size={24} /></div>
                    <div className="stat-info">
                        <span className="stat-value">{displayStats.humidity?.toFixed(1) || 0}%</span>
                        <span className="stat-label">Avg Humidity</span>
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="custom-dashboard__charts">
                
                {/* NPK Bar Chart */}
                <div className="chart-card">
                    <div className="chart-header">
                        <h4>{selectedYear === 'All' ? 'Average N, P, K Levels (All Time)' : `Average N, P, K in ${selectedYear}`}</h4>
                    </div>
                    <div className="chart-body">
                        {displayStats.total > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={npkData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} angle={-35} textAnchor="end" height={60} interval={0} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                                    <RechartsTooltip 
                                        cursor={{fill: '#f1f5f9'}}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40} isAnimationActive={!disableAnimation} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{display:'flex', height:'100%', alignItems:'center', justifyContent:'center', color:'#94a3b8'}}>ไม่มีข้อมูลในปีนี้</div>
                        )}
                    </div>
                </div>

                {/* Env Line Chart */}
                <div className="chart-card chart-card--wide">
                    <div className="chart-header">
                        <h4>Environment Trends: Temp & Humidity</h4>
                    </div>
                    <div className="chart-body">
                        {envData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={envData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis 
                                        dataKey="name" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#64748b', fontSize: isMonthlyGrouped ? 11 : 10 }}
                                        interval={isMonthlyGrouped ? 0 : 'preserveStartEnd'}
                                        angle={isMonthlyGrouped ? 0 : (dateColumn ? -15 : 0)}
                                        textAnchor={isMonthlyGrouped ? 'middle' : (dateColumn ? 'end' : 'middle')}
                                        height={isMonthlyGrouped ? 25 : (dateColumn ? 40 : 30)}
                                    />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                                    <RechartsTooltip 
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                                    <Line type="monotone" dataKey="Temperature" stroke="#f97316" strokeWidth={2} dot={false} activeDot={{ r: 6 }} isAnimationActive={!disableAnimation} />
                                    <Line type="monotone" dataKey="Humidity" stroke="#0ea5e9" strokeWidth={2} dot={false} activeDot={{ r: 6 }} isAnimationActive={!disableAnimation} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{display:'flex', height:'100%', alignItems:'center', justifyContent:'center', color:'#94a3b8'}}>ไม่มีข้อมูลในปีนี้</div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default CustomDashboard;
