// What #4471 actually holds: one entry per problem, each with its own ticket. Pages explain it;
// this file is what runs.
//
// Counts follow the desk's own view (causes.ts, as CauseTable shows it): every report is placed by
// its tenant. The reports the desk read as a one-day move (desk-notes.json) stay counted where
// they're filed, under `parser`, and get their own ticket on top as `oneDayMove`.
import { groupByCause, readAs, type Cause, type CauseGroup, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = Cause | 'oneDayMove';

// The ticket each problem is filed as, in the repo this kb lives in.
export const TICKETS: Record<Problem, { issue: number; title: string; state: string }> = {
  parser: { issue: 1, title: 'Shared parser reads every date month first', state: 'fixed · fix(dates): parse dd/mm for eu locales' },
  hint: { issue: 2, title: 'booking-v3 prints MM/DD/YYYY under its date field', state: "won't fix · booking-v3 form retired" },
  oneDayMove: { issue: 3, title: 'Some dates move by one day', state: 'duplicate of #1 · filed under parser' },
};

export type ProblemRow = {
  problem: Problem | 'unplaced';
  reports: number;
  tenants: number;
  firstSeen: string;
  lastSeen: string;
  // Filed under another problem's count (oneDayMove → parser).
  within?: Problem;
};

export function problemRows(reports: Report[], tenantOf: (r: Report) => Tenant | undefined, oneDayMove: readonly string[]): ProblemRow[] {
  const groups: CauseGroup[] = groupByCause(reports, tenantOf);
  const rows: ProblemRow[] = groups.map((g) => ({
    problem: g.cause,
    reports: g.reports.length,
    tenants: g.tenants,
    firstSeen: g.firstSeen,
    lastSeen: g.lastSeen,
  }));
  for (const g of groups) {
    const moved = g.reports.filter((r) => oneDayMove.includes(r.id));
    if (!moved.length || g.cause === 'unplaced') continue;
    const days = moved.map((r) => r.receivedAt.slice(0, 10)).sort();
    rows.push({
      problem: 'oneDayMove',
      reports: readAs(g, oneDayMove),
      tenants: new Set(moved.map((r) => r.tenant)).size,
      firstSeen: days[0],
      lastSeen: days[days.length - 1],
      within: g.cause,
    });
  }
  return rows;
}
