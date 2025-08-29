import React from 'react';
import { Wallet } from 'lucide-react';
import { Impression } from '../../types/impression';

interface ImpressionSummaryProps {
  impressions: Impression[];
  className?: string;
}

export default function ImpressionSummary({ impressions, className = '' }: ImpressionSummaryProps) {
  if (!impressions || impressions.length === 0) {
    return null;
  }

  const totalPrice = impressions.reduce((sum, imp) => sum + imp.price, 0);
  const count = impressions.length;

  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      <Wallet className="w-4 h-4 text-purple-400" />
      <span className="text-primary-400">
        {count} impressão{count !== 1 ? 'ões' : ''}
      </span>
      <span className="text-primary-300">•</span>
      <span className="font-medium text-purple-400">
        {new Intl.NumberFormat('pt-MZ', {
          style: 'currency',
          currency: 'MZN'
        }).format(totalPrice)}
      </span>
    </div>
  );
}
