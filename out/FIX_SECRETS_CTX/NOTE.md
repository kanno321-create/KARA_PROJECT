Issue: GitHub rejected `${{ secrets.* }}` in job-level `if` clauses, causing `Unrecognized named-value: 'secrets'` on the deploy workflow.
Fix: Map `VERCEL_TOKEN` and `VERCEL_PROJECT` secrets into `jobs.deploy-staging.env` and `jobs.deploy-production.env`, then gate deployment steps with `${{ env.* }}` comparisons at step level.
Validation: `python -m yamllint .github/workflows/deploy.yml` (fails: UnicodeDecodeError from legacy smart-quote characters in workflow file; see lint.log).
