# Phase 1 Empirical Asset Audit & Botanical Production Requirements (`asset-requirements.md`)

**Audit Date:** 2026-11-11  
**Audited Workspace:** `/Users/vaibhavborkar/mydigibouquet.com`  
**Audit Method:** Direct directory listing (`ls -la` & `find /Users/vaibhavborkar/mydigibouquet.com -maxdepth 4 | sort`)

---

## 1. Empirical Workspace Audit Findings

Direct filesystem inspection verified that `/Users/vaibhavborkar/mydigibouquet.com` initially contained **only architecture/design documentation (`SPEC.md`, `STATE.md`, `docs/*`)** and **0 existing raster/vector image assets**:

| Category | Existing Assets Found | Gap Status | Immediate Action Taken |
| :--- | :--- | :--- | :--- |
| **Focal Flowers & Morphology Variations** (`Rose`, `Peony`, `Tulip`, `Sunflower`, `Lily`, `Orchid`, `Dahlia`, `Hydrangea`, `Ranunculus`, `Anemone`) | `0` files | Missing | Authored full visual variation matrix below & compiled deterministic multi-layer studio PNG masters (`1400×1400` RGBA) into `assets-master/` + `public/assets/v1/` via `sharp`. |
| **Loose Individual Petals** (`Rose Petal`, `Peony Petal`) | `0` files | Missing | Added dedicated loose petal accent masters for romantic floor/bouquet accents. |
| **Stems, Leaves & Foliage / Greenery** (`Silver Eucalyptus`, `Seeded Eucalyptus`, `Fern`, `Olive Branch`, `Italian Ruscus`, `Willow`, `Pine Sprig`, `Dusty Miller`) | `0` files | Missing | Added articulated veined/powdered foliage masters with collar pivot metadata. |
| **Floral Fillers** (`Baby's Breath`, `Daisy/Chamomile`, `Lavender`, `Waxflower`, `Lotus`, `Meadow Aster`) | `0` files | Missing | Added multi-floret airy filler clusters with crisp alpha separation. |
| **Wrapping Paper & Vessels** (`5 Wraps`, `3 Vases`, `Bare Stems`) | `0` files | Missing | Added split `back.png` / `front.png` sandwich masters + `vase-clear-glass` specular overlay & normalized clip polygons. |
| **Ribbons & Bows** (`4 Bow Styles × 6 Ribbons`) | `0` files | Missing | Added studio ribbon silk/velvet/twine bow cutouts anchored at `(500, 740)`. |
| **Stationery Textures, Envelopes & Wax Seals** | `0` files | Missing | Added card stock weaves, wax seals, pressed-petal watermark & tabletop surfaces. |

---

## 2. Production Asset Specifications (For Photography / Studio Upgrades)

Any photography batch dropped into `assets-master/` automatically compiles cleanly via `npm run build:assets` (`scripts/build-assets.mjs` using `sharp`) without changing engine code, provided every asset satisfies these studio standards:

### 2.1 Botanical Morphology & Visual Variation Catalog (38 V1 Masters)

Every focal species must provide authentic biological stages & orientations so repeated stems never look cloned:

| Botanical Family | Required SKU Variations (`skuId`) | Morphological / Orientation Spec | Symmetry & Drape |
| :--- | :--- | :--- | :--- |
| **Garden Rose** | `rose-crimson-open`, `rose-blush-open`, `rose-blush-half`, `rose-blush-bud`, `rose-white-open`, `rose-petal-blush` | **Closed bud** (tight pointed calyx), **Half-open** (outer unfurling petals), **Fully open** (spiraled deep rosette center), + loose cupped **petal** | Fan `±45°` |
| **Peony** | `peony-blush-full`, `peony-blush-small`, `peony-coral-full`, `peony-petal-blush` | **Small nested bloom** (`65%` crown silhouette) vs **Full ruffled heirloom bloom** + floating translucent **petal** | Full/small radial (`±180°` toggleable) |
| **Tulip** | `tulip-red-upright`, `tulip-red-tilted`, `tulip-yellow-tilted`, `tulip-blush-upright` | **Upright closed goblet** + **Naturally arch-tilted bend stem** showing curved neck | Fan `±45°` |
| **Sunflower** | `sunflower-front`, `sunflower-angled` | **Front-facing sun disk** + **40° three-quarter angled profile** showing green involucre bracts | Front radial / Angled fan |
| **Oriental Lily** | `lily-oriental-up`, `lily-oriental-angled` | **Upward flared trumpet** + **Diagonal three-quarter orientation** exposing stamens | Fan `±45°` |
| **Additional V1 Focals** | `orchid-white`, `dahlia-burgundy`, `hydrangea-blue`, `ranunculus-peach`, `anemone-blush` | Softly lit 20–25° tabletop studio elevation with clean emerald calyx & stem extending downward | Radial (`dahlia`, `ranunculus`, `anemone`) / Fan (`orchid`, `hydrangea`) |
| **Fillers (`6`)** | `babys-breath`, `daisy-chamomile`, `lavender`, `waxflower`, `lotus`, `meadow-aster` | Multi-stem delicate panicle sprigs w/ transparent air gaps for natural behind/front tucking | Fan `±45°` |
| **Greenery & Foliage (`8`)** | `eucalyptus-silver`, `eucalyptus-seeded`, `fern-boston`, `olive-branch`, `ruscus-italian`, `willow-sprig`, `pine-sprig`, `dusty-miller` | Elongated botanical sprays (`allowFrontDrape: true` on trailing `eucalyptus-seeded`, `fern-boston`, `willow-sprig`, `ruscus-italian`) | Fan `±55°` |

### 2.2 Technical Quality, Lighting & Transparency Rules
1. **Master Format & Resolution:** Lossless 32-bit **RGBA Transparent PNG** at **`1400 × 1400px`** minimum for single blooms (`1400 × 1800px` max aspect for tall sprays/wraps). Zero baked drop shadows! Zero checkerboard/white edge halos (`alpha === 0` pixels must carry zero RGB bleed).
2. **Camera Angle & Lighting Consistency:** Consistent **`20°–25°` tabletop florist elevation** with **diffused `45°–60°` overhead-front key light** so rotating stems within `±45°` keeps shadow & highlight direction believable.
3. **Framing & Collar Pivot Registration:**
   - Every cutout leaves `>= 6%` clear alpha margin (zero edge petal cropping!).
   - Stem axis aligns bottom-center around normalized `(anchorX: 0.50, anchorY: 0.88)` (recorded in `assets-master/catalog-meta.json`) so rotation pivots around the hand-tied bouquet collar rather than orbiting blooms sideways.
4. **Compiled Runtime LODs (`scripts/build-assets.mjs`):**
   - `thumb.webp` (`200 × 200px`, `< 15 KB`) — picker cards
   - `studio.webp` (`700px` max edge, `< 60 KB`) — interactive `60fps` Konva stage
   - `export.webp` (`1400px` max edge, `< 180 KB`) — sequential fixed-pixel PNG/JPG export
   - `hitmask.json` (`160px` max edge 1-bit alpha bitset at `12%` threshold) — zero `.cache()` RAM overhead!

