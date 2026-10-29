// Content mirrored from the live growfollows.com landing page
// Images are served from the live GrowFollows CDN (raster images go through the
// Next.js image optimizer so they arrive as compressed, resized WebP).
const ORIGIN = "https://growfollows.com";
export const A = (p: string, w = 1080) =>
  /\.svg$/i.test(p) ? `${ORIGIN}/assets/${p}` : `${ORIGIN}/_next/image?url=${encodeURIComponent(`/assets/${p}`)}&w=${w}&q=75`;
const CDN = (f: string, w = 828) => `${ORIGIN}/_next/image?url=${encodeURIComponent(`https://cdn.growfollows.com/media/root/${f}`)}&w=${w}&q=75`;

export const links = { signup: "https://growfollows.com/signup", signin: "https://growfollows.com/signin" };

export const navServices = [
  ["All Services", "services/facebook.png"],
  ["Instagram Services", "services/instagram.png"],
  ["Facebook Services", "services/facebook.png"],
  ["Twitter (X) Services", "services/twitter.png"],
  ["YouTube Services", "services/youtube.png"],
  ["Spotify Services", "services/spotify.png"],
  ["TikTok Services", "services/tiktok.png"],
  ["Telegram Services", "services/telegram.png"],
  ["WhatsApp Services", "smm-services/icon-whatsapp.png"],
  ["Shopee Services", "smm-services/icon-shopee.png"],
  ["SoundCloud Services", "services/soundcloud.png"],
  ["LinkedIn Services", "platforms/icon-linkedin.png"],
  ["Pinterest Services", "smm-services/icon-pinterest.png"],
  ["Snapchat Services", "smm-services/icon-snapchat.png"],
  ["Threads Services", "smm-services/icon-threads.png"],
  ["Reddit Services", "smm-services/icon-reddit.png"],
  ["Twitch Services", "smm-services/icon-twitch.png"],
] as const;

export const areaCountries = [
  "Vietnam", "UK", "Thailand", "Pakistan", "Nigeria", "Indonesia", "India", "Egypt", "Brazil", "Bangladesh", "Philippines", "Malaysia",
  "Turkey", "Kenya", "Germany", "France", "USA", "Morocco", "Nepal", "Australia", "Mexico", "South Africa", "Canada", "Saudi Arabia", "UAE",
];
export const flag = (c: string) => A(`worldwide/flag-${c.toLowerCase().replace(/ /g, "-")}.png`, 96);

export const companyLinks = [
  "How It Works", "Our Story", "Contact Us", "Cheap SMM Panel", "Reseller SMM Panel", "Child Panel", "SMM Panel bKash", "Wholesale SMM Panel",
  "White Label SMM Panel", "Safe SMM Panel", "Premium SMM Panel", "Easy SMM Panel", "Fast SMM Panel", "Global SMM Panel",
];

export const heroSocials = ["facebook", "instagram", "linkdein", "spotify", "telegram", "tiktok"].map((n) => A(`home/${n}-threed.webp`, 128));

