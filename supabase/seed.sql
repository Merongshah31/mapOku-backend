-- =====================================================
-- MAPOKU SEED DATA — DUMMY OBSTACLES FOR KUALA LUMPUR
-- Run this in Supabase Dashboard → SQL Editor
-- =====================================================

-- 1. Optional: Clear existing obstacles if you want a fresh start
-- TRUNCATE TABLE public.votes CASCADE;
-- TRUNCATE TABLE public.obstacles CASCADE;

-- 2. Insert realistic dummy obstacles around Kuala Lumpur
INSERT INTO public.obstacles (
  latitude,
  longitude,
  location,
  type,
  description,
  image_url,
  status,
  upvotes,
  downvotes,
  affects
) VALUES
  -- 1. KLCC / Persiaran Petronas
  (
    3.1585,
    101.7130,
    ST_SetSRID(ST_MakePoint(101.7130, 3.1585), 4326)::geography,
    'broken_pavement',
    'Jalan pejalan kaki rosak berdekatan Menara ExxonMobil & KLCC Park. Bahaya untuk kerusi roda.',
    'https://images.unsplash.com/photo-1584463699039-38c644837517?auto=format&fit=crop&w=600&q=80',
    'active',
    5,
    0,
    ARRAY['wheelchair', 'stroller', 'elderly']::accessibility_need[]
  ),

  -- 2. Bukit Bintang / Pavilion (Jalan Bukit Bintang)
  (
    3.1490,
    101.7135,
    ST_SetSRID(ST_MakePoint(101.7135, 3.1490), 4326)::geography,
    'construction',
    'Kerja-kerja menaik taraf laluan pejalan kaki berhadapan Pavilion. Laluan sempit & berpasir.',
    'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=600&q=80',
    'active',
    12,
    1,
    ARRAY['wheelchair', 'visually_impaired', 'elderly', 'stroller']::accessibility_need[]
  ),

  -- 3. Pasar Seni / Central Market (Jalan Hang Kasturi)
  (
    3.1458,
    101.6962,
    ST_SetSRID(ST_MakePoint(101.6962, 3.1458), 4326)::geography,
    'steep_ramp',
    'Ramp naik ke kaki lima kedai terlalu curam (>1:8 gradient), tiada susur tangan (handrail).',
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
    'active',
    7,
    0,
    ARRAY['wheelchair', 'elderly']::accessibility_need[]
  ),

  -- 4. Dataran Merdeka / Jalan Raja
  (
    3.1498,
    101.6935,
    ST_SetSRID(ST_MakePoint(101.6935, 3.1498), 4326)::geography,
    'missing_curb_cut',
    'Tiada curb cut di simpang lampu isyarat pejalan kaki. Kerusi roda perlu turun ke jalan raya.',
    NULL,
    'active',
    4,
    0,
    ARRAY['wheelchair', 'stroller']::accessibility_need[]
  ),

  -- 5. KL Sentral / Nu Sentral (Jalan Stesen Sentral)
  (
    3.1340,
    101.6868,
    ST_SetSRID(ST_MakePoint(101.6868, 3.1340), 4326)::geography,
    'blocked_ramp',
    'Motorsikal kerap parkir di atas ramp khas OKU berdekatan jejantas Nu Sentral.',
    'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=600&q=80',
    'active',
    15,
    2,
    ARRAY['wheelchair', 'stroller']::accessibility_need[]
  ),

  -- 6. Brickfields / Little India (Jalan Tun Sambanthan)
  (
    3.1295,
    101.6862,
    ST_SetSRID(ST_MakePoint(101.6862, 3.1295), 4326)::geography,
    'no_tactile_paving',
    'Tactile blocks (laluan orang buta) terputus dan hilang sepanjang 20 meter di hadapan kedai.',
    NULL,
    'active',
    9,
    0,
    ARRAY['visually_impaired']::accessibility_need[]
  ),

  -- 7. Masjid Jamek LRT / Jalan Tun Perak
  (
    3.1495,
    101.6968,
    ST_SetSRID(ST_MakePoint(101.6968, 3.1495), 4326)::geography,
    'narrow_passage',
    'Gerai penjaja & tiang papan tanda menghalang laluan pejalan kaki. Lebar kurang 70cm.',
    NULL,
    'active',
    8,
    1,
    ARRAY['wheelchair', 'stroller', 'visually_impaired']::accessibility_need[]
  ),

  -- 8. Jalan Alor (Bukit Bintang food street)
  (
    3.1457,
    101.7085,
    ST_SetSRID(ST_MakePoint(101.7085, 3.1457), 4326)::geography,
    'uneven_surface',
    'Permukaan berturap sangat tidak rata dan licin akibat air cucian kedai makan.',
    NULL,
    'active',
    6,
    0,
    ARRAY['elderly', 'wheelchair', 'visually_impaired']::accessibility_need[]
  ),

  -- 9. Jalan Sultan Ismail / Medan Tuanku
  (
    3.1595,
    101.7010,
    ST_SetSRID(ST_MakePoint(101.7010, 3.1595), 4326)::geography,
    'flooded_path',
    'Laluan pejalan kaki kerap bertakung air sedalam 5cm setiap kali selepas hujan lebat.',
    NULL,
    'active',
    3,
    0,
    ARRAY['wheelchair', 'visually_impaired', 'elderly']::accessibility_need[]
  ),

  -- 10. Chow Kit (Jalan Tuanku Abdul Rahman)
  (
    3.1638,
    101.6980,
    ST_SetSRID(ST_MakePoint(101.6980, 3.1638), 4326)::geography,
    'broken_pavement',
    'Penutup longkang konkrit patah dan berlubang besar di tepi laluan kaki lima.',
    NULL,
    'active',
    11,
    0,
    ARRAY['wheelchair', 'visually_impaired', 'elderly', 'stroller']::accessibility_need[]
  ),

  -- 11. Berjaya Times Square / Jalan Imbi
  (
    3.1420,
    101.7105,
    ST_SetSRID(ST_MakePoint(101.7105, 3.1420), 4326)::geography,
    'blocked_ramp',
    'Skuter sewa dan palang konkrit menghalang akses ramp kerusi roda ke stesen Monorel.',
    NULL,
    'active',
    10,
    1,
    ARRAY['wheelchair', 'stroller']::accessibility_need[]
  ),

  -- 12. Kampung Baru (Jalan Raja Muda Musa)
  (
    3.1610,
    101.7060,
    ST_SetSRID(ST_MakePoint(101.7060, 3.1610), 4326)::geography,
    'no_tactile_paving',
    'Laluan tiada jubin taktil (tactile paving) dan tiada lampu isyarat dengan amaran audio.',
    NULL,
    'active',
    4,
    0,
    ARRAY['visually_impaired', 'hearing_impaired']::accessibility_need[]
  ),

  -- 13. Petaling Street (Chinatown)
  (
    3.1440,
    101.6982,
    ST_SetSRID(ST_MakePoint(101.6982, 3.1440), 4326)::geography,
    'narrow_passage',
    'Laluan berbumbung terlalu sesak dengan barangan jualan tergantung rendah dan meja peniaga.',
    NULL,
    'active',
    7,
    0,
    ARRAY['wheelchair', 'visually_impaired', 'stroller']::accessibility_need[]
  ),

  -- 14. Mid Valley Megamall (Jalan Lingkaran Syed Putra)
  (
    3.1180,
    101.6778,
    ST_SetSRID(ST_MakePoint(101.6778, 3.1180), 4326)::geography,
    'missing_curb_cut',
    'Kaki lima menuju ke jejantas KTM tiada penurun tebing (curb ramp). Ketinggian curb 15cm.',
    NULL,
    'active',
    8,
    0,
    ARRAY['wheelchair', 'stroller', 'elderly']::accessibility_need[]
  ),

  -- 15. Bangsar (Jalan Telawi)
  (
    3.1292,
    101.6712,
    ST_SetSRID(ST_MakePoint(101.6712, 3.1292), 4326)::geography,
    'uneven_surface',
    'Akar pokok besar merosakkan lantai pejalan kaki menyebabkan jubin terangkat tinggi.',
    NULL,
    'active',
    5,
    0,
    ARRAY['wheelchair', 'visually_impaired', 'elderly']::accessibility_need[]
  );

-- 3. Verification query — check that all 15 obstacles were inserted properly
SELECT 
  id, 
  latitude, 
  longitude, 
  type, 
  status, 
  affects, 
  description 
FROM public.obstacles 
ORDER BY created_at DESC;
