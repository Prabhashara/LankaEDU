import { useEffect, useRef, useState } from "react";

export default function CountdownTimer({ durationMinutes, onTimeUp, isActive }) {
  const [totalSeconds, setTotalSeconds] = useState(durationMinutes ? Math.round(durationMinutes * 60) : 0);
  const previousDuration = useRef(durationMinutes);
  const hasTriggeredTimeUp = useRef(false);

  useEffect(() => {
    if (durationMinutes && durationMinutes !== previousDuration.current) {
      setTotalSeconds(Math.round(durationMinutes * 60));
      previousDuration.current = durationMinutes;
      hasTriggeredTimeUp.current = false;
    }
  }, [durationMinutes]);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const interval = setInterval(() => {
      setTotalSeconds((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive]);

  useEffect(() => {
    if (totalSeconds === 0 && isActive && !hasTriggeredTimeUp.current) {
      hasTriggeredTimeUp.current = true;
      onTimeUp?.();
    }
  }, [totalSeconds, isActive, onTimeUp]);

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const isWarning = totalSeconds <= 300;
  const isCritical = totalSeconds <= 60;
  const timeClass = isCritical ? "critical" : isWarning ? "warning" : "";

  return (
    <div className={`countdown-timer ${timeClass}`}>
      <div className="timer-display">
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </div>
      {isCritical && <div className="timer-label">Time is running out!</div>}
    </div>
  );
}
