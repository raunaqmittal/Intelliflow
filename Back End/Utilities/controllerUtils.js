'use strict';

/**
 * Utilities shared across controllers.
 */

/**
 * Normalizes a phone number to E.164 format (+<digits>).
 * Strips all non-numeric characters and prepends '+'.
 * Returns undefined if no digits are present.
 */
const normalizePhone = (phone) => {
  if (!phone) return undefined;
  const digits = phone.replace(/[^0-9]/g, '');
  if (!digits) return undefined;
  return `+${digits}`;
};

/**
 * Department alias map for fuzzy department matching.
 * Maps canonical department keys to their accepted aliases.
 */
const DEPT_ALIASES = {
  qa: ['qualityassurance', 'testing', 'qatesting', 'qatest'],
  qualityassurance: ['qa', 'testing'],
  testing: ['qa', 'qualityassurance'],
  research: ['rnd', 'r&d', 'researchanddevelopment', 'randd'],
  development: ['dev', 'softwaredevelopment', 'engineering'],
  engineering: ['development', 'dev', 'softwaredevelopment'],
  design: ['uiux', 'ui', 'ux', 'uiandux'],
};

/** Normalizes a department string for alias comparison. */
const normalizeDept = (d) => (d || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim();

/**
 * Expands a single department term into all its aliases.
 * Returns an array of normalized strings including the term itself.
 */
const expandDeptAliases = (term) => {
  const n = normalizeDept(term);
  const set = new Set([n]);
  for (const [k, vals] of Object.entries(DEPT_ALIASES)) {
    if (n === k || vals.includes(n)) {
      set.add(k);
      vals.forEach((v) => set.add(v));
    }
  }
  return Array.from(set);
};

/**
 * Expands a list of department terms to all their aliases.
 */
const expandDeptList = (list) =>
  (Array.isArray(list) ? list : []).flatMap(expandDeptAliases).map(normalizeDept);

module.exports = { normalizePhone, DEPT_ALIASES, normalizeDept, expandDeptAliases, expandDeptList };
