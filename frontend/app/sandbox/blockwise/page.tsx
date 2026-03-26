import { redirect } from "next/navigation";

// BlockWise AI has been renamed to Destinations AI
export default function BlockwiseRedirect() {
  redirect("/sandbox/destinations-ai");
}
