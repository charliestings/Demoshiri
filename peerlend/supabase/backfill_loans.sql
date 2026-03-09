-- Backfill script to fix old loans that have a NULL borrower_name
-- This looks at the borrower_id, finds their profile, and updates the loans table.

UPDATE public.loans l
SET borrower_name = p.full_name
FROM public.profiles p
WHERE l.borrower_id = p.id
AND l.borrower_name IS NULL;
