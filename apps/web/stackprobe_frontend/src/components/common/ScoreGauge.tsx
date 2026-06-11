import React from 'react';

interface ScoreGaugeProps {
  score: number;
  title: string;
  colorClass: string;
  trackColor: string;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score, title, colorClass, trackColor }) => {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center p-4 rounded-xl border border-zinc-850 bg-zinc-900/20 backdrop-blur-md flex-1">
      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-2">{title}</span>
      <div className="relative flex items-center justify-center">
        <svg className="w-20 h-20 transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="40"
            cy="40"
            r={radius}
            className={trackColor}
            strokeWidth="6"
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx="40"
            cy="40"
            r={radius}
            className={`${colorClass} transition-all duration-500 ease-out`}
            strokeWidth="6"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute text-lg font-bold font-mono text-zinc-100">{score}</span>
      </div>
    </div>
  );
};
