# TrustLens Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. **Default-Deny Catch-All**: Any path not explicitly matched is denied for all `read` and `write` operations.
2. **Verified Identity Enforcement**: Every write operation requires `request.auth != null && request.auth.token.email_verified == true`.
3. **PII Isolation (Split Collection)**: User email addresses are stored exclusively in `/users/{userId}/private/info` and restricted strictly to the owner (`request.auth.uid == userId`). Public profile documents at `/users/{userId}` never store email or phone numbers.
4. **Privilege Escalation Prevention**: During creation of `/users/{userId}`, `role` is restricted to `'Analyst'` (users cannot self-assign privileged roles or modify `role` on update unless they are an explicit admin in `/admins/{uid}`).
5. **Relational Ownership & Query Enforcement**: Every document in `/projects/{projectId}`, `/auditEntries/{auditId}`, and `/watchlist/{itemId}` must have `ownerId == request.auth.uid`. Every `allow list` rule enforces `resource.data.ownerId == request.auth.uid` on the server without delegating filtering to the client.
6. **Temporal Integrity & Immutability**: `createdAt == request.time` on `create`, `updatedAt == request.time` on `update`, and `ownerId` / `createdAt` / `id` are immutable across all updates.
7. **Audit Log Immutability**: Documents in `/auditEntries/{auditId}` are append-only (`allow update, delete: if false;`).

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Payload 1 (Unverified Email Write)**: `auth: { uid: 'u1', token: { email_verified: false } }` attempting to create `/projects/p1` -> `PERMISSION_DENIED`.
2. **Payload 2 (Shadow Field Injection)**: Creating `/projects/p1` with an undeclared field `isSuperVerified: true` -> `PERMISSION_DENIED` via `.keys().hasOnly(...)`.
3. **Payload 3 (Identity Spoofing on Create)**: Authenticated as `u1` creating `/projects/p1` with `ownerId: 'u2'` -> `PERMISSION_DENIED`.
4. **Payload 4 (Owner Mutation on Update)**: Authenticated as `u1` updating `/projects/p1` to change `ownerId` to `'u2'` -> `PERMISSION_DENIED`.
5. **Payload 5 (Client Timestamp Forgery)**: Creating `/projects/p1` with a past/future `createdAt` timestamp != `request.time` -> `PERMISSION_DENIED`.
6. **Payload 6 (Path ID Poisoning)**: Creating a project with a 300-character or special-character document ID -> `PERMISSION_DENIED` via `isValidId()`.
7. **Payload 7 (PII Cross-User Read)**: Authenticated as `u2` attempting `get` on `/users/u1/private/info` -> `PERMISSION_DENIED`.
8. **Payload 8 (Self-Assigned Reviewer Role)**: Authenticated as `u1` creating `/users/u1` with `role: 'Reviewer'` without admin status -> `PERMISSION_DENIED`.
9. **Payload 9 (Unauthorized List Scraping)**: Authenticated as `u1` listing `/projects` without `where('ownerId', '==', 'u1')` -> `PERMISSION_DENIED`.
10. **Payload 10 (Value Poisoning on Update)**: Updating `companyName` on `/projects/p1` with a 5,000-character string or integer -> `PERMISSION_DENIED` via `isValidProject(incoming())`.
11. **Payload 11 (Audit Log Tampering)**: Authenticated owner `u1` attempting to `update` or `delete` `/auditEntries/aud1` -> `PERMISSION_DENIED`.
12. **Payload 12 (Orphaned Watchlist Item)**: Creating `/watchlist/w1` referencing a non-existent `projectId` -> `PERMISSION_DENIED` via `exists(/databases/$(database)/documents/projects/$(incoming().projectId))`.
