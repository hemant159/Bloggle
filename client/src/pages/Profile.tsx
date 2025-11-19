import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/PostCard";
import { PostGridSkeleton } from "@/components/LoadingSkeleton";
import { PenSquare, FileText } from "lucide-react";
import type { Post } from "@shared/schema";

export default function Profile() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const { data: posts, isLoading: postsLoading } = useQuery<Post[]>({
    queryKey: ["/api/posts"],
    enabled: isAuthenticated,
  });

  // Redirect if not authenticated (in useEffect to avoid render loops)
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, authLoading, setLocation]);

  // Show nothing while checking auth
  if (authLoading || !isAuthenticated) {
    return null;
  }

  // Filter posts by current user
  const userPosts = posts?.filter((post) => post.authorId === user?.id) || [];

  return (
    <div className="min-h-screen">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-primary/10 via-accent/30 to-background border-b">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-16">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2" data-testid="text-username">
                {user?.username}
              </h1>
              <p className="text-muted-foreground text-base md:text-lg" data-testid="text-email">
                {user?.email}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {userPosts.length} {userPosts.length === 1 ? "post" : "posts"} published
              </p>
            </div>
            <Button
              size="lg"
              onClick={() => setLocation("/create")}
              className="w-full md:w-auto"
              data-testid="button-create-post"
            >
              <PenSquare className="w-5 h-5 mr-2" />
              Create New Post
            </Button>
          </div>
        </div>
      </div>

      {/* User's Posts */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-16">
        <h2 className="text-2xl md:text-3xl font-semibold mb-8">Your Posts</h2>

        {postsLoading ? (
          <PostGridSkeleton count={3} />
        ) : userPosts.length === 0 ? (
          <div className="text-center py-16 md:py-24">
            <FileText className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-2xl md:text-3xl font-semibold mb-2">No posts yet</h3>
            <p className="text-muted-foreground text-base md:text-lg mb-6">
              Share your first story with the world!
            </p>
            <Button onClick={() => setLocation("/create")} data-testid="button-create-first-post">
              <PenSquare className="w-4 h-4 mr-2" />
              Create Your First Post
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {userPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
