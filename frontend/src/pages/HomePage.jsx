import React from "react";
import { getJournalSummary, getProtectedData } from "../api";
import "./Home.css";
import ProfileDropdown from "../components/ProfileDropdown";
import "../components/ProfileDropdown.css";

import  { useEffect, useState } from "react";
import "./Home.css";

// theme names and sample data removed as real data is fetched from backend

function Greeting({ username }) {
  const hour = new Date().getHours();
  const label =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  return <h1 className="greeting">{label}, <span className="brand-accent">{username || "User"}</span> </h1>;
}

// removed previous line chart; replaced with pie chart below

function PieChart({ counts }) {
  const entries = Object.entries(counts || {});
  const total = entries.reduce((sum, [, v]) => sum + v, 0) || 1;
  const radius = 80;
  const cx = 100;
  const cy = 100;

  // Colors mapped to moods to match app palette
  const colorMap = {
    joy: '#f97316',
    love: '#60a5fa',
    sadness: '#64748b',
    anger: '#ef4444',
    surprise: '#34d399',
    fear: '#8b5cf6',
  };

  let cumulative = 0;
  const slices = entries.map(([label, value]) => {
    const fraction = value / total;
    const startAngle = cumulative * 2 * Math.PI - Math.PI / 2;
    const endAngle = (cumulative + fraction) * 2 * Math.PI - Math.PI / 2;
    cumulative += fraction;

    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);
    const largeArc = fraction > 0.5 ? 1 : 0;

    const d = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    return { d, label, value, color: colorMap[label] || '#999' };
  });

  return (
    <div style={{display:'grid', gridTemplateColumns:'220px 1fr', gap:16, alignItems:'center'}}>
      <svg width="200" height="200" viewBox="0 0 200 200" role="img" aria-label="Mood distribution last 7 days">
        <circle cx={cx} cy={cy} r={radius} fill="#f3f4f6" />
        {slices.map((s, i) => (
          <path key={i} d={s.d} fill={s.color} />
        ))}
        <circle cx={cx} cy={cy} r={38} fill="#fff" stroke="#e5e7eb" />
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontWeight="700" fill="var(--text-700)">
          7d
        </text>
      </svg>
      <ul style={{listStyle:'none', margin:0, padding:0, display:'grid', gap:8}}>
        {entries.map(([label, value]) => (
          <li key={label} style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <span style={{display:'inline-flex', alignItems:'center', gap:8}}>
              <span style={{width:10, height:10, borderRadius:999, background: colorMap[label] || '#999'}}></span>
              {label}
            </span>
            <span className="pill">{value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function HomePage() {
  const [theme] = useState(() => localStorage.getItem("theme") || "warm");
  const [moodCounts, setMoodCounts] = useState({ sadness:0, joy:0, love:0, anger:0, fear:0, surprise:0 });
  const [recentEntries, setRecentEntries] = useState([]);
  const [user, setUser] = useState(null);


  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await getJournalSummary();
        if (data?.moodCounts) setMoodCounts(data.moodCounts);
        if (data?.recentEntries) setRecentEntries(data.recentEntries);
      } catch (e) {
        // silently ignore for home rendering
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await getProtectedData();
        if (data?.user) setUser(data.user);
      } catch (e) {
        // ignore; user not loaded shouldn't block home
      }
    })();
  }, []);

  return (
    <div className="home">
      {/* Top Nav */}
      <header className="topnav">
        <div className="container nav-inner">
          <a href="/" className="logo">
           <img src='/logo.jpeg' alt="logo" />
            CalmSpace
          </a>
          <nav className="nav-links" aria-label="Primary">
            <a className="active" href="#dashboard">Dashboard</a>
            <a href="/journal">Write a journal</a>
            <ProfileDropdown user={user} />
          </nav>
        </div>
      </header>

      {/* Hero / Overview */}
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-left">
            <Greeting username={user?.username} />
            <p className="sub">Here’s a quick look at your recent mood and entries.</p>

            

            {/* Graph */}
            <div className="card">
              <div className="card-head">
                <h3>Mood Trend </h3>
                
              </div>
              <PieChart counts={moodCounts} />
            </div>
          </div>

          {/* Previous entries */}
          <aside className="hero-right">
            <div className="card entries">
              <div className="card-head">
                <h3>Previous Entries</h3>
                <a className="link" href="#all">View all</a>
              </div>
              <ul className="entry-list">
                {recentEntries && recentEntries.length > 0 ? (
                  recentEntries.map((e) => (
                    <li key={e._id} className="entry">
                      <div className="entry-meta">
                        <span className="entry-date">{new Date(e.createdAt).toLocaleDateString()}</span>
                        <span className="pill">{e.mood}</span>
                      </div>
                      <p className="entry-text">{e.text.length > 120 ? `${e.text.slice(0,120)}…` : e.text}</p>
                    </li>
                  ))
                ) : (
                  <>Please Write an Entry First</>
                )}
              </ul>
            </div>

            <div className="cta card">
              <h4>Write today’s journal</h4>
              <p>Capture a quick reflection or a longer entry.</p>
              <a href="/journal" className="btn btn-primary">Write a journal</a>
            </div>
          </aside>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container ">
          <p>© {new Date().getFullYear()} CalmSpace</p>
          
        </div>
      </footer>
    </div>
  );
}
