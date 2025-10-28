'use strict';

var fs = require('fs');
var https = require('https');
var path = require('path');
var teams_apps = require('@microsoft/teams.apps');
var logging = require('@microsoft/teams.common/logging');
var teams_dev = require('@microsoft/teams.dev');
var OpenAI = require('openai');
var microsoftGraphClient = require('@microsoft/microsoft-graph-client');
var azureTokenCredentials = require('@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials');
var identity = require('@azure/identity');

function _interopDefault (e) { return e && e.__esModule ? e : { default: e }; }

var fs__default = /*#__PURE__*/_interopDefault(fs);
var https__default = /*#__PURE__*/_interopDefault(https);
var path__default = /*#__PURE__*/_interopDefault(path);
var OpenAI__default = /*#__PURE__*/_interopDefault(OpenAI);

// src/index.ts
var graphClient = null;
function getGraphClient() {
  if (graphClient) {
    return graphClient;
  }
  const clientId = process.env.M365_CLIENT_ID || process.env.REACT_APP_CLIENT_ID;
  const tenantId = process.env.M365_TENANT_ID || process.env.REACT_APP_TENANT_ID || "common";
  const clientSecret = process.env.M365_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "Microsoft Graph credentials not configured. Please set M365_CLIENT_ID and M365_CLIENT_SECRET in .localConfigs"
    );
  }
  const credential = new identity.ClientSecretCredential(tenantId, clientId, clientSecret);
  const authProvider = new azureTokenCredentials.TokenCredentialAuthenticationProvider(credential, {
    scopes: ["https://graph.microsoft.com/.default"]
  });
  graphClient = microsoftGraphClient.Client.initWithMiddleware({
    authProvider
  });
  return graphClient;
}
async function searchUsers(query) {
  const client2 = getGraphClient();
  try {
    const response = await client2.api("/users").filter(`startsWith(displayName,'${query}') or startsWith(mail,'${query}')`).select("id,displayName,mail,jobTitle,department,accountEnabled").top(10).get();
    return response.value;
  } catch (error) {
    console.error("[GRAPH] User search error:", error.message);
    throw new Error(`Failed to search users: ${error.message}`);
  }
}
async function revokeUserAccess(userId, services) {
  const client2 = getGraphClient();
  const results = [];
  try {
    if (services.includes("account") || services.includes("all")) {
      await client2.api(`/users/${userId}`).patch({
        accountEnabled: false
      });
      results.push({ service: "account", status: "disabled" });
    }
    if (services.includes("email") || services.includes("teams") || services.includes("office365") || services.includes("all")) {
      const user = await client2.api(`/users/${userId}`).select("assignedLicenses").get();
      if (user.assignedLicenses && user.assignedLicenses.length > 0) {
        const licenseIds = user.assignedLicenses.map((l) => l.skuId);
        await client2.api(`/users/${userId}/assignLicense`).post({
          addLicenses: [],
          removeLicenses: licenseIds
        });
        results.push({ service: "licenses", status: "revoked", count: licenseIds.length });
      }
    }
    if (services.includes("sharepoint") || services.includes("all")) {
      const groups = await client2.api(`/users/${userId}/memberOf`).get();
      for (const group of groups.value) {
        try {
          await client2.api(`/groups/${group.id}/members/${userId}/$ref`).delete();
          results.push({ service: "sharepoint_group", status: "removed", group: group.displayName });
        } catch (err) {
        }
      }
    }
    return results;
  } catch (error) {
    console.error("[GRAPH] Revoke access error:", error.message);
    throw new Error(`Failed to revoke access: ${error.message}`);
  }
}
async function transferUserData(fromUserId, toUserId, dataTypes) {
  const client2 = getGraphClient();
  const results = [];
  try {
    if (dataTypes.includes("emails") || dataTypes.includes("mailbox") || dataTypes.includes("all")) {
      results.push({
        dataType: "mailbox",
        status: "pending_manual",
        message: "Mailbox delegation requires Exchange Online admin action",
        action: `Run: Add-MailboxPermission -Identity "${fromUserId}" -User "${toUserId}" -AccessRights FullAccess`
      });
    }
    if (dataTypes.includes("files") || dataTypes.includes("onedrive") || dataTypes.includes("all")) {
      const drive = await client2.api(`/users/${fromUserId}/drive`).get();
      results.push({
        dataType: "onedrive",
        status: "accessible",
        message: `OneDrive accessible for transfer`,
        driveId: drive.id,
        action: `Use SharePoint admin to transfer ownership or grant access to ${toUserId}`
      });
    }
    if (dataTypes.includes("calendar") || dataTypes.includes("all")) {
      await client2.api(`/users/${fromUserId}/calendar/permissions`).post({
        emailAddress: {
          address: toUserId,
          name: toUserId
        },
        role: "read"
      });
      results.push({
        dataType: "calendar",
        status: "delegated",
        message: "Calendar read access granted"
      });
    }
    return results;
  } catch (error) {
    console.error("[GRAPH] Transfer data error:", error.message);
    throw new Error(`Failed to transfer data: ${error.message}`);
  }
}

