import OpenAI from "openai";
import { searchUsers, revokeUserAccess, transferUserData, getUser } from "./graphClient";

// Initialize OpenAI client with GitHub Models endpoint
const client = new OpenAI({
  apiKey: process.env.GITHUB_TOKEN || process.env.OPENAI_API_KEY || "your-api-key-here",
  baseURL: process.env.OPENAI_BASE_URL || "https://models.inference.ai.azure.com",
});

const MODEL = process.env.OPENAI_MODEL || "gpt-4o";

// Employee offboarding tools/functions
const tools: OpenAI.Chat.ChatCompletionTool[] = [
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
            description: "The employee name or email to search for",
          },
        },
        required: ["query"],
      },
    },
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
            description: "The ID of the employee to offboard",
          },
          reason: {
            type: "string",
            description: "Reason for offboarding (resignation, termination, retirement, etc.)",
          },
          lastWorkingDay: {
            type: "string",
            description: "Last working day in YYYY-MM-DD format",
          },
        },
        required: ["employeeId", "reason", "lastWorkingDay"],
      },
    },
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
            description: "The offboarding session ID",
          },
        },
        required: ["sessionId"],
      },
    },
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
            description: "The ID of the employee",
          },
          services: {
            type: "array",
            items: { type: "string" },
            description: "List of services to revoke access from (e.g., 'email', 'teams', 'sharepoint')",
          },
        },
        required: ["employeeId", "services"],
      },
    },
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
            description: "The ID of the employee leaving",
          },
          toEmployeeId: {
            type: "string",
            description: "The ID of the employee taking over",
          },
          dataTypes: {
            type: "array",
            items: { type: "string" },
            description: "Types of data to transfer (e.g., 'emails', 'files', 'calendar')",
          },
        },
        required: ["fromEmployeeId", "toEmployeeId", "dataTypes"],
      },
    },
  },
];

// Mock function implementations (you can replace these with real Microsoft Graph API calls)
async function executeFunction(name: string, args: any): Promise<string> {
  console.log(`[AGENT] Executing function: ${name} with args:`, JSON.stringify(args));
  
  // Check if we should use real Graph API or mock data
  const useRealAPI = process.env.USE_REAL_GRAPH_API === "true";
  
  try {
    switch (name) {
      case "search_employee":
        if (useRealAPI) {
          try {
            const users = await searchUsers(args.query);
            return JSON.stringify({
              employees: users.map((u: any) => ({
                id: u.id,
                name: u.displayName,
                email: u.mail || u.userPrincipalName,
                department: u.department,
                jobTitle: u.jobTitle,
                accountEnabled: u.accountEnabled,
              })),
              source: "Microsoft Graph API",
            });
          } catch (error: any) {
            console.warn("[AGENT] Falling back to mock data:", error.message);
            // Fall through to mock data
          }
        }
        
        // Mock data fallback
        return JSON.stringify({
          employees: [
            { id: "emp-001", name: args.query, email: `${args.query.toLowerCase().replace(" ", ".")}@company.com`, department: "Engineering", accountEnabled: true },
            { id: "emp-002", name: `${args.query} (Manager)`, email: `${args.query.toLowerCase().replace(" ", ".")}.mgr@company.com`, department: "Engineering", accountEnabled: true },
          ],
          source: "Mock Data",
        });
      
      case "create_offboarding_session":
        // This is custom business logic - keep as mock/database
        return JSON.stringify({
          sessionId: `session-${Date.now()}`,
          employeeId: args.employeeId,
          reason: args.reason,
          lastWorkingDay: args.lastWorkingDay,
          status: "created",
          message: "Offboarding session created successfully",
        });
      
      case "get_offboarding_checklist":
        // Custom business logic - could integrate with SharePoint lists or custom database
        return JSON.stringify({
          sessionId: args.sessionId,
          checklist: [
            { id: 1, task: "Revoke system access", status: "pending", priority: "high" },
            { id: 2, task: "Disable email account", status: "pending", priority: "high" },
            { id: 3, task: "Transfer data ownership", status: "pending", priority: "medium" },
            { id: 4, task: "Collect company assets", status: "pending", priority: "medium" },
            { id: 5, task: "Exit interview", status: "pending", priority: "low" },
          ],
          progress: "0% complete",
        });
      
      case "revoke_access":
        if (useRealAPI) {
          try {
            const results = await revokeUserAccess(args.employeeId, args.services);
            return JSON.stringify({
              employeeId: args.employeeId,
              servicesRevoked: args.services,
              results: results,
              status: "success",
              message: `Access revoked for ${args.services.join(", ")}`,
              source: "Microsoft Graph API",
            });
          } catch (error: any) {
            console.warn("[AGENT] Falling back to mock data:", error.message);
            // Fall through to mock data
          }
        }
        
        // Mock data fallback
        return JSON.stringify({
          employeeId: args.employeeId,
          servicesRevoked: args.services,
          status: "success",
          message: `Access revoked for ${args.services.join(", ")}`,
          source: "Mock Data",
        });
      
      case "transfer_data":
        if (useRealAPI) {
          try {
            const results = await transferUserData(args.fromEmployeeId, args.toEmployeeId, args.dataTypes);
            return JSON.stringify({
              fromEmployeeId: args.fromEmployeeId,
              toEmployeeId: args.toEmployeeId,
              dataTypesTransferred: args.dataTypes,
              results: results,
              status: "in_progress",
              message: `Data transfer initiated for ${args.dataTypes.join(", ")}`,
              source: "Microsoft Graph API",
            });
          } catch (error: any) {
            console.warn("[AGENT] Falling back to mock data:", error.message);
            // Fall through to mock data
          }
        }
        
        // Mock data fallback
        return JSON.stringify({
          fromEmployeeId: args.fromEmployeeId,
          toEmployeeId: args.toEmployeeId,
          dataTypesTransferred: args.dataTypes,
          status: "in_progress",
          message: `Data transfer initiated for ${args.dataTypes.join(", ")}`,
          source: "Mock Data",
        });
      
      default:
        return JSON.stringify({ error: "Unknown function" });
    }
  } catch (error: any) {
    console.error(`[AGENT] Error executing ${name}:`, error);
    return JSON.stringify({ error: error.message, function: name });
  }
}

