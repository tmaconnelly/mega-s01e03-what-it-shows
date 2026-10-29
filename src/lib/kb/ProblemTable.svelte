<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import { uniqueById, type Report } from '#lib/kb/causes';
  import { problemRows, TICKETS } from '#lib/kb/problems';
  import { tenantOf } from '#lib/kb/locales';

  let { ticket, repo }: { ticket: number; repo: string } = $props();

  const merged = $derived(uniqueById(reports as Report[]).filter((r) => r.mergedInto === ticket));
  const rows = $derived(problemRows(merged, tenantOf, notes.oneDayMove));
  const filed = $derived(rows.filter((r) => r.problem !== 'unplaced').length);
</script>

<p class="sum">
  <strong>{merged.length}</strong> reports merged into #{ticket} ·
  <strong>{filed}</strong>
  {filed === 1 ? 'ticket' : 'tickets'}
</p>

<table>
  <thead>
    <tr><th>ticket</th><th>problem</th><th>reports</th><th>tenants</th><th>seen</th><th>state</th></tr>
  </thead>
  <tbody>
    {#each rows as r (r.problem)}
      <tr class:unplaced={r.problem === 'unplaced'} class:within={r.within}>
        {#if r.problem === 'unplaced'}
          <td>—</td><td><code>unplaced</code>: no tenant on file</td>
        {:else}
          <td><a href="https://github.com/{repo}/issues/{TICKETS[r.problem].issue}">#{TICKETS[r.problem].issue}</a></td>
          <td><code>{r.problem}</code> · {TICKETS[r.problem].title}</td>
        {/if}
        <td><strong>{r.reports}</strong>{#if r.within}<span class="small"> of <code>{r.within}</code>'s</span>{/if}</td>
        <td>{r.tenants}</td>
        <td class="small">{r.firstSeen} → {r.lastSeen}</td>
        <td class="small">{r.problem === 'unplaced' ? 'open' : TICKETS[r.problem].state}</td>
      </tr>
    {/each}
  </tbody>
</table>

<style>
  .sum { font-size: 1.1rem; }
  .small { color: var(--muted); font-size: 0.85em; }
  .unplaced td { background: var(--warn-bg); }
  .within td:first-child { padding-left: 1.25rem; }
</style>
