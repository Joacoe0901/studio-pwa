import { redirect } from "next/navigation";

// Root redirects to login; auth guard added in Sprint 1.
export default function RootPage() {
  redirect("/login");
}
