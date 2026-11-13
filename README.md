# Voltara-CoE
Goddess of power watching over your platform.

Code App that brings Center of Excellence monitoring into one clear view.

## Deployment

### 1. Prerequisites

- Source: https://learn.microsoft.com/en-us/power-apps/developer/code-apps/overview#prerequisites

- Your IDE of choice. For example, [Visual Studio Code](https://code.visualstudio.com/)
- [Node.js (LTS)](https://nodejs.org/)
- [Git](https://git-scm.com/)
- [Power Apps CLI]((https://learn.microsoft.com/en-us/power-apps/developer/code-apps/reference/cli)

- A Power Platform environment with **code apps enabled** (Power Platform admin center → Environment → Settings → Features).
- License end users with **Power Apps Premium**.
- Admin rights: the app uses the Power Platform for Admins (V1 and V2), Power Apps for Admins and HTTP with Microsoft Entra ID connectors, so users need tenant or environment admin roles to see most of the data.

### 2. Install and sign in

```bash
npm install
pac auth create
pac env select --environment <your-env-id>
```

### 3. Create/Configure `power.config.json`

- Run `pac code init --displayName <app-display-name>` to generate the `power.config.json`
- Run `pac code push`
Note: if there is another code app with the same displayName, it will fail.
At this time you will have the `power.config.json` with the following fields updated:

- `environmentId`: your target environment ID.
- `appId`: leave it out on the first deployment; the first push creates the app.
- `appDisplayName`: the name you want the app to have.

You still need to configure connections otherwise it will fail to fetch data.

### 4. Create connections and add them to the app

In the target environment, create a connection for each connector:

- Power Platform for Admins
- Power Platform for Admins V2
- Microsoft Dataverse
- Office 365 Groups
- Office 365 Outlook
- Power Apps for Admins
- HTTP with Microsoft Entra ID (preauthorized)

Then add each one to the app, which writes the real connection reference IDs into `power.config.json`:

```bash
pac code add-data-source -a <api-name> -c <connection-id>
```

The HTTP with Microsoft Entra ID connector also needs a real `sharedConnectionId`.

### 5. Build and push

```bash
npm run build
pac code push
```

After the first push, put the returned `appId` in `power.config.json` so later pushes update the same app.
To deploy into a solution for ALM, use `pac code push --solutionName <solution-name>`.

### 6. Share the app

Share the app with users or a security group from [make.powerapps.com](https://make.powerapps.com). Users approve the connections the first time they open it.

## Changing the app name

| File | What it controls |
|---|---|
| `power.config.json` → `appDisplayName` | The app name in Power Apps (maker portal, app list). |
| [index.html](index.html) → `<title>` | The browser tab title. |
| [src/config/branding.json](src/config/branding.json) | Brand name, app name, tagline and footer shown in the sidebar. |
| [src/lib/settingsTransfer.ts](src/lib/settingsTransfer.ts) | The name used in the settings import error message. |
