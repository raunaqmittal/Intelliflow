// Department normalization and alias utilities used across the app

export const normalizeDept = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim();

// Common aliases and synonyms
const ALIASES: Record<string, string[]> = {
  qa: ['qualityassurance', 'testing', 'qatesting', 'qatest'],
  qualityassurance: ['qa', 'testing'],
  testing: ['qa', 'qualityassurance'],
  research: ['rnd', 'r&d', 'researchanddevelopment', 'randd'],
  development: ['dev', 'softwaredevelopment', 'engineering'],
  design: ['uiux', 'ui', 'ux', 'uiandux'],
};

export function expandDeptAliases(term: string): string[] {
  const n = normalizeDept(term);
  const set = new Set<string>([n]);
  for (const [k, vals] of Object.entries(ALIASES)) {
    if (n === k || vals.includes(n)) {
      set.add(k);
      vals.forEach(v => set.add(v));
    }
  }
  return Array.from(set);
}

export function matchesManagerDepartments(employeeDept: string, managerDepts: string[]): boolean {
  // Strict normalized equality only. Now that departments are normalized in the DB,
  // we must avoid overly-permissive substring matching which inflated results.
  if (!employeeDept || !managerDepts || managerDepts.length === 0) return false;
  const empKey = normalizeDept(employeeDept);
  // Allow manager aliases but only compare using exact normalized equality
  const mgrKeys = managerDepts.flatMap(expandDeptAliases).map(normalizeDept);
  const set = new Set(mgrKeys);
  return set.has(empKey);
}
