"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { getAdminPassword, setAdminPassword } from "@/lib/auth";

interface CheckinRecord {
  id: number;
  nickname: string;
  content: string;
  type: string;
  count: number;
  note: string;
  created_at: string;
  source?: string;
}

interface OjDailyStat {
  date: string;
  totalDelta: number;
}

const TYPES = {
  practice: { label: "刷题", emoji: "💻", color: "#00d4ff" },
  contest: { label: "补题", emoji: "📝", color: "#6366f1" },
  vp: { label: "VP", emoji: "🏆", color: "#f59e0b" },
  study: { label: "学习", emoji: "📖", color: "#10b981" },
} as const;

export default function CheckinPage() {
  const [records, setRecords] = useState<CheckinRecord[]>([]);
  const [todayType, setTodayType] = useState<keyof typeof TYPES>("practice");
  const [todayCount, setTodayCount] = useState(1);
  const [todayNote, setTodayNote] = useState("");
  const [isAuth, setIsAuth] = useState(false);
  const [password, setPassword] = useState("");
  const [adminPassword, setAdminPasswordState] = useState("");
  const [error, setError] = useState("");
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const [viewYear, setViewYear] = useState(new Date().getFullYear());

  const fetchRecords = useCallback(async () => {
    try {
      const [checkinsRes, ojStatsRes] = await Promise.all([
        fetch("/api/checkins"),
        fetch("/api/oj-public/daily-stats"),
      ]);
      const checkinsData = await checkinsRes.json();
      const ojStatsData = await ojStatsRes.json();
      const checkins = Array.isArray(checkinsData) ? checkinsData : [];
      const ojRecords = Array.isArray(ojStatsData)
        ? ojStatsData
            .filter((item: OjDailyStat) => item.totalDelta > 0)
            .map((item: OjDailyStat) => ({
              id: -Number(item.date.replaceAll("-", "")),
              nickname: "OJ Float",
              content: "",
              type: "practice",
              count: item.totalDelta,
              note: "OJ Float sync",
              created_at: `${item.date} 12:00:00`,
              source: "oj_float",
            }))
        : [];
      setRecords(
        [...checkins, ...ojRecords].sort((a, b) =>
          String(b.created_at).localeCompare(String(a.created_at)),
        ),
      );
    } catch {}
  }, []);

  useEffect(() => {
    fetchRecords();
    if (sessionStorage.getItem("keronshans_auth") === "true") {
      setIsAuth(true);
      setAdminPasswordState(getAdminPassword());
    }
  }, [fetchRecords]);

  const handleLogin = () => {
    if (password.trim()) {
      setIsAuth(true);
      sessionStorage.setItem("keronshans_auth", "true");
      setAdminPassword(password);
      setAdminPasswordState(password);
      setError("");
    } else {
      setError("密码错误");
    }
  };

  const today = new Date().toISOString().split("T")[0];
  const todayRecords = records.filter((r) => r.created_at && r.created_at.startsWith(today));
  const todayTotalCount = todayRecords.reduce((sum, r) => sum + (r.count || 1), 0);
  const checkedToday = todayRecords.length > 0;

  const handleCheckin = async () => {
    if (todayCount < 1) return;
    try {
      const res = await fetch("/api/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": adminPassword },
        body: JSON.stringify({ date: today, type: todayType, count: todayCount, note: todayNote }),
      });
      if (res.ok) {
        await fetchRecords();
        setTodayCount(1);
        setTodayNote("");
      }
    } catch {}
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/checkins?id=${id}`, {
        method: "DELETE",
        headers: { "x-admin-password": adminPassword },
      });
      if (res.ok) setRecords(records.filter((r) => r.id !== id));
    } catch {}
  };

  // Build date->record map using created_at for heatmap
  const heatmapData = useMemo(() => {
    const map = new Map<string, { count: number; type: string; note: string }>();
    records.forEach((r) => {
      const dateStr = r.created_at ? r.created_at.split(/[T ]/)[0] : "";
      if (!dateStr) return;
      const existing = map.get(dateStr);
      if (existing) {
        existing.count += (r.count || 1);
      } else {
        map.set(dateStr, { count: (r.count || 1), type: r.type || "practice", note: r.note || "" });
      }
    });
    return map;
  }, [records]);

  const yearDays = useMemo(() => {
    const start = new Date(viewYear, 0, 1);
    const startDay = start.getDay();
    const adjustedStart = new Date(start);
    adjustedStart.setDate(adjustedStart.getDate() - ((startDay + 6) % 7));

    const end = new Date(viewYear, 11, 31);
    const endDay = end.getDay();
    const adjustedEnd = new Date(end);
    if (endDay !== 0) adjustedEnd.setDate(adjustedEnd.getDate() + (7 - endDay));

    const days: (string | null)[] = [];
    const current = new Date(adjustedStart);
    while (current <= adjustedEnd) {
      const dateStr = current.toISOString().split("T")[0];
      if (current.getFullYear() === viewYear) {
        days.push(dateStr);
      } else {
        days.push(null);
      }
      current.setDate(current.getDate() + 1);
    }
    return days;
  }, [viewYear]);

  const weeks: (string | null)[][] = [];
  for (let i = 0; i < yearDays.length; i += 7) {
    weeks.push(yearDays.slice(i, i + 7));
  }

  // Stats
  const totalDays = records.length;
  const totalCount = records.reduce((sum, r) => sum + (r.count || 1), 0);
  const maxStreak = useMemo(() => {
    if (records.length === 0) return 0;
    const dates = [...new Set(records.map((r) => r.created_at?.split(/[T ]/)[0]).filter(Boolean))] as string[];
    dates.sort();
    let max = 1, current = 1;
    for (let i = 1; i < dates.length; i++) {
      const diff = (new Date(dates[i]).getTime() - new Date(dates[i - 1]).getTime()) / (1000 * 60 * 60 * 24);
      if (diff === 1) { current++; max = Math.max(max, current); }
      else if (diff > 1) { current = 1; }
    }
    return max;
  }, [records]);

  const currentStreak = useMemo(() => {
    if (records.length === 0) return 0;
    const dates = [...new Set(records.map((r) => r.created_at?.split(/[T ]/)[0]).filter(Boolean))] as string[];
    dates.sort().reverse();
    let streak = 0;
    const checkDate = new Date(today);
    for (let i = 0; i < dates.length; i++) {
      const expected = new Date(checkDate);
      expected.setDate(expected.getDate() - i);
      const expectedStr = expected.toISOString().split("T")[0];
      if (dates[i] === expectedStr) { streak++; } else { break; }
    }
    return streak;
  }, [records, today]);

  const getColor = (date: string | null) => {
    if (!date) return "bg-transparent";
    const data = heatmapData.get(date);
    if (!data) return "bg-gray-100 dark:bg-cyber-surface/50";
    if (data.count >= 10) return "bg-blue-800 dark:bg-blue-600";
    if (data.count >= 5) return "bg-blue-600 dark:bg-blue-500";
    if (data.count >= 3) return "bg-blue-400 dark:bg-blue-400";
    return "bg-blue-300 dark:bg-blue-400/60";
  };

  const monthLabels = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
  const dayLabels = ["一", "", "三", "", "五", "", "日"];

  // Compute month label positions based on actual week column indices
  const monthPositions = useMemo(() => {
    const positions: { label: string; col: number }[] = [];
    for (let m = 0; m < 12; m++) {
      const monthStart = new Date(viewYear, m, 1);
      // Find which week column this month starts in
      const jan1 = new Date(viewYear, 0, 1);
      const jan1Offset = (jan1.getDay() + 6) % 7;
      const dayIndex = Math.round((monthStart.getTime() - jan1.getTime()) / (1000 * 60 * 60 * 24));
      const col = Math.floor((dayIndex + jan1Offset) / 7);
      positions.push({ label: monthLabels[m], col });
    }
    return positions;
  }, [viewYear]);

  const typeStats = useMemo(() => {
    const stats: Record<string, { count: number; days: number }> = {};
    records.forEach((r) => {
      if (!stats[r.type]) stats[r.type] = { count: 0, days: 0 };
      stats[r.type].count += (r.count || 1);
      stats[r.type].days += 1;
    });
    return stats;
  }, [records]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-display font-bold mb-2">
          <span className="neon-text-blue">◈</span> 刷题打卡
        </h1>
        <p className="text-gray-500 dark:text-gray-400 font-mono text-sm">
          &gt; CHECK_IN.SYSTEM | 坚持就是胜利
        </p>
        <div className="mt-2 h-[1px] bg-gradient-to-r from-neon-blue via-neon-purple to-neon-green opacity-50" />
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
        <div className="cyber-card neon-border-blue p-4 text-center">
          <div className="text-3xl font-display font-bold text-neon-blue">{totalDays}</div>
          <div className="text-xs font-mono text-gray-500 mt-1">打卡天数</div>
        </div>
        <div className="cyber-card neon-border-blue p-4 text-center">
          <div className="text-3xl font-display font-bold text-neon-blue">{totalCount}</div>
          <div className="text-xs font-mono text-gray-500 mt-1">题目总量</div>
        </div>
        <div className="cyber-card neon-border-blue p-4 text-center">
          <div className="text-3xl font-display font-bold text-neon-purple">{currentStreak}</div>
          <div className="text-xs font-mono text-gray-500 mt-1">当前连续</div>
        </div>
        <div className="cyber-card neon-border-blue p-4 text-center">
          <div className="text-3xl font-display font-bold text-neon-green">{maxStreak}</div>
          <div className="text-xs font-mono text-gray-500 mt-1">最长连续</div>
        </div>
        <div className="cyber-card neon-border-blue p-4 text-center">
          <div className={`text-3xl font-display font-bold ${checkedToday ? "text-neon-green" : "text-gray-400"}`}>
            {checkedToday ? "✓" : "✕"}
          </div>
          <div className="text-xs font-mono text-gray-500 mt-1">今日打卡</div>
        </div>
      </div>

      {/* Type Stats */}
      <div className="cyber-card p-5 mb-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.entries(TYPES).map(([key, val]) => (
            <div key={key} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{ backgroundColor: val.color + "20" }}>
                {val.emoji}
              </div>
              <div>
                <div className="text-sm font-mono font-bold">{val.label}</div>
                <div className="text-xs font-mono text-gray-500">
                  {typeStats[key]?.days || 0} 天 / {typeStats[key]?.count || 0} 题
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Checkin Card */}
      <div className="cyber-card neon-border-blue p-6 mb-8">
        {!isAuth ? (
          <div className="space-y-3">
            <p className="text-sm font-mono text-gray-500">&gt; 需要密码才能打卡</p>
            <div className="flex gap-2">
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleLogin()} placeholder="输入密码..." className="cyber-input flex-1" />
              <button onClick={handleLogin} className="cyber-btn-blue">验证</button>
            </div>
            {error && <p className="text-sm text-red-500 font-mono">{error}</p>}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-sm font-mono text-gray-400">类型:</span>
              {Object.entries(TYPES).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => setTodayType(key as typeof todayType)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-mono transition-all border ${
                    todayType === key ? "border-neon-blue bg-neon-blue/10 text-neon-blue" : "border-transparent bg-gray-50 dark:bg-cyber-surface text-gray-500 hover:border-neon-blue/30"
                  }`}
                >
                  <span>{val.emoji}</span> {val.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-mono text-gray-400">题数:</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setTodayCount(Math.max(1, todayCount - 1))} className="w-8 h-8 rounded bg-gray-100 dark:bg-cyber-surface text-gray-600 flex items-center justify-center hover:bg-neon-blue/10 hover:text-neon-blue transition-all">-</button>
                <input type="number" value={todayCount} onChange={(e) => setTodayCount(Math.max(1, parseInt(e.target.value) || 1))} min="1" className="w-20 text-center cyber-input" />
                <button onClick={() => setTodayCount(todayCount + 1)} className="w-8 h-8 rounded bg-gray-100 dark:bg-cyber-surface text-gray-600 flex items-center justify-center hover:bg-neon-blue/10 hover:text-neon-blue transition-all">+</button>
              </div>
            </div>
            <div>
              <input type="text" value={todayNote} onChange={(e) => setTodayNote(e.target.value)} placeholder="备注（可选）..." className="cyber-input" maxLength={100} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-gray-400">{today}</span>
              <button onClick={handleCheckin} className="cyber-btn-blue px-6 py-2">
                {checkedToday ? `补录签到 (今日已${todayTotalCount}题)` : "打卡签到"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Heatmap */}
      <div className="cyber-card p-6 mb-8 overflow-x-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-display font-bold text-neon-blue">提交热力图</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => setViewYear(viewYear - 1)} className="w-7 h-7 rounded bg-gray-100 dark:bg-cyber-surface text-gray-500 flex items-center justify-center hover:text-neon-blue transition-all text-sm">‹</button>
            <span className="text-sm font-mono font-bold min-w-[4rem] text-center">{viewYear}</span>
            <button onClick={() => setViewYear(viewYear + 1)} className="w-7 h-7 rounded bg-gray-100 dark:bg-cyber-surface text-gray-500 flex items-center justify-center hover:text-neon-blue transition-all text-sm">›</button>
          </div>
        </div>

        {/* Month labels - positioned relative to the heatmap grid */}
        <div className="relative mb-1 ml-8" style={{ height: "16px" }}>
          {monthPositions.map((mp, i) => {
            const cellSize = 13;
            const gap = 3;
            return (
              <div
                key={i}
                className="absolute text-[10px] font-mono text-gray-400 whitespace-nowrap"
                style={{ left: `${mp.col * (cellSize + gap)}px`, top: 0 }}
              >
                {mp.label}
              </div>
            );
          })}
        </div>

        <div className="flex gap-0">
          <div className="flex flex-col gap-0 mr-1">
            {dayLabels.map((label, i) => (
              <div key={i} className="h-[13px] leading-[13px] text-[10px] font-mono text-gray-400 w-4 text-right pr-1">
                {label}
              </div>
            ))}
          </div>

          <div className="flex gap-[3px]">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((day, di) => {
                  const colorClass = getColor(day);
                  const record = day ? heatmapData.get(day) : null;
                  return (
                    <div
                      key={di}
                      className={`w-[13px] h-[13px] rounded-[2px] transition-all cursor-default ${colorClass} ${
                        day ? "hover:ring-1 hover:ring-neon-blue/50" : ""
                      }`}
                      onMouseEnter={() => day && setHoveredCell(day)}
                      onMouseLeave={() => setHoveredCell(null)}
                      title={(() => {
                        const data = heatmapData.get(day || "");
                        if (!data && !day) return "";
                        if (!data) return day || "";
                        return `${day}: ${TYPES[data.type as keyof typeof TYPES]?.emoji || ""} ${data.count}题`;
                      })()}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {hoveredCell && (
          <div className="mt-3 p-3 rounded-lg bg-gray-50 dark:bg-cyber-surface text-sm font-mono">
            {(() => {
              const data = heatmapData.get(hoveredCell);
              return data ? (
                <span className="text-neon-blue">{hoveredCell}: {TYPES[data.type as keyof typeof TYPES]?.emoji || ""} {TYPES[data.type as keyof typeof TYPES]?.label || ""} {data.count}题</span>
              ) : (
                <span className="text-gray-400">{hoveredCell}: 未打卡</span>
              );
            })()}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 mt-4 text-xs font-mono text-gray-400">
          <span>少</span>
          <div className="w-[13px] h-[13px] rounded-[2px] bg-gray-100 dark:bg-cyber-surface/50" />
          <div className="w-[13px] h-[13px] rounded-[2px] bg-blue-300 dark:bg-blue-400/60" />
          <div className="w-[13px] h-[13px] rounded-[2px] bg-blue-400 dark:bg-blue-400" />
          <div className="w-[13px] h-[13px] rounded-[2px] bg-blue-600 dark:bg-blue-500" />
          <div className="w-[13px] h-[13px] rounded-[2px] bg-blue-800 dark:bg-blue-600" />
          <span>多</span>
        </div>
      </div>

      {/* Recent Records */}
      <div className="cyber-card p-6">
        <h2 className="text-lg font-display font-bold text-neon-blue mb-4">最近记录</h2>
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {records.length === 0 ? (
            <p className="text-center text-gray-400 font-mono text-sm py-8">暂无打卡记录</p>
          ) : (
            records.slice(0, 80).map((record) => (
              <div key={record.id} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-cyber-surface transition-all group">
                <span className="text-xl">{TYPES[record.type as keyof typeof TYPES]?.emoji || "💻"}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono font-bold">{record.created_at?.split(/[T ]/)[0] || ""}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: (TYPES[record.type as keyof typeof TYPES]?.color || "#00d4ff") + "20", color: TYPES[record.type as keyof typeof TYPES]?.color || "#00d4ff" }}>
                      {TYPES[record.type as keyof typeof TYPES]?.label || record.type}
                    </span>
                    <span className="text-sm font-mono text-neon-blue">+{record.count || 1} 题</span>
                  </div>
                  {record.note && <p className="text-xs font-mono text-gray-400 mt-0.5 truncate">{record.note}</p>}
                </div>
                {isAuth && record.source !== "oj_float" && (
                  <button onClick={() => handleDelete(record.id)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 text-sm p-1 transition-all">✕</button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
