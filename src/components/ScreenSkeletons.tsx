import type { Href } from "expo-router";
import { StyleSheet, View } from "react-native";

import {
  Bone,
  SkeletonCard,
  SkeletonChips,
  SkeletonEventCard,
  SkeletonEyebrow,
  SkeletonHeading,
  SkeletonHero,
  SkeletonList,
  SkeletonListRow,
  SkeletonPageTitle,
  SkeletonProgressCard,
  SkeletonScreen,
  SkeletonSettingsCard,
  SkeletonStatRow,
  SkeletonThumbList,
} from "@/components/Skeleton";

/**
 * One loading skeleton per screen, each laid out like the screen it stands
 * in for (see Skeleton.tsx for the building blocks). Kept together so the
 * screens themselves only swap `<LoadingScreen />` for one line.
 */

// ── Organizer ──────────────────────────────────────────────────────────

export function OrganizerHomeSkeleton() {
  return (
    <SkeletonScreen tabBar>
      <SkeletonHeading />
      <SkeletonChips />
      <SkeletonHero />
      <SkeletonStatRow />
      <SkeletonProgressCard rows={4} />
    </SkeletonScreen>
  );
}

export function OrganizerTicketsSkeleton() {
  return (
    <SkeletonScreen tabBar>
      <View style={styles.titleBlock}>
        <SkeletonPageTitle>Tickets</SkeletonPageTitle>
        <Bone width="70%" height={13} />
      </View>
      <SkeletonEventCard />
      <SkeletonEventCard />
    </SkeletonScreen>
  );
}

export function OrganizerBarSkeleton() {
  return (
    <SkeletonScreen tabBar>
      <SkeletonPageTitle>Bar</SkeletonPageTitle>
      <SkeletonHero />
      <SkeletonProgressCard rows={3} />
      <SkeletonProgressCard rows={3} />
    </SkeletonScreen>
  );
}

export function EventTicketsSkeleton({ title }: { title?: string }) {
  return (
    <SkeletonScreen title={title ?? "Ticket sales"} backHref="/organizer/tickets">
      <Bone height={160} radius={20} />
      <SkeletonStatRow />
      <SkeletonEyebrow />
      <View style={styles.grid}>
        {[0, 1, 2, 3].map((i) => (
          <SkeletonCard key={i} style={styles.gridCard}>
            <Bone width="40%" height={10} />
            <Bone width="75%" height={14} />
            <Bone width="55%" height={11} />
          </SkeletonCard>
        ))}
      </View>
      <SkeletonEyebrow />
      <Bone height={52} radius={16} />
    </SkeletonScreen>
  );
}

/** A plain list of sale rows under a top bar (bar → recent, bar → by event). */
export function TitledListSkeleton({ title, backHref }: { title: string; backHref: Href }) {
  return (
    <SkeletonScreen title={title} backHref={backHref}>
      <SkeletonList rows={8} />
    </SkeletonScreen>
  );
}

export function BarDrinksSkeleton() {
  return (
    <SkeletonScreen title="Drinks" backHref="/organizer/bar">
      <SkeletonProgressCard rows={6} thumb={false} title={false} />
    </SkeletonScreen>
  );
}

export function NotificationsSkeleton() {
  return (
    <SkeletonScreen title="Notifications" backHref="/organizer/account/menu">
      <SkeletonSettingsCard rows={4} />
    </SkeletonScreen>
  );
}

/** Content only — the happy-hour screen keeps its real top bar. */
export function HappyHourEventsSkeleton() {
  return (
    <SkeletonScreen bare>
      <Bone width="80%" height={13} />
      <SkeletonThumbList rows={4} />
    </SkeletonScreen>
  );
}

/** Content only — the happy-hour screen keeps its real top bar. */
export function HappyHourCampaignsSkeleton() {
  return (
    <SkeletonScreen bare>
      <Bone height={52} radius={16} />
      {[0, 1].map((i) => (
        <SkeletonCard key={i} style={styles.paddedCard}>
          <View style={styles.spaceBetween}>
            <Bone width={90} height={14} />
            <Bone width={50} height={12} />
          </View>
          <Bone width="50%" height={12} />
          {[0, 1, 2].map((j) => (
            <View key={j} style={styles.spaceBetween}>
              <Bone width="45%" height={13} />
              <Bone width="25%" height={13} />
            </View>
          ))}
        </SkeletonCard>
      ))}
    </SkeletonScreen>
  );
}

/** Content only — the new-happy-hour screen keeps its real top bar. */
export function HappyHourNewSkeleton() {
  return (
    <SkeletonScreen bare>
      <SkeletonEyebrow />
      <SkeletonThumbList rows={4} />
      <SkeletonEyebrow />
      <SkeletonChips />
    </SkeletonScreen>
  );
}

// ── Usher ──────────────────────────────────────────────────────────────

export function UsherHomeSkeleton() {
  return (
    <SkeletonScreen tabBar>
      <View style={styles.spaceBetweenCenter}>
        <SkeletonPageTitle>Your event</SkeletonPageTitle>
        <Bone width={120} height={36} radius={999} />
      </View>
      <SkeletonEventCard
        coverHeight={320}
        footer={
          <View style={styles.cardFooter}>
            <Bone height={52} radius={16} />
          </View>
        }
      />
    </SkeletonScreen>
  );
}

/** Where the camera viewfinder will be. */
export function ScannerSkeleton({ title = "Scan" }: { title?: string }) {
  return (
    <SkeletonScreen tabBar>
      <SkeletonPageTitle>{title}</SkeletonPageTitle>
      <Bone height={360} radius={24} />
      <Bone height={52} radius={16} />
    </SkeletonScreen>
  );
}

// ── Cashier ────────────────────────────────────────────────────────────

export function CashierHomeSkeleton() {
  return (
    <SkeletonScreen tabBar>
      <SkeletonHeading />
      <SkeletonHero />
      <SkeletonEyebrow />
      <SkeletonStatRow />
      <SkeletonEyebrow />
      <SkeletonStatRow />
    </SkeletonScreen>
  );
}

export function CashierTicketsSkeleton() {
  return (
    <SkeletonScreen tabBar>
      <SkeletonPageTitle>Tickets</SkeletonPageTitle>
      <SkeletonStatRow />
      <SkeletonEyebrow />
      {/* The real rows sit flush on the page, not in a card. */}
      <View>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <SkeletonListRow key={i} />
        ))}
      </View>
    </SkeletonScreen>
  );
}

export function CashierBarSkeleton() {
  return (
    <SkeletonScreen tabBar>
      <SkeletonPageTitle>Bar</SkeletonPageTitle>
      <SkeletonHero />
      <SkeletonEyebrow />
      <SkeletonList rows={5} />
    </SkeletonScreen>
  );
}

const styles = StyleSheet.create({
  titleBlock: {
    gap: 8,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  gridCard: {
    flexBasis: "47%",
    flexGrow: 1,
    borderRadius: 16,
    padding: 14,
    gap: 8,
  },
  paddedCard: {
    padding: 20,
    gap: 14,
  },
  spaceBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  spaceBetweenCenter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardFooter: {
    padding: 16,
  },
});
