-- ============================================================
-- Step 1/2: Add enum values for 枚举.md spec (2026-06-03)
-- Run alone first; PostgreSQL requires enum commits before use.
-- ============================================================

-- clothing_category — new codes
alter type public.clothing_category add value if not exists 'tshirt_short';
alter type public.clothing_category add value if not exists 'tshirt_long';
alter type public.clothing_category add value if not exists 'thermal_top';
alter type public.clothing_category add value if not exists 'long_johns';
alter type public.clothing_category add value if not exists 'pants_mid';
alter type public.clothing_category add value if not exists 'outer_uv';
alter type public.clothing_category add value if not exists 'shoes_sandal';
alter type public.clothing_category add value if not exists 'shoes_sneaker';
alter type public.clothing_category add value if not exists 'shoes_leather';
alter type public.clothing_category add value if not exists 'shoes_boot';

-- fabric_material — spec §3.1 + placeholder for shoes
alter type public.fabric_material add value if not exists 'cotton';
alter type public.fabric_material add value if not exists 'modal';
alter type public.fabric_material add value if not exists 'acrylic';
alter type public.fabric_material add value if not exists 'polyester';
alter type public.fabric_material add value if not exists 'wool';
alter type public.fabric_material add value if not exists 'down';
alter type public.fabric_material add value if not exists 'unspecified';
