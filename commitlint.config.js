/**
 * Conventional Commits, enforced on `commit-msg`.
 *
 * `agent_rules/04-committing.md` states the conventions; this is what makes
 * them hold. The body-line cap is off because that file asks for bulleted,
 * multi-line messages and the default 100-column wrap fights them.
 */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'body-max-line-length': [0, 'always'],
    'footer-max-line-length': [0, 'always'],
  },
};
