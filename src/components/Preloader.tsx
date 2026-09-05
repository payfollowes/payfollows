import React, { useEffect, useState } from 'react';

// Replay the entry sequence once per browser session, not on every mount.
let playedThisSession = false;

const BRAND = 'PayFollows';

/**
 * Entry sequence. Waits for fonts + a minimum dwell, then sweeps the whole
 * panel upward (transform-only exit). Skipped entirely for reduced-motion
 * users and re-runs of the session.
 */
const Preloader: React.FC = () => {
  const [exiting, setExiting] = useState(false);
  const [gone, setGone] = useState(playedThisSession);

  useEffect(() => {
    if (playedThisSession) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      playedThisSession = true;
      setGone(true);
      return;
    }

    const holdForFonts = document.fonts?.ready ?? Promise.resolve();
    const minDwell = new Promise((resolve) => setTimeout(resolve, 1100));
    const failSafe = new Promise((resolve) => setTimeout(resolve, 2200));

    Promise.race([Promise.all([holdForFonts, minDwell]), failSafe]).then(() => {
      playedThisSession = true;
      setExiting(true);
      // Unmount once the exit sweep completes.
      setTimeout(() => setGone(true), 750);
    });
  }, []);

  if (gone) return null;

  return (
    <div className={`pf-preloader${exiting ? ' pf-preloader-exit' : ''}`} aria-hidden="true">
      <div className="pf-preloader-logo flex flex-col items-center">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2 21 7v10l-9 5-9-5V7l9-5Z"
            stroke="#8B5CF6"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M12 12 21 7M12 12 3 7M12 12v10"
            stroke="#8B5CF6"
            strokeWidth="1.1"
            strokeLinejoin="round"
            opacity="0.5"
          />
        </svg>
        <div className="mt-5 text-2xl font-bold tracking-tight text-white">
          {BRAND.split('').map((letter, index) => (
            <span
              key={`${letter}-${index}`}
              className="pf-preloader-letter"
              style={{ '--letter-index': index } as React.CSSProperties}
            >
              {letter}
            </span>
          ))}
        </div>
        <div className="pf-preloader-bar">
          <span />
        </div>
      </div>
    </div>
  );
};

export default Preloader;