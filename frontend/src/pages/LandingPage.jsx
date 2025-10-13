import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "../api";
import "./Landing.css";

export default function LandingPage() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "warm");

  useEffect(() => {
    // Clear any existing tokens when visiting landing page
    logoutUser().catch(() => {});
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const handleClick = () => {
    navigate("/login");
  };

   const handlesignup = () => {
    navigate("/register");
  };

  // return (
  //   <div className="landing-container" onClick={handleClick}>
  //     <h1>Welcome to Our App</h1>
  //     <p> proceed to login</p>
  //   </div>
  // );

   return (
    <main className="lp">
      {/* Header */}
      <header className="lp-header">
        <div className="container">
          <a className="lp-logo" href="/" aria-label="Home">
            <img src='/logo.jpeg' alt="logo" />
            CalmSpace
          </a>
          <nav className="lp-nav" aria-label="Primary">
            <a href="#features">Features</a>
            <a href="#how">How it Works</a>
            <a href="#trust">Trust</a>
            <a href="#blog">Blog</a>
            <a href="#contact">Contact</a>
          </nav>
          <div className="lp-actions">
            <div className="theme-picker-mini">
              {["warm", "calm", "mint", "lavender", "rose", "sunset"].map((themeId) => (
                <button
                  key={themeId}
                  className={`theme-btn-mini ${theme === themeId ? 'active' : ''}`}
                  onClick={() => setTheme(themeId)}
                  title={themeId.charAt(0).toUpperCase() + themeId.slice(1)}
                >
                  <div className="theme-color-mini" data-theme={themeId}></div>
                </button>
              ))}
            </div>
            <button className="btn btn-ghost" onClick={handleClick}>Log in</button>
            <button className="btn btn-primary" onClick={handlesignup}>Sign up</button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="hero">
        <div className="container hero-layout">
          <div className="hero-copy">
            <h1 className="hero-heading">
              Your safe space to reflect, heal, and grow.
            </h1>
            <p className="hero-sub">
              Journal your thoughts, track your emotions, and let AI gently guide
              you with supportive insights and activities.
            </p>
            <div className="hero-actions">
              <button className="btn btn-primary" onClick={handleClick}>Start Journaling</button>
              <button className="btn btn-ghost" onClick={handleClick}>See how it works</button>
            </div>
            <p className="hero-note" role="note">
              🔒 Your entries are encrypted and never shared.
            </p>
          </div>

          {/* Replace this block with an image/illustration later */}
          <div className="hero-visual" aria-hidden="true">
            <div className="visual-card">
              <div className="visual-header" />
              <div className="visual-body">
                <div className="visual-line w-90" />
                <div className="visual-line w-75" />
                <div className="visual-line w-60" />
                <div className="visual-mood">
                  <div className="mood-chip">😊 Joy</div>
                  <div className="mood-chip">❤️ Love</div>
                  <div className="mood-chip">💭 Reflect</div>
                </div>
                <div className="visual-chart" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="section">
        <div className="container">
          <h2 className="section-title">Why choose MindJournal?</h2>
          <div className="grid-3">
            <article className="card">
              <h3 className="card-title">Private Journaling</h3>
              <p className="card-body">Write freely—your data stays secure and encrypted.</p>
            </article>
            <article className="card">
              <h3 className="card-title">Mood Analytics</h3>
              <p className="card-body">See trends over time with calm, clear visuals.</p>
            </article>
            <article className="card">
              <h3 className="card-title">AI Support</h3>
              <p className="card-body">Receive gentle recommendations and uplifting notes.</p>
            </article>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="section alt">
        <div className="container">
          <h2 className="section-title">Your wellness in 3 steps</h2>
          <div className="steps">
            <div className="step">
              <div className="badge">1</div>
              <div>
                <h4>Write your daily entry</h4>
                <p>Capture thoughts without judgment or pressure.</p>
              </div>
            </div>
            <div className="step">
              <div className="badge">2</div>
              <div>
                <h4 >Get instant mood insights</h4>
                <p>Understand emotions with AI-powered detection.</p>
              </div>
            </div>
            <div className="step">
              <div className="badge">3</div>
              <div>
                <h4>Receive gentle suggestions</h4>
                <p>Activities, reflections, and resources tailored to you.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section id="trust" className="section">
        <div className="container trust">
          <div className="trust-item">
            <span className="trust-icon" aria-hidden="true">🔒</span>
            <div>
              <h4>Private by design</h4>
              <p>End-to-end encryption and strict privacy controls.</p>
            </div>
          </div>
          <div className="trust-item">
            <span className="trust-icon" aria-hidden="true">🌿</span>
            <div>
              <h4>Uplifting UX</h4>
              <p>Psychologically warm visuals and gentle copy.</p>
            </div>
          </div>
          <div className="trust-item">
            <span className="trust-icon" aria-hidden="true">📊</span>
            <div>
              <h4>Clear insights</h4>
              <p>Trends and summaries that are easy to understand.</p>
            </div>
          </div>
        </div>
      </section>

      

      {/* CTA */}
      <section className="section cta">
        <div className="container cta-box">
          <div>
            <h2 className="cta-title">Start your wellness journey today</h2>
            <p className="cta-sub">Free plan • No credit card needed</p>
          </div>
          <button className="btn btn-primary btn-lg" onClick={handleClick}>Create your account</button>
        </div>
      </section>

      {/* Footer */}
      <footer className="lp-footer">
        <div className="container footer-layout">
          <div className="footer-brand">
            <a className="lp-logo" href="/" >
              <img src='/logo.jpeg' alt="logo" />
              CalmSpace
            </a>
            <p className="footer-copy">© {new Date().getFullYear()} MindJournal. All rights reserved.</p>
          </div>
          
        </div>
      </footer>
    </main>
  );
}
