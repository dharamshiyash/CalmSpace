const User = require("../models/User");
const jwt = require("jsonwebtoken");

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// Google OAuth strategy setup
exports.setupGoogleStrategy = (passport) => {
  // Check if Google OAuth credentials are available
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn("⚠️  Google OAuth credentials not found. Google sign-in will be disabled.");
    console.warn("   To enable Google OAuth, set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your environment variables.");
    return; // Exit early if credentials are missing
  }

  const GoogleStrategy = require("passport-google-oauth20").Strategy;

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user already exists with this Google ID
          let user = await User.findOne({ googleId: profile.id });

          if (user) {
            // User exists, update their Google info if needed
            if (!user.googleEmail) {
              user.googleEmail = profile.emails[0].value;
              user.googleName = profile.displayName;
              user.googlePicture = profile.photos[0]?.value;
              await user.save();
            }
            return done(null, user);
          }

          // Check if user exists with the same email but different auth method
          const existingUser = await User.findOne({ email: profile.emails[0].value });
          
          if (existingUser) {
            // Link Google account to existing user
            existingUser.googleId = profile.id;
            existingUser.googleEmail = profile.emails[0].value;
            existingUser.googleName = profile.displayName;
            existingUser.googlePicture = profile.photos[0]?.value;
            existingUser.isVerified = true; // Google users are automatically verified
            await existingUser.save();
            return done(null, existingUser);
          }

          // Create new user with Google OAuth
          const newUser = new User({
            username: profile.displayName || profile.emails[0].value.split("@")[0],
            email: profile.emails[0].value,
            googleId: profile.id,
            googleEmail: profile.emails[0].value,
            googleName: profile.displayName,
            googlePicture: profile.photos[0]?.value,
            isVerified: true, // Google users are automatically verified
          });

          await newUser.save();
          return done(null, newUser);
        } catch (error) {
          console.error("Google OAuth error:", error);
          return done(error, null);
        }
      }
    )
  );

  // Serialize user for session
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
};

// Google OAuth routes
exports.googleAuth = (passport) => {
  // Check if Google OAuth is configured
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return (req, res) => {
      res.redirect(`${process.env.FRONTEND_URL || "http://localhost:3000"}/login?error=google_auth_not_configured`);
    };
  }
  
  return passport.authenticate("google", {
    scope: ["profile", "email"],
  });
};

exports.googleCallback = (passport) => {
  // Check if Google OAuth is configured
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return (req, res) => {
      res.redirect(`${process.env.FRONTEND_URL || "http://localhost:3000"}/login?error=google_auth_not_configured`);
    };
  }
  
  return passport.authenticate("google", {
    failureRedirect: `${process.env.FRONTEND_URL || "http://localhost:3000"}/login?error=google_auth_failed`,
  });
};

exports.googleCallbackHandler = async (req, res) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:3000"}/login?error=google_auth_failed`);
    }

    // Generate JWT token
    const token = generateToken(user._id);

    // Set token in HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Redirect to frontend with success
    res.redirect(`${process.env.FRONTEND_URL || "http://localhost:3000"}/home`);
  } catch (error) {
    console.error("Google callback handler error:", error);
    res.redirect(`${process.env.FRONTEND_URL || "http://localhost:3000"}/login?error=google_auth_failed`);
  }
};

// Check if user exists by email (for registration validation)
exports.checkUserExists = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    
    res.json({ 
      exists: !!user,
      message: user ? "User exists" : "User not found"
    });
  } catch (error) {
    console.error("Check user exists error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
