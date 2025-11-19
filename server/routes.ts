import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import { registerSchema, loginSchema, insertPostSchema, updatePostSchema } from "@shared/schema";
import type { User } from "@shared/schema";

const JWT_SECRET = process.env.SESSION_SECRET;
if (!JWT_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required");
}
const SALT_ROUNDS = 10;

interface AuthRequest extends Request {
  user?: User;
}

async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.cookies.token;

  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await storage.getUser(decoded.userId);
    
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(403).json({ error: "Invalid or expired token" });
    return;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Enable cookie parser
  app.use(cookieParser());

  // ============ Auth Routes ============

  // Register
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const validatedData = registerSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        res.status(400).json({ error: "Email already registered" });
        return;
      }

      const existingUsername = await storage.getUserByUsername(validatedData.username);
      if (existingUsername) {
        res.status(400).json({ error: "Username already taken" });
        return;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.password, SALT_ROUNDS);

      // Create user
      const user = await storage.createUser({
        username: validatedData.username,
        email: validatedData.email,
        password: hashedPassword,
      });

      // Create JWT token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

      // Set HTTP-only cookie
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json({ user: userWithoutPassword });
    } catch (error: any) {
      if (error.name === "ZodError") {
        res.status(400).json({ error: error.errors[0].message });
        return;
      }
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const validatedData = loginSchema.parse(req.body);

      const user = await storage.getUserByEmail(validatedData.email);
      if (!user) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      const isValidPassword = await bcrypt.compare(validatedData.password, user.password);
      if (!isValidPassword) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      const { password: _, ...userWithoutPassword } = user;
      res.status(200).json({ user: userWithoutPassword });
    } catch (error: any) {
      if (error.name === "ZodError") {
        res.status(400).json({ error: error.errors[0].message });
        return;
      }
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const { password: _, ...userWithoutPassword } = req.user;
    res.status(200).json({ user: userWithoutPassword });
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    res.status(200).json({ message: "Logged out successfully" });
  });

  // Get all posts
  app.get("/api/posts", async (req: Request, res: Response) => {
    try {
      const posts = await storage.getAllPosts();
      res.status(200).json(posts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch posts" });
    }
  });

  // Get single post
  app.get("/api/posts/:id", async (req: Request, res: Response) => {
    try {
      const post = await storage.getPost(req.params.id);
      if (!post) {
        res.status(404).json({ error: "Post not found" });
        return;
      }
      res.status(200).json(post);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch post" });
    }
  });

  // Create post (protected)
  app.post("/api/posts", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Authentication required" });
        return;
      }

      const validatedData = insertPostSchema.parse(req.body);

      const post = await storage.createPost(
        validatedData,
        req.user.id,
        req.user.username
      );

      res.status(201).json(post);
    } catch (error: any) {
      if (error.name === "ZodError") {
        res.status(400).json({ error: error.errors[0].message });
        return;
      }
      res.status(500).json({ error: "Failed to create post" });
    }
  });

  // Update post (protected)
  app.put("/api/posts/:id", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Authentication required" });
        return;
      }

      const existingPost = await storage.getPost(req.params.id);
      if (!existingPost) {
        res.status(404).json({ error: "Post not found" });
        return;
      }

      // Check if user is the author
      if (existingPost.authorId !== req.user.id) {
        res.status(403).json({ error: "You can only edit your own posts" });
        return;
      }

      const validatedData = updatePostSchema.parse(req.body);
      const updatedPost = await storage.updatePost(req.params.id, validatedData);

      if (!updatedPost) {
        res.status(404).json({ error: "Post not found" });
        return;
      }

      res.status(200).json(updatedPost);
    } catch (error: any) {
      if (error.name === "ZodError") {
        res.status(400).json({ error: error.errors[0].message });
        return;
      }
      res.status(500).json({ error: "Failed to update post" });
    }
  });

  // Delete post (protected)
  app.delete("/api/posts/:id", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Authentication required" });
        return;
      }

      const existingPost = await storage.getPost(req.params.id);
      if (!existingPost) {
        res.status(404).json({ error: "Post not found" });
        return;
      }

      // Check if user is the author
      if (existingPost.authorId !== req.user.id) {
        res.status(403).json({ error: "You can only delete your own posts" });
        return;
      }

      const deleted = await storage.deletePost(req.params.id);
      if (!deleted) {
        res.status(404).json({ error: "Post not found" });
        return;
      }

      res.status(200).json({ message: "Post deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete post" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
