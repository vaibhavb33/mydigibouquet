export type BlogCategory =
  | "Digital Gifting"
  | "Flower Meanings"
  | "Bouquet Ideas"
  | "Birthday Messages"
  | "Anniversary Gifts"
  | "Virtual Flowers"
  | "Digital Greeting Inspiration";

export type BlogSection = {
  heading: string;
  paragraphs: readonly string[];
  bullets?: readonly string[];
};

export type BlogPostSpec = {
  slug: string;
  title: string;
  description: string;
  category: BlogCategory;
  publishedAt: string;
  updatedAt: string;
  readingTimeMin: number;
  targetKeyword: string;
  coverImage: string;
  coverAlt: string;
  relatedOccasion?: string;
  relatedSpecies?: string;
  sections: readonly BlogSection[];
};

export const BLOG_POSTS: readonly BlogPostSpec[] = [
  {
    slug: "what-is-a-digital-bouquet-complete-guide",
    title: "How to Create a Digital Bouquet That Feels Like Real Floristry",
    description:
      "Learn how modern digital bouquets combine morphological blooms, folded paper wraps, handwritten stationery, cropped keepsake photos, and private wax-seal links.",
    category: "Digital Gifting",
    publishedAt: "2026-11-01",
    updatedAt: "2026-11-10",
    readingTimeMin: 6,
    targetKeyword: "create a digital bouquet",
    coverImage: "/assets/v1/flowers/peony-blush-full-studio.webp",
    coverAlt: "Blush heirloom peony bloom used in a digital floral gift arrangement",
    relatedOccasion: "just-because",
    relatedSpecies: "peony",
    sections: [
      {
        heading: "Why Thoughtful Digital Bouquets Outlast Generic eCards",
        paragraphs: [
          "Standard greeting eCards feel rushed because every sender picks from identical flat graphics. A well-crafted digital bouquet restores the tactile pacing of visiting a florist: choosing closed buds alongside open focal blooms, framing petals with silver dollar eucalyptus or olive branches, tying a velvet or linen bow, and slipping a personal card beneath the collar.",
          "Because there are no delivery cutoffs, shipping fees, or wilting stems, a digital flower gift reaches partners, friends, or family across continents in seconds—while letting recipients keep high-resolution keepsake portraits forever.",
        ],
      },
      {
        heading: "Four Details That Make a Virtual Bouquet Feel Tactile",
        paragraphs: [
          "Inside an online bouquet maker, spatial layering matters more than sheer stem count. Keep these four florist rules in mind when building your arrangement:",
        ],
        bullets: [
          "Pair two focal stages: combine an open crimson rose or blush peony with a half-open bud so silhouettes feel organic instead of stamped.",
          "Anchor negative space with airiness: tuck chamomile, baby's breath, and split Monstera or seeded eucalyptus behind primary flowers.",
          "Match vessel and stem style: kraft paper and natural twine flatter meadow stems, while transparent cellophane showcases criss-crossing green stems.",
          "Finish with human texture: attach one favorite cropped photograph and a short 15-second voice note behind the wax seal.",
        ],
      },
      {
        heading: "Privacy First for Meaningful Personal Messages",
        paragraphs: [
          "Unlike public social posts, sincere notes belong strictly between sender and recipient. Always verify that your bouquet sharing link blocks search indexing by default and allows hiding sender/recipient names inside chat link previews when surprises matter.",
        ],
      },
    ],
  },
  {
    slug: "flower-meanings-guide-for-custom-bouquets",
    title: "The Floriography Handbook: Flower Meanings for Personalized Bouquets",
    description:
      "Decode classic flower symbolism—from crimson garden roses and blush peonies to white orchids, tilted tulips, and olive branches—before arranging your stems.",
    category: "Flower Meanings",
    publishedAt: "2026-11-02",
    updatedAt: "2026-11-10",
    readingTimeMin: 7,
    targetKeyword: "personalized digital bouquet",
    coverImage: "/assets/v1/flowers/rose-crimson-open-studio.webp",
    coverAlt: "Crimson open garden rose symbolizing enduring love and devotion",
    relatedOccasion: "romance",
    relatedSpecies: "rose",
    sections: [
      {
        heading: "Speaking Through Chosen Stems Instead of Clichés",
        paragraphs: [
          "Victorian floriography turned every bouquet into an intentional letter. Even when recipients do not know traditional meanings by heart, including a subtle botanical legend inside your digital unboxing card transforms pretty petals into an unforgettable gesture.",
        ],
      },
      {
        heading: "Essential Flower Meanings by Emotion",
        paragraphs: [
          "Use this quick reference when selecting focal blooms and greenery inside the Studio:",
        ],
        bullets: [
          "Crimson Garden Rose: deep affection, devotion, and courage.",
          "Blush & Coral Peonies: warm romance, prosperity, and joyful anticipation.",
          "Yellow Tilted Tulips: sunny warmth, cheer, and unburdened optimism.",
          "White Oriental Lily & Phalaenopsis Orchid: serenity, grace, humility, and thoughtful support.",
          "Chamomile & Olive Branches: patient calm, reconciliation, and peace—ideal for genuine apologies.",
          "Silver Eucalyptus & Ferns: protection, renewal, and enduring companionship.",
        ],
      },
    ],
  },
  {
    slug: "25-thoughtful-birthday-bouquet-message-ideas",
    title: "25 Thoughtful Birthday Bouquet Message Ideas (Beyond 'Happy Birthday')",
    description:
      "Fresh card notes to pair with an online birthday bouquet—covering best friends, partners, parents, coworkers, and milestone celebrations.",
    category: "Birthday Messages",
    publishedAt: "2026-11-04",
    updatedAt: "2026-11-10",
    readingTimeMin: 5,
    targetKeyword: "online birthday bouquet",
    coverImage: "/assets/v1/flowers/sunflower-front-studio.webp",
    coverAlt: "Golden autumn sunflower focal stem for an online birthday bouquet",
    relatedOccasion: "birthday",
    relatedSpecies: "sunflower",
    sections: [
      {
        heading: "How to Pair Your Card Note With Birthday Stems",
        paragraphs: [
          "Sunlight tones—sunflowers, amber tulips, and peach ranunculus—immediately signal warmth on a birthday stationery card. Aim for two or three sincere sentences referencing one specific memory rather than generic greeting poetry.",
        ],
      },
      {
        heading: "Warm Wishes for Friends, Partners, and Colleagues",
        paragraphs: [
          "Adapt any of these card starters directly inside Step 4 of the Petal & Prose Studio:",
        ],
        bullets: [
          "For a close friend: 'Picked the brightest sunflowers in the studio because you bring that exact warmth into every room. Happy birthday!'",
          "For long distance: 'Miles apart on your birthday, so here are sunlit stems that will never wilt on your desk. Wait until you hear the voice note inside.'",
          "For a partner: 'Every year alongside you feels richer than the last. Wishing you slow mornings, bold laughs, and everything you hope for this year.'",
          "For a mentor or teammate: 'Thank you for leading with patience and steadiness all year—wishing you a restorative, joyful birthday week.'",
        ],
      },
    ],
  },
  {
    slug: "modern-anniversary-digital-flower-gifts",
    title: "Modern Anniversary Digital Flower Gifts: Recreate Wedding Blooms Online",
    description:
      "Celebrate relationship milestones with personalized digital flower gifts that echo your original anniversary or wedding palette plus cropped memories.",
    category: "Anniversary Gifts",
    publishedAt: "2026-11-05",
    updatedAt: "2026-11-10",
    readingTimeMin: 6,
    targetKeyword: "digital flower gift",
    coverImage: "/assets/v1/flowers/orchid-white-studio.webp",
    coverAlt: "White phalaenopsis moth orchid stem for anniversary and wedding keepsakes",
    relatedOccasion: "anniversary",
    relatedSpecies: "orchid",
    sections: [
      {
        heading: "Echoing Memory Over Price Tags",
        paragraphs: [
          "Whether you are celebrating one year together or twenty-five, the sweetest anniversary digital flower gift recalls shared details: the color of your first bouquet together, an ivory ceramic vessel reminiscent of a favorite cafe table, and three cropped snapshots enclosed behind the greeting card.",
        ],
      },
      {
        heading: "Three Anniversary Palettes That Photograph Beautifully",
        paragraphs: [
          "Try these curated studio combinations inside the Anniversary template:",
        ],
        bullets: [
          "Heirloom Blush & Velvet: Blush open peonies, ivory closed rosebuds, and silver eucalyptus wrapped in Herringbone weave paper.",
          "Midnight Velvet Contrast: Crimson roses, burgundy dahlia, and gold ink on Charcoal paper resting against Evening Slate.",
          "Minimalist Botanical Sculpt: Three white phalaenopsis orchids with a single split Monstera frond in a clear flared glass vase.",
        ],
      },
    ],
  },
  {
    slug: "floral-arrangement-ideas-round-hand-tied-garden-luxury",
    title: "Online Flower Arrangement Silhouettes: Round, Garden, Sculptural & Luxury",
    description:
      "Understand how real florists compose round European domes, spiral hand-tied stems, wildflower meadows, and minimalist ikenobo silhouettes online.",
    category: "Bouquet Ideas",
    publishedAt: "2026-11-07",
    updatedAt: "2026-11-10",
    readingTimeMin: 6,
    targetKeyword: "online flower arrangement",
    coverImage: "/assets/v1/flowers/ranunculus-peach-studio.webp",
    coverAlt: "Clooney peach ranunculus bloom arranged in an airy garden silhouette",
    relatedOccasion: "wedding",
    relatedSpecies: "ranunculus",
    sections: [
      {
        heading: "Why Silhouette Comes Before Stem Count",
        paragraphs: [
          "Even twenty expensive flowers look disorganized without clear geometry. Before filling every gap on your canvas, decide which architectural shape matches your sentiment.",
        ],
      },
      {
        heading: "Choosing From Seven Classic Florist Presets",
        paragraphs: [
          "In the Composition Studio, one click rearranges your chosen blooms into balanced studio ratios while leaving every stem free to fine-tune:",
        ],
        bullets: [
          "Round Bouquet: Tight European dome ideal for bridal suites, birthdays, and classic roses.",
          "Classic Hand-Tied: Spiral stems meeting cleanly at a ribbon knot with generous ruscus collaring.",
          "Garden-Style Meadow: Uneven heights, breathing space, sweet peas, and chamomile for natural movement.",
          "Sculptural Minimalist: Intentional restraint—three to five focal stems plus one clean leaf against pale stoneware.",
        ],
      },
    ],
  },
  {
    slug: "why-virtual-flowers-with-voice-notes-feel-personal",
    title: "Virtual Flowers With Voice Notes & Cropped Photos: Why Multimedia Gifts Land Deeply",
    description:
      "Discover how pairing virtual flower bouquets with a brief spoken message and cropped memory cards creates an unforgettable remote gifting ritual.",
    category: "Virtual Flowers",
    publishedAt: "2026-11-08",
    updatedAt: "2026-11-10",
    readingTimeMin: 5,
    targetKeyword: "virtual flower bouquet",
    coverImage: "/assets/v1/flowers/anemone-blush-studio.webp",
    coverAlt: "Blush panda anemone botanical bloom inside a digital keepsake bouquet",
    relatedOccasion: "miss-you",
    relatedSpecies: "anemone",
    sections: [
      {
        heading: "Hearing a Familiar Voice Changes the Unboxing Moment",
        paragraphs: [
          "Written notes remain essential, yet hearing someone laugh for twelve seconds while admiring gently swaying virtual flowers turns a link on a screen into a genuine keepsake. Keep voice notes concise—between 10 and 30 seconds feels natural and intimate.",
        ],
      },
      {
        heading: "Cropping Keepsake Snapshots With Editorial Restraint",
        paragraphs: [
          "Attaching two or three cropped portrait photographs—each with a short four-word date or location caption—gives recipients a compact mini-album right beneath the botanical legend without overwhelming the arrangement.",
        ],
      },
    ],
  },
  {
    slug: "virtual-greeting-cards-vs-digital-bouquet-unboxing",
    title: "Virtual Greeting Cards Upgraded: Inside the Animated Wax-Seal Envelope Experience",
    description:
      "See how curated typography, cotton-paper tints, gentle petal motion, and reduced-motion accessibility turn virtual greeting cards into calm keepsakes.",
    category: "Digital Greeting Inspiration",
    publishedAt: "2026-11-09",
    updatedAt: "2026-11-10",
    readingTimeMin: 5,
    targetKeyword: "virtual greeting cards",
    coverImage: "/assets/v1/flowers/hydrangea-blue-studio.webp",
    coverAlt: "Sky cloud blue hydrangea bloom paired with bespoke virtual stationery",
    relatedOccasion: "thank-you",
    relatedSpecies: "hydrangea",
    sections: [
      {
        heading: "Replacing Cluttered Pop-Ups With Quiet Arrival",
        paragraphs: [
          "Traditional virtual greeting cards often open behind banner ads and jarring sound effects. A monogrammed wax seal resting cleanly atop warm cotton linen invites the recipient to tap once—unfolding stems with gentle breeze motion only when desired, while respecting OS prefers-reduced-motion preferences.",
        ],
      },
      {
        heading: "Typography & Paper Stocks Designed for Legibility",
        paragraphs: [
          "Choose Warm Parchment, Deckle Ivory, Blush Rose, Botanical Sage, or Midnight Velvet paper stocks paired with contrast-checked forest green, burgundy, ink, or pearl lettering—ensuring your message stays readable on both bright afternoon phones and cozy evening tablets.",
        ],
      },
    ],
  },
];

export function getBlogPostBySlug(slug: string): BlogPostSpec | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}

