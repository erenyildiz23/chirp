import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { NotificationList } from "@/components/notifications/notification-list";
import { getNotifications } from "@/lib/queries/notifications";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const items = await getNotifications();

  return (
    <>
      <PageHeader title="Notifications" />
      <NotificationList items={items} />
    </>
  );
}
