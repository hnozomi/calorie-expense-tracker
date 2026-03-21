import { redirect } from "next/navigation";

/** Other tab: redirect to food-masters as default */
export default function OtherPage() {
  redirect("/other/food-masters");
}
