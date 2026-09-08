import { router, useLocalSearchParams } from "expo-router";

import { TicketScanner } from "@/components/TicketScanner";

export default function ScannerScreen() {
  const { eventId, title } = useLocalSearchParams<{ eventId: string; title?: string }>();

  return <TicketScanner eventId={eventId} title={title} onBack={() => router.back()} />;
}
