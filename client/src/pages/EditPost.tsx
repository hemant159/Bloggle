import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import type { Post } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";

export default function EditPost() {
  const [, params] = useRoute("/edit/:id");
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const postId = params?.id;

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    imageUrl: "",
  });

  // Redirect if not authenticated (in useEffect to avoid render loops)
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, authLoading, setLocation]);

  const { data: post, isLoading: postLoading } = useQuery<Post>({
    queryKey: ["/api/posts", postId],
    enabled: !!postId && isAuthenticated,
  });

  useEffect(() => {
    if (post) {
      // Check if user is the author
      if (post.authorId !== user?.id) {
        toast({
          variant: "destructive",
          title: "Access denied",
          description: "You can only edit your own posts.",
        });
        setLocation("/");
        return;
      }

      setFormData({
        title: post.title,
        content: post.content,
        imageUrl: post.imageUrl || "",
      });
    }
  }, [post, user, setLocation, toast]);

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("PUT", `/api/posts/${postId}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Post updated!",
        description: "Your changes have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts", postId] });
      setLocation(`/post/${postId}`);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error.message || "Failed to update post. Please try again.",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  // Show nothing while checking auth
  if (authLoading || !isAuthenticated) {
    return null;
  }

  if (postLoading) {
    return (
      <div className="min-h-screen">
        <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12">
          <Skeleton className="h-10 w-32 mb-8" />
          <Card className="p-6 md:p-8 lg:p-12">
            <Skeleton className="h-10 w-64 mb-8" />
            <div className="space-y-6">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => setLocation(`/post/${postId}`)}
          className="mb-6 md:mb-8"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card className="p-6 md:p-8 lg:p-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-8">Edit Post</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                type="text"
                placeholder="Enter your post title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                disabled={updateMutation.isPending}
                className="h-12 text-base md:text-lg"
                data-testid="input-title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL (optional)</Label>
              <Input
                id="imageUrl"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                disabled={updateMutation.isPending}
                className="h-12"
                data-testid="input-image-url"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                placeholder="Write your post content here..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                required
                disabled={updateMutation.isPending}
                className="min-h-[300px] resize-y text-base leading-relaxed"
                data-testid="textarea-content"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="submit"
                className="w-full sm:w-auto h-12 px-8"
                disabled={updateMutation.isPending}
                data-testid="button-submit"
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation(`/post/${postId}`)}
                disabled={updateMutation.isPending}
                className="w-full sm:w-auto h-12 px-8"
                data-testid="button-cancel"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
