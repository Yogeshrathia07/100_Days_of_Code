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
        const email =
          profile._json.preferred_username ||
          profile._json.email;

        if (!email) return done(null, false);

        let user = await User.findOne({ email });

        if (!user) {
          user = await User.create({
            name: profile.displayName,
            email: email,
            SAP_ID: null,
            leetcode_id: null,
            password: null,
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});
