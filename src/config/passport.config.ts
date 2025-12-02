import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { config } from "./index.js";
import { User } from "../modules/user/user.model.js";
import logger from "../utils/logger.js";

// serialize user for session (not used with JWT, but required by passport)
passport.serializeUser((user: any, done) => {
  done(null, user._id ? user._id.toString() : null);
});

// deserialize user from session (not used with JWT, but required by passport)
passport.deserializeUser(async (id: string, done) => {
  try {
    if (!id) {
      return done(null, null);
    }
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// google oauth strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: config.googleClientId,
      clientSecret: config.googleClientSecret,
      callbackURL: config.googleCallbackURL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // check if user exists with this google id
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          // user exists, update profile if needed
          if (
            !user.emailVerified &&
            profile.emails &&
            profile.emails[0]?.verified
          ) {
            user.emailVerified = true;
            await user.save();
          }
          return done(null, user);
        }

        // check if user exists with this email
        if (profile.emails && profile.emails[0]?.value) {
          user = await User.findOne({
            email: profile.emails[0].value.toLowerCase(),
          });

          if (user) {
            // user exists with email, link google account
            user.googleId = profile.id;
            user.provider = "google";
            if (profile.emails && profile.emails[0]?.verified) {
              user.emailVerified = true;
            }
            await user.save();
            return done(null, user);
          }
        }

        // create new user
        if (!profile.emails || !profile.emails[0]?.value) {
          return done(
            new Error("Email is required for Google authentication"),
            undefined
          );
        }

        user = new User({
          name:
            profile.displayName ||
            profile.name?.givenName ||
            profile.name?.familyName ||
            "User",
          email: profile.emails[0].value.toLowerCase(),
          phone: undefined, // google doesn't provide phone, not required for google users
          password: undefined, // no password for google users, not required
          googleId: profile.id,
          provider: "google",
          emailVerified: profile.emails[0]?.verified ? true : false,
        });

        await user.save();
        logger.info(`Google user created: ${user.email}`);

        return done(null, user);
      } catch (error: any) {
        logger.error("Google OAuth error:", error);
        return done(error, undefined);
      }
    }
  )
);

export default passport;
