-- Polar product id for the subscription. price_id holds a Polar *price* id, which
-- cannot be compared against POLAR_PRODUCT_ID_* (founding detection, seat pricing).

alter table public.freelancer_subscriptions
  add column if not exists polar_product_id text;

comment on column public.freelancer_subscriptions.polar_product_id is
  'Polar product id from webhook/reconcile. Use for plan / founding checks, not price_id.';