// src/services/agentService.ts
var client = new OpenAI__default.default({
  apiKey: process.env.GITHUB_TOKEN || process.env.OPENAI_API_KEY || "your-api-key-here",
  baseURL: process.env.OPENAI_BASE_URL || "https://models.inference.ai.azure.com"
});
var MODEL = process.env.OPENAI_MODEL || "gpt-4o";
var tools = [
  {
    type: "function",
    function: {
      name: "search_employee",
      description: "Search for an employee in the Microsoft 365 directory by name or email",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The employee name or email to search for"
          }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_offboarding_session",
      description: "Create a new offboarding session for an employee",
      parameters: {
        type: "object",
        properties: {
          employeeId: {
            type: "string",
            description: "The ID of the employee to offboard"
          },
          reason: {
            type: "string",
            description: "Reason for offboarding (resignation, termination, retirement, etc.)"
          },
          lastWorkingDay: {
            type: "string",
            description: "Last working day in YYYY-MM-DD format"
          }
        },
        required: ["employeeId", "reason", "lastWorkingDay"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_offboarding_checklist",
      description: "Get the offboarding checklist and current progress for an employee",
      parameters: {
        type: "object",
        properties: {
          sessionId: {
            type: "string",
            description: "The offboarding session ID"
          }
        },
        required: ["sessionId"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "revoke_access",
      description: "Revoke access to Microsoft 365 services for an employee",
      parameters: {
        type: "object",
        properties: {
          employeeId: {
            type: "string",
            description: "The ID of the employee"
          },
          services: {
            type: "array",
            items: { type: "string" },
            description: "List of services to revoke access from (e.g., 'email', 'teams', 'sharepoint')"
          }
        },
        required: ["employeeId", "services"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "transfer_data",
      description: "Transfer data and responsibilities from one employee to another",
      parameters: {
        type: "object",
        properties: {
          fromEmployeeId: {
            type: "string",
            description: "The ID of the employee leaving"
          },
          toEmployeeId: {
            type: "string",
            description: "The ID of the employee taking over"
          },
          dataTypes: {
            type: "array",
            items: { type: "string" },
            description: "Types of data to transfer (e.g., 'emails', 'files', 'calendar')"
          }
        },
        required: ["fromEmployeeId", "toEmployeeId", "dataTypes"]
      }
    }
  }
];
async function executeFunction(name, args) {
  console.log(`[AGENT] Executing function: ${name} with args:`, JSON.stringify(args));
  const useRealAPI = process.env.USE_REAL_GRAPH_API === "true";
  try {
    switch (name) {
      case "search_employee":
        if (useRealAPI) {
          try {
            const users = await searchUsers(args.query);
            return JSON.stringify({
              employees: users.map((u) => ({
                id: u.id,
                name: u.displayName,
                email: u.mail || u.userPrincipalName,
                department: u.department,
                jobTitle: u.jobTitle,
                accountEnabled: u.accountEnabled
              })),
              source: "Microsoft Graph API"
            });
          } catch (error) {
            console.warn("[AGENT] Falling back to mock data:", error.message);
          }
        }
        return JSON.stringify({
          employees: [
            { id: "emp-001", name: args.query, email: `${args.query.toLowerCase().replace(" ", ".")}@company.com`, department: "Engineering", accountEnabled: true },
            { id: "emp-002", name: `${args.query} (Manager)`, email: `${args.query.toLowerCase().replace(" ", ".")}.mgr@company.com`, department: "Engineering", accountEnabled: true }
          ],
          source: "Mock Data"
        });
      case "create_offboarding_session":
        return JSON.stringify({
          sessionId: `session-${Date.now()}`,
          employeeId: args.employeeId,
          reason: args.reason,
          lastWorkingDay: args.lastWorkingDay,
          status: "created",
          message: "Offboarding session created successfully"
        });
      case "get_offboarding_checklist":
        return JSON.stringify({
          sessionId: args.sessionId,
          checklist: [
            { id: 1, task: "Revoke system access", status: "pending", priority: "high" },
            { id: 2, task: "Disable email account", status: "pending", priority: "high" },
            { id: 3, task: "Transfer data ownership", status: "pending", priority: "medium" },
            { id: 4, task: "Collect company assets", status: "pending", priority: "medium" },
            { id: 5, task: "Exit interview", status: "pending", priority: "low" }
          ],
          progress: "0% complete"
        });
      case "revoke_access":
        if (useRealAPI) {
          try {
            const results = await revokeUserAccess(args.employeeId, args.services);
            return JSON.stringify({
              employeeId: args.employeeId,
              servicesRevoked: args.services,
              results,
              status: "success",
              message: `Access revoked for ${args.services.join(", ")}`,
              source: "Microsoft Graph API"
            });
          } catch (error) {
            console.warn("[AGENT] Falling back to mock data:", error.message);
          }
        }
        return JSON.stringify({
          employeeId: args.employeeId,
          servicesRevoked: args.services,
          status: "success",
          message: `Access revoked for ${args.services.join(", ")}`,
          source: "Mock Data"
        });
      case "transfer_data":
        if (useRealAPI) {
          try {
            const results = await transferUserData(args.fromEmployeeId, args.toEmployeeId, args.dataTypes);
            return JSON.stringify({
              fromEmployeeId: args.fromEmployeeId,
              toEmployeeId: args.toEmployeeId,
              dataTypesTransferred: args.dataTypes,
              results,
              status: "in_progress",
              message: `Data transfer initiated for ${args.dataTypes.join(", ")}`,
              source: "Microsoft Graph API"
            });
          } catch (error) {
            console.warn("[AGENT] Falling back to mock data:", error.message);
          }
        }
        return JSON.stringify({
          fromEmployeeId: args.fromEmployeeId,
          toEmployeeId: args.toEmployeeId,
          dataTypesTransferred: args.dataTypes,
          status: "in_progress",
          message: `Data transfer initiated for ${args.dataTypes.join(", ")}`,
          source: "Mock Data"
        });
      default:
        return JSON.stringify({ error: "Unknown function" });
    }
  } catch (error) {
    console.error(`[AGENT] Error executing ${name}:`, error);
    return JSON.stringify({ error: error.message, function: name });
  }
}
var SYSTEM_PROMPT = `You are an intelligent Employee Offboarding Assistant for Microsoft 365.

Your role is to help HR managers and IT administrators efficiently offboard employees while ensuring:
- Data security and compliance
- Smooth transition of responsibilities
- Complete revocation of access
- Proper documentation

When responding to user queries, use chain of thought reasoning:
1. Analyze what the user is asking
2. Determine which tools/functions you need to call
3. Execute the functions in the correct order
4. Synthesize the results into a clear, actionable response

Always think step-by-step and explain your reasoning when appropriate.

Available capabilities:
- Search for employees in the directory
- Create offboarding sessions
- Get offboarding checklists
- Revoke access to services
- Transfer data and responsibilities

Be proactive, thorough, and security-conscious in your responses.`;
var conversationHistory = /* @__PURE__ */ new Map();
async function processAgenticMessage(userMessage, userId = "default") {
  try {
    if (!conversationHistory.has(userId)) {
      conversationHistory.set(userId, [
        { role: "system", content: SYSTEM_PROMPT }
      ]);
    }
    const messages = conversationHistory.get(userId);
    messages.push({ role: "user", content: userMessage });
    const thoughtProcess = [];
    let response = await client.chat.completions.create({
      model: MODEL,
      messages,
      tools,
      tool_choice: "auto",
      temperature: 0.7,
      max_tokens: 1500
    });
    let assistantMessage = response.choices[0].message;
    let iterations = 0;
    const maxIterations = 10;
    while (assistantMessage.tool_calls && iterations < maxIterations) {
      iterations++;
      console.log(`[AGENT] Chain of thought iteration ${iterations}`);
      messages.push(assistantMessage);
      for (const toolCall of assistantMessage.tool_calls) {
        if (toolCall.type !== "function") continue;
        const functionName = toolCall.function?.name;
        const functionArgs = JSON.parse(toolCall.function?.arguments || "{}");
        thoughtProcess.push(`\u{1F914} **Thinking**: I need to ${functionName.replace(/_/g, " ")} ${JSON.stringify(functionArgs).substring(0, 100)}...`);
        console.log(`[AGENT] \u{1F914} Thinking: I need to ${functionName} with ${JSON.stringify(functionArgs)}`);
        const functionResult = await executeFunction(functionName, functionArgs);
        thoughtProcess.push(`\u2705 **Action completed**: ${functionName.replace(/_/g, " ")}`);
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: functionResult
        });
      }
      response = await client.chat.completions.create({
        model: MODEL,
        messages,
        tools,
        tool_choice: "auto",
        temperature: 0.7,
        max_tokens: 1500
      });
      assistantMessage = response.choices[0].message;
    }
    messages.push(assistantMessage);
    if (messages.length > 20) {
      conversationHistory.set(userId, [
        messages[0],
        // Keep system prompt
        ...messages.slice(-19)
      ]);
    }
    let finalResponse = "";
    if (thoughtProcess.length > 0) {
      finalResponse += "**\u{1F9E0} Chain of Thought:**\n\n";
      finalResponse += thoughtProcess.join("\n\n") + "\n\n---\n\n";
    }
    finalResponse += assistantMessage.content || "I apologize, I couldn't process that request.";
    return finalResponse;
  } catch (error) {
    console.error("[AGENT ERROR]", error);
    return `I encountered an error: ${error.message}. Please make sure your API key is configured correctly.`;
  }
}

// src/index.ts
var sslOptions = {
  key: process.env.SSL_KEY_FILE ? fs__default.default.readFileSync(process.env.SSL_KEY_FILE) : void 0,
  cert: process.env.SSL_CRT_FILE ? fs__default.default.readFileSync(process.env.SSL_CRT_FILE) : void 0
};
var plugins = [new teams_dev.DevtoolsPlugin()];
if (sslOptions.cert && sslOptions.key) {
  plugins.push(new teams_apps.HttpPlugin(https__default.default.createServer(sslOptions)));
}
var app = new teams_apps.App({
  logger: new logging.ConsoleLogger("tab", { level: "debug" }),
  plugins
});
app.tab("home", path__default.default.join(__dirname, "./client"));
app.on("message", async (context) => {
  const userMessage = context.activity.text || "";
  const userId = context.activity.from?.id || "default";
  console.log(`[INFO] Received message from ${userId}: ${userMessage}`);
  try {
    const responseText = await processAgenticMessage(userMessage, userId);
    await context.send({
      type: "message",
      text: responseText
    });
    console.log(`[INFO] Sent agentic response (${responseText.length} chars)`);
  } catch (error) {
    console.error("[ERROR]", error);
    await context.send({
      type: "message",
      text: `I apologize, but I encountered an error: ${error.message}. Please try again.`
    });
  }
});
(async () => {
  await app.start(+(process.env.PORT || 3978));
})();
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map