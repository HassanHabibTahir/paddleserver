import passport from "passport";
import express from "express";

import {
  addNewPassword,
  forgotPassword,
  getUser,
  login,
  loginWithGoogle,
  logout,
  resendCode,
  singUp,
  updateProfile,
  verificationCode,
} from "../controllers/auth.js";

export const authRouter = express.Router();

authRouter.post("/signup", singUp);
authRouter.post("/verificationCode", verificationCode);

authRouter.post("/login", login);

authRouter.get(
  "/cuser",
  passport.authenticate("jwt", { session: false }),
  getUser
);

authRouter.get("/resendCode", resendCode);

authRouter.post(
  "/verificationCode",
  passport.authenticate("jwt", { session: false }),
  verificationCode
);

authRouter.post("/glogin", loginWithGoogle);
authRouter.put(
  "/update",
  passport.authenticate("jwt", { session: false }),
  updateProfile
);

authRouter.post("/forgot", forgotPassword);
authRouter.post("/reset", addNewPassword);

authRouter.get(
  "/logout",
  passport.authenticate("jwt", { session: false }),
  logout
);
