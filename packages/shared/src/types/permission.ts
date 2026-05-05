export interface PermissionPolicy {
  id: string;
  name: string;
  description: string;
  fileScopes: string[];
  networkScopes: string[];
  shellScopes: ('read_only' | 'build_test' | 'write' | 'network' | 'destructive')[];
  githubScopes: string[];
  approvalRules: ApprovalRule[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ApprovalRule {
  action: string;
  risk: 'low' | 'medium' | 'high';
  requiresApproval: boolean;
}
