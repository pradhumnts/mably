import { FeaturesPageShell } from "@/components/features/features-page-shell";
import { getFeatureRequestsPageData } from "@/lib/actions/feature-requests";

export default async function FeaturesPage() {
  const data = await getFeatureRequestsPageData();
  return (
    <FeaturesPageShell
      ok={data.ok}
      error={data.error}
      requests={data.requests}
      myVoteIds={data.myVoteIds}
    />
  );
}
