-- Freelancer onboarding completion + optional survey category (profiles)

alter table public.profiles
  add column if not exists onboarding_completed_at timestamptz,
  add column if not exists freelancer_survey_category text;

alter table public.profiles
  drop constraint if exists profiles_freelancer_survey_category_check;

alter table public.profiles
  add constraint profiles_freelancer_survey_category_check
  check (
    freelancer_survey_category is null
    or freelancer_survey_category in (
      'development_tech',
      'design_creative',
      'writing_content',
      'marketing_growth',
      'media_production'
    )
  );

-- Existing users: do not force the new flow
update public.profiles
set onboarding_completed_at = coalesce(onboarding_completed_at, now())
where onboarding_completed_at is null;
