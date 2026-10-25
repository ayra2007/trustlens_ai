/**
 * Firestore Security Rules Test Specification (Dirty Dozen Verification)
 * Verifies that all 12 adversarial payloads in security_spec.md return PERMISSION_DENIED.
 */

export interface SecurityRuleTestCase {
  id: string;
  title: string;
  collectionPath: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  expectedOutcome: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_RULE_TESTS: SecurityRuleTestCase[] = [
  {
    id: 'DD-01',
    title: 'Unverified Email Write Rejected',
    collectionPath: '/projects/proj-aurora-2024',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-02',
    title: 'Shadow Field Injection Rejected via hasOnly()',
    collectionPath: '/projects/proj-aurora-2024',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-03',
    title: 'Identity Spoofing on Create Rejected',
    collectionPath: '/projects/proj-aurora-2024',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-04',
    title: 'Immutable ownerId Mutation Rejected on Update',
    collectionPath: '/projects/proj-aurora-2024',
    operation: 'update',
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-05',
    title: 'Client Timestamp Forgery Rejected (createdAt != request.time)',
    collectionPath: '/projects/proj-aurora-2024',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-06',
    title: 'Path Variable ID Poisoning Rejected',
    collectionPath: '/projects/invalid$id!with@bad#chars',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-07',
    title: 'Cross-User PII Read on /users/{uid}/private/info Rejected',
    collectionPath: '/users/user-alpha/private/info',
    operation: 'get',
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-08',
    title: 'Self-Assigned Privileged Role on Profile Creation Rejected',
    collectionPath: '/users/user-alpha',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-09',
    title: 'Unfiltered List Query Scraping Rejected',
    collectionPath: '/projects',
    operation: 'list',
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-10',
    title: 'Value Poisoning on Update Rejected by Validation Helper',
    collectionPath: '/projects/proj-aurora-2024',
    operation: 'update',
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-11',
    title: 'Immutable Audit Log Update/Delete Rejected',
    collectionPath: '/auditEntries/AUD-101',
    operation: 'update',
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-12',
    title: 'Orphaned Watchlist Item Creation Without Existing Parent Project Rejected',
    collectionPath: '/watchlist/WL-999',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
  },
];
