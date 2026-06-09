import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import client from "../api/client";

// ─── API helpers ────────────────────────────────────────────────────────────

const exerciseApi = {
  getLogs: (date) => client.get(`/logs/exercise/?date=${date}`),
  addLog: (data) => client.post("/logs/exercise/", data),
  deleteLog: (id) => client.delete(`/logs/exercise/${id}`),
};

// ─── Constants ───────────────────────────────────────────────────────────────

const EXERCISE_PRESETS = [
  { name: "Running", icon: "🏃", met: 9.8, category: "cardio" },
  { name: "Walking", icon: "🚶", met: 3.5, category: "cardio" },
  { name: "Cycling", icon: "🚴", met: 7.5, category: "cardio" },
  { name: "Swimming", icon: "🏊", met: 8.0, category: "cardio" },
  { name: "Weight Training", icon: "🏋️", met: 5.0, category: "strength" },
  { name: "Yoga", icon: "🧘", met: 3.0, category: "flexibility" },
  { name: "HIIT", icon: "⚡", met: 10.0, category: "cardio" },
  { name: "Jump Rope", icon: "🪢", met: 11.0, category: "cardio" },
  { name: "Rowing", icon: "🚣", met: 7.0, category: "cardio" },
  { name: "Pilates", icon: "🤸", met: 3.5, category: "flexibility" },
  { name: "Basketball", icon: "🏀", met: 6.5, category: "sport" },
  { name: "Soccer", icon: "⚽", met: 7.0, category: "sport" },
];

const CATEGORY_COLORS = {
  cardio: { bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.3)", text: "#ef4444", label: "Cardio" },
  strength: { bg: "rgba(234,179,8,0.12)", border: "rgba(234,179,8,0.3)", text: "#eab308", label: "Strength" },
  flexibility: { bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.3)", text: "#22c55e", label: "Flexibility" },
  sport: { bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.3)", text: "#3b82f6", label: "Sport" },
};

// ─── NavBar ──────────────────────────────────────────────────────────────────

function NavBar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate("/login"); };

  const links = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/diary", label: "Diary" },
    { to: "/exercise", label: "Exercise" },
    { to: "/recipes", label: "Recipes" },
    { to: "/progress", label: "Progress" },
    { to: "/profile", label: "Profile" },
  ];

  return (
    <nav style={styles.nav}>
      <div style={styles.navInner}>
        <Link to="/dashboard" style={styles.navLogo}>
          <span>⚡</span>
          <span>Calorimatic</span>
        </Link>
        <div style={styles.navLinks}>
          {links.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              style={{
                ...styles.navLink,
                ...(to === "/exercise" ? styles.navLinkActive : {}),
              }}
            >
              {label}
            </Link>
          ))}
          <button onClick={handleLogout} style={styles.navLogout}>Log out</button>
        </div>
      </div>
    </nav>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, unit, color = "#a78bfa" }) {
  return (
    <div style={{ ...styles.statCard, borderColor: `${color}33` }}>
      <div style={{ ...styles.statIcon, background: `${color}18`, color }}>{icon}</div>
      <div style={styles.statBody}>
        <div style={styles.statValue}>
          {value ?? "—"}
          {value != null && unit && <span style={styles.statUnit}> {unit}</span>}
        </div>
        <div style={styles.statLabel}>{label}</div>
      </div>
    </div>
  );
}

// ─── ExerciseLogItem ──────────────────────────────────────────────────────────

function ExerciseLogItem({ log, onDelete }) {
  const [confirming, setConfirming] = useState(false);
  const cat = CATEGORY_COLORS[log.category] || CATEGORY_COLORS.cardio;

  return (
    <div style={styles.logItem}>
      <div style={{ ...styles.logCatDot, background: cat.bg, border: `1px solid ${cat.border}` }}>
        <span style={{ fontSize: 18 }}>{log.icon || "🏃"}</span>
      </div>
      <div style={styles.logInfo}>
        <div style={styles.logName}>{log.activity}</div>
        <div style={styles.logMeta}>
          <span style={{ ...styles.logBadge, background: cat.bg, color: cat.text, border: `1px solid ${cat.border}` }}>
            {cat.label}
          </span>
          {log.duration_minutes && (
            <span style={styles.logDetail}>⏱ {log.duration_minutes} min</span>
          )}
        </div>
      </div>
      <div style={styles.logRight}>
        {log.calories_burned != null && (
          <div style={styles.logCalories}>
            <span style={styles.logCaloriesNum}>{Math.round(log.calories_burned)}</span>
            <span style={styles.logCaloriesLabel}> kcal</span>
          </div>
        )}
        {confirming ? (
          <div style={styles.confirmRow}>
            <button style={styles.confirmYes} onClick={() => onDelete(log.id)}>Remove</button>
            <button style={styles.confirmNo} onClick={() => setConfirming(false)}>Cancel</button>
          </div>
        ) : (
          <button style={styles.deleteBtn} onClick={() => setConfirming(true)}>✕</button>
        )}
      </div>
    </div>
  );
}

