export function LandingMascot() {
  return (
    <svg
      className="landing-mascot"
      viewBox="0 0 280 300"
      fill="none"
      role="img"
      aria-label="PayFollows purple mascot holding a megaphone"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="mascot-body" x1="67" y1="66" x2="215" y2="243" gradientUnits="userSpaceOnUse">
          <stop stopColor="#C4B5FD" />
          <stop offset=".48" stopColor="#9B78F5" />
          <stop offset="1" stopColor="#6D35D8" />
        </linearGradient>
        <linearGradient id="mascot-belly" x1="106" y1="121" x2="183" y2="227" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E9E2FF" />
          <stop offset="1" stopColor="#B9A1FF" />
        </linearGradient>
        <linearGradient id="mascot-megaphone" x1="20" y1="99" x2="98" y2="150" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E5DCFF" />
          <stop offset="1" stopColor="#8B5CF6" />
        </linearGradient>
        <filter id="mascot-shadow" x="0" y="0" width="280" height="300" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="10" />
        </filter>
      </defs>
      <ellipse cx="147" cy="276" rx="78" ry="12" fill="#4C1D95" fillOpacity=".28" filter="url(#mascot-shadow)" />
      <path d="M109 211c-12 19-17 39-8 52 8 11 27 10 38-1l13-18M171 211c13 18 19 38 10 51-8 11-27 10-38-1l-13-18" fill="url(#mascot-body)" />
      <path d="M95 143c-19-7-35-2-40 10-5 13 6 28 23 34l27 9 12-36-22-17ZM187 143c19-7 35-2 40 10 5 13-6 28-23 34l-27 9-12-36 22-17Z" fill="url(#mascot-body)" />
      <path d="M140 41c-11-13-31-12-38 3-4 9-3 18-1 25-24 9-41 32-41 60v67c0 33 27 59 60 59h40c33 0 60-26 60-59v-67c0-28-19-52-45-61 2-14-3-29-15-33-8-3-15 0-20 6Z" fill="url(#mascot-body)" />
      <path d="M89 137c0-27 22-49 49-49h5c27 0 49 22 49 49v42c0 26-21 47-47 47h-9c-26 0-47-21-47-47v-42Z" fill="url(#mascot-belly)" fillOpacity=".56" />
      <path d="M202 103c13 8 22 23 23 39" stroke="#EDE9FE" strokeOpacity=".55" strokeWidth="5" strokeLinecap="round" />
      <path d="M76 160c-13 2-23 12-22 24 1 10 9 17 21 20" stroke="#DDD2FF" strokeOpacity=".55" strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="119" cy="136" rx="11" ry="14" fill="white" />
      <ellipse cx="163" cy="136" rx="11" ry="14" fill="white" />
      <ellipse cx="122" cy="138" rx="5.5" ry="8" fill="#34205D" />
      <ellipse cx="166" cy="138" rx="5.5" ry="8" fill="#34205D" />
      <circle cx="124" cy="135" r="2" fill="white" />
      <circle cx="168" cy="135" r="2" fill="white" />
      <path d="M133 162c5 6 12 9 19 9s14-3 19-9" stroke="#56349B" strokeWidth="4" strokeLinecap="round" />
      <path d="M191 185c7-12 20-17 31-11 10 6 11 21 2 31-7 8-17 11-27 7" fill="#9FE870" />
      <path d="M50 120 23 105c-6-3-13 1-13 8v39c0 7 7 11 13 8l27-15 35 3c7 1 13-5 13-12v-6c0-7-6-13-13-12l-35 2Z" fill="url(#mascot-megaphone)" stroke="#E9E2FF" strokeOpacity=".72" strokeWidth="3" />
      <path d="m50 120 1 25" stroke="#6D35D8" strokeWidth="4" strokeLinecap="round" />
      <path d="M98 124h13v28H98c-7 0-12-5-12-12v-4c0-7 5-12 12-12Z" fill="#6D35D8" />
      <path d="m10 110-8-7M9 145l-8 5M28 96l-2-10" stroke="#C4B5FD" strokeWidth="3" strokeLinecap="round" />
      <path d="M89 92c9-12 22-19 37-20" stroke="white" strokeOpacity=".35" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
