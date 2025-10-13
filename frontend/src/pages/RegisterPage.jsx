import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser, logoutUser } from "../api";


export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Clear any existing tokens when visiting register page
    logoutUser().catch(() => {});
  }, []);

  const handleRegister = async (e) => {
      e.preventDefault();
      try {
        await registerUser({ username, email, password });
        navigate("/verify");
      } catch (err) {
        alert(err.response?.data?.message || "Registration failed");
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
           Create your account 
        </h1>
        <p className="auth-sub">
           Start journaling, track moods, and get gentle AI guidance.
        </p>

        <form className="auth-form" onSubmit={handleRegister}>

           <div className="field">
              <label htmlFor="name" className="label">
                Full name
              </label>
              <input
                id="name"
                name="name"
                className="input"
                type="text"
                autoComplete="name"
                placeholder="Full Name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

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
            Register
          </button>

          <div className="divider">
            <span>or</span>
          </div>

          

          
        </form>
        <p className="switch">
                <p >Already Register?<br></br> <Link className="link" to="/login">Login here</Link></p>  
          </p>
      </section>

      <footer className="auth-footer">
        
      </footer>
    </main>
  );
}