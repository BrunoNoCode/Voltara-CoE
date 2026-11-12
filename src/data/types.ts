export type EnvType = 'Production' | 'Sandbox' | 'Developer' | 'Default';
export type HealthStatus = 'Healthy' | 'Warning' | 'Attention';

export type ResourceType =
  | 'Canvas App'
  | 'Model-driven App'
  | 'Code App'
  | 'Cloud Flow'
  | 'Scheduled Flow'
  | 'Desktop Flow'
  /** Power Automate agent flow (workflow with modernflowtype = 1) — a flow, grouped under Power Automate. */
  | 'Agent Flow'
  | 'Copilot Studio'
  | 'AI Model'
  | 'Dataverse Table'
  | 'Classic Workflow'
  | 'Business Rule'
  | 'Custom Action'
  | 'Business Process Flow'
  | 'Other';

export type ResourceStatus = 'Published' | 'Draft' | 'On' | 'Off' | 'Suspended' | 'Active' | 'Inactive';
export type LicenseDesignation = 'Premium' | 'Standard';

export interface Environment {
  id: string;
  name: string;
  type: EnvType;
  region: string;
  flags: string[];
  /** Managed Environment (Power Platform governance feature). */
  managed: boolean;
  /** Power Platform environment group name, read from the admin API (read-only in the monitor). */
  group: string;
  /** Power Platform environment group ID. */
  groupId?: string;
  status: HealthStatus;
  created: string;
  lastSynced: string;
  lastActivity: string;
  url: string;
  organizationId: string;
  securityGroup?: { id: string; name: string };
  monitored: boolean;
  description?: string;
}

/** Copilot Studio agent harness: the Standard harness or the Microsoft Copilot harness. */
export type AgentHarness = 'Standard' | 'MSFT Copilot';

export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  envId: string;
  owner: string;
  /** Owner's e-mail / UPN (systemuser internalemailaddress, domainname) — used to match Azure group members. */
  ownerEmail?: string;
  ownerUpn?: string;
  /** Canvas / code apps: the app GUID (canvasapp.name) used by the apps.powerapps.com play link. */
  appId?: string;
  tags: string[];
  status: ResourceStatus;
  /** Flows only: Premium when the flow uses a premium connector. */
  license?: LicenseDesignation;
  /** Flows only: connectors used (from the flow's connection references). */
  connectors?: string[];
  /** Copilot Studio agents only: the agent harness ("Powered by"). undefined = unknown / not an agent. */
  poweredBy?: AgentHarness;
  /** Dataverse tables only: EntityDefinitions IsCustomEntity. undefined = unknown / not a table. */
  customTable?: boolean;
  /** Display names of the (visible, non-default) solutions containing the resource. [] = not in a solution, undefined = unknown. */
  solutions?: string[];
  /** Cloud / scheduled / agent flows: runs in the last 30 days (flowrun table). undefined = unknown. */
  runs30d?: number;
  /** Failed runs among runs30d. */
  failedRuns30d?: number;
  /** True when run counting stopped at its page cap, so runs30d is a lower bound. */
  runsPartial?: boolean;
  /** Start time of the latest run within the last 30 days (flows only). */
  lastRun?: string;
  modified: string;
}

export type TagRule = 'Owner' | 'Owner (AAD Group)' | 'Environment' | 'Manual' | 'Resource Type' | 'Connection';

/** Resource categories a rule-based tag can apply to. */
export type TagCategory =
  | 'Cloud / Desktop Flow'
  | 'Scheduled Flow'
  | 'Canvas App'
  | 'Model-Driven App'
  | 'Code App'
  | 'AI Model'
  | 'Dataverse Tables'
  | 'Agent Flow'
  | 'Copilot Studio';

export type ConditionField = 'Owner' | 'Environment' | 'Azure Group Owner';
export type ConditionOperator = 'is' | 'is not' | 'contains';

/** A user imported from an Entra (Azure AD) group — direct or nested member. */
export interface GroupMember {
  name: string;
  mail?: string;
  upn?: string;
}

/** Snapshot of an Entra group's transitive members, taken when the rule was created or refreshed. */
export interface GroupSnapshot {
  id: string;
  name: string;
  members: GroupMember[];
  importedAt: string;
  /** True when only direct members could be read (nested groups not expanded). */
  directOnly?: boolean;
}

export interface TagCondition {
  id: string;
  field: ConditionField;
  /** Owner: is / is not / contains. Environment: is / is not. Azure Group Owner: is (member) / is not (member). */
  operator: ConditionOperator;
  /** Owner names (or text for "contains"), or environment IDs. Empty for Azure Group Owner. */
  values: string[];
  group?: GroupSnapshot;
}

export interface Tag {
  id: string;
  name: string;
  description: string;
  /** Display summary of the rule (legacy tags store one of TagRule). */
  rule: string;
  /** Display summary of what the tag applies to. */
  appliesTo: string;
  /** Stored count for legacy tags; rule-based tags are counted live from the loaded resources. */
  resources: number;
  active: boolean;
  kind: 'resource' | 'flag';
  /** Rule-based tags: categories the tag applies to ('all' = every category). */
  categories?: TagCategory[] | 'all';
  /** Rule-based tags: conditions that select resources. */
  conditions?: TagCondition[];
  /** How conditions combine: all must match (AND, default) or any (OR). */
  match?: 'all' | 'any';
}

export interface Activity {
  id: string;
  title: string;
  subtitle: string;
  kind: 'app' | 'flow' | 'env' | 'ai';
  minutesAgo: number;
}
