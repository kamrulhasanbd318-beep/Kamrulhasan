const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID || "not-configured",
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || "not-configured",
  callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:3000/auth/google/callback"
}, (_accessToken, _refreshToken, profile, done) => {
  return done(null, {
    id: profile.id,
    displayName: profile.displayName,
    emails: profile.emails || [],
    photos: profile.photos || []
  });
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));
