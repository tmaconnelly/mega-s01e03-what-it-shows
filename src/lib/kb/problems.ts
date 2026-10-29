// What #4471 actually holds: one entry per problem, each with its own ticket. Pages explain it;
// this file is what runs.
//
// causes.ts places a report by its tenant. That is right for the two date-order bugs, but the
// reports the desk read as a one-day move (desk-notes.json) are not a flipped date at all: the day
// shifts by one, and the tenant cannot explain that. They are their own problem, not footnotes.
import { causeOf, type Cause, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = Cause | 'shift';

// The ticket each problem is filed as, in the repo this kb lives in.
export const TICKETS: Record<Problem, { issue: number; title: string }> = {
  parser: { issue: 1, title: 'Shared parser reads every date month first' },
  hint: { issue: 2, title: 'booking-v3 prints MM/DD/YYYY under its date field' },
  shift: { issue: 3, title: 'Some dates move by one day' },
};

export const PROBLEMS: readonly Problem[] = ['parser', 'hint', 'shift'];

export function problemOf(r: Pick<Report, 'id' | 'channel'>, t: Tenant | undefined, oneDayMove: readonly string[]): Problem | null {
  if (oneDayMove.includes(r.id)) return 'shift';
  return causeOf(r, t);
}

export type ProblemGroup = {
  problem: Problem | 'unplaced';
  reports: Report[];
  tenants: string[];
  channels: Record<string, number>;
  // How many of these reports intake tagged as something else.
  mistagged: number;
  firstSeen: string;
  lastSeen: string;
};

export function groupByProblem(reports: Report[], tenantOf: (r: Report) => Tenant | undefined, oneDayMove: readonly string[]): ProblemGroup[] {
  const by = new Map<ProblemGroup['problem'], Report[]>();
  for (const r of reports) {
    const p = problemOf(r, tenantOf(r), oneDayMove) ?? 'unplaced';
    by.set(p, [...(by.get(p) ?? []), r]);
  }
  const rank = (p: ProblemGroup['problem']) => (p === 'unplaced' ? PROBLEMS.length : PROBLEMS.indexOf(p));
  return [...by.entries()]
    .map(([problem, rs]) => {
      const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
      return {
        problem,
        reports: rs,
        tenants: [...new Set(rs.map((r) => r.tenant))].sort(),
        channels: rs.reduce<Record<string, number>>((n, r) => ({ ...n, [r.channel]: (n[r.channel] ?? 0) + 1 }), {}),
        mistagged: rs.filter((r) => r.meta.intakeTag !== problem).length,
        firstSeen: days[0],
        lastSeen: days[days.length - 1],
      };
    })
    .sort((a, b) => rank(a.problem) - rank(b.problem));
}
