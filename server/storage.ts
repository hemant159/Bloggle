import { User } from "./models/User";
import { PostModel } from "./models/post";
import { type InsertUser, type User as UserType, type InsertPost, type UpdatePost, type Post } from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<UserType | undefined>;
  getUserByUsername(username: string): Promise<UserType | undefined>;
  getUserByEmail(email: string): Promise<UserType | undefined>;
  createUser(user: InsertUser): Promise<UserType>;

  // Post operations
  getAllPosts(): Promise<Post[]>;
  getPost(id: string): Promise<Post | undefined>;
  getPostsByAuthor(authorId: string): Promise<Post[]>;
  createPost(post: InsertPost, authorId: string, authorUsername: string): Promise<Post>;
  updatePost(id: string, post: UpdatePost): Promise<Post | undefined>;
  deletePost(id: string): Promise<boolean>;
}

export class MongoStorage implements IStorage {
  // USER METHODS
  async getUser(id: string): Promise<UserType | undefined> {
    const user = await User.findById(id).lean();
    return user ? this.mapUser(user) : undefined;
  }

  async getUserByUsername(username: string): Promise<UserType | undefined> {
    const user = await User.findOne({ username }).lean();
    return user ? this.mapUser(user) : undefined;
  }

  async getUserByEmail(email: string): Promise<UserType | undefined> {
    const user = await User.findOne({ email }).lean();
    return user ? this.mapUser(user) : undefined;
  }

  async createUser(user: InsertUser): Promise<UserType> {
    const newUser = await User.create(user);
    return this.mapUser(newUser.toObject());
  }

  // POST METHODS
  async getAllPosts(): Promise<Post[]> {
    const posts = await PostModel.find().sort({ createdAt: -1 }).lean();
    return posts.map(post => this.mapPost(post));
  }

  async getPost(id: string): Promise<Post | undefined> {
    const post = await PostModel.findById(id).lean();
    return post ? this.mapPost(post) : undefined;
  }

  async getPostsByAuthor(authorId: string): Promise<Post[]> {
    const posts = await PostModel.find({ authorId }).sort({ createdAt: -1 }).lean();
    return posts.map(post => this.mapPost(post));
  }

  async createPost(insertPost: InsertPost, authorId: string, authorUsername: string): Promise<Post> {
    const newPost = await PostModel.create({
      ...insertPost,
      authorId,
      authorUsername,
    });
    return this.mapPost(newPost.toObject());
  }

  async updatePost(id: string, updatePost: UpdatePost): Promise<Post | undefined> {
    const updatedPost = await PostModel.findByIdAndUpdate(
      id,
      { 
        ...updatePost,
        updatedAt: new Date()
      },
      { new: true }
    ).lean();
    
    return updatedPost ? this.mapPost(updatedPost) : undefined;
  }

  async deletePost(id: string): Promise<boolean> {
    const result = await PostModel.findByIdAndDelete(id);
    return result !== null;
  }

  // Mapping helpers
  private mapUser(user: any): UserType {
    return {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      password: user.password
    };
  }

  private mapPost(post: any): Post {
    return {
      id: post._id.toString(),
      title: post.title,
      content: post.content,
      imageUrl: post.imageUrl || null,
      authorId: post.authorId,
      authorUsername: post.authorUsername,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString()
    };
  }
}

// CHANGE THIS TO USE MONGODB
export const storage = new MongoStorage();