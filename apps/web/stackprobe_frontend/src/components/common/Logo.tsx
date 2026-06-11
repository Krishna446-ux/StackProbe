import React from 'react';
import { Layers } from 'lucide-react';

interface LogoProps {
  iconSize?: number;
  showText?: boolean;
  textSize?: string;
}

export const Logo: React.FC<LogoProps> = ({
  iconSize = 32,
  showText = true,
  textSize = 'text-base',
}) => {
  const inner = Math.round(iconSize * 0.56);
  return (
    <div className="flex items-center gap-2.5 flex-shrink-0">
      <div
        className="rounded-lg bg-green-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-900/40"
        style={{ width: iconSize, height: iconSize }}
      >
        <Layers size={inner} className="text-white" strokeWidth={2.2} />
      </div>
      {showText && (
        <span className={`font-bold text-white tracking-tight ${textSize}`}>
          StackProbe
        </span>
      )}
    </div>
  );
};
