import React, { useEffect, useMemo, useRef, useState } from "react";
import "./Journal.css";
import { createJournal, listJournal, updateJournal, deleteJournal, getEmotionSupport, getProtectedData } from "../api";
import { useNavigate } from "react-router-dom";
import ProfileDropdown from "../components/ProfileDropdown";
import "../components/ProfileDropdown.css";

export default function Journal() {
  const [entryText, setEntryText] = useState("");
  const [splitOpen, setSplitOpen] = useState(false);
  const [splitEntered, setSplitEntered] = useState(false);
  const [entries, setEntries] = useState([]);
  const [dayIndex, setDayIndex] = useState(0); // 0 = latest day (usually today)
  const [previewText, setPreviewText] = useState("");
  const [previewMood, setPreviewMood] = useState("joy");
  const [mlResponse, setMlResponse] = useState(null);
  const [mlLoading, setMlLoading] = useState(false);
  const [conversationCount, setConversationCount] = useState(0);
  // Right-side follow-up conversation (chat) state
  const [supportMessages, setSupportMessages] = useState([]); // {role: 'assistant'|'user', content: string}
  const [supportInput, setSupportInput] = useState("");
  const [user, setUser] = useState(null);
  // Breathing timer state
  const [showBreathingPrompt, setShowBreathingPrompt] = useState(false);
  const [recommendedDuration, setRecommendedDuration] = useState(0);
  const [breathingEnabled, setBreathingEnabled] = useState(false);
  const [breathingRunning, setBreathingRunning] = useState(false);
  const [breathingTotalSeconds, setBreathingTotalSeconds] = useState(0);
  const [breathingRemaining, setBreathingRemaining] = useState(0);
  const [inhaleSeconds, setInhaleSeconds] = useState(4);
  const [exhaleSeconds, setExhaleSeconds] = useState(4);
  const [breathingPhase, setBreathingPhase] = useState("inhale"); // 'inhale' | 'exhale'
  const [phaseRemaining, setPhaseRemaining] = useState(4);
  const phaseRef = useRef("inhale");
  useEffect(() => { phaseRef.current = breathingPhase; }, [breathingPhase]);
  const navigate = useNavigate();

  useEffect(() => {
    const theme = localStorage.getItem("theme") || "warm";
    document.documentElement.setAttribute("data-theme", theme);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await listJournal();
        setEntries(data.entries || []);
      } catch (err) {
        if (err?.response?.status === 401) navigate("/login");
      }
    })();
  }, [navigate]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await getProtectedData();
        if (data?.user) setUser(data.user);
      } catch (e) {
        // ignore; user not loaded shouldn't block journal
      }
    })();
  }, []);

  useEffect(() => {
    if (splitOpen) {
      // allow CSS transition
      const t = setTimeout(() => setSplitEntered(true), 10);
      return () => clearTimeout(t);
    } else {
      setSplitEntered(false);
    }
  }, [splitOpen]);

  const previewMoodClass = useMemo(() => {
    const map = {
      joy: "joy",
      sadness: "sadness",
      anger: "anger",  
      fear: "fear",
      love: "love",
      surprise: "surprise",
    };
    return map[previewMood] || "joy";
  }, [previewMood]);

  const todayPretty = () => {
    const d = new Date();
    return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
  };

  // Build a stable local date key (YYYY-MM-DD) to group entries by calendar day in local time
  const toLocalDateKey = (dateLike) => {
    const d = new Date(dateLike);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const da = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${da}`;
  };

  const uniqueDatesDesc = useMemo(() => {
    if (!Array.isArray(entries) || entries.length === 0) return [];
    const keys = new Set(entries.map((e) => toLocalDateKey(e.createdAt)));
    return Array.from(keys).sort((a, b) => (a > b ? -1 : a < b ? 1 : 0));
  }, [entries]);

  const selectedDateKey = uniqueDatesDesc[dayIndex] || toLocalDateKey(new Date());

  const selectedDatePretty = useMemo(() => {
    const [y, m, d] = selectedDateKey.split("-").map((x) => parseInt(x, 10));
    const dt = new Date(y, (m || 1) - 1, d || 1);
    return dt.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
  }, [selectedDateKey]);

  const entriesForSelectedDay = useMemo(() => {
    return entries.filter((e) => toLocalDateKey(e.createdAt) === selectedDateKey);
  }, [entries, selectedDateKey]);

  const onSubmit = async (e) => {
    e.preventDefault();
    const text = entryText.trim();
    if (!text) return;
    try {
      // First save the journal entry (this will encrypt it)
      const savedEntry = await createJournal({ text, mood: "joy" }); // Use default mood first
      const { data } = await listJournal();
      setEntries(data.entries || []);
      
      // Now get ML prediction and supportive response using the original text
      setMlLoading(true);
      let predictedMood = "joy"; // default fallback
      let supportResult = null;
      try {
        const mlData = await getEmotionSupport({ text, mood: "joy" });
        setMlResponse(mlData.data);
        supportResult = mlData.data;

        // Map ML service emotions to frontend emotions
        const emotionMap = {
          "joy": "joy",
          "sadness": "sadness",
          "anger": "anger",
          "fear": "fear",
          "love": "love",
          "surprise": "surprise"
        };

        predictedMood = emotionMap[mlData.data.prediction?.toLowerCase?.() || mlData.data.prediction] || "joy";

        // Update the saved entry with the predicted mood
        if (savedEntry.data?.entry?._id) {
          await updateJournal(savedEntry.data.entry._id, { mood: predictedMood });
          // Refresh the entries list to show updated mood
          const { data: updatedData } = await listJournal();
          setEntries(updatedData.entries || []);
        }
      } catch (mlErr) {
        console.error("ML prediction failed:", mlErr);
        setMlResponse({ error: "Failed to analyze emotions" });
      }
      setMlLoading(false);
      
      // store for split preview and open
      setPreviewText(text);
      setPreviewMood(predictedMood);
      setSplitOpen(true);
      setEntryText("");
      setConversationCount((c) => Math.min(5, c + 1));

      // Reset right-side conversation and breathing state for a fresh session
      setSupportMessages([]);
      setSupportInput("");
      setShowBreathingPrompt(false);
      setRecommendedDuration(0);
      setBreathingEnabled(false);
      setBreathingRunning(false);
      setInhaleSeconds(4);
      setExhaleSeconds(4);
      setBreathingTotalSeconds(0);
      setBreathingRemaining(0);
      setBreathingPhase("inhale");
      setPhaseRemaining(4);

      // Seed right-side conversation with assistant support summary
      const assistantIntro = [];
      if (supportResult?.support_plan?.support_message) {
        assistantIntro.push(supportResult.support_plan.support_message);
      }
      if (Array.isArray(supportResult?.support_plan?.activities)) {
        assistantIntro.push("Suggested activities: " + supportResult.support_plan.activities.join(", "));
      }
      setSupportMessages((msgs) => [
        ...msgs,
        ...(assistantIntro.length ? [{ role: "assistant", content: assistantIntro.join("\n\n") }] : [])
      ]);

      // If model suggests breathing, show prompt to user
      const actions = supportResult?.support_plan?.actions;
      if (actions?.suggest_breathing_timer) {
        const total = parseInt(actions?.recommended_duration || 0, 10) || 60;
        setShowBreathingPrompt(true);
        setRecommendedDuration(total);
      }
      // Also suggest breathing for fear or anger moods via prompt
      if ((predictedMood === "fear" || predictedMood === "anger") && !actions?.suggest_breathing_timer) {
        setShowBreathingPrompt(true);
        setRecommendedDuration(60);
      }
    } catch (err) {
      if (err?.response?.status === 401) return navigate("/login");
      alert(err?.response?.data?.message || "Failed to save entry");
    }
  };

  const onDelete = async (id) => {
    try {
      await deleteJournal(id);
      const { data } = await listJournal();
      setEntries(data.entries || []);
    } catch (err) {
      if (err?.response?.status === 401) return navigate("/login");
      alert(err?.response?.data?.message || "Failed to delete entry");
    }
  };

  const backToCompose = (e) => {
    e.preventDefault();
    setSplitOpen(false);
  };

  // Right-side: submit a follow-up message to the support pipeline
  const onSupportSubmit = async (e) => {
    e.preventDefault();
    const text = supportInput.trim();
    if (!text) return;
    setSupportMessages((m) => [...m, { role: "user", content: text }]);
    setSupportInput("");
    try {
      setMlLoading(true);
      const resp = await getEmotionSupport({ text, mood: previewMood });
      setMlLoading(false);
      const plan = resp?.data?.support_plan;
      const parts = [];
      if (plan?.support_message) parts.push(plan.support_message);
      if (Array.isArray(plan?.activities)) parts.push("Suggested activities: " + plan.activities.join(", "));
      setSupportMessages((m) => [...m, { role: "assistant", content: parts.join("\n\n") || "" }]);
      // Update breathing availability if suggested on follow-up
      const actions = plan?.actions;
      if (actions?.suggest_breathing_timer) {
        const total = parseInt(actions?.recommended_duration || 0, 10) || 0;
        setBreathingEnabled(true);
        setBreathingTotalSeconds(total);
        setBreathingRemaining(total);
        setBreathingRunning(false);
        setBreathingPhase("inhale");
        setPhaseRemaining(4);
      }
    } catch (err) {
      setMlLoading(false);
      setSupportMessages((m) => [...m, { role: "assistant", content: "Sorry, I couldn't process that right now." }]);
    }
  };

  // Breathing controls
  const startBreathing = () => {
    if (!breathingEnabled) return;
    const total = breathingTotalSeconds > 0 ? breathingTotalSeconds : 0;
    setBreathingRemaining(total);
    setBreathingPhase("inhale");
    setPhaseRemaining(inhaleSeconds);
    setBreathingRunning(true);
  };

  const stopBreathing = () => {
    setBreathingRunning(false);
  };

  // Breathing timer effect
  useEffect(() => {
    if (!breathingRunning) return;
    if (breathingRemaining <= 0) {
      setBreathingRunning(false);
      // Auto message to assistant after completion
      (async () => {
        try {
          const txt = `I completed the breathing exercise for ${breathingTotalSeconds} seconds.`;
          setSupportMessages((m) => [...m, { role: "user", content: txt }]);
          const resp = await getEmotionSupport({ text: txt, mood: previewMood });
          const plan = resp?.data?.support_plan;
          const parts = [];
          if (plan?.support_message) parts.push(plan.support_message);
          if (Array.isArray(plan?.activities)) parts.push("Suggested activities: " + plan.activities.join(", "));
          setSupportMessages((m) => [...m, { role: "assistant", content: parts.join("\n\n") || "" }]);
        } catch (e) {
          setSupportMessages((m) => [...m, { role: "assistant", content: "Great work completing the timer. How do you feel now?" }]);
        }
      })();
      return;
    }

    const tick = setTimeout(() => {
      // Decrement both total and phase
      setBreathingRemaining((t) => Math.max(0, t - 1));
      setPhaseRemaining((p) => {
        if (p > 1) return p - 1;
        // switch phase immediately, using ref to avoid stale closure
        const next = phaseRef.current === "inhale" ? "exhale" : "inhale";
        setBreathingPhase(next);
        return next === "inhale" ? inhaleSeconds : exhaleSeconds;
      });
    }, 1000);
    return () => clearTimeout(tick);
  }, [breathingRunning, breathingRemaining, inhaleSeconds, exhaleSeconds, breathingPhase, previewMood, breathingTotalSeconds]);

  return (
    <div>
      {/* Top Navigation */}
      <header className="topnav">
        <div className="container nav-inner">
          <a href="/home" className="logo">
            <img src='/logo.jpeg' alt="logo" />
            CalmSpace
          </a>
          <nav className="nav-links">
            <a href="/home">Dashboard</a>
            <a className="active" href="/journal">Write Journal</a>
            <ProfileDropdown user={user} />
          </nav>
        </div>
      </header>

      {/* New Journal Form */}
      {!splitOpen && (
        <section className="new-entry container" id="compose">
          <h1 className="page-title">Write your journal</h1>
          <form className="entry-form" onSubmit={onSubmit}>
            <textarea
              id="entryText"
              placeholder="How are you feeling today?"
              required
              value={entryText}
              onChange={(e) => setEntryText(e.target.value)}
            ></textarea>
            <div className="form-row">
              <button type="submit" className="btn btn-primary">Save Entry</button>
            </div>
          </form>
        </section>
      )}

      {/* Sticky Note Entries with day-based pagination */}
      {!splitOpen && (
        <section className="entries container" id="notes">
          <h2 className="section-title">Your Journals</h2>
          <div className="day-pagination" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn"
              onClick={() => setDayIndex((i) => Math.min(i + 1, Math.max(0, uniqueDatesDesc.length - 1)))}
              disabled={uniqueDatesDesc.length <= 1 || dayIndex >= uniqueDatesDesc.length - 1}
            >
              ← Previous Day
            </button>
            <div style={{ fontWeight: 600 }} aria-live="polite" aria-atomic="true">
              {entries.length === 0 ? "No entries yet" : `Entries for ${selectedDatePretty}`}
            </div>
            <button
              type="button"
              className="btn"
              onClick={() => setDayIndex((i) => Math.max(0, i - 1))}
              disabled={uniqueDatesDesc.length <= 1 || dayIndex === 0}
            >
              Next Day →
            </button>
          </div>
          <div className="note-grid">
            {entries.length === 0 && (
              <article className="sticky-note tilt-1">
                <div className="pin"></div>
                <div className="note-head">
                  <span className="date">{todayPretty()}</span>
                  <span className="pill calm">Start</span>
                </div>
                <p className="note-text">No entries yet. Your reflections will appear here.</p>
              </article>
            )}
            {entries.length > 0 && entriesForSelectedDay.length === 0 && (
              <article className="sticky-note tilt-2">
                <div className="pin"></div>
                <div className="note-head">
                  <span className="date">{selectedDatePretty}</span>
                  <span className="pill calm">Info</span>
                </div>
                <p className="note-text">No entries for this day.</p>
              </article>
            )}
            {entriesForSelectedDay.map((e, i) => (
              <article key={e._id || i} className={`sticky-note ${i % 3 === 0 ? "tilt-1" : i % 3 === 1 ? "tilt-2" : "tilt-3"}`}>
                <div className="pin"></div>
                <div className="note-head">
                  <span className="date">{new Date(e.createdAt).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}</span>
                  <span className={`pill ${({ joy: "joy", sadness: "sadness", anger: "anger", fear: "fear", love: "love", surprise: "surprise" }[e.mood])}`}>{e.mood}</span>
                </div>
                <p className="note-text">{e.text}</p>
                <button className="btn" style={{ marginTop: 8 }} onClick={() => onDelete(e._id)}>Delete</button>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Split View */}
      {splitOpen && (
        <section className={`split container ${splitEntered ? "entered" : ""}`} id="splitView">
          <div className="split-left">
            <h2 className="section-title">Write your journal </h2>
            {previewText && (
              <div className="read-card" style={{ marginBottom: 16 }}>
                <div className="read-head">
                  <span className="date">{todayPretty()}</span>
                  <span className={"pill " + previewMoodClass}>{previewMood}</span>
                </div>
                <div className="read-body" aria-readonly="true">{previewText}</div>
              </div>
            )}
            <form className="entry-form" onSubmit={onSubmit}>
              <textarea
                id="entryTextSplit"
                placeholder={conversationCount >= 5 ? "Limit reached (5). Please return to journal list." : "Write your next reflection..."}
                required
                value={entryText}
                onChange={(e) => setEntryText(e.target.value)}
                disabled={conversationCount >= 5}
              ></textarea>
              <div className="form-row">
                <button type="submit" className="btn btn-primary" disabled={conversationCount >= 5}>Save Entry</button>
                <button className="link back-link" onClick={backToCompose} type="button" style={{ marginLeft: 12 }}>← Back</button>
              </div>
            </form>
          </div>

          <div className="split-right">
            <h2 className="section-title">Emotion Support</h2>
            <div className="ml-response">
              {mlLoading ? (
                <div className="loading">
                  <div className="spinner"></div>
                  <p>Analyzing your emotions...</p>
                </div>
              ) : mlResponse ? (
                <div className="emotion-results">
                  {mlResponse.error ? (
                    <div className="error-message">
                      <p>❌ {mlResponse.error}</p>
                    </div>
                  ) : (
                    <>
                      <div className="prediction">
                        <h3>Detected Emotion:</h3>
                        <span className={`emotion-badge ${mlResponse.prediction?.toLowerCase()}`}>
                          {mlResponse.prediction}
                        </span>
                      </div>
                      {mlResponse.support_plan?.support_message && (
                        <div className="support-message" style={{ marginTop: 12 }}>
                          <h4>Supportive Message</h4>
                          <p>{mlResponse.support_plan.support_message}</p>
                        </div>
                      )}
                      {Array.isArray(mlResponse.support_plan?.activities) && (
                        <div className="activities" style={{ marginTop: 12 }}>
                          <h4>Suggested Activities</h4>
                          <ul>
                            {mlResponse.support_plan.activities.map((act, idx) => (
                              <li key={idx}>{act}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Breathing Prompt */}
                      {showBreathingPrompt && !breathingEnabled && (
                        <div className="breathing-prompt" style={{ marginTop: 16, padding: 12, border: "1px solid #e6eefb", background: "#f7fbff", borderRadius: 8 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <div>
                              <strong>Would you like to try a guided breathing exercise?</strong>
                              <div style={{ color: "#4c6a9b" }}>Recommended duration: {recommendedDuration || 60}s</div>
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                              <button type="button" className="btn" onClick={() => {
                                const total = recommendedDuration || 60;
                                setBreathingEnabled(true);
                                setBreathingTotalSeconds(total);
                                setBreathingRemaining(total);
                                setBreathingPhase("inhale");
                                setPhaseRemaining(inhaleSeconds);
                                setShowBreathingPrompt(false);
                              }}>Yes</button>
                              <button type="button" className="btn" onClick={() => setShowBreathingPrompt(false)}>No</button>
                            </div>
                          </div>
                        </div>
                      )}
                      {/* Breathing Timer UI */}
                      {breathingEnabled && (
                        <div className="breathing" style={{ marginTop: 16, padding: 12, border: "1px solid #e6eefb", background: "#f7fbff", borderRadius: 8 }}>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 12, alignItems: "center" }}>
                            <div>
                              <h4 style={{ margin: 0 }}>Breathing Timer</h4>
                              <div style={{ color: "#4c6a9b" }}>Total: {breathingRemaining}s / {breathingTotalSeconds || 0}s</div>
                            </div>
                            <div style={{ textAlign: "center" }}>
                              <div style={{ fontWeight: 700, fontSize: 18, color: breathingPhase === 'inhale' ? '#1a7f37' : '#7f1a1a' }}>
                                {breathingPhase === 'inhale' ? 'Inhale' : 'Exhale'}
                              </div>
                              <div style={{ fontSize: 12, color: '#4c6a9b' }}>Next in {phaseRemaining}s</div>
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                              {!breathingRunning ? (
                                <button type="button" className="btn" onClick={startBreathing}>Start</button>
                              ) : (
                                <button type="button" className="btn" onClick={stopBreathing}>Stop</button>
                              )}
                              <button type="button" className="btn" onClick={() => { setBreathingEnabled(false); setShowBreathingPrompt(false); }}>Close</button>
                            </div>
                          </div>
                          <div className="breathing-bar" style={{ marginTop: 12, height: 12, background: "#e6eefb", borderRadius: 6, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${breathingTotalSeconds ? (100 * (breathingTotalSeconds - breathingRemaining) / breathingTotalSeconds) : 0}%`, background: "linear-gradient(90deg, #62a0ff, #7cb7ff)", transition: "width 1s linear" }}></div>
                          </div>
                          <div className="phase-visual" style={{ marginTop: 10, display: 'flex', gap: 6 }}>
                            <div style={{ flex: 1, height: 10, borderRadius: 6, background: breathingPhase === 'inhale' ? '#bff0c4' : '#f0f0f0', transition: 'background 0.3s' }}></div>
                            <div style={{ flex: 1, height: 10, borderRadius: 6, background: breathingPhase === 'exhale' ? '#f5b5b5' : '#f0f0f0', transition: 'background 0.3s' }}></div>
                          </div>
                        </div>
                      )}
                      {/* Right-side conversation */}
                      <div className="support-chat" style={{ marginTop: 16 }}>
                        <h4>Conversation</h4>
                        <div className="chat-thread" style={{ maxHeight: 240, overflowY: "auto", padding: 8, border: "1px solid #e0e0e0", borderRadius: 8 }}>
                          {supportMessages.length === 0 && (
                            <p style={{ color: "#666" }}>You can ask follow-up questions or react to the plan here.</p>
                          )}
                          {supportMessages.map((m, idx) => (
                            <div key={idx} style={{ marginBottom: 8, textAlign: m.role === 'user' ? 'right' : 'left' }}>
                              <span style={{ display: "inline-block", padding: "8px 12px", borderRadius: 12, background: m.role === 'user' ? '#dff0ff' : '#f4f6f8' }}>
                                {m.content}
                              </span>
                            </div>
                          ))}
                        </div>
                        <form onSubmit={onSupportSubmit} className="chat-input" style={{ display: "flex", gap: 8, marginTop: 8 }}>
                          <input
                            type="text"
                            placeholder="Type your response..."
                            value={supportInput}
                            onChange={(e) => setSupportInput(e.target.value)}
                            style={{ flex: 1 }}
                          />
                          <button type="submit" className="btn">Send</button>
                        </form>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="placeholder">
                  <p>No support generated yet</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="footer">
        <div className="container footer-inner">
          <p>© {new Date().getFullYear()} CalmSpace</p>
          <nav className="footer-links">
            <a href="#privacy">Privacy</a>
            <a href="#terms">Terms</a>
            <a href="#support">Support</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}