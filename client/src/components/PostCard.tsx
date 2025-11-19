import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import type { Post } from "@shared/schema";
import { Calendar, User as UserIcon } from "lucide-react";
import { format } from "date-fns";

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const formattedDate = format(new Date(post.createdAt), "MMM dd, yyyy");

  return (
    <Link href={`/post/${post.id}`}>
      <div data-testid={`card-post-${post.id}`}>
        <Card className="overflow-hidden hover-elevate transition-all duration-200 h-full flex flex-col cursor-pointer">
          {/* Featured Image */}
          {post.imageUrl ? (
            <div className="aspect-[16/9] w-full overflow-hidden bg-muted">
              <img
                src={post.imageUrl}
                alt={post.title}
                className="w-full h-full object-cover transition-transform duration-200 hover:scale-105"
                data-testid={`img-post-${post.id}`}
              />
            </div>
          ) : (
            <div className="aspect-[16/9] w-full bg-gradient-to-br from-primary/20 via-accent to-muted" />
          )}

          {/* Content */}
          <div className="p-6 flex-1 flex flex-col">
            {/* Title */}
            <h2
              className="text-xl md:text-2xl font-semibold mb-3 line-clamp-2 leading-tight"
              data-testid={`text-post-title-${post.id}`}
            >
              {post.title}
            </h2>

            {/* Excerpt */}
            <p className="text-muted-foreground text-sm md:text-base line-clamp-3 mb-4 leading-relaxed flex-1">
              {post.content}
            </p>

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <UserIcon className="w-4 h-4" />
                <span data-testid={`text-author-${post.id}`}>{post.authorUsername}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span data-testid={`text-date-${post.id}`}>{formattedDate}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Link>
  );
}