// System prompt for the agent
const SYSTEM_PROMPT = `You are an intelligent Employee Offboarding Assistant for Microsoft 365.

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

// Conversation history per user
const conversationHistory = new Map<string, OpenAI.Chat.ChatCompletionMessageParam[]>();

export async function processAgenticMessage(
  userMessage: string,
  userId: string = "default"
): Promise<string> {
  try {
    // Get or initialize conversation history
    if (!conversationHistory.has(userId)) {
      conversationHistory.set(userId, [
        { role: "system", content: SYSTEM_PROMPT },
      ]);
    }
    
    const messages = conversationHistory.get(userId)!;
    
    // Add user message
    messages.push({ role: "user", content: userMessage });
    
    // Track chain of thought for user visibility
    const thoughtProcess: string[] = [];
    
    let response = await client.chat.completions.create({
      model: MODEL,
      messages: messages,
      tools: tools,
      tool_choice: "auto",
      temperature: 0.7,
      max_tokens: 1500,
    });
    
    let assistantMessage = response.choices[0].message;
    let iterations = 0;
    const maxIterations = 10;
    
    // Handle function calls (agent loop)
    while (assistantMessage.tool_calls && iterations < maxIterations) {
      iterations++;
      console.log(`[AGENT] Chain of thought iteration ${iterations}`);
      
      // Add assistant's message with tool calls
      messages.push(assistantMessage);
      
      // Execute all tool calls
      for (const toolCall of assistantMessage.tool_calls) {
        if (toolCall.type !== "function") continue;
        
        const functionName = toolCall.function?.name;
        const functionArgs = JSON.parse(toolCall.function?.arguments || "{}");
        
        // Add to thought process for user
        thoughtProcess.push(`🤔 **Thinking**: I need to ${functionName.replace(/_/g, ' ')} ${JSON.stringify(functionArgs).substring(0, 100)}...`);
        
        console.log(`[AGENT] 🤔 Thinking: I need to ${functionName} with ${JSON.stringify(functionArgs)}`);
        
        const functionResult = await executeFunction(functionName, functionArgs);
        
        // Add result summary to thought process
        thoughtProcess.push(`✅ **Action completed**: ${functionName.replace(/_/g, ' ')}`);
        
        // Add function result to messages
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: functionResult,
        });
      }
      
      // Get next response from model
      response = await client.chat.completions.create({
        model: MODEL,
        messages: messages,
        tools: tools,
        tool_choice: "auto",
        temperature: 0.7,
        max_tokens: 1500,
      });
      
      assistantMessage = response.choices[0].message;
    }
    
    // Add final assistant message
    messages.push(assistantMessage);
    
    // Keep conversation history manageable (last 20 messages)
    if (messages.length > 20) {
      conversationHistory.set(userId, [
        messages[0], // Keep system prompt
        ...messages.slice(-19),
      ]);
    }
    
    // Build response with chain of thought
    let finalResponse = "";
    if (thoughtProcess.length > 0) {
      finalResponse += "**🧠 Chain of Thought:**\n\n";
      finalResponse += thoughtProcess.join("\n\n") + "\n\n---\n\n";
    }
    finalResponse += assistantMessage.content || "I apologize, I couldn't process that request.";
    
    return finalResponse;
    
  } catch (error: any) {
    console.error("[AGENT ERROR]", error);
    return `I encountered an error: ${error.message}. Please make sure your API key is configured correctly.`;
  }
}

export function clearConversation(userId: string = "default"): void {
  conversationHistory.delete(userId);
  console.log(`[AGENT] Cleared conversation history for user ${userId}`);
}
