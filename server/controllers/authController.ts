import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { User, IUser } from "../models/User";
import jwt from "jsonwebtoken";

// REGISTER -----------------------------
export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    // Input validation
    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(409).json({ 
        message: "User with this email or username already exists" 
      });
    }

    // Password strength validation
    if (password.length < 6) {
      return res.status(400).json({ 
        message: "Password must be at least 6 characters long" 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12); // Increased salt rounds

    const newUser: IUser = await User.create({
      username,
      email,
      password: hashedPassword
    });

    res.status(201).json({
      id: newUser._id.toString(),
      username: newUser.username,
      email: newUser.email
    });
  } catch (error: any) {
    // Handle duplicate key error (unique constraint)
    if (error.code === 11000) {
      return res.status(409).json({ 
        message: "User with this email or username already exists" 
      });
    }
    res.status(500).json({ message: "Server error during registration" });
  }
};

// LOGIN --------------------------------
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const tokenPayload = {
      id: user._id.toString(),
      username: user.username,
      email: user.email
    };

    // Check if JWT secret exists
    if (!process.env.SESSION_SECRET) {
      throw new Error("JWT secret is not defined");
    }

    const token = jwt.sign(
      tokenPayload, 
      process.env.SESSION_SECRET,
      { expiresIn: '7d' } // Add expiration
    );

    res.status(200).json({
      token,
      user: tokenPayload
    });
  } catch (error: any) {
    res.status(500).json({ message: "Server error during login" });
  }
};