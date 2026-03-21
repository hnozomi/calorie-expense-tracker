import { redirect } from "next/navigation";

/** Root page: middleware handles redirect to /home or /login */
export default function RootPage() {
  redirect("/home");
}
