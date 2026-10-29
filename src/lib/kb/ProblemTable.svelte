<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import { uniqueById, type Report } from '#lib/kb/causes';
  import { groupByProblem, TICKETS } from '#lib/kb/problems';
  import { tenantOf } from '#lib/kb/locales';

  let { ticket, repo }: { ticket: number; repo: string } = $props();

  const merged = $derived(uniqueById(reports as Report[]).filter((r) => r.mergedInto === ticket));
  const groups = $derived(groupByProblem(merged, tenantOf, notes.oneDayMove));
  const filed = $derived(groups.filter((g) => g.problem !== 'unplaced').length);
  const channels = (c: Record<string, number>) =>
    Object.entries(c)
      .sort((a, b) => b[1] - a[1])
      .map(([ch, n]) => `${ch} ×${n}`)
      .join(' · ');
</script>

<p class="sum">
  <strong>{merged.length}</strong> reports merged into #{ticket} ·
  <strong>{filed}</strong>
  {filed === 1 ? 'problem' : 'problems'}, one ticket each
</p>

<table>
  <thead>
    <tr><th>ticket</th><th>problem</th><th>reports</th><th>tenants</th><th>channels</th><th>mistagged</th><th>seen</th></tr>
  </thead>
  <tbody>
    {#each groups as g (g.problem)}
      <tr class:unplaced={g.problem === 'unplaced'}>
        {#if g.problem === 'unplaced'}
          <td>—</td><td><code>unplaced</code>: no tenant on file</td>
        {:else}
          <td><a href="https://github.com/{repo}/issues/{TICKETS[g.problem].issue}">#{TICKETS[g.problem].issue}</a></td>
          <td><code>{g.problem}</code> · {TICKETS[g.problem].title}</td>
        {/if}
        <td><strong>{g.reports.length}</strong></td>
        <td>{g.tenants.length}</td>
        <td class="small">{channels(g.channels)}</td>
        <td>{g.mistagged}</td>
        <td class="small">{g.firstSeen} → {g.lastSeen}</td>
      </tr>
    {/each}
  </tbody>
</table>

<style>
  .sum { font-size: 1.1rem; }
  .small { color: var(--muted); font-size: 0.85em; }
  .unplaced td { background: var(--warn-bg); }
</style>