export const customerReviews = [
  { quote: "I wanted my store profiles to look more trustworthy before running ads. GrowFollows delivered exactly what I needed. The ordering process was simple, and results started showing quickly.", name: "Arif H.", role: "Ecommerce Business Owner, Dhaka", img: "arif-h" },
  { quote: "As a growing creator, first impressions matter. GrowFollows helped my profiles look more established, and I noticed more organic engagement after staying active with my content.", name: "Nusrat J.", role: "Fashion Content Creator", img: "nusrat-j" },
  { quote: "We manage several social accounts for international clients. GrowFollows has become one of our preferred SMM panels because of its reliable services, competitive pricing, and reseller-friendly dashboard.", name: "Michael R.", role: "Digital Marketing Agency", img: "michael-r" },
  { quote: "Our restaurant depends heavily on social media marketing. Stronger social proof improved customer confidence and helped our profiles appear more professional.", name: "Fahim A.", role: "Restaurant Owner, Chattogram", img: "fahim-a" },
  { quote: "I've worked with several SMM panels over the years. GrowFollows offers stable service quality, fast processing, and excellent support for reseller businesses.", name: "Sarah L.", role: "Social Media Reseller", img: "sarah-l" },
  { quote: "Adding funds with bKash was easy, and placing orders from the dashboard took only a few minutes. Support answered quickly whenever I needed help choosing the right service.", name: "Rakib H.", role: "Freelance Marketer, Sylhet", img: "rakib-h" },
  { quote: "GrowFollows made it simple to manage growth across multiple platforms from one place. Clear tracking and fair pricing keep our agency workflows moving.", name: "Farzana T.", role: "Agency Account Manager", img: "farzana-t" },
  { quote: "I started as a beginner and still found the panel easy to use. Services delivered as expected and the real-time order status gave me confidence.", name: "Imran K.", role: "Content Creator", img: "imran-k" },
  { quote: "Reliable delivery and transparent pricing matter for our team. GrowFollows has been consistent for both local Bangladesh clients and global campaigns.", name: "Mehedi A.", role: "Growth Strategist", img: "mehedi-a" },
].map((r) => ({ ...r, img: A(`services/reviews/customers/${r.img}-v3.png`, 128), date: "February 04, 12:30 PM" }));

export const videoReviews = [1, 2, 3, 4].map((id) => ({
  id,
  name: "Rifat Ahamed",
  role: "Business Owner",
  rating: "4.8",
  poster: A("hero/trusted-by-users-in-bangladesh-and-worldwide.png"),
  videoUrl: "https://videos.pexels.com/video-files/3195394/3195394-uhd_1440_2560_25fps.mp4",
}));

export const stats = [
  { value: "12,865,171", label: "Total Orders" },
  { value: "98,538", label: "Total Users" },
  { value: "3,075", label: "Services Available" },
];

export const steps = [
  { n: "01", t: "Create Your Free Account", d: "Register for a free GrowFollows account and access hundreds of social media marketing services." },
  { n: "02", t: "Discover Our Services", d: "Find affordable SMM panel services from the list. Then, choose the service that matches your goals." },
  { n: "03", t: "Add Funds Easily", d: "Securely add funds to your account using safe payment options like bKash, Nagad, Rocket, bank transfer, or international gateways." },
  { n: "04", t: "Place Orders & Relax", d: "Once you select your service, place your order and track the progress in real time from your dashboard." },
];

