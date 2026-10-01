import { redirect } from "next/navigation";

export default function Conversations() {
  redirect("/admin/board?tab=recruiters");
}
