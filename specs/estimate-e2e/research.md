<!-- NO-EVIDENCE-NO-ACTION | NO-SOLO | POLICY-FIRST -->
# Research Dossier: Estimate-Only Canon

All open questions from specification have been resolved via policy review and historical audit data. Each item documents decision, primary reason, and considered alternatives.

## Topic 1: Authentication & Access Control
- **Decision**: Enforce corporate SSO with dual-approver release workflow for estimator access and rule updates.
- **Reason**: Aligns with NO-SOLO guardrail and existing governance that requires two-person approval for knowledge changes.
- **Alternatives**: Direct password login (rejected: violates security baseline); Token-only access (rejected: lacks approver evidence trail).

## Topic 2: Data & Log Retention
- **Decision**: Retain estimate payloads 24 months, QC/evidence logs 84 months, and purge anonymized aggregates quarterly.
- **Reason**: Matches audit obligations for electrical estimates while limiting storage buildup; keeps evidence available through warranty windows.
- **Alternatives**: 12-month retention (rejected: insufficient for delayed compliance checks); Indefinite retention (rejected: conflicts with privacy minimization).

## Topic 3: Concurrency & Performance Envelope
- **Decision**: Size workflows for 150 concurrent estimate sessions with peak p95 budget < 2000 ms to maintain 20% buffer under 2500 ms SLA.
- **Reason**: Mirrors historical peak usage plus seasonal uplift; leaves headroom for regression replay bursts.
- **Alternatives**: 50 concurrent (rejected: under-provisions shared factory tours); 250 concurrent (rejected: unnecessary infrastructure cost for current contracts).

## Topic 4: Evidence Storage Format
- **Decision**: Store JSON + SVG + log triplets in object storage keyed by `<phase>_<name>` and cross-link from responses.
- **Reason**: Maintains FIX-4 compliance and enables deterministic regression verification.
- **Alternatives**: PNG-only bundles (rejected: loses structured data); Inline Base64 (rejected: bloats API payloads).

## Topic 5: Knowledge Snapshot Approval
- **Decision**: Require regression PASS and representative sign-off before activating new knowledge ZIPs; store signature hash with snapshot metadata.
- **Reason**: Fulfills approval chain defined in acceptance criteria and prevents drift without traceability.
- **Alternatives**: Auto-promote latest ZIP (rejected: violates approval flow); Manual email acknowledgment (rejected: lacks machine-verifiable record).

