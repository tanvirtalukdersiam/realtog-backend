import { User } from "../user/user.model.js";
import { generateToken } from "@utils/jwt.js";
import { AuthResponse } from "./auth.types.js";
import mongoose from "mongoose";

export class GoogleAuthService {
  // generate auth response from user
  async generateAuthResponse(user: any): Promise<AuthResponse> {
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        emailVerified: user.emailVerified,
        role: user.role,
      },
      token,
    };
  }

  // find or create user from google profile
  async findOrCreateUser(profile: any): Promise<any> {
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
      return user;
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
        return user;
      }
    }

    // create new user
    user = new User({
      name: profile.displayName || profile.name?.givenName || "User",
      email:
        profile.emails && profile.emails[0]?.value
          ? profile.emails[0].value.toLowerCase()
          : "",
      phone: "", // google doesn't provide phone
      password: "", // no password for google users
      googleId: profile.id,
      provider: "google",
      emailVerified:
        profile.emails && profile.emails[0]?.verified ? true : false,
    });

    await user.save();
    return user;
  }
}

export const googleAuthService = new GoogleAuthService();
