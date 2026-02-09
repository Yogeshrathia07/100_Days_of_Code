const passport = require("passport");
const { OIDCStrategy } = require("passport-azure-ad");
const User = require("../model/user");

passport.use(
  new OIDCStrategy(
    {
      identityMetadata: `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID}/v2.0/.well-known/openid-configuration`,
      clientID: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      responseType: "code",
      responseMode: "form_post",
      redirectUrl: process.env.MICROSOFT_CALLBACK_URL,
      allowHttpForRedirectUrl: true,
      scope: ["profile", "email", "openid"],
    },

    async (iss, sub, profile, accessToken, refreshToken, done) => {
      try {
        // ✅ get email from microsoft
        const email =
          profile._json.email || profile._json.preferred_username;

        if (!email) {
          return done(null, false);
        }

        // ✅ Restrict login only for UPES domain
        if (!email.endsWith("upes.ac.in")) {
          console.log("❌ Not allowed email:", email);
          return done(null, false);
        }

        const name = profile.displayName;

        // ✅ find user in DB
        let user = await User.findOne({ email });

        // ✅ create user if not exists
        if (!user) {
          user = await User.create({
            name,
            email,
            SAP_ID: null,
            leetcode_id: null,
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// ================= SESSION STORE =================
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// ================= SESSION FETCH =================
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});