export const platforms = [
  { id: "facebook", label: "Facebook", icon: "home/facebook.png", img: "home/facebook-smm-panel.png", title: "Facebook", d: "Grow your Facebook page, profile, group, or post with our Facebook SMM Panel services. Buy Facebook followers, likes, views, comments, shares, and page engagement to improve your social proof." },
  { id: "instagram", label: "Instagram", icon: "home/instagram.png", img: "home/instgram-smm-panel.png", title: "Instagram", d: "Build a stronger Instagram presence with our Instagram SMM Panel services. Buy Instagram followers, likes, reels views, comments, saves, and engagement to support profile growth and content visibility." },
  { id: "youtube", label: "YouTube", icon: "smm-services/icon-youtube.png", img: "home/youtube-smm-panel.png", title: "YouTube", d: "Promote your videos with our YouTube SMM Panel services. Buy YouTube views, subscribers, likes, comments, and watch time to support channel growth, video reach, and audience trust." },
  { id: "tiktok", label: "TikTok", icon: "home/tiktok.png", img: "home/tiktok-smm-panel.png", title: "TikTok", d: "Boost your short videos with our TikTok SMM Panel services. Buy TikTok followers, likes, views, comments, and shares to improve content reach, profile activity, and social engagement." },
  { id: "telegram", label: "Telegram", icon: "home/telegram.png", img: "home/others-smm-panel.png", title: "Telegram", d: "Grow your Telegram channel or group with our Telegram SMM Panel services. Buy Telegram members, post views, reactions, and engagement to make your community look active and trusted." },
  { id: "x", label: "X (Twitter)", icon: "smm-services/icon-x.png", img: "home/twitter-smm-panel.png", title: "Twitter", d: "Improve your X account with our Twitter SMM Panel services. Buy Twitter followers, likes, retweets, views, and comments to support post reach, profile trust, and audience engagement." },
  { id: "threads", label: "Threads", icon: "smm-services/icon-threads.png", img: "home/threads-smm-panel.png", title: "Threads", d: "Grow your Threads profile with our Threads SMM Panel services. Buy Threads followers, likes, views, and engagement to make your posts more active and support early profile growth." },
  { id: "spotify", label: "Spotify", icon: "home/spotify.png", img: "home/spotify-smm-panel.png", title: "Spotify", d: "Promote your music with our Spotify SMM Panel services. Buy Spotify plays, followers, saves, and monthly listeners to support artist growth, music reach, and listener trust." },
  { id: "whatsapp", label: "WhatsApp", icon: "smm-services/icon-whatsapp.png", img: "home/whatsapp-smm-panel.png", title: "WhatsApp", d: "Support your WhatsApp marketing with our WhatsApp SMM Panel services. Grow channel followers, views, and engagement to improve brand updates, campaign reach, and community activity." },
  { id: "linkedin", label: "LinkedIn", icon: "home/linkdein.png", img: "home/linkdein-smm-panel.png", title: "LinkedIn", d: "Build professional visibility with our LinkedIn SMM Panel services. Buy LinkedIn followers, post likes, views, comments, and company page engagement to support business growth." },
  { id: "shopee", label: "Shopee", icon: "smm-services/icon-shopee.png", img: "home/shopee-smm-panel.png", title: "Shopee", d: "Improve your store visibility with our Shopee SMM Panel services. Buy Shopee followers, product likes, views, and engagement to support seller trust and online shop growth." },
  { id: "others", label: "Others", icon: "smm-services/icon-others.png", img: "home/others-smm-panel.png", title: "Other", d: "Need more platforms? GrowFollows also offers other SMM panel services for different social media and digital platforms, helping creators, brands, agencies, and resellers grow from one dashboard." },
].map((p) => ({ ...p, icon: A(p.icon), img: A(p.img) }));

export const worldCountries = ["USA", "UK", "Bangladesh", "Vietnam", "Thailand", "Indonesia", "Brazil", "Nigeria", "India", "UAE", "Germany"];

export const orbitIcons = [
  { src: "platforms/icon-youtube.png", x: 14, y: 22 }, { src: "platforms/icon-facebook.png", x: 4, y: 50 }, { src: "platforms/icon-whatsapp.png", x: 16, y: 80 },
  { src: "platforms/icon-instagram.png", x: 28, y: 60 }, { src: "platforms/icon-telegram.png", x: 70, y: 62 }, { src: "platforms/icon-spotify.png", x: 84, y: 82 },
  { src: "platforms/icon-tiktok.png", x: 93, y: 50 }, { src: "platforms/icon-linkedin.png", x: 82, y: 20 }, { src: "platforms/icon-x.png", x: 66, y: 32 },
  { src: "platforms/icon-threads.png", x: 30, y: 30 }, { src: "platforms/icon-soundcloud.png", x: 8, y: 30 }, { src: "platforms/icon-reddit.png", x: 92, y: 30 },
].map((o) => ({ ...o, src: A(o.src) }));

export const advantages = [
  { t: "Fast Order Processing", d: "Place your order and track progress from the dashboard. GrowFollows helps users start social media growth campaigns without long waiting times." },
  { t: "Affordable Packages", d: "Choose low-cost SMM services for Facebook, Instagram, YouTube, TikTok, Telegram, Spotify, and more based on your goals and budget." },
  { t: "Bangladesh Payment Support", d: "Bangladeshi users can add funds using local payment options like bKash, Nagad, and Rocket where available." },
  { t: "Reseller Friendly Dashboard", d: "Agencies and resellers can manage multiple client orders from one account with simple tracking and service selection." },
  { t: "Multiple Platform Services", d: "Use one SMM panel for followers, likes, views, comments, subscribers, members, plays, and other engagement services." },
];

