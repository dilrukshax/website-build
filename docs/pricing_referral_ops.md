# Pricing + Referral Ops Notes

## Daily Points Expiry Sweep

- Command:
  - `npm --workspace=@project-aurora/website-builder-api run referrals:sweep-expired-points`
- Expected output:
  - JSON payload with `{ accounts, expiredPoints }`.
- Recommended cadence:
  - Run once per day at UTC midnight.

## Manual Billing Workflow

1. Owner submits a plan change or add-on request from `/dashboard/billing`.
2. A `pending` billing charge is created.
3. Superadmin confirms or rejects from `/dashboard/superadmin/billing`.
4. On confirm:
   - Tenant plan/subscription/add-ons are applied.
   - Tenant wallet credit auto-applies to net charge.
   - Referral paid milestone rewards are processed.

## Referral Review Workflow

1. Referral claim requires a valid `proofToken` from `/api/device-check`.
2. Risky claims enter `verify`/`review` states.
3. Superadmin can approve/block from `/dashboard/superadmin/referrals`.
4. Enterprise upgrades create pending enterprise reward candidates.
5. Superadmin selects `small|medium|large` tier or rejects.

