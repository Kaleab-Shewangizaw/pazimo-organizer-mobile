import { useLocalSearchParams } from "expo-router";

import { TicketScanner } from "@/components/TicketScanner";
import { goBack } from "@/lib/navigation";

export default function ScannerScreen() {
  const { eventId, title } = useLocalSearchParams<{ eventId: string; title?: string }>();

  return <TicketScanner eventId={eventId} title={title} onBack={() => goBack("/usher")} />;
}
