export interface ToolDefinition {
  id: string;
  name: string;
  type: 'local' | 'mcp_server' | 'skill' | 'plugin';
  description: string;
  config: Record<string, unknown>;
  permissionManifest: string[];
  createdAt: Date;
  updatedAt: Date;
}
