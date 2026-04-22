'use client';

import Link from 'next/link';
import { Plus, Star } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { ReviewsList } from '@/components/user/ReviewsList';
import { Suspense } from 'react';

export default function UserReviewsPage() {
  const { user, isAuthenticated, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'user') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
        <Star className="w-16 h-16 text-blue-400/50 mb-5" />
        <h1 className="text-2xl font-black text-white mb-2">Access Denied</h1>
        <p className="text-blue-200/50 mb-6">
          Reviews are only available to verified users.
        </p>
        <Link
          href="/"
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          Connect Wallet
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Reviews
          </h1>
          <p className="text-blue-200/50 mt-1">Your review history.</p>
        </div>
        <Link
          href="/user/reviews/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" /> Write Review
        </Link>
      </div>

      <Suspense
        fallback={
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-12 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        }
      >
        <ReviewsList />
      </Suspense>
    </div>
  );
}
