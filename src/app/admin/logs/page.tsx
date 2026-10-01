import { redirect } from "next/navigation";

export default function Logs() {
  redirect("/admin/board?tab=logs");
}
