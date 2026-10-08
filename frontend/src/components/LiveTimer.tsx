import React, { useState, useEffect } from 'react';

interface LiveTimerProps {
  startTime: string;
  isCountDown?: boolean;
  plannedEndTime?: string;
  className?: string;
}

export const LiveTimer: React.FC<LiveTimerProps> = ({
  startTime,
  isCountDown = false,
  plannedEndTime,
  className = ''
}) => {
  const [displayTime, setDisplayTime] = useState<string>('00:00:00');
  const [isUrgent, setIsUrgent] = useState<boolean>(false);

  useEffect(() => {
    const calculate = () => {
      const now = Date.now();
      const start = new Date(startTime).getTime();

      if (isCountDown && plannedEndTime) {
        const end = new Date(plannedEndTime).getTime();
        const diff = end - now;

        if (diff <= 0) {
          setDisplayTime('00:00:00 (Vaqt tugadi)');
          setIsUrgent(true);
          return;
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        if (diff < 5 * 60 * 1000) {
          setIsUrgent(true);
        }

        setDisplayTime(
          `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
        );
      } else {
        const diff = Math.max(0, now - start);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        setDisplayTime(
          `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
        );
      }
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [startTime, isCountDown, plannedEndTime]);

  return (
    <span className={`font-mono tracking-wider font-semibold ${isUrgent ? 'text-rose-400 animate-pulse' : ''} ${className}`}>
      {displayTime}
    </span>
  );
};
