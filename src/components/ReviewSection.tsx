"use client";

import { useState } from "react";
import { Star, ThumbsUp, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import type { Review } from "@/types/skill";

interface ReviewSectionProps {
  skillId: string;
  rating?: number;
  reviewCount?: number;
  reviews?: Review[];
}

function StarDisplay({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = rating >= star;
        const half = !filled && rating >= star - 0.5;
        return (
          <Star
            key={star}
            size={size}
            className={filled || half ? "text-[#ffd700]" : "text-[#2e2e4e]"}
            fill={filled ? "#ffd700" : half ? "url(#half)" : "none"}
          />
        );
      })}
    </div>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            size={24}
            className={(hover || value) >= star ? "text-[#ffd700]" : "text-[#2e2e4e]"}
            fill={(hover || value) >= star ? "#ffd700" : "none"}
          />
        </button>
      ))}
    </div>
  );
}

function RatingBar({ star, count, total }: { star: number; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-[#8b8ba7] w-4 text-right">{star}</span>
      <Star size={11} className="text-[#ffd700]" fill="#ffd700" />
      <div className="flex-1 h-1.5 rounded-full bg-[#1e1e2e] overflow-hidden">
        <div
          className="h-full rounded-full bg-[#ffd700] transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[#4a4a5a] w-6 text-right">{count}</span>
    </div>
  );
}

export function ReviewSection({ skillId, rating = 0, reviewCount = 0, reviews = [] }: ReviewSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [localReviews, setLocalReviews] = useState<Review[]>(reviews);
  const [helpedIds, setHelpedIds] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);

  // Distribution (mock based on existing reviews)
  const dist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: localReviews.filter((r) => Math.round(r.rating) === star).length,
  }));

  const handleSubmit = () => {
    if (newRating === 0 || comment.trim().length < 10) return;
    const review: Review = {
      id: `r-new-${Date.now()}`,
      skill_id: skillId,
      user_id: "me",
      username: "you",
      avatar_url: null,
      rating: newRating,
      comment: comment.trim(),
      created_at: new Date().toISOString(),
      helpful_count: 0,
    };
    setLocalReviews([review, ...localReviews]);
    setSubmitted(true);
    setShowForm(false);
    setComment("");
    setNewRating(0);
  };

  const toggleHelpful = (id: string) => {
    setHelpedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setLocalReviews((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, helpful_count: helpedIds.has(id) ? r.helpful_count - 1 : r.helpful_count + 1 }
          : r
      )
    );
  };

  const visibleReviews = showAll ? localReviews : localReviews.slice(0, 3);
  const avgRating = localReviews.length > 0
    ? localReviews.reduce((a, r) => a + r.rating, 0) / localReviews.length
    : rating;

  return (
    <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-[#1e1e2e] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare size={16} className="text-[#ffd700]" />
          <span className="text-sm font-semibold text-[#f8f8ff]">Reviews</span>
          <span className="text-xs text-[#8b8ba7]">({localReviews.length + reviewCount - reviews.length} total)</span>
        </div>
        {!submitted && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-xs px-3 py-1.5 rounded-lg bg-[#1e1e2e] text-[#8b8ba7] hover:text-[#f8f8ff] transition-colors border border-[#2e2e4e]"
          >
            {showForm ? "Cancel" : "Write a review"}
          </button>
        )}
      </div>

      <div className="p-5">
        {/* Summary row */}
        <div className="flex gap-6 mb-5">
          <div className="flex flex-col items-center justify-center">
            <span className="text-5xl font-mono font-bold text-[#f8f8ff]">
              {avgRating.toFixed(1)}
            </span>
            <StarDisplay rating={avgRating} size={14} />
            <span className="text-xs text-[#8b8ba7] mt-1">
              {localReviews.length + (reviewCount - reviews.length)} reviews
            </span>
          </div>
          <div className="flex-1 space-y-1.5">
            {dist.map(({ star, count }) => (
              <RatingBar
                key={star}
                star={star}
                count={count + (star === 5 ? Math.max(0, reviewCount - reviews.length - 2) : 0)}
                total={localReviews.length + Math.max(0, reviewCount - reviews.length)}
              />
            ))}
          </div>
        </div>

        {/* Write review form */}
        {showForm && (
          <div className="mb-5 p-4 rounded-xl bg-[#0e0e16] border border-[#2e2e4e]">
            <p className="text-sm font-semibold text-[#f8f8ff] mb-3">Your rating</p>
            <StarPicker value={newRating} onChange={setNewRating} />
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this skill (min 10 chars)…"
              rows={3}
              className="mt-3 w-full bg-[#12121a] border border-[#1e1e2e] rounded-xl px-4 py-3 text-sm text-[#f8f8ff] placeholder-[#4a4a5a] focus:border-[#7c3aed] focus:outline-none transition-colors resize-none"
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={handleSubmit}
                disabled={newRating === 0 || comment.trim().length < 10}
                className="px-4 py-2 rounded-lg bg-[#7c3aed] text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#6d28d9] transition-colors"
              >
                Submit Review
              </button>
            </div>
          </div>
        )}

        {submitted && (
          <div className="mb-5 p-3 rounded-xl bg-[#00d97e10] border border-[#00d97e30] text-[#00d97e] text-sm flex items-center gap-2">
            <Star size={14} fill="#00d97e" />
            Thanks! Your review has been posted.
          </div>
        )}

        {/* Review list */}
        <div className="space-y-4">
          {visibleReviews.map((review) => (
            <div key={review.id} className="border-b border-[#1e1e2e] last:border-0 pb-4 last:pb-0">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#60efff] flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {review.username[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-[#f8f8ff]">{review.username}</span>
                    <StarDisplay rating={review.rating} size={12} />
                    <span className="text-xs text-[#4a4a5a] ml-auto">
                      {new Date(review.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                  <p className="text-sm text-[#8b8ba7] leading-relaxed">{review.comment}</p>
                  <button
                    onClick={() => toggleHelpful(review.id)}
                    className={`mt-2 flex items-center gap-1.5 text-xs transition-colors ${
                      helpedIds.has(review.id) ? "text-[#7c3aed]" : "text-[#4a4a5a] hover:text-[#8b8ba7]"
                    }`}
                  >
                    <ThumbsUp size={12} />
                    Helpful ({review.helpful_count + (helpedIds.has(review.id) ? 1 : 0)})
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {localReviews.length > 3 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="mt-4 w-full flex items-center justify-center gap-1.5 text-sm text-[#8b8ba7] hover:text-[#f8f8ff] transition-colors"
          >
            {showAll ? (
              <><ChevronUp size={15} /> Show less</>
            ) : (
              <><ChevronDown size={15} /> Show all {localReviews.length} reviews</>
            )}
          </button>
        )}

        {localReviews.length === 0 && !showForm && (
          <div className="text-center py-6 text-[#4a4a5a] text-sm">
            <MessageSquare size={24} className="mx-auto mb-2 opacity-40" />
            No reviews yet. Be the first to review this skill.
          </div>
        )}
      </div>
    </div>
  );
}
