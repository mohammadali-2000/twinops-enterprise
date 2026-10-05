import { redirect } from "next/navigation";

// Sign-in is handled by choosing a twin on the home page.
export default function AuthCompletePage() {
  redirect("/");
}
