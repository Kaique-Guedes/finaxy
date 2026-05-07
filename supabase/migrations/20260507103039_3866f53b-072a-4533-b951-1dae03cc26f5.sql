ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS paid boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_recurring boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, date);