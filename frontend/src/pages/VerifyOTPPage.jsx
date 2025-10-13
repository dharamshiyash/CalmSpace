import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { verifyOTP, logoutUser } from "../api";

export default function VerifyOTPPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Clear any existing tokens when visiting verify page
    logoutUser().catch(() => {});
  }, []);

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      await verifyOTP({ email, otp });
      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.message || "Verification failed");
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
           Verify Your Email
        </h1>
        <p className="auth-sub">
           Enter the 4-digit code sent to your email to complete registration.
        </p>

        <form className="auth-form" onSubmit={handleVerify}>

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
                Enter 4-Digit Code
              </label>
            </div>
            <div className="pass-wrap">
              <input
                
                id="password"
                name="password"
                className="input"
                required
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
             
            </div>
          </div>
          <button className="btn btn-primary btn-lg" type="submit">
            Verify
          </button>

           
        </form>
        
      </section>

      <footer className="auth-footer">
        
      </footer>
    </main>
  );
}

