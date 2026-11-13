# Specification: Photorealistic Flower & Greenery Asset Library

**Module:** Botanical Asset Pipeline & Catalog Engine  
**System:** Petal & Prose v2.0  
**Date:** 2026-11-13  
**Status:** SPECIFICATION LOCKED & FINALIZED  

---

## 1. Scope & Visual Philosophy

This specification establishes the technical standards, data contracts, and pipeline architecture for the Petal & Prose botanical asset library.

### Core Visual Directives:
- **Zero Vector / CSS Flowers:** No programmatic geometric arcs, flat gradients, or repetitive circular petal patterns.
- **Authentic Photographic Realism:** Every stem is derived from high-resolution studio photography with macro petal texture, natural imperfections, subtle veining, and realistic light capture.
- **Botanical Proportions & Anatomy:** Real calyxes, floral bracts, woody/herbaceous stems, and natural petiole attachments.
- **Clean Alpha Matting:** Corner-calibrated, shadow-invariant chroma unmixing (`scripts/process-photo-masters.mjs`) ensuring zero green/grey halos, fringe artifacts, or jagged edges on light (#F7F4EE) or dark (#1B1D1B) surfaces.
- **Multi-Angle Variations:** Front-facing blooms, three-quarter angled profiles, tilted stems, and distinct bloom stages (tight bud, half-open, full bloom, loose petal).

---

## 2. Complete Asset Metadata Schema

Every botanical asset in the library stores comprehensive metadata fulfilling all 10 required dimensions:

```typescript
export type BotanicalMeta = {
  // 1. Asset ID
  skuId: string;

  // 2. Flower / Botanical Name
  name: string;

  // 3. Category / Studio Role
  role: "focal" | "filler" | "foliage" | "petal";

  // 4. Color Definition
  colorFamily: "crimson" | "blush" | "ivory" | "amber" | "lavender" | "sage";
  colorHex: string;
  colorAnchor: string;

  // 5. Image Paths (Multi-LOD & Alpha Mask)
  thumbPath: string;     // 200×200 WebP (LOD 3)
  studioPath: string;    // 700×700 WebP (LOD 2)
  exportPath: string;    // 1400×1400 WebP (LOD 1)
  hitmaskPath: string;   // 160px 1-bit alpha bitmask JSON

  // 6. Natural Aspect Ratio
  aspectRatio: number;   // width / height (typically 0.60 for 840×1400 master)
  naturalWidth: number;  // Display coordinate width (e.g. 450)
  naturalHeight: number; // Display coordinate height (e.g. 750)

  // 7. Preferred Rendering Size & Anchor
  preferredWidth: number;
  preferredHeight: number;
  anchorX: number;       // Normalized X pivot (0.50)
  anchorY: number;       // Normalized Y pivot (0.22 at bloom center)
  headRadiusWorld: number;
  stemLengthWorld: number;

  // 8. Botanical Classification
  botanicalType: string; // e.g. "Angiosperm / Rosaceae / Rosa hybrida"
  familyId: string;      // e.g. "rose", "peony", "eucalyptus"
  speciesSlug: string;
  hasSpeciesPage: boolean;

  // 9. Bloom Stage & Orientation
  bloomStage: "Full Bloom" | "Half Open" | "Closed Bud" | "Lush Cluster" | "Mature Foliage" | "Loose Petal";
  facingAngle: "Front-Facing" | "Three-Quarter Angled" | "Profile / Tilted";
  variantLabel: string;  // e.g. "Full Open", "Three-Quarter Profile"

  // 10. Symbolic Meaning & Licensing Information
  meaningShort: string;
  meaningFull: string;
  occasionTags: string[];
  license: string;       // "Petal & Prose Fine-Art Botanical Studio — Proprietary Asset"
  isRadialSymmetric: boolean;
  allowFrontDrape: boolean;
  defaultMinRotDeg: number;
  defaultMaxRotDeg: number;
};
```

---

## 3. Botanical Catalog Inventory

### 3.1 Flowers (18 Species)

| SKU ID | Botanical Name | Common Name | Category | Color | Bloom Stage | Facing Angle |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `rose-crimson-open` | *Rosa hybrida* | Crimson Garden Rose | Focal | Crimson (#9F2D3A) | Full Bloom | Front-Facing |
| `rose-blush-open` | *Rosa hybrida* | Blush Heirloom Rose | Focal | Blush (#E8A9AE) | Full Bloom | Front-Facing |
| `rose-blush-half` | *Rosa hybrida* | Blush Garden Rose | Focal | Blush (#E49FA6) | Half Open | Slightly Angled |
| `rose-blush-bud` | *Rosa hybrida* | Blush Rosebud | Focal | Blush (#DDA0A7) | Closed Bud | Upright Profile |
| `rose-white-open` | *Rosa hybrida* | Chantilly White Rose | Focal | Ivory (#F2EEE6) | Full Bloom | Front-Facing |
| `rose-peach-open` | *Rosa hybrida* | Juliet Apricot Rose | Focal | Amber (#ECA586) | Full Bloom | Front-Facing |
| `rose-petal-blush` | *Rosa hybrida* | Velvet Rose Petal | Petal | Blush (#DE959F) | Loose Petal | Flat Specimen |
| `peony-blush-full` | *Paeonia lactiflora* | Blush Heirloom Peony | Focal | Blush (#E6A5AF) | Full Bloom | Front-Facing |
| `peony-blush-small` | *Paeonia lactiflora* | Blush Peony Crown | Focal | Blush (#E29CA7) | Budding | Front-Facing |
| `peony-coral-full` | *Paeonia lactiflora* | Coral Charm Peony | Focal | Crimson (#DC6452) | Full Bloom | Front-Facing |
| `peony-petal-blush` | *Paeonia lactiflora* | Ruffled Peony Petal | Petal | Blush (#DF94A0) | Loose Petal | Flat Specimen |
| `tulip-red-upright` | *Tulipa gesneriana* | Crimson Tulip | Focal | Crimson (#B22534) | Full Bloom | Upright Profile |
| `tulip-red-tilted` | *Tulipa gesneriana* | Crimson Tulip | Focal | Crimson (#B22534) | Full Bloom | Tilted Curve |
| `tulip-yellow-tilted` | *Tulipa gesneriana* | Buttercup French Tulip | Focal | Amber (#E0A724) | Full Bloom | Tilted Curve |
| `tulip-blush-upright` | *Tulipa gesneriana* | Angelique Blush Tulip | Focal | Blush (#E5A4AF) | Full Bloom | Upright Profile |
| `ranunculus-peach` | *Ranunculus asiaticus* | Clooney Peach Ranunculus | Focal | Amber (#E89B77) | Full Bloom | Front-Facing |
| `dahlia-burgundy` | *Dahlia pinnata* | Burgundy Pompon Dahlia | Focal | Crimson (#5C1827) | Full Bloom | Front-Facing |
| `anemone-blush` | *Anemone coronaria* | Blush Panda Anemone | Focal | Blush (#E4CAD1) | Full Bloom | Front-Facing |
| `carnation-blush` | *Dianthus caryophyllus* | Ruffled Heirloom Carnation | Focal | Blush (#EAA8B2) | Full Bloom | Three-Quarter Angled |
| `orchid-white` | *Phalaenopsis* | Phalaenopsis Moth Orchid | Focal | Ivory (#F5F4EE) | Full Bloom Spray | Arching Profile |
| `lily-oriental-up` | *Lilium orientalis* | Casablanca White Lily | Focal | Ivory (#F2F0E8) | Full Bloom | Forward-Upward |
| `lily-oriental-angled` | *Lilium orientalis* | Blush Stargazer Lily | Focal | Blush (#DE869A) | Full Bloom | Three-Quarter Angled |
| `sunflower-front` | *Helianthus annuus* | Autumn Sun Sunflower | Focal | Amber (#D88E1B) | Full Bloom | Front-Facing |
| `sunflower-angled` | *Helianthus annuus* | Autumn Sun Sunflower | Focal | Amber (#D88E1B) | Full Bloom | Three-Quarter Angled |
| `daisy-chamomile` | *Matricaria chamomilla* | Wild Chamomile Cluster | Filler | Ivory (#EBE7DE) | Lush Cluster | Multi-Angle |
| `hydrangea-blue` | *Hydrangea macrophylla* | Sky Cloud Hydrangea | Focal | Lavender (#7698C2) | Mophead Dome | Front-Facing |
| `camellia-white` | *Camellia japonica* | Porcelain White Camellia | Focal | Ivory (#F4F3EE) | Full Double Bloom | Front-Facing |
| `zinnia-amber` | *Zinnia elegans* | Golden Amber Zinnia | Focal | Amber (#DB7A2B) | Full Bloom | Front-Facing |
| `lotus` | *Nelumbo nucifera* | Sacred Ivory Lotus | Filler | Ivory (#EFEBE2) | Half Open Cup | Upright Profile |
| `magnolia-ivory` | *Magnolia grandiflora* | Southern Ivory Magnolia | Focal | Ivory (#F7F4EB) | Half Open Goblet | Front-Facing |
| `lavender` | *Lavandula angustifolia* | Provence Lavender | Filler | Lavender (#7B668E) | Flower Spikes | Upright Stalks |
| `babys-breath` | *Gypsophila paniculata* | Cloud Baby’s Breath | Filler | Ivory (#EBEAE4) | Airy Cloud | Diffused Spray |
| `meadow-aster` | *Symphyotrichum* | Lilac Meadow Aster | Filler | Lavender (#9E8AB8) | Star Cluster | Front-Facing |
| `waxflower` | *Chamelaucium* | Geraldton Waxflower | Filler | Blush (#DC9AA9) | Branching Sprig | Multi-Angle |

### 3.2 Greenery & Foliage (10 Types)

| SKU ID | Botanical Name | Common Name | Category | Color | Morphology | Arrangement Role |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `eucalyptus-silver` | *Eucalyptus cinerea* | Silver Dollar Eucalyptus | Foliage | Sage (#8A9E93) | Round glaucous leaves | Background halo & framing |
| `eucalyptus-seeded` | *Eucalyptus nicholii* | Seeded Eucalyptus Drape | Foliage | Sage (#7F968A) | Weeping leaves + berry seed pods | Soft cascading perimeter |
| `fern-boston` | *Nephrolepis exaltata* | Studio Sword Fern | Foliage | Sage (#5C7A58) | Arching pinnate frond | Base depth & collar volume |
| `olive-branch` | *Olea europaea* | Tuscan Olive Branch | Foliage | Sage (#7B8C7A) | Bicolor lance leaves + olives | Classical Mediterranean texture |
| `ruscus-italian` | *Ruscus hypoglossum* | Italian Ruscus Vine | Foliage | Sage (#4D6E4C) | Slender glossy emerald vine | Vertical line & airy height |
| `monstera-deliciosa` | *Monstera deliciosa* | Tropical Monstera Leaf | Foliage | Sage (#3D5C43) | Broad perforated fan leaf | Asymmetric anchor leaf |
| `leatherleaf-fern` | *Rumohra adiantiformis* | Leatherleaf Fern Frond | Foliage | Sage (#3B593E) | Stiff triangular pinnate frond | Florist structural backing |
| `salal-lemon-leaf` | *Gaultheria shallon* | Salal Lemon Leaf Foliage | Foliage | Sage (#4A6749) | Leathery ovate emerald foliage | Dense mid-tier green collar |
| `pittosporum-variegated` | *Pittosporum tobira* | Variegated Pittosporum | Foliage | Sage (#8E9F8B) | Cream-margined wavy foliage | Soft light-catching filler |
| `pine-sprig` | *Pinus sylvestris* | Highland Pine Sprig | Foliage | Sage (#4F6E54) | Whispering evergreen needles | Winter texture & contrast |
| `dusty-miller` | *Jacobaea maritima* | Silvery Dusty Miller | Foliage | Sage (#9CAD9E) | Velvety silver felted lobes | Frosted tonal contrast |
| `autumn-oak-foliage` | *Quercus rubra* | Autumn Copper Foliage | Foliage | Amber (#A65B34) | Deeply lobed russet leaves | Warm autumn seasonal palette |
| `willow-sprig` | *Salix babylonica* | Weeping Willow Sprig | Foliage | Sage (#788D72) | Fine drooping slender wands | Whimsical airy movement |

---

## 4. Multi-LOD Image Pipeline & Hitmask Specs

### 4.1 Master Asset Ingestion
- Master format: Uncompressed 32-bit PNG (RGBA), $840 \times 1400$ px for standard stems, $800 \times 800$ px for petals.
- Color space: sRGB with embedded profile.
- Background: 100% transparent alpha channel ($A = 0$).

### 4.2 Multi-LOD Compilation (`scripts/build-assets.mjs`)
For each stem, sharp compiles three WebP assets and one JSON bitmask into `public/assets/v1/flowers/`:

1. **Export LOD (`[skuId]-export.webp`)**
   - Resolution: Up to $1400 \times 1400$ px inside.
   - Quality: 90% lossy WebP, 100% alpha quality, effort 5.
   - Purpose: High-resolution PNG/JPG canvas exports and retina displays.
2. **Studio LOD (`[skuId]-studio.webp`)**
   - Resolution: Up to $700 \times 700$ px inside.
   - Quality: 86% lossy WebP, 100% alpha quality, effort 5.
   - Purpose: Real-time Konva interactive canvas rendering with instant 60 FPS transform performance.
3. **Thumbnail LOD (`[skuId]-thumb.webp`)**
   - Resolution: $200 \times 200$ px contain.
   - Crop: Focused on the top 52% bloom crown for stems; full frame for loose petals.
   - Quality: 84% WebP, 100% alpha quality.
   - Purpose: Palette selector, stem counter capsule, and drawer catalog cards.
4. **Hitmask JSON (`[skuId]-hitmask.json`)**
   - Resolution: $160 \times 160$ px.
   - Format: Packed base64 1-bit alpha bitmask at threshold $31/255$ (12% opacity).
   - Purpose: Pixel-perfect alpha collision testing in the Konva workbench, preventing accidental selection when clicking transparent areas between petals.

---

## 5. Licensing & Commercial Rights Standard

All assets in this library are generated and processed under the **Petal & Prose Proprietary Commercial License**:
- **Copyright Owner:** Petal & Prose Studio / Vaibhav Borkar.
- **Originality:** 100% bespoke studio photographic captures and keying. Zero third-party copyrighted materials or scraped assets from digitalbouquet.org.
- **Allowed Uses:** Web studio rendering, social sharing cards (`/api/og/[slug]`), keepsake PDF/PNG/JPG exports, and marketing collateral.
- **Restrictions:** Sublicensing or reselling isolated stem cutouts as stock photography is strictly prohibited.

