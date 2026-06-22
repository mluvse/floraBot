export default function FloraLogo({ size = 48, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="FloraBot Logo"
    >
      <defs>
        <radialGradient id="logoBg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#dcfce7" />
          <stop offset="100%" stopColor="#16a34a" />
        </radialGradient>
        <radialGradient id="logoBloom" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fce7f3" />
          <stop offset="100%" stopColor="#f9a8d4" />
        </radialGradient>
      </defs>
      {/* Background circle */}
      <circle cx="32" cy="32" r="30" fill="url(#logoBg)" />
      {/* Trunk */}
      <path d="M29 55 Q32 45 35 55 Q32 42 29 55" fill="#7d5c38" />
      <rect x="30" y="38" width="4" height="18" rx="2" fill="#7d5c38" />
      {/* Foliage */}
      <circle cx="32" cy="28" r="13" fill="#15803d" />
      <circle cx="21" cy="33" r="9" fill="#16a34a" />
      <circle cx="43" cy="33" r="9" fill="#16a34a" />
      <circle cx="32" cy="18" r="10" fill="#22c55e" />
      {/* Highlight */}
      <ellipse cx="28" cy="16" rx="5" ry="3" fill="#4ade80" opacity="0.5" />
      {/* Blossoms - petals */}
      {/* Blossom 1 */}
      <circle cx="24" cy="26" r="4" fill="url(#logoBloom)" opacity="0.9" />
      <circle cx="24" cy="26" r="1.5" fill="#ec4899" />
      {/* Blossom 2 */}
      <circle cx="38" cy="22" r="4" fill="url(#logoBloom)" opacity="0.9" />
      <circle cx="38" cy="22" r="1.5" fill="#db2777" />
      {/* Blossom 3 */}
      <circle cx="32" cy="34" r="3.5" fill="url(#logoBloom)" opacity="0.85" />
      <circle cx="32" cy="34" r="1.2" fill="#ec4899" />
      {/* Blossom 4 */}
      <circle cx="43" cy="30" r="3" fill="url(#logoBloom)" opacity="0.8" />
      <circle cx="43" cy="30" r="1.1" fill="#be185d" />
      {/* Small petal dots */}
      <circle cx="19" cy="30" r="2.5" fill="#fce7f3" opacity="0.85" />
      <circle cx="19" cy="30" r="1" fill="#f472b6" />
      {/* Bot eye / spark */}
      <circle cx="38" cy="14" r="2" fill="#fef08a" opacity="0.9" />
      <circle cx="38" cy="14" r="0.8" fill="#ca8a04" />
    </svg>
  );
}
