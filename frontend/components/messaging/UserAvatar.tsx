'use client';

import React from 'react';

interface UserAvatarProps {
  firstName: string;
  lastName: string;
  role?: 'user' | 'admin';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const roleColors: Record<string, string> = {
  admin: 'bg-red-100 text-red-700',
  user: 'bg-blue-100 text-blue-700',
};

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
};

export function UserAvatar({
  firstName,
  lastName,
  role = 'user',
  size = 'md',
  className = '',
}: UserAvatarProps) {
  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
  const colorClass = roleColors[role] ?? roleColors.user;

  return (
    <div
      className={`${sizeClasses[size]} ${colorClass} rounded-full flex items-center justify-center font-semibold shrink-0 ${className}`}
      aria-label={`${firstName} ${lastName}`}
    >
      {initials}
    </div>
  );
}
