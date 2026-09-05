import React from 'react';

const PLATFORMS = [
  'Instagram',
  'TikTok',
  'YouTube',
  'X · Twitter',
  'Facebook',
  'Telegram',
  'Snapchat',
  'LinkedIn',
  'Discord',
  'Spotify',
  'SoundCloud',
  'Twitch',
  'Pinterest',
  'Threads',
  'WhatsApp',
  'Reddit',
];

/**
 * Trust strip — "Trusted by modern teams" equivalent for PayFollows:
 * the platforms we deliver on, as a quiet static row.
 */
const PlatformsMarquee: React.FC = () => {
  return (
    <section aria-label="Supported platforms" className="px-4 sm:px-6 lg:px-8 py-14">
      <div className="container mx-auto text-center">
        <p className="text-sm text-gray-400">Trusted by creators and resellers everywhere</p>
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 mt-8">
          {PLATFORMS.map((name) => (
            <span key={name} className="text-gray-500 hover:text-gray-300 transition-colors text-sm font-medium">
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PlatformsMarquee;