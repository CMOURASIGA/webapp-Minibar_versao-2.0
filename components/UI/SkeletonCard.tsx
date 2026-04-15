import React from 'react';

type Variant = 'purchase' | 'product' | 'customer' | 'metric';

interface SkeletonCardProps {
  variant?: Variant;
  count?: number;
}

const Block: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-[#E8ECF2] rounded animate-pulse ${className}`} />
);

const SkeletonItem: React.FC<{ variant: Variant }> = ({ variant }) => {
  if (variant === 'metric') {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-3">
        <Block className="h-3 w-20 mb-2" />
        <Block className="h-6 w-24" />
      </div>
    );
  }

  if (variant === 'product') {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-3">
        <Block className="h-6 w-6 mb-3 rounded-full" />
        <Block className="h-3 w-24 mb-2" />
        <Block className="h-4 w-16 mb-3" />
        <Block className="h-9 w-full rounded-lg" />
      </div>
    );
  }

  if (variant === 'customer') {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-3">
        <Block className="h-4 w-40 mb-2" />
        <Block className="h-3 w-28 mb-3" />
        <Block className="h-8 w-24 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3">
      <div className="flex items-start justify-between gap-2 mb-2">
        <Block className="h-4 w-36" />
        <Block className="h-5 w-14 rounded-full" />
      </div>
      <Block className="h-3 w-24 mb-2" />
      <Block className="h-4 w-20" />
    </div>
  );
};

const SkeletonCard: React.FC<SkeletonCardProps> = ({ variant = 'purchase', count = 3 }) => {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, idx) => (
        <SkeletonItem key={`${variant}-${idx}`} variant={variant} />
      ))}
    </div>
  );
};

export default SkeletonCard;