// ─── AddExerciseModal ─────────────────────────────────────────────────────────

function AddExerciseModal({ onClose, onSave, userWeightKg = 70 }) {
  const [step, setStep] = useState("preset");
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ name: "", duration_mins: "", calories_burned: "", category: "cardio" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selectPreset = (preset) => {
    setSelected(preset);
    setForm((f) => ({ ...f, name: preset.name, category: preset.category, calories_burned: "" }));
    setStep("form");
  };

  const calcEstimate = () => {
    if (!selected || !form.duration_mins) return null;
    return Math.round(selected.met * userWeightKg * (parseFloat(form.duration_mins) / 60));
  };

  const handleDurationChange = (val) => {
    setForm((f) => {
      const next = { ...f, duration_mins: val };
      if (selected && val) {
        next.calories_burned = Math.round(selected.met * userWeightKg * (parseFloat(val) / 60));
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError("Exercise name is required."); return; }
    if (!form.duration_mins) { setError("Duration is required."); return; }
    setSaving(true);
    setError("");
    try {
      await onSave({
        activity: form.name.trim(),
        duration_minutes: parseInt(form.duration_mins),
        calories_burned: form.calories_burned ? parseFloat(form.calories_burned) : null,
      });
      onClose();
    } catch (e) {
      setError(e?.response?.data?.detail || "Failed to save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <div>
            <div style={styles.modalTitle}>Log Exercise</div>
            {step === "form" && selected && (
              <div style={styles.modalSubtitle}>{selected.icon} {selected.name}</div>
            )}
          </div>
          <button style={styles.modalClose} onClick={onClose}>✕</button>
        </div>

        {step === "preset" && (
          <>
            <div style={styles.modalSectionLabel}>Quick pick</div>
            <div style={styles.presetGrid}>
              {EXERCISE_PRESETS.map((p) => {
                const cat = CATEGORY_COLORS[p.category];
                return (
                  <button key={p.name} style={{ ...styles.presetCard, borderColor: cat.border }} onClick={() => selectPreset(p)}>
                    <span style={styles.presetIcon}>{p.icon}</span>
                    <span style={styles.presetName}>{p.name}</span>
                    <span style={{ ...styles.presetCat, color: cat.text }}>{cat.label}</span>
                  </button>
                );
              })}
            </div>
            <div style={styles.modalDivider} />
            <button style={styles.customBtn} onClick={() => { setSelected(null); setForm({ name: "", duration_mins: "", calories_burned: "", category: "cardio" }); setStep("form"); }}>
              ✏️ Enter custom exercise
            </button>
          </>
        )}

        {step === "form" && (
          <>
            {!selected && (
              <>
                <label style={styles.label}>Exercise name</label>
                <input style={styles.input} placeholder="e.g. Skateboarding" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} autoFocus />
                <label style={styles.label}>Category</label>
                <div style={styles.catRow}>
                  {Object.entries(CATEGORY_COLORS).map(([key, c]) => (
                    <button
                      key={key}
                      style={{ ...styles.catChip, background: form.category === key ? c.bg : "transparent", border: `1px solid ${form.category === key ? c.text : "rgba(255,255,255,0.12)"}`, color: form.category === key ? c.text : "#888" }}
                      onClick={() => setForm((f) => ({ ...f, category: key }))}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </>
            )}

            <label style={styles.label}>Duration (minutes)</label>
            <input style={styles.input} type="number" min="1" placeholder="e.g. 30" value={form.duration_mins} onChange={(e) => handleDurationChange(e.target.value)} />

            <label style={styles.label}>
              Calories burned
              {calcEstimate() != null && form.duration_mins && (
                <span style={styles.estimateHint}> — est. {calcEstimate()} kcal</span>
              )}
            </label>
            <input
              style={styles.input}
              type="number"
              min="0"
              placeholder={calcEstimate() != null ? `~${calcEstimate()} (estimated)` : "e.g. 250"}
              value={form.calories_burned}
              onChange={(e) => setForm((f) => ({ ...f, calories_burned: e.target.value }))}
            />

            {error && <div style={styles.errorMsg}>{error}</div>}

            <div style={styles.modalActions}>
              <button style={styles.backBtn} onClick={() => setStep("preset")}>← Back</button>
              <button style={styles.saveBtn} onClick={handleSubmit} disabled={saving}>
                {saving ? "Saving…" : "Log Exercise"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Exercise() {
  const { user } = useAuth();
  const today = new Date().toISOString().split("T")[0];

  const [date, setDate] = useState(today);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);

  const userWeightKg = user?.weight_kg || 70;

  const totalCalories = logs.reduce((s, l) => s + (l.calories_burned || 0), 0);
  const totalMinutes = logs.reduce((s, l) => s + (l.duration_minutes || 0), 0);
  const topCategory = "cardio";

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await exerciseApi.getLogs(date);
      setLogs(res.data || []);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleSave = async (data) => {
    await exerciseApi.addLog({
      activity: data.activity,
      duration_minutes: data.duration_minutes,
      calories_burned: data.calories_burned,
    });
    await fetchLogs();
    showToast("Exercise logged! 💪");
  };

  const handleDelete = async (id) => {
    try {
      await exerciseApi.deleteLog(id);
      setLogs((prev) => prev.filter((l) => l.id !== id));
      showToast("Exercise removed.");
    } catch {
      showToast("Could not remove exercise.", "error");
    }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const isToday = date === today;

  const shiftDate = (days) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().split("T")[0]);
  };

  const formatDateLabel = () => {
    if (date === today) return "Today";
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (date === yesterday.toISOString().split("T")[0]) return "Yesterday";
    return new Date(date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  return (
    <div style={styles.page}>
      <NavBar />

      {toast && (
        <div style={{ ...styles.toast, background: toast.type === "error" ? "#7f1d1d" : "#14532d", borderColor: toast.type === "error" ? "#ef444466" : "#22c55e66" }}>
          {toast.msg}
        </div>
      )}

      <main style={styles.main}>
        <div style={styles.pageHeader}>
          <div>
            <h1 style={styles.pageTitle}>🏋️ Exercise</h1>
            <p style={styles.pageSubtitle}>Track workouts and calories burned</p>
          </div>
          <button style={styles.addBtn} onClick={() => setShowModal(true)}>+ Log Exercise</button>
        </div>

        <div style={styles.datePicker}>
          <button style={styles.dateArrow} onClick={() => shiftDate(-1)}>‹</button>
          <div style={styles.dateDisplay}>
            <span style={styles.dateLabel}>{formatDateLabel()}</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={styles.dateInput} max={today} />
          </div>
          <button style={{ ...styles.dateArrow, opacity: isToday ? 0.3 : 1 }} onClick={() => !isToday && shiftDate(1)} disabled={isToday}>›</button>
        </div>

        <div style={styles.statsRow}>
          <StatCard icon="🔥" label="Calories burned" value={totalCalories > 0 ? Math.round(totalCalories) : null} unit="kcal" color="#f97316" />
          <StatCard icon="⏱" label="Active time" value={totalMinutes > 0 ? totalMinutes : null} unit="min" color="#a78bfa" />
          <StatCard icon="📋" label="Activities" value={logs.length > 0 ? logs.length : null} color="#22c55e" />
        </div>

        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Workouts</h2>
            {logs.length > 0 && (
              <span style={styles.sectionCount}>{logs.length} {logs.length === 1 ? "activity" : "activities"}</span>
            )}
          </div>

          {loading ? (
            <div style={styles.emptyState}>
              <div style={styles.spinner} />
              <p style={styles.emptyText}>Loading…</p>
            </div>
          ) : logs.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>🏃</div>
              <p style={styles.emptyTitle}>No workouts logged{!isToday ? " on this day" : " yet"}</p>
              <p style={styles.emptyText}>
                {isToday ? "Log a workout to track calories burned and stay on top of your goals." : "Nothing was logged on this day."}
              </p>
              {isToday && (
                <button style={styles.emptyAddBtn} onClick={() => setShowModal(true)}>+ Log your first workout</button>
              )}
            </div>
          ) : (
            <div style={styles.logList}>
              {logs.map((log) => (
                <ExerciseLogItem key={log.id} log={log} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>

        {!loading && logs.length === 0 && isToday && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Quick start</h2>
            <div style={styles.quickGrid}>
              {EXERCISE_PRESETS.slice(0, 6).map((p) => {
                const cat = CATEGORY_COLORS[p.category];
                return (
                  <button key={p.name} style={{ ...styles.quickCard, borderColor: cat.border }} onClick={() => setShowModal(true)}>
                    <span style={styles.quickIcon}>{p.icon}</span>
                    <span style={styles.quickName}>{p.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {totalCalories > 0 && (
          <div style={styles.contextCard}>
            <div style={styles.contextIcon}>💡</div>
            <div style={styles.contextText}>
              You've burned <strong style={{ color: "#f97316" }}>{Math.round(totalCalories)} kcal</strong> today.
              {totalCalories >= 300 ? " Great work — that's a solid session!" : " Keep it up!"}
            </div>
          </div>
        )}
      </main>

      {showModal && (
        <AddExerciseModal onClose={() => setShowModal(false)} onSave={handleSave} userWeightKg={userWeightKg} />
      )}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = {
  page: { minHeight: "100vh", background: "#0f0f13", color: "#e8e8f0", fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" },

  nav: { borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(15,15,19,0.95)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 100 },
  navInner: { maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" },
  navLogo: { display: "flex", alignItems: "center", gap: 8, color: "#e8e8f0", textDecoration: "none", fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em" },
  navLinks: { display: "flex", alignItems: "center", gap: 4 },
  navLink: { color: "#888", textDecoration: "none", fontSize: 14, fontWeight: 500, padding: "6px 12px", borderRadius: 8 },
  navLinkActive: { color: "#a78bfa", background: "rgba(167,139,250,0.1)" },
  navLogout: { background: "none", border: "1px solid rgba(255,255,255,0.12)", color: "#888", fontSize: 13, padding: "6px 12px", borderRadius: 8, cursor: "pointer", marginLeft: 8 },

  toast: { position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", border: "1px solid", borderRadius: 10, padding: "12px 20px", fontSize: 14, fontWeight: 500, zIndex: 9999, pointerEvents: "none", whiteSpace: "nowrap" },

  main: { maxWidth: 780, margin: "0 auto", padding: "32px 24px 80px" },

  pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 },
  pageTitle: { fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", margin: "0 0 4px" },
  pageSubtitle: { color: "#666", fontSize: 14, margin: 0 },
  addBtn: { background: "#a78bfa", color: "#0f0f13", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer" },

  datePicker: { display: "flex", alignItems: "center", gap: 12, marginBottom: 24, background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "10px 16px", border: "1px solid rgba(255,255,255,0.07)" },
  dateArrow: { background: "none", border: "none", color: "#e8e8f0", fontSize: 22, cursor: "pointer", padding: "0 4px" },
  dateDisplay: { flex: 1, display: "flex", alignItems: "center", gap: 10 },
  dateLabel: { fontWeight: 600, fontSize: 15, color: "#e8e8f0" },
  dateInput: { background: "none", border: "none", color: "#666", fontSize: 13, cursor: "pointer", padding: 0, colorScheme: "dark" },

  statsRow: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: 28 },
  statCard: { background: "rgba(255,255,255,0.04)", border: "1px solid", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 },
  statIcon: { width: 40, height: 40, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 },
  statBody: { minWidth: 0 },
  statValue: { fontSize: 20, fontWeight: 700, letterSpacing: "-0.03em", color: "#e8e8f0", lineHeight: 1.1 },
  statUnit: { fontSize: 12, fontWeight: 500, color: "#888" },
  statLabel: { fontSize: 12, color: "#666", marginTop: 2 },

  section: { marginBottom: 28 },
  sectionHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: 600, margin: 0, color: "#e8e8f0" },
  sectionCount: { fontSize: 12, color: "#666", background: "rgba(255,255,255,0.06)", padding: "3px 8px", borderRadius: 20 },

  logList: { display: "flex", flexDirection: "column", gap: 8 },
  logItem: { display: "flex", alignItems: "center", gap: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "12px 16px" },
  logCatDot: { width: 44, height: 44, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  logInfo: { flex: 1, minWidth: 0 },
  logName: { fontWeight: 600, fontSize: 15, color: "#e8e8f0", marginBottom: 4 },
  logMeta: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" },
  logBadge: { fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 20, letterSpacing: "0.02em" },
  logDetail: { fontSize: 12, color: "#888" },
  logRight: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 },
  logCalories: { textAlign: "right" },
  logCaloriesNum: { fontSize: 16, fontWeight: 700, color: "#f97316" },
  logCaloriesLabel: { fontSize: 11, color: "#888" },
  confirmRow: { display: "flex", gap: 6 },
  confirmYes: { background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", borderRadius: 6, padding: "4px 8px", fontSize: 12, cursor: "pointer", fontWeight: 600 },
  confirmNo: { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#aaa", borderRadius: 6, padding: "4px 8px", fontSize: 12, cursor: "pointer" },
  deleteBtn: { background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: 14, padding: "4px 6px", borderRadius: 6 },

  emptyState: { textAlign: "center", padding: "48px 24px", background: "rgba(255,255,255,0.03)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)" },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: 600, color: "#e8e8f0", marginBottom: 6 },
  emptyText: { fontSize: 14, color: "#666", maxWidth: 320, margin: "0 auto 20px" },
  emptyAddBtn: { background: "#a78bfa", color: "#0f0f13", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer" },
  spinner: { width: 28, height: 28, border: "3px solid rgba(167,139,250,0.2)", borderTop: "3px solid #a78bfa", borderRadius: "50%", margin: "0 auto 12px" },

  quickGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 10 },
  quickCard: { background: "rgba(255,255,255,0.04)", border: "1px solid", borderRadius: 12, padding: "14px 10px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 },
  quickIcon: { fontSize: 24 },
  quickName: { fontSize: 13, fontWeight: 500, color: "#ccc" },

  contextCard: { display: "flex", alignItems: "flex-start", gap: 12, background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)", borderRadius: 12, padding: "14px 16px" },
  contextIcon: { fontSize: 20, flexShrink: 0 },
  contextText: { fontSize: 14, color: "#ccc", lineHeight: 1.5 },

  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 },
  modal: { background: "#18181f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 28, width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", color: "#e8e8f0" },
  modalSubtitle: { fontSize: 14, color: "#888", marginTop: 2 },
  modalClose: { background: "rgba(255,255,255,0.08)", border: "none", color: "#888", width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontSize: 14 },
  modalSectionLabel: { fontSize: 12, fontWeight: 600, color: "#666", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 },
  presetGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 },
  presetCard: { background: "rgba(255,255,255,0.04)", border: "1px solid", borderRadius: 10, padding: "12px 8px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 },
  presetIcon: { fontSize: 22 },
  presetName: { fontSize: 12, fontWeight: 600, color: "#ccc", textAlign: "center" },
  presetCat: { fontSize: 10, fontWeight: 600, letterSpacing: "0.04em" },
  modalDivider: { height: 1, background: "rgba(255,255,255,0.07)", margin: "18px 0" },
  customBtn: { width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#ccc", borderRadius: 10, padding: 12, fontSize: 14, cursor: "pointer", fontWeight: 500 },

  label: { display: "block", fontSize: 13, fontWeight: 600, color: "#888", marginBottom: 6, marginTop: 16 },
  estimateHint: { color: "#a78bfa", fontWeight: 500 },
  input: { width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "11px 14px", color: "#e8e8f0", fontSize: 15, boxSizing: "border-box", outline: "none" },
  catRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  catChip: { padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer" },
  errorMsg: { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", borderRadius: 8, padding: "10px 14px", fontSize: 13, marginTop: 12 },
  modalActions: { display: "flex", gap: 10, marginTop: 20 },
  backBtn: { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#aaa", borderRadius: 10, padding: "12px 16px", fontSize: 14, cursor: "pointer", fontWeight: 500 },
  saveBtn: { flex: 1, background: "#a78bfa", color: "#0f0f13", border: "none", borderRadius: 10, padding: 12, fontSize: 15, fontWeight: 700, cursor: "pointer" },
};