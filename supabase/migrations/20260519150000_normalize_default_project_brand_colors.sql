-- Treat saved Mably default hex values as unset (webp backgrounds + global theme).
update public.projects
set brand_color = null
where lower(trim(brand_color)) in ('#f97316', '#fb923c', 'f97316', 'fb923c');

update public.profiles
set default_brand_color = null
where lower(trim(default_brand_color)) in ('#f97316', '#fb923c', 'f97316', 'fb923c');
