export const ArtifactType = {
  DIFF: 'diff',
  FILE: 'file',
  REPORT: 'report',
  PR_DRAFT: 'pr_draft',
  SCREENSHOT: 'screenshot',
  LOG: 'log',
  GENERATED_ASSET: 'generated_asset',
} as const;

export type ArtifactTypeValue = (typeof ArtifactType)[keyof typeof ArtifactType];
