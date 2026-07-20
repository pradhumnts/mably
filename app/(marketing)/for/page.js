import { redirect } from "next/navigation";

/** Parent path of audience pages — send visitors and crawlers to a live page. */
export default function ForIndexPage() {
  redirect("/for/freelancers");
}
