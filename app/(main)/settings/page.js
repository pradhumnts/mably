import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/data/profile";
import { SettingsPageClient } from "./settings-page-client";

export default async function SettingsPage() {
  const profile = await getCurrentUserProfile();
  if (!profile) {
    redirect("/");
  }

  return (
    <SettingsPageClient
      initialProfile={{
        name: profile.name,
        email: profile.email,
        avatar: profile.avatar,
        phone: profile.phone,
        title: profile.title,
        location: profile.location,
        calendarLink: profile.calendarLink,
        notificationPreferences: profile.notificationPreferences,
        role: profile.role,
      }}
    />
  );
}
