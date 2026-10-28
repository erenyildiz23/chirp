import type { Metadata } from "next";
import { FollowListPage } from "../follow-list-page";

export const metadata: Metadata = { title: "Followers" };

export default async function FollowersPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return <FollowListPage username={username} kind="followers" />;
}
