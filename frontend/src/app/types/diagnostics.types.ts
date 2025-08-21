// Type definitions for the diagnostic response from backend
export interface OctokitTestResult {
  success: boolean;
  appName?: string;
  appOwner?: string;
  permissions?: Record<string, string | undefined>;
  error?: string;
}

export interface InstallationDiagnostic {
  index: number;
  installationId: number;
  accountLogin: string;
  accountId: string | number;
  accountType: string;
  accountAvatarUrl: string;
  appId: number;
  appSlug: string;
  targetType: string;
  permissions: Record<string, string | undefined>;
  events: string[];
  createdAt: string;
  updatedAt: string;
  suspendedAt: string | null;
  suspendedBy: { login: string; id: number } | null;
  hasOctokit: boolean;
  octokitTest: OctokitTestResult | null;
  isValid: boolean;
  validationErrors: string[];
}

export interface AppInfo {
  name: string;
  description: string;
  owner: string;
  htmlUrl: string;
  permissions: Record<string, string | undefined>;
  events: string[];
}

export interface DiagnosticsResponse {
  timestamp: string;
  appConnected: boolean;
  totalInstallations: number;
  installations: InstallationDiagnostic[];
  errors: string[];
  appInfo: AppInfo | null;
  summary: {
    validInstallations: number;
    invalidInstallations: number;
    organizationNames: string[];
    accountTypes: Record<string, number>;
  };
}
