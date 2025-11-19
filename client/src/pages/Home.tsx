import { useQuery } from "@tanstack/react-query";
import { PostCard } from "@/components/PostCard";
import { PostGridSkeleton } from "@/components/LoadingSkeleton";
import { FileText, AlertCircle } from "lucide-react";
import type { Post } from "@shared/schema";

export default function Home() {
  const { data: posts, isLoading, error } = useQuery<Post[]>({
    queryKey: ["/api/posts"],
  });

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/10 via-accent/30 to-background border-b">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-16 lg:py-20">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 leading-tight">
              Welcome to BlogHub
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              Discover stories, thinking, and expertise from writers on any topic.
            </p>
          </div>
        </div>
      </div>

      {/* Posts Grid Section */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-16">
        {isLoading ? (
          <PostGridSkeleton count={6} />
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-destructive mb-4">
              <AlertCircle className="w-12 h-12 mx-auto mb-2" />
              <p className="text-lg font-medium">Failed to load posts</p>
              <p className="text-sm text-muted-foreground">
                {error instanceof Error ? error.message : "Please try again later"}
              </p>
            </div>
          </div>
        ) : !posts || posts.length === 0 ? (
          <div className="text-center py-16 md:py-24">
            <FileText className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl md:text-3xl font-semibold mb-2">No posts yet</h2>
            <p className="text-muted-foreground text-base md:text-lg">
              Be the first to share your thoughts!
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-2xl md:text-3xl font-semibold mb-8">Latest Posts</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
