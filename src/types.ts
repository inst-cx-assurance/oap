export interface OapRecord {
  id: string;
  entityType: string;
  recordVersion: string;
  createdAt: string;
  supersedes?: string;
  generationMethod?: 'human_supplied' | 'system_capture';
  [key: string]: unknown;
}

export interface OapPackage {
  $schema: string;
  schemaVersion: string;
  manifest: {
    packageId: string;
    packageVersion: string;
    manifestVersion: string;
    oapVersion: string;
    createdAt: string;
    producedByPartyId: string;
    projectId: string;
    outcomeIds: string[];
    authorizationBoundaryIds: string[];
    profiles: Array<{ profileId: string; profileVersion: string }>;
    inventory: Array<{
      recordId: string;
      entityType: string;
      recordVersion: string;
      supersessionStatus: 'current' | 'superseded';
      supersedesRecordId?: string;
    }>;
    qualifications: string[];
    exclusions: string[];
    contentHash: { algorithm: 'sha256'; value: string };
    canonicalizationMethod: 'OAP Canonical JSON v0.1';
  };
  records: OapRecord[];
}

export interface Diagnostic {
  code: string;
  path: string;
  message: string;
  supportingRecordIds: string[];
}
