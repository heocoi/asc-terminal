import type {
  EngagementMetrics,
  CommerceMetrics,
  SubscriptionEventMetrics,
  SubscriptionStateMetrics,
  UsageMetricsData,
} from "./types";

function num(val: string | undefined): number {
  return parseFloat(val ?? "0") || 0;
}

// Group records by date and sum numeric fields
function groupByDate<T>(
  records: Record<string, string>[],
  dateField: string,
  mapper: (grouped: Record<string, string>[]) => T
): T[] {
  const byDate = new Map<string, Record<string, string>[]>();
  for (const r of records) {
    const date = r[dateField] ?? "";
    if (!date) continue;
    if (!byDate.has(date)) byDate.set(date, []);
    byDate.get(date)!.push(r);
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, rows]) => mapper(rows));
}

export function aggregateEngagement(records: Record<string, string>[]): EngagementMetrics[] {
  return groupByDate(records, "Date", (rows) => {
    let impressions = 0;
    let impressionsUnique = 0;
    let pageViews = 0;
    let pageViewsUnique = 0;
    let totalDownloads = 0;

    for (const r of rows) {
      impressions += num(r["Impressions"]);
      impressionsUnique += num(r["Impressions Unique"]) || num(r["Unique Impressions"]);
      pageViews += num(r["Product Page Views"]) || num(r["Page Views"]);
      pageViewsUnique += num(r["Product Page Views Unique"]) || num(r["Unique Page Views"]);
      totalDownloads += num(r["Total Downloads"]) || num(r["Downloads"]);
    }

    return {
      date: rows[0]["Date"],
      impressions,
      impressionsUnique,
      pageViews,
      pageViewsUnique,
      conversionRate: impressions > 0 ? totalDownloads / impressions : 0,
    };
  });
}

export function aggregateCommerce(records: Record<string, string>[]): CommerceMetrics[] {
  return groupByDate(records, "Date", (rows) => {
    let totalDownloads = 0;
    let proceeds = 0;
    let payingUsers = 0;
    let refunds = 0;

    for (const r of rows) {
      totalDownloads += num(r["Total Downloads"]) || num(r["Downloads"]);
      proceeds += num(r["Proceeds"]) || num(r["Developer Proceeds"]);
      payingUsers += num(r["Paying Users"]);
      refunds += num(r["Refunds"]) || num(r["Refunded Proceeds"]);
    }

    return { date: rows[0]["Date"], totalDownloads, proceeds, payingUsers, refunds };
  });
}

export function aggregateSubscriptionEvents(records: Record<string, string>[]): SubscriptionEventMetrics[] {
  return groupByDate(records, "Date", (rows) => {
    let trialStarts = 0;
    let trialConversions = 0;
    let paidStarts = 0;
    let renewals = 0;
    let voluntaryChurns = 0;
    let involuntaryChurns = 0;
    let billingIssueEntries = 0;
    let gracePeriodRecoveries = 0;

    for (const r of rows) {
      const event = r["Event"] ?? r["event"] ?? "";
      const count = num(r["Event Count"]) || num(r["Quantity"]) || 1;

      // Map event types to metrics
      if (event.includes("Free Trial") && event.includes("Start")) trialStarts += count;
      else if (event.includes("Trial") && event.includes("Conversion")) trialConversions += count;
      else if (event.includes("Paid") && event.includes("Start")) paidStarts += count;
      else if (event.includes("Renewal")) renewals += count;
      else if (event.includes("Voluntary") && event.includes("Churn")) voluntaryChurns += count;
      else if (event.includes("Involuntary") && event.includes("Churn")) involuntaryChurns += count;
      else if (event.includes("Billing Issue") && event.includes("Entry")) billingIssueEntries += count;
      else if (event.includes("Grace Period") && event.includes("Recovery")) gracePeriodRecoveries += count;
    }

    return {
      date: rows[0]["Date"],
      trialStarts,
      trialConversions,
      paidStarts,
      renewals,
      voluntaryChurns,
      involuntaryChurns,
      billingIssueEntries,
      gracePeriodRecoveries,
    };
  });
}

export function aggregateSubscriptionState(records: Record<string, string>[]): SubscriptionStateMetrics[] {
  return groupByDate(records, "Date", (rows) => {
    let activePaid = 0;
    let activeFreeTrial = 0;
    let activePaidOffer = 0;
    let billingIssue = 0;

    for (const r of rows) {
      const state = r["State"] ?? r["state"] ?? "";
      const count = num(r["Active Subscriptions"]) || num(r["Quantity"]) || num(r["Count"]);

      if (state.includes("Free Trial")) activeFreeTrial += count;
      else if (state.includes("Paid Offer") || state.includes("Introductory")) activePaidOffer += count;
      else if (state.includes("Billing Issue") || state.includes("Grace Period")) billingIssue += count;
      else if (state.includes("Active") || state.includes("Paid") || state.includes("Standard")) activePaid += count;
    }

    // MRR = activePaid * avg price (approximation, real MRR needs price data)
    // For now, we just store the count; MRR calculation happens at display layer
    return {
      date: rows[0]["Date"],
      activePaid,
      activeFreeTrial,
      activePaidOffer,
      billingIssue,
      mrr: 0, // populated later when price data is available
    };
  });
}

export function aggregateUsage(records: Record<string, string>[]): UsageMetricsData[] {
  return groupByDate(records, "Date", (rows) => {
    let sessions = 0;
    let crashes = 0;
    let activeDevices = 0;
    let installations = 0;
    let deletions = 0;

    for (const r of rows) {
      sessions += num(r["Sessions"]);
      crashes += num(r["Crashes"]);
      activeDevices += num(r["Active Devices"]) || num(r["Active in Last 30 Days"]);
      installations += num(r["Installations"]);
      deletions += num(r["Deletions"]);
    }

    return { date: rows[0]["Date"], sessions, crashes, activeDevices, installations, deletions };
  });
}