export const comparison = [
  { name: "Google Ads", logo: A("comparison/google-ad.svg"), ok: false },
  { name: "Meta Business Partner", logo: A("comparison/meta.svg"), ok: false },
  { name: "GrowFollows", logo: A("comparison/growfollow.svg"), ok: true },
  { name: "TikTok Ads", logo: A("comparison/tiktok.svg"), ok: false },
];

export const blogPosts = [
  {
    title: "10 Ways to Promote a Spotify Song on Instagram",
    date: "October 18, 2026",
    author: "Arian Mahamud",
    cover: CDN("how-to-promote-a-spotify-song-on-instagram.webp"),
    excerpt: "Learn how to promote a Spotify song on Instagram using 10 practical methods. Discover how Instagram Reels, Stories, Notes, collaborations, and ads can help you reach new listeners. This guide also explains Spotify song sharing, profile optimization, and how GrowFollows offers additional Spotify music promotion services for independent artists.",
  },
  {
    title: "How to Get More Spotify Saves Organically: 10 Tips",
    date: "October 15, 2026",
    author: "Shuman Chandra Das",
    cover: CDN("how-to-get-more-spotify-saves-organically.webp"),
    excerpt: "Learn how to get more Spotify saves organically using 10 practical strategies. Discover how to optimize your artist profile, promote songs on social media, submit music to playlists, and improve listener engagement. Explore Spotify save rates, audience growth techniques, and how GrowFollows can support your music promotion goals effectively.",
  },
  {
    title: "How Much Does a Child SMM Panel Cost? 2026 Price Guide",
    date: "October 14, 2026",
    author: "Arian Mahamud",
    cover: CDN("how-much-does-a-child-smm-panel-cost.webp"),
    excerpt: "How much does a child SMM panel cost in 2026? This guide explains monthly subscription fees, setup expenses, domain costs, payment charges, and potential reseller profits. Discover how to compare affordable child panel providers, avoid hidden fees, and explore GrowFollows services to start your SMM reseller business with confidence.",
  },
];

export const footer = {
  email: "support@growfollows.com",
  phone: "+44 7380 800689",
  address: "Unit 4, Storm 12 Plaza Shopping Centre, 54 St Mary's Rd, Southampton, United Kingdom, SO14 0BH",
  quickLinks: ["Home", "Api", "Terms & Conditions", "Privacy Policy", "Refund Policy", "Contact Us", "FAQs", "Child Panel", "Cheap SMM Panel", "Reseller SMM Panel", "SMM Panel bKash", "API SMM Panel", "Wholesale SMM Panel", "White Label SMM Panel", "Safe SMM Panel", "Premium SMM Panel", "Easy SMM Panel", "Fast SMM Panel", "Global SMM Panel"],
  socials: [
    { name: "Instagram", icon: A("footer/social-ig.png"), href: "https://www.instagram.com/growfollows_official/" },
    { name: "Facebook", icon: A("footer/social-fb.png"), href: "https://www.facebook.com/GrowfollowsOfficial/" },
    { name: "LinkedIn", icon: A("footer/social-lk.png"), href: "https://www.linkedin.com/company/growfollows/" },
    { name: "YouTube", icon: A("footer/social-yt.png"), href: "https://www.youtube.com/@GrowFollows" },
    { name: "X", icon: A("footer/social-x.png"), href: "https://x.com/growfollowsltd" },
    { name: "Pinterest", icon: A("smm-services/icon-pinterest.png"), href: "https://www.pinterest.com/growfollows/" },
  ],
  offices: [
    { name: "Bangladesh", address: "Level 4, House 12, Road 7, Block D, Banani, Dhaka-1213, Bangladesh", icon: A("footer/map-outline.svg") },
    { name: "UK", address: "71-75 Shelton Street, Covent Garden, London, WC2H 9JQ, UK", icon: A("services/uk.svg") },
    { name: "UAE", address: "Business Bay, Sheikh Zayed Road, Dubai, UAE", icon: A("services/uae.svg") },
  ],
  ai: ["Claude", "ChatGPT", "Gemini", "Grok", "Copilot", "Perplexity"],
};
