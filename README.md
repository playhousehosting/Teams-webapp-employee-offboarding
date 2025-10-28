# Employee Offboarding Assistant - M365 Agentic App

An intelligent, agentic employee offboarding assistant for Microsoft 365 with **chain of thought reasoning** capabilities. This application uses AI agents with function calling to provide intelligent, conversational assistance for managing employee offboarding processes.

![Teams App](https://img.shields.io/badge/Teams-App-purple?logo=microsoft-teams)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)
![React](https://img.shields.io/badge/React-18.3-blue?logo=react)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-green?logo=openai)
![Microsoft Graph](https://img.shields.io/badge/Microsoft-Graph%20API-blue?logo=microsoft)

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [Agent Capabilities](#-agent-capabilities)
- [Real API Integration](#-real-api-integration)
- [Development](#-development)
- [Project Structure](#-project-structure)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)

## ✨ Features

### 🤖 Agentic AI with Chain of Thought
- **Natural Language Understanding**: Talk to the agent like you would a colleague
- **Visible Reasoning**: Watch the agent think through problems step-by-step
- **Function Calling**: Automatically executes the right functions based on context
- **Smart Fallbacks**: Gracefully handles errors and missing data
- **Conversation Memory**: Maintains context throughout the session

### 👥 Employee Management
- **Search Employees**: Natural language search across M365 directory
- **Offboarding Sessions**: Create and manage complete offboarding workflows
- **Progress Tracking**: Real-time checklist with completion status
- **Access Revocation**: Disable accounts, revoke licenses, remove from groups
- **Data Transfer**: Delegate mailboxes, transfer OneDrive, share calendars

### 🎨 Modern UI
- **Adaptive Cards**: Rich, interactive cards for offboarding sessions
- **React + Fluent UI**: Modern, accessible interface
- **Teams Integration**: Works natively in Microsoft Teams
- **Responsive Design**: Optimized for desktop, tablet, and mobile

### 🔐 Enterprise-Ready
- **Microsoft Graph API**: Optionally use real API for production scenarios
- **Mock Data Mode**: Demo without API credentials
- **Audit Logging**: All operations logged for compliance
- **Secure by Default**: API keys in environment variables

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Microsoft Teams                       │
│                   (localhost:53001)                      │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│              M365 Agents Toolkit (v1.9)                 │
│                  Teams AI Library                        │
└───────────────────┬─────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌──────────────────┐    ┌──────────────────┐
│  Agent Service   │    │   React UI       │
│  (OpenAI GPT-4o) │    │ (Fluent UI)      │
└────────┬─────────┘    └──────────────────┘
         │
         ├─── Function Calling (5 tools)
         │    • search_employee
         │    • create_offboarding_session
         │    • get_offboarding_checklist
         │    • revoke_access
         │    • transfer_data
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│                   Graph Client                           │
│           (Microsoft Graph API / Mock Data)              │
└─────────────────────────────────────────────────────────┘
```

## 📦 Prerequisites

- **Node.js** 18.0 or higher ([Download](https://nodejs.org/))
- **Microsoft 365 Account** for development ([Get free account](https://developer.microsoft.com/microsoft-365/dev-program))
- **AI Provider** (choose one):
  - OpenAI API key ([Get key](https://platform.openai.com/api-keys))
  - GitHub Models token ([Free for GitHub users](https://github.com/settings/tokens))
- **Visual Studio Code** (recommended) with [Microsoft 365 Agents Toolkit](https://aka.ms/teams-toolkit) extension
- **Git** for version control

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/playhousehosting/Teams-webapp-employee-offboarding.git
cd Teams-webapp-employee-offboarding
```

### 2. Install Dependencies

```bash
npm install
```

This will install:
- `@microsoft/teams.apps` - M365 Agents Toolkit
- `openai` - OpenAI SDK for AI capabilities
- `@microsoft/microsoft-graph-client` - Microsoft Graph API client
- `@azure/identity` - Azure authentication
- React, TypeScript, Fluent UI, and more

### 3. Configure Environment

Copy the example configuration:

```bash
cp .env.example .localConfigs
```

## ⚙️ Configuration

Edit `.localConfigs` to configure your environment:

### Option A: OpenAI API (Recommended)

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-proj-your-api-key-here
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o

# Use mock data for demo (no Azure setup needed)
USE_REAL_GRAPH_API=false
```

**Get your OpenAI API key**: https://platform.openai.com/api-keys

### Option B: GitHub Models (Free)

```env
# GitHub Models Configuration
GITHUB_TOKEN=ghp_your_github_token_here
OPENAI_BASE_URL=https://models.inference.ai.azure.com
OPENAI_MODEL=gpt-4o

# Use mock data for demo
USE_REAL_GRAPH_API=false
```

**Get your GitHub token**: https://github.com/settings/tokens (select "repo" scope)

### Optional: Real Microsoft Graph API

To use real Microsoft Graph API instead of mock data, see [GRAPH_API_SETUP.md](./GRAPH_API_SETUP.md) for detailed instructions.

```env
# Microsoft Graph API (Optional - for production use)
M365_CLIENT_ID=your-azure-app-client-id
M365_CLIENT_SECRET=your-azure-app-client-secret
M365_TENANT_ID=your-m365-tenant-id
USE_REAL_GRAPH_API=true
```

## 🎯 Usage

### Starting the Application

```bash
npm run dev:teamsfx
```

This starts:
- **Backend server** on http://localhost:53000
- **M365 DevTools** on http://localhost:53001

### Accessing the Agent

1. **Open DevTools**: http://localhost:53001/devtools
2. **Start chatting** with the agent in natural language

### Example Conversations

#### 🔍 Search for an Employee

```
You: "Find employee named John Smith"

Agent: 🤔 **Thinking**: I need to search for John Smith in the employee database...

✅ **Action**: Searched employee database

📋 **Result**: Found 2 matching employees:
- John Smith (Engineering) - emp-001
- John Smith Jr. (Marketing) - emp-005
```

#### 🚪 Start Offboarding Process

```
You: "I need to offboard Sarah Johnson. She's resigning and her last day is December 31st"

Agent: 🤔 **Thinking**: Let me help you set up the offboarding process...

1. Searching for Sarah Johnson...
2. Creating offboarding session...
3. Generating checklist...

✅ **Complete**: Offboarding session created!

**Session ID**: session-1730144325
**Employee**: Sarah Johnson (HR Manager)
**Reason**: Resignation
**Last Day**: December 31, 2025

**Checklist**:
- [ ] Revoke system access
- [ ] Disable email account
- [ ] Transfer data ownership
- [ ] Collect company assets
- [ ] Schedule exit interview
```

#### 🔒 Revoke Access

```
You: "Revoke Teams and Email access for emp-001"

Agent: 🤔 **Thinking**: This is a critical operation. Let me revoke access to the specified services...

⚠️  **Warning**: Revoking access will immediately disable the user's ability to use these services.

✅ **Revoked**: Microsoft Teams
✅ **Revoked**: Email (Exchange Online)

🎯 **Summary**: Successfully revoked access to 2 services for emp-001
```

#### 📊 Check Progress

```
You: "Show me the status of session-1730144325"

Agent: 🤔 **Thinking**: Let me retrieve the offboarding checklist...

📋 **Offboarding Progress**: 60% Complete

✅ Revoke system access - **Completed**
✅ Disable email account - **Completed**
⏳ Transfer data ownership - **In Progress**
⬜ Collect company assets - **Pending**
⬜ Schedule exit interview - **Pending**
```

#### 📦 Transfer Data

```
You: "Transfer all data from emp-001 to emp-002"

Agent: 🤔 **Thinking**: I'll transfer data ownership between these employees...

1. Verifying user access...
2. Setting up mailbox delegation...
3. Transferring OneDrive access...
4. Sharing calendar...

✅ **Complete**: Data transfer configured

**Summary**:
- Mailbox delegation: emp-002 can now access emp-001's mailbox
- OneDrive: Full access granted to emp-001's files
- Calendar: Shared with edit permissions
```

## 🛠️ Agent Capabilities

The agent has 5 function tools at its disposal:

### 1. `search_employee`
**Purpose**: Search for employees in the M365 directory

**Parameters**:
- `query` (string): Search term (name, email, department)

**Example**: `"Find employees in the Engineering department"`

### 2. `create_offboarding_session`
**Purpose**: Create a new offboarding workflow

**Parameters**:
- `employee_id` (string): Employee identifier
- `last_working_day` (string): Last day of employment (ISO format)
- `reason` (string): Resignation, Termination, Retirement, etc.

**Example**: `"Start offboarding for emp-001, last day 2025-12-31, reason: resignation"`

### 3. `get_offboarding_checklist`
**Purpose**: Retrieve checklist and progress for an offboarding session

**Parameters**:
- `session_id` (string): Session identifier

**Example**: `"What's the status of session-1730144325?"`

### 4. `revoke_access`
**Purpose**: Revoke access to M365 services

**Parameters**:
- `employee_id` (string): Employee identifier
- `services` (array): List of services to revoke (Teams, Email, SharePoint, OneDrive)

**Example**: `"Disable all access for emp-001"`

### 5. `transfer_data`
**Purpose**: Transfer data ownership and access

**Parameters**:
- `from_employee_id` (string): Current owner
- `to_employee_id` (string): New owner
- `data_types` (array): OneDrive, Email, Calendar, etc.

**Example**: `"Transfer email and files from emp-001 to emp-002"`

## 🌐 Real API Integration

By default, the app uses **mock data** for demonstration. To use **real Microsoft Graph API**:

### 1. Create Azure AD App Registration

See [GRAPH_API_SETUP.md](./GRAPH_API_SETUP.md) for complete step-by-step instructions.

**Quick summary**:
1. Go to [Azure Portal](https://portal.azure.com) → Azure Active Directory → App registrations
2. Create new registration
3. Add API permissions:
   - `User.Read.All`
   - `User.ReadWrite.All`
   - `Directory.Read.All`
   - `Group.ReadWrite.All`
   - `Mail.ReadWrite`
   - `Files.ReadWrite.All`
   - `Calendars.ReadWrite`
4. Grant admin consent
5. Create client secret

### 2. Update Configuration

```env
M365_CLIENT_ID=your-app-id
M365_CLIENT_SECRET=your-secret
M365_TENANT_ID=your-tenant-id
USE_REAL_GRAPH_API=true
```

### 3. Restart Application

```bash
npm run dev:teamsfx
```

The agent will now use real Microsoft Graph API calls instead of mock data!

## 💻 Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev:teamsfx` | Start with hot reload (recommended) |
| `npm run build` | Build for production |
| `npm run dev` | Start backend only |
| `npm run start` | Start without watch mode |

### Development Workflow

1. **Make changes** to code in `src/`
2. **nodemon** auto-restarts on file changes
3. **Test in DevTools**: http://localhost:53001/devtools
4. **View logs** in the terminal

### Debugging

VS Code launch configurations included:

- **Debug in Teams (Edge)**: F5 to debug in Edge
- **Debug in Teams (Chrome)**: Debug in Chrome
- **Attach to Backend**: Attach debugger to Node.js process

### Hot Reload

The app uses `nodemon` to automatically restart when you change:
- `src/**/*.ts` - Backend TypeScript
- `.localConfigs` - Environment variables

Frontend changes require `npm run build:client`.

## 📁 Project Structure

```
Teams-webapp-employee-offboarding/
├── src/
│   ├── index.ts                          # Main M365 app entry point
│   ├── services/
│   │   ├── agentService.ts              # Agentic AI with chain of thought
│   │   └── graphClient.ts               # Microsoft Graph API client
│   └── Tab/
│       ├── App.tsx                       # Main React component
│       ├── App.css                       # Styles
│       ├── client.tsx                    # React entry point
│       ├── authConfig.ts                 # MSAL authentication
│       ├── components/
│       │   ├── UserSearch.tsx           # Employee search component
│       │   └── OffboardingProgress.tsx   # Progress tracker
│       ├── services/
│       │   ├── graphService.ts          # Graph service (frontend)
│       │   └── offboardingService.ts     # Offboarding logic
│       └── types/
│           └── offboarding.ts            # TypeScript types
├── appPackage/
│   ├── manifest.json                     # Teams app manifest
│   ├── color.png                         # App icon (color)
│   └── outline.png                       # App icon (outline)
├── dist/                                 # Built output
│   ├── client/                          # Frontend bundle
│   └── index.js                         # Backend bundle
├── env/
│   └── .env.dev                         # Development environment
├── infra/
│   ├── azure.bicep                      # Azure infrastructure
│   └── azure.parameters.json             # Azure parameters
├── .localConfigs                         # Local environment variables (git ignored)
├── .gitignore                           # Git ignore rules
├── adaptiveCard.json                     # Adaptive Card template
├── GRAPH_API_SETUP.md                   # Graph API setup guide
├── m365agents.yml                        # M365 Agents config (production)
├── m365agents.local.yml                  # M365 Agents config (local)
├── nodemon.json                         # Nodemon configuration
├── package.json                          # Dependencies
├── tsconfig.json                         # TypeScript config
├── tsup.config.js                        # Backend bundler config
├── vite.config.js                        # Frontend bundler config
└── README.md                             # This file
```

### Key Files Explained

#### Backend (Agent)
- **`src/index.ts`**: Entry point that creates M365 app, registers message handlers, and starts HTTP server
- **`src/services/agentService.ts`**: Core agentic AI service with OpenAI function calling and chain of thought reasoning
- **`src/services/graphClient.ts`**: Microsoft Graph API wrapper with real API implementations

#### Frontend (React UI)
- **`src/Tab/App.tsx`**: Main React component with Teams context integration
- **`src/Tab/components/`**: Reusable React components for search and progress tracking
- **`src/Tab/services/`**: Frontend services for calling APIs

#### Configuration
- **`.localConfigs`**: Environment variables (API keys, endpoints) - **never commit this file**
- **`adaptiveCard.json`**: Pre-built Adaptive Card template for rich UI responses
- **`GRAPH_API_SETUP.md`**: Step-by-step guide for Azure AD app registration

## 🚀 Deployment

### Deploy to Azure

1. **Sign in to Azure** in VS Code (Microsoft 365 Agents Toolkit)

2. **Provision resources**:
   ```bash
   npx teamsapp provision --env dev
   ```

3. **Deploy code**:
   ```bash
   npx teamsapp deploy --env dev
   ```

4. **Publish to Teams**:
   ```bash
   npx teamsapp publish --env dev
   ```

### Environment Variables for Production

Update `env/.env.dev` with production values:

```env
# OpenAI Configuration
OPENAI_API_KEY=your-production-api-key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o

# Microsoft Graph API
M365_CLIENT_ID=your-azure-app-id
M365_CLIENT_SECRET=your-client-secret
M365_TENANT_ID=your-tenant-id
USE_REAL_GRAPH_API=true
```

**Security Best Practices**:
- Use Azure Key Vault for secrets in production
- Enable Managed Identity for Azure resources
- Use certificate-based authentication instead of client secrets
- Implement proper logging and monitoring

## 🐛 Troubleshooting

### Agent Not Responding

**Problem**: No response when chatting with agent in DevTools

**Solutions**:
1. Check `.localConfigs` has valid `OPENAI_API_KEY` or `GITHUB_TOKEN`
2. Verify terminal shows: `[INFO] tab/http listening on port 53000`
3. Check for errors in terminal output
4. Restart: Stop Node process and run `npm run dev:teamsfx` again

### TypeScript Errors

**Problem**: Type errors in OpenAI function calls

**Solutions**:
1. Ensure `openai` package is latest: `npm install openai@latest`
2. Use type guards: `if (toolCall.type !== "function") continue;`
3. Use optional chaining: `toolCall.function?.name`

### Graph API 401/403 Errors

**Problem**: "Unauthorized" or "Forbidden" when using real Graph API

**Solutions**:
1. Verify Azure AD app has correct permissions (see GRAPH_API_SETUP.md)
2. Ensure admin consent was granted
3. Check client ID/secret/tenant ID are correct in `.localConfigs`
4. Verify `USE_REAL_GRAPH_API=true` is set

### Build Failures

**Problem**: tsup or vite build fails

**Solutions**:
1. Clear build cache: `rm -rf dist node_modules && npm install`
2. Check `tsup.config.js` has `bundle: true`
3. Verify all imports use correct paths
4. Run `npm run build` to see detailed errors

### Port Already in Use

**Problem**: `EADDRINUSE` error on port 53000 or 53001

**Solutions**:
```powershell
# Windows PowerShell
Get-Process -Name node | Stop-Process -Force

# Then restart
npm run dev:teamsfx
```

### Mock Data vs Real API

**Problem**: Want to switch between mock and real data

**Solution**: Toggle in `.localConfigs`:
```env
# For demo with mock data
USE_REAL_GRAPH_API=false

# For production with real Graph API
USE_REAL_GRAPH_API=true
```

## 📚 Additional Resources

### Microsoft Documentation
- [Microsoft 365 Agents Toolkit](https://aka.ms/teams-toolkit)
- [Teams AI Library](https://microsoft.github.io/teams-ai)
- [Microsoft Graph API](https://learn.microsoft.com/graph)
- [Adaptive Cards](https://adaptivecards.io/)

### AI & Development
- [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)
- [GitHub Models](https://github.com/marketplace/models)
- [Chain of Thought Prompting](https://www.promptingguide.ai/techniques/cot)

### This Project
- [Graph API Setup Guide](./GRAPH_API_SETUP.md)
- [Adaptive Card Template](./adaptiveCard.json)
- [GitHub Repository](https://github.com/playhousehosting/Teams-webapp-employee-offboarding)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 👥 Authors

Created as a demonstration of agentic AI capabilities in Microsoft 365 environments.

## 🙏 Acknowledgments

- Microsoft 365 Agents Toolkit team
- OpenAI for GPT-4o
- Microsoft Graph API team
- React and TypeScript communities

---

**Need Help?** Open an issue on [GitHub](https://github.com/playhousehosting/Teams-webapp-employee-offboarding/issues)

**Questions?** Check out the [troubleshooting section](#-troubleshooting) or [GRAPH_API_SETUP.md](./GRAPH_API_SETUP.md)

## Get started with the Basic Tab template

> **Prerequisites**
>
> To run the basic tab template in your local dev machine, you will need:
>
> - [Node.js](https://nodejs.org/), supported versions: >=20.
> - A [Microsoft 365 account for development](https://docs.microsoft.com/microsoftteams/platform/toolkit/accounts)
>   Please note that after you enrolled your developer tenant in Office 365 Target Release, it may take couple days for the enrollment to take effect.
> - [Microsoft 365 Agents Toolkit Visual Studio Code Extension](https://aka.ms/teams-toolkit) version 6.0.0 and higher or [Microsoft 365 Agents Toolkit CLI](https://aka.ms/teamsfx-toolkit-cli)

1. First, select the Microsoft 365 Agents Toolkit icon on the left in the VS Code toolbar.
2. In the Account section, sign in with your [Microsoft 365 account](https://docs.microsoft.com/microsoftteams/platform/toolkit/accounts) if you haven't already.
3. Press F5 to start debugging which launches your app in Teams using a web browser. Select `Debug in Teams (Edge)` or `Debug in Teams (Chrome)`.
4. When Teams launches in the browser, select the Add button in the dialog to install your app to Teams.

**Congratulations**! You are running an application that can now show a basic web page in Teams, Outlook and the Microsoft 365 app.

![Basic Tab](https://github.com/user-attachments/assets/d87fa70b-238b-4f9f-bde8-cf16c086332d)

## What's included in the template

| Folder       | Contents                                     |
| ------------ | -------------------------------------------- |
| `.vscode`    | VSCode files for debugging                   |
| `appPackage` | Templates for the application manifest |
| `env`        | Environment files                            |
| `infra`      | Templates for provisioning Azure resources   |
| `src`        | The source code for the application    |

The following files can be customized and demonstrate an example implementation to get you started.

| File                             | Contents                                                                                                        |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `index.html`                     | HTML file.                                                                                                      |
| `src/Tab/App.css`                | CSS file for the app.                                                                                           |
| `src/Tab/App.tsx`                | Tab source file. It calls `teamsjs` SDK to get the context of on which Microsoft 365 application your app is running.      |
| `src/index.ts`                   | Starting the app using [Teams AI(v2)](https://microsoft.github.io/teams-ai).                                                                     |
| `vite.config.js`                 | Configuration for Vite build tool.                                                                              |  
| `nodemon.json`                   | Configuration for Nodemon to watch and restart the server.                                                      |

The following are Microsoft 365 Agents Toolkit specific project files. You can [visit a complete guide on Github](https://github.com/OfficeDev/TeamsFx/wiki/Teams-Toolkit-Visual-Studio-Code-v5-Guide#overview) to understand how Microsoft 365 Agents Toolkit works.

| File                 | Contents                                                                                                                                  |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `m365agents.yml`       | This is the main Microsoft 365 Agents Toolkit project file. The project file defines two primary things: Properties and configuration Stage definitions. |
| `m365agents.local.yml` | This overrides `m365agents.yml` with actions that enable local execution and debugging.                                                     |

## Extend the Basic Tab template

Following documentation will help you to extend the Basic Tab template.

- [Add or manage the environment](https://learn.microsoft.com/microsoftteams/platform/toolkit/teamsfx-multi-env)
- [Create multi-capability app](https://learn.microsoft.com/microsoftteams/platform/toolkit/add-capability)
- [Access data in Microsoft Graph](https://learn.microsoft.com/microsoftteams/platform/toolkit/teamsfx-sdk#microsoft-graph-scenarios)
- [Use an existing Microsoft Entra application](https://learn.microsoft.com/microsoftteams/platform/toolkit/use-existing-aad-app)
- [Customize the app manifest](https://learn.microsoft.com/microsoftteams/platform/toolkit/teamsfx-preview-and-customize-app-manifest)
- Host your app in Azure by [provision cloud resources](https://learn.microsoft.com/microsoftteams/platform/toolkit/provision) and [deploy the code to cloud](https://learn.microsoft.com/microsoftteams/platform/toolkit/deploy)
- [Collaborate on app development](https://learn.microsoft.com/microsoftteams/platform/toolkit/teamsfx-collaboration)
- [Set up the CI/CD pipeline](https://learn.microsoft.com/microsoftteams/platform/toolkit/use-cicd-template)
- [Publish the app to your organization or the Microsoft app store](https://learn.microsoft.com/microsoftteams/platform/toolkit/publish)
- [Enable the app for multi-tenant](https://github.com/OfficeDev/TeamsFx/wiki/Multi-tenancy-Support-for-Azure-AD-app)
- [Preview the app on mobile clients](https://aka.ms/teamsfx-mobile)
