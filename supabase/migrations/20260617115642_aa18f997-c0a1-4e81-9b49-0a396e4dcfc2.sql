UPDATE public.evidence_items
SET url = 'https://picsum.photos/seed/' || id::text || '/960/540',
    payload = COALESCE(payload, '{}'::jsonb) || jsonb_build_object('thumbnail', 'https://picsum.photos/seed/' || id::text || '/480/270')
WHERE kind = 'screenshot' AND (url IS NULL OR url = '');