# Voltara-CoE
Goddess of power watching over your platform.

Code App that brings Center of Excellence monitoring into one clear view.

## Deployment

### 1. Prerequisites

Source: https://learn.microsoft.com/en-us/power-apps/developer/code-apps/overview#prerequisites

- Your IDE of choice. For example, [Visual Studio Code](https://code.visualstudio.com/)
- [Node.js (LTS)](https://nodejs.org/)
- [Git](https://git-scm.com/)
- [Power Apps CLI](https://learn.microsoft.com/en-us/power-apps/developer/code-apps/reference/cli)


- A Power Platform environment with **code apps enabled** (Power Platform admin center → Environment → Settings → Features).
- License end users with **Power Apps Premium**.
- Admin rights: users need tenant or System Administrator at Environment level to see most of the data.

### 2. Install and sign in

Install the Power Apps CLI (`pa`) and the project dependencies:

```bash
npm install -g @microsoft/power-apps-cli
npm install
```

```bash
pa auth login
```

Check the active account with `pa auth status`, and change it with `pa auth switch --account <user@contoso.com>`.

### 3. Initial Setup | Test it locally and push it to Power Apps

- Generate `power.config.json` (this also selects the target environment)
```bash
pa app init --display-name "<app-display-name>" --environment-id <your-env-id>
```
- Build and push your Code App to the environment
```bash
npm run build
pa app push
```

At this time you will have the `power.config.json` with the following fields updated:

- `environmentId`: your target environment ID.
- `appId`: leave it out on the first deployment; the first push creates the app.
- `appDisplayName`: the name you want the app to have.

You still need to configure connections otherwise it will fail to fetch data.

### 4. Create connections and add them to the app

> [!TIP]
> **Quick tip**
> 
> You can avoid doing the below steps by using dummy IDs - and the user will need to create it when they open the app:
> - Avoid doing the below steps connection by connection! Be lazy :)
> - You can reuse the `power.config.example.json` and copy the connection references section.
> - This way the connections will be created when the users opens the app and you don't need to do this process manually.

In the target environment, create a connection for each connector:

- Power Platform for Admins V2
- Microsoft Dataverse
- Office 365 Groups
- Office 365 Outlook
- Power Apps for Admins
- HTTP with Microsoft Entra ID (preauthorized)

You can create them in the maker portal or with the CLI, then find their IDs. Then add each one to the app, which writes the real connection reference IDs into `power.config.json`:

```bash
pa connection create --connector <connector-id>
pa connection list
pa app add data-source --connector <connector-id> --connection-id <connection-id>
```

Connector IDs: `shared_powerplatformadminv2`, `shared_commondataserviceforapps`, `shared_office365groups`, `shared_office365`, `shared_powerappsforadmins`, `shared_webcontents`. Use `pa connector list --search <name>` to confirm them.

The HTTP with Microsoft Entra ID connector - shared_webcontents - should be configured with:.

### 5. Build and push

```bash
npm run build
pa app push
```

To deploy into a solution for ALM, use `pa app push --solution-id <solution-id>` (find the ID with `pa solution list`).

To test locally against the Power Apps host, run `npm run dev` and then `pa app run`.

### 6. Share the app

Share the app with `pa app share --principal <emails-or-object-ids>`.


## Configuration Settings

| File | What it controls |
|---|---|
| `power.config.json` → `appDisplayName` | The app name in Power Apps (maker portal, app list). |
| [index.html](index.html) → `<title>` | The browser tab title. |
| [src/config/branding.json](src/config/branding.json) | Brand name, app name, tagline and footer shown in the sidebar. |


## PRO Tips
If you want your users to use your own connection (and not theirs), you can add `sharedConnectionId` for the connection references. E.g.:

```bash
	"00000000-0000-0000-0000-000000000007": {
      "id": "/providers/Microsoft.PowerApps/apis/shared_webcontents",
      "displayName": "HTTP with Microsoft Entra ID (preauthorized)",
      "dataSources": [
        "webcontents"
      ],
      "authenticationType": "EntraAuth",
      "sharedConnectionId": "/providers/Microsoft.PowerApps/apis/shared_webcontents/connections/00000000000000000000000000000000",
      "dataSets": {}
    }
```

## API References

| API / Connector | Operations / endpoints used | Where it's used |
|---|---|---|
| **Power Platform for Admins V2** (`PowerPlatformforAdminsV2Service`) | `ListEnvironmentsForUser` (paged via `nextLink` / `$skip`), `QueryResources`, `ListEnvironmentGroups`, `GetEnvironmentGroup` | [src/data/liveEnvironments.ts](src/data/liveEnvironments.ts) → consumed by [src/pages/Environments.tsx](src/pages/Environments.tsx), [src/pages/EnvironmentDetails.tsx](src/pages/EnvironmentDetails.tsx), [src/state/AppStore.tsx](src/state/AppStore.tsx) |
| | `GetManyEnvironmentEntitlements` (Copilot capacity) | [src/data/liveCopilotCapacity.ts](src/data/liveCopilotCapacity.ts) → consumed by [src/pages/AiHub.tsx](src/pages/AiHub.tsx), [src/lib/aiHubSync.ts](src/lib/aiHubSync.ts) |
| | `GetTenantResourcesAcrossEnvironments` (resource consumption) | [src/data/liveResourceConsumption.ts](src/data/liveResourceConsumption.ts) → consumed by [src/pages/AiHub.tsx](src/pages/AiHub.tsx), [src/lib/aiHubSync.ts](src/lib/aiHubSync.ts) |
| | `UpsertResourceThreshold` | [src/data/liveThresholds.ts](src/data/liveThresholds.ts) → consumed by [src/pages/AiThresholds.tsx](src/pages/AiThresholds.tsx), [src/pages/AiHub.tsx](src/pages/AiHub.tsx), [src/lib/thresholdJobs.ts](src/lib/thresholdJobs.ts), [src/lib/aiThresholds.ts](src/lib/aiThresholds.ts) |
| | `ListCloudFlows` | [src/data/liveFlows.ts](src/data/liveFlows.ts) |
| **Power Apps for Admins** (`PowerAppsforAdminsService`) | `Get_AdminApps` (canvas app inventory) | [src/data/liveResources.ts](src/data/liveResources.ts) → consumed by [src/pages/ActionCenter.tsx](src/pages/ActionCenter.tsx), [src/lib/actions.ts](src/lib/actions.ts), [src/lib/useEvaluationSync.ts](src/lib/useEvaluationSync.ts) |
| | `Remove_AdminApp` (delete canvas app) | [src/lib/deleteJobs.ts](src/lib/deleteJobs.ts) |
| **Microsoft Dataverse** (`MicrosoftDataverseService`) | `ListRecordsWithOrganization` (FetchXML via `runFetch` / `fetchAllRows`) on `workflows` (desktop flows) and `systemusers` (owner lookup) | [src/data/liveFlows.ts](src/data/liveFlows.ts), [src/data/liveFlowAiConsumption.ts](src/data/liveFlowAiConsumption.ts) |
| | `ListRecordsWithOrganization` on `EntityDefinitions`, `solutions`, `canvasapps`, `appmodules`, `bots`, `msdyn_aimodels`, `workflows` | [src/data/liveResources.ts](src/data/liveResources.ts), [src/data/resourceDetails.ts](src/data/resourceDetails.ts) (also reads solution layers) |
| | `DeleteRecordWithOrganization` (`appmodules` for model-driven apps; `workflows` for cloud, scheduled, desktop and agent flows) | [src/lib/deleteJobs.ts](src/lib/deleteJobs.ts) → consumed by [src/pages/ActionCenter.tsx](src/pages/ActionCenter.tsx), [src/pages/ActionRuleBuilder.tsx](src/pages/ActionRuleBuilder.tsx), [src/components/DeleteHistoryPanel.tsx](src/components/DeleteHistoryPanel.tsx) |
| **Office 365 Groups** (`Office365GroupsService`), proxying **Microsoft Graph v1.0** | `HttpRequestV2` → `GET /groups?$search` (`ConsistencyLevel: eventual`), `/groups?$filter=startswith`, `/groups/{id}`, `/groups/{id}/members`, `/groups/{id}/transitiveMembers`, `/directoryObjects/{id}` | [src/data/liveGroups.ts](src/data/liveGroups.ts) → consumed by [src/pages/CreateResourceTagPanel.tsx](src/pages/CreateResourceTagPanel.tsx) (group search and members), [src/pages/EnvironmentDetails.tsx](src/pages/EnvironmentDetails.tsx) (security group name), [src/lib/groupSync.ts](src/lib/groupSync.ts) (members) |
| | `ListGroups` (fallback), `ListGroupMembers` | [src/data/liveGroups.ts](src/data/liveGroups.ts) |
| **Office 365 Outlook** (`Office365OutlookService`) | `SendEmailV2` | [src/lib/sendJobs.ts](src/lib/sendJobs.ts) → consumed by [src/pages/ActionCenter.tsx](src/pages/ActionCenter.tsx), [src/pages/ActionRuleBuilder.tsx](src/pages/ActionRuleBuilder.tsx), [src/components/SendHistoryPanel.tsx](src/components/SendHistoryPanel.tsx), [src/components/TopBar.tsx](src/components/TopBar.tsx) (notifications) |
| **HTTP with Microsoft Entra ID (preauthorized)**, proxying the **Copilot Studio (Power Virtual Agents) API** | `InvokeHttp` → `POST https://powerva.microsoft.com/api/botmanagement/v1/analytics/environments/{envId}/agent-ops/billing` and the same path plus `/summary` (`?utcStartTime=…&utcEndTime=…`) | [src/data/liveAgentBilling.ts](src/data/liveAgentBilling.ts) → consumed by [src/pages/AiHub.tsx](src/pages/AiHub.tsx), [src/lib/aiHubSync.ts](src/lib/aiHubSync.ts) |


The app also builds links out to these portals. They’re links only, not API calls:


| Portal | What it links to | Where it's built |
|---|---|---|
| `admin.powerplatform.microsoft.com` | Environment and environment group pages in the Power Platform admin center | [src/data/liveEnvironments.ts](src/data/liveEnvironments.ts) (`ppacEnvironmentUrl`, `ppacEnvironmentGroupUrl`), [src/pages/EnvironmentDetails.tsx](src/pages/EnvironmentDetails.tsx), [src/pages/AiThresholds.tsx](src/pages/AiThresholds.tsx) |
| `make.powerapps.com` / `apps.powerapps.com` | Open or edit apps and solutions | [src/lib/actions.ts](src/lib/actions.ts), [src/data/resourceDetails.ts](src/data/resourceDetails.ts) |
| `make.powerautomate.com` | Open flows | [src/lib/actions.ts](src/lib/actions.ts), [src/data/resourceDetails.ts](src/data/resourceDetails.ts) |
| `copilotstudio.preview.microsoft.com` | Open agents | [src/lib/actions.ts](src/lib/actions.ts), [src/data/resourceDetails.ts](src/data/resourceDetails.ts) |
| `entra.microsoft.com` | Security group pages | [src/pages/EnvironmentDetails.tsx](src/pages/EnvironmentDetails.tsx) |