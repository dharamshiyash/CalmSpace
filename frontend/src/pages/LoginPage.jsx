import React, { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { loginUser, logoutUser } from "../api";
import "./auth.css";


export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Clear any existing tokens when visiting login page
    logoutUser().catch(() => {});
    
    // Check for any error parameters
    const errorParam = searchParams.get('error');
    if (errorParam === 'auth_failed') {
      setError('Authentication failed. Please try again.');
    }
  }, [searchParams]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await loginUser({ email, password });
      navigate("/home");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };



  return (
    <main className="auth">
      {/* Header (optional mini brand) */}
      <header className="auth-header">
        <a className="brand" href="/" aria-label="CalmSpace Home">
          <img src='/logo.jpeg' alt="logo" />
          CalmSpace
        </a>
      </header>

      <section className="auth-card" role="form" aria-labelledby="authTitle">
        
        

        <h1 id="authTitle" className="auth-title">
           Welcome back
        </h1>
        <p className="auth-sub">
           Log in to continue your journaling journey.
        </p>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleLogin}>

          <div className="field">
            <label htmlFor="email" className="label">
              Email
            </label>
            <input
              id="email"
              name="email"
              className="input"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="field">
            <div className="label-row">
              <label htmlFor="password" className="label">
                Password
              </label>
            </div>
            <div className="pass-wrap">
              <input
                value={password}
                id="password"
                name="password"
                className="input"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••" 
                required
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="pass-toggle"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          <button className="btn btn-primary btn-lg" type="submit">
            Login
          </button>

        </form>
        <div className="switch">
          <p>New user? <Link className="link" to="/register">Register here</Link></p>  
        </div>
      </section>

      <footer className="auth-footer">
        
      </footer>
    </main>
  );
}