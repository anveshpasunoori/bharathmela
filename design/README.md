# Design assets

Images kept for later use. Pictures the app shows live in `public/categories/` (see `ILLUSTRATED` in
`src/components/CategoryIcon.tsx`).

- `category-photos/`: photo-style tiles not used yet, ready for categories we may add:
  - trade and home services: `ELECTRICIAN`, `PLUMBING`, `HVAC` (AC repair), `HANDYMAN`, `ROOFING`, `GUTTERS`,
    `PAVERS` (pavers and patios), `LANDSCAPING`, `PEST_CONTROL`, `REMODELING`
  - shopping, for splitting Clothing & Jewelry or Other Goods later: `MENS_WEAR`, `WOMENS_WEAR`, `KIDS_WEAR`,
    `FASHION_JEWELRY`, `ACCESSORIES`, `FABRICS`, `ELECTRONICS`, `HOME_APPLIANCES`, `KITCHENWARE`,
    `SPORTS_FITNESS`, `PET_SUPPLIES`, `PERSONAL_CARE`, `BABY_CARE`, `OFFICE_STATIONERY`, `GARDENING_TOOLS`,
    `BOOKS_MEDIA`
  - `JOBS`, and `MUSIC` (music lessons; an alternative picture for Dance, Music & Sangeetham)
- `category-illustrations/`: the earlier illustrated tiles for rooms, tutoring, food, legal, domestic help,
  dance, realtors and events, replaced by photos.
- `source-sheets/`: the original sheets the tiles were cut from (5 tiles per row; cut to 172 px squares with rounded corners).

To use a tile, copy it to `public/categories/<CATEGORY>.webp` and add the category to `ILLUSTRATED`.
