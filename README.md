# Employee Offboarding Assistant - M365 Agentic App

An intelligent, agentic employee offboarding assistant for Microsoft 365 with **chain of thought reasoning** capabilities.

## 🤖 Agentic Features

This application uses AI agents with function calling to provide intelligent, context-aware assistance:

### Chain of Thought Reasoning
The agent thinks step-by-step:
1. **Analyzes** your request
2. **Determines** which tools to use
3. **Executes** functions in the correct order
4. **Synthesizes** results into actionable responses

### Available Agent Functions
- `search_employee` - Search for employees in M365 directory
- `create_offboarding_session` - Start new offboarding process
- `get_offboarding_checklist` - Get checklist and progress
- `revoke_access` - Revoke M365 service access
- `transfer_data` - Transfer data and responsibilities

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- GitHub account (for free AI models) OR OpenAI API key

### Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure AI Model**

   **Option A: GitHub Models (Free)**
   - Get a GitHub token: https://github.com/settings/tokens
   - Add to `.localConfigs`:
     ```
     GITHUB_TOKEN=your_github_token_here
     OPENAI_BASE_URL=https://models.inference.ai.azure.com
     OPENAI_MODEL=gpt-4o
     ```

   **Option B: OpenAI API**
   - Get API key from: https://platform.openai.com/api-keys
   - Add to `.localConfigs`:
     ```
     OPENAI_API_KEY=your_api_key_here
     OPENAI_BASE_URL=https://api.openai.com/v1
     OPENAI_MODEL=gpt-4o-mini
     ```

3. **Run the agent**
   ```bash
   npm run dev:teamsfx
   ```

4. **Access the playground**
   - DevTools: http://localhost:53001/devtools
   - Web Portal: http://localhost:53000

## 💬 Example Conversations

### Search for Employee
```
You: "Find employee John Smith"
Agent: 🤔 I need to search for John Smith...
      ✓ Found 2 matching employees
      📋 Here are the results: [employee details]
```

### Start Offboarding
```
You: "I need to offboard Sarah Johnson, her last day is December 31st"
Agent: 🤔 Let me help you with that...
      1. Searching for Sarah Johnson...
      2. Creating offboarding session...
      3. Setting up checklist...
      ✓ Offboarding session created (ID: session-123)
      📋 Here's your checklist: [5 tasks]
```

### Revoke Access
```
You: "Revoke Teams and Email access for emp-001"
Agent: 🤔 Processing access revocation...
      ⚠️  This is a critical operation
      ✓ Revoked access to Teams
      ✓ Revoked access to Email
      ✅ Access successfully revoked
```

## 🎯 Features

### Intelligent Assistant
- Natural language understanding
- Context-aware responses
- Multi-step task execution
- Function chaining for complex workflows

### Employee Management
- Search Microsoft 365 directory
- Create offboarding sessions
- Track progress with checklists
- Manage access revocation
- Transfer data and responsibilities

### Chain of Thought
Watch the agent think in real-time:
- Visible reasoning process
- Step-by-step execution logs
- Function call transparency
- Decision explanation

## 📁 Project Structure

```
src/
├── index.ts                    # Main M365 app entry
├── services/
│   └── agentService.ts        # Agentic AI service with chain of thought
├── Tab/
│   ├── App.tsx                # React UI components
│   ├── authConfig.ts          # MSAL authentication
│   ├── services/
│   │   ├── graphService.ts   # Microsoft Graph API
│   │   └── offboardingService.ts
│   └── components/
│       ├── UserSearch.tsx
│       └── OffboardingProgress.tsx
```

## 🔧 Development

### Watch mode (auto-rebuild)
```bash
npm run dev:teamsfx
```

### Build only
```bash
npm run build
```

### Access DevTools
```bash
open http://localhost:53001/devtools
```

## 🧪 Testing the Agent

Try these natural language queries:

1. **Search**: "Find all employees named Smith"
2. **Offboard**: "I need to offboard John Doe, resignation, last day March 15th"
3. **Checklist**: "Show me the offboarding checklist for session-123"
4. **Revoke**: "Disable email and SharePoint for emp-001"
5. **Transfer**: "Transfer all data from emp-001 to emp-002"

## 🔐 Security

- All API calls are logged for audit
- Sensitive operations require explicit confirmation
- Conversation history is maintained per user
- Function execution is sandboxed

## 📝 Configuration

Edit `.localConfigs` to customize:
- AI model selection
- API endpoints
- M365 tenant settings
- Port configurations

## 🤝 Contributing

This is a demonstration project showing agentic AI capabilities in M365 environments.

## 📄 License

MIT

A modern, secure web application for automating employee offboarding processes using Microsoft Graph API. Built with React, TypeScript, and Fluent UI following Microsoft's security best practices.

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
