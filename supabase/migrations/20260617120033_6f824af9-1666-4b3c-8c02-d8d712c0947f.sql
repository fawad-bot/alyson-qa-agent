UPDATE public.evidence_items
SET url = NULL,
    payload = (COALESCE(payload, '{}'::jsonb) - 'thumbnail') || jsonb_build_object('status', 'pending_capture')
WHERE kind = 'screenshot'
  AND url LIKE 'https://picsum.photos/%';