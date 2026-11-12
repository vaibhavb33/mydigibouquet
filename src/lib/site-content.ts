import type { OccasionSlug } from "@/engine/types";

export type FaqItem = {
  id: string;
  category: "Studio & Blooms" | "Customization & AI" | "Cards, Photos & Voice" | "Sharing & Privacy";
  question: string;
  answer: string;
};

export const SITE_FAQS: readonly FaqItem[] = [
  {
    id: "free-no-signup",
    category: "Studio & Blooms",
    question: "Is Petal & Prose completely free to use without creating an account?",
    answer:
      "Yes. You can arrange full digital bouquets, customize wrapping papers and stationery, export high-resolution keepsakes, save workspace drafts locally to your browser session, and generate private unboxing links with zero sign-up required.",
  },
  {
    id: "morphological-realism",
    category: "Studio & Blooms",
    question: "What makes your flower library different from flat clip-art bouquet makers?",
    answer:
      "Every bloom is prepared as a studio-lit botanical cutout with natural directional stages—closed buds, half-open blooms, full heirloom faces, tilted tulips, upright and angled lilies, plus cascading foliage like Monstera and seeded eucalyptus—rendered across back, stem, and front-collar layers.",
  },
  {
    id: "ai-editable-stems",
    category: "Customization & AI",
    question: "If I use the AI Atelier Florist, can I still edit individual flowers afterward?",
    answer:
      "Always. Unlike AI image generators that bake everything into one uneditable picture, our assistant selects curated botanical SKUs from our real catalog and arranges them onto the Konva canvas as independent editable stems that you can drag, rotate, resize, swap, duplicate, or undo.",
  },
  {
    id: "wrapping-ribbons",
    category: "Customization & AI",
    question: "Can I layer wrapping papers, glass vases, and textured ribbons realistically?",
    answer:
      "Yes. Wrapping paper (Kraft, Ivory Parchment, Blush Linen, Herringbone Weave, Transparent Cellophane, Floral-Patterned, Sage Cotton, and Charcoal) renders behind your stems with an authentic folded front collar over lower stems, finished with Satin, Silk, Velvet, or Natural Twine ribbons.",
  },
  {
    id: "photo-voice-privacy",
    category: "Cards, Photos & Voice",
    question: "How do keepsake photo cropping and personal voice notes work?",
    answer:
      "In Step 4, you can upload up to 6 JPEG, PNG, or WebP photos, crop them cleanly inside the studio before uploading, and record a voice note via your microphone—or upload an MP3, WAV, M4A, OGG, or WebM file if mic recording is unavailable. All media is validated by binary magic bytes on the server.",
  },
  {
    id: "privacy-unboxing",
    category: "Sharing & Privacy",
    question: "Are private shared bouquet links hidden from search engines?",
    answer:
      "Yes. Every recipient page (/b/[slug]) emits strict noindex, nofollow robots headers and a Referrer-Policy: no-referrer header. You can also enable 'Hide names in link preview' before publishing so recipient and sender names never appear in chat link previews or Open Graph images.",
  },
  {
    id: "exports-mobile",
    category: "Sharing & Privacy",
    question: "What keepsake image sizes can recipients and senders download?",
    answer:
      "Both senders and recipients can export high-resolution 1:1 Square (1600x1600), 4:5 Keepsake Portrait (1440x1800), 9:16 Mobile Wallpaper (1080x1920), and transparent-background PNG or JPG frames directly from any desktop or mobile browser.",
  },
  {
    id: "drafts-reopen",
    category: "Customization & AI",
    question: "Can I save multiple bouquet drafts and duplicate versions before sending?",
    answer:
      "Yes. Open 'My Bouquets' in the Studio header to save projects to your workspace database, reopen previous bouquets for editing, duplicate variations for different recipients, or delete drafts at any time.",
  },
];

export const FEATURED_SIX_OCCASIONS: ReadonlyArray<{
  slug: OccasionSlug;
  badge: string;
  headline: string;
  description: string;
}> = [
  {
    slug: "romance",
    badge: "Romantic",
    headline: "Romantic",
    description: "Crimson garden roses, cupped blush peonies & velvet satin ribbon.",
  },
  {
    slug: "birthday",
    badge: "Celebration",
    headline: "Birthday",
    description: "Sunlit sunflowers, tilted tulips & chamomile tied in natural twine.",
  },
  {
    slug: "wedding",
    badge: "Bridal Suite",
    headline: "Wedding",
    description: "White phalaenopsis orchids, ivory roses, peonies & crystal wrap.",
  },
  {
    slug: "friendship",
    badge: "Warmth",
    headline: "Friendship",
    description: "Wild daisies, lavender sprigs, peach ranunculus & patterned wrap.",
  },
  {
    slug: "thank-you",
    badge: "Gratitude",
    headline: "Thank You",
    description: "Blue hydrangeas, olive branches & sweet peas with silk tails.",
  },
  {
    slug: "congratulations",
    badge: "Milestone",
    headline: "Congratulations",
    description: "Tall coral peonies, champagne wrap & architectural foliage.",
  },
];

export const HOW_IT_WORKS_STEPS: ReadonlyArray<{
  step: string;
  title: string;
  summary: string;
  detail: string;
}> = [
  {
    step: "01",
    title: "Select Flowers & Foliage",
    summary: "Browse 40 botanical SKUs by mood, color, or petal stage.",
    detail:
      "Mix full-open focals, half-open blooms, closed buds, chamomile, baby's breath, Monstera leaves, silver eucalyptus, olive branches, and seasonal foliage.",
  },
  {
    step: "02",
    title: "Arrange Bouquet & Wrap",
    summary: "Sculpt freely or apply 7 florist composition silhouettes.",
    detail:
      "Drag, rotate, scale, reorder z-layers, flip stems, lock placements, wrap behind blooms in kraft, linen, transparent cellophane, or glass vases with Silk/Velvet/Twine ribbons—or ask the AI Atelier Florist.",
  },
  {
    step: "03",
    title: "Personalize Card & Memories",
    summary: "Write your letter, crop keepsake photos & record a voice note.",
    detail:
      "Pair 6 tactile stationery stocks with calibrated high-contrast typography, pressed-petal watermarks, wax seals, up to 6 cropped photos, and an optional personal voice recording.",
  },
  {
    step: "04",
    title: "Share Your Creation",
    summary: "Send an animated unboxing envelope or download studio PNG/JPGs.",
    detail:
      "Recipients tap your custom wax seal to reveal swaying blooms, keepsake photos in a lightbox, and your voice note alongside PNG/JPG export downloads and WhatsApp / native sharing.",
  },
];

export const PLATFORM_PILLARS: ReadonlyArray<{
  title: string;
  eyebrow: string;
  body: string;
}> = [
  {
    eyebrow: "Morphological Realism",
    title: "Stems With Life Stages, Layer Depth & Shadow",
    body: "Open blooms, side-angled petals, and arched foliage tuck cleanly behind front wrap folds and ribbon bows rather than floating as flat stickers.",
  },
  {
    eyebrow: "True Object Control",
    title: "Editable Canvas Architecture & Smart Florist Help",
    body: "Every starter template and AI Florist suggestion populates individual Konva stem nodes you can drag, rotate, flip, lock, duplicate, and undo cleanly.",
  },
  {
    eyebrow: "Multi-Sensory Keepsake",
    title: "Handwritten Stationery, Photos & Personal Voice",
    body: "Combine auto-contrast cotton cards, animated reveal motion (respecting prefers-reduced-motion), cropped memory photos, and personal voice recordings.",
  },
  {
    eyebrow: "Calming & Ad-Free",
    title: "Zero Display Ads, Private Links & Free High-Res Exports",
    body: "Shared bouquets stay off search indexes with clean Open Graph previews, strict SVG-free upload sanitization, and full-res transparent cutout downloads.",
  },
];

