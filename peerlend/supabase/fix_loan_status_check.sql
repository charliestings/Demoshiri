-- Fix: Update Loan Status Constraint to include 'repaid'
-- The user encountered: Repayment failed: new row for relation "loans" violates check constraint "loans_status_check"

-- 1. Drop the existing constraint
ALTER TABLE public.loans 
DROP CONSTRAINT IF EXISTS loans_status_check;

-- 2. Add the updated constraint with all necessary statuses
ALTER TABLE public.loans 
ADD CONSTRAINT loans_status_check 
CHECK (status IN ('pending', 'approved', 'funding', 'funded', 'repaid', 'rejected'));

-- Also ensure 'funded' is allowed if it was missing (though the error happened only on repayment)
-- and 'funding' if it's used by the investment flow.
