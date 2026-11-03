require("dotenv").config();

const express = require("express");
const session = require("express-session");
const passport = require("passport");
const path = require("path");

require("./config/passport");

const app = express();
const isProduction = process.env.NODE_ENV === "production";

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is missing.");
}

if (isProduction) app.set("trust proxy", 1);

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(session({
  name: "kamrul.sid",
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, "public")));

app.get("/auth/google", (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_CALLBACK_URL) {
    return res.status(503).send("Google OAuth is not configured yet.");
  }
  passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
});

app.get("/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/?login=failed" }),
  (req, res) => res.redirect("/dashboard")
);

app.get("/api/me", (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ authenticated: false });
  res.json({
    authenticated: true,
    user: {
      id: req.user.id,
      name: req.user.displayName,
      email: req.user.emails?.[0]?.value || null,
      photo: req.user.photos?.[0]?.value || null
    }
  });
});

app.get("/dashboard", (req, res) => {
  if (!req.isAuthenticated()) return res.redirect("/");
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

app.post("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy((destroyErr) => {
      if (destroyErr) return next(destroyErr);
      res.clearCookie("kamrul.sid");
      res.redirect("/");
    });
  });
});

app.get("/health", (_req, res) => res.json({ ok: true, service: "kamrul-platform-auth" }));

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`KAMRUL backend listening on port ${port}`));
