ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS target_url text;
UPDATE public.projects SET target_url = 'https://lovable.dev' WHERE target_url IS NULL;