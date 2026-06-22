import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { landingPath } from "@/lib/constants";

export default async function Home() {
  const session = await getSession();
  if (!session) redirect("/login");
  redirect(landingPath(session.role));
}
