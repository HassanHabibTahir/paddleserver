import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import User from "../models/user.js";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

dotenv.config();

passport.use(cookieParser());

const jwtOptions = {
  jwtFromRequest: (req) => {
    let token = null;

    if (req && req.cookies) {
      token = req.cookies["viryal_tk"];
    }

    return token;
  },
  secretOrKey: process.env.JWT_SECRET,
};

passport.use(
  new JwtStrategy(jwtOptions, async (payload, done) => {
    try {
      const user = await User.findOne({ _id: payload._id });
      if (user) {
        return done(null, user);
      }
      return done(null, false);
    } catch (error) {
      return done(error, false);
    }
  })
);

export default passport;
