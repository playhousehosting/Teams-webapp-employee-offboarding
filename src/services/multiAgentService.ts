/**
 * Multi-Agent Orchestration System
 * 
 * Coordinates specialized AI agents for different domains:
 * - HR Agent: Employee relations, policies, exit interviews
 * - IT Agent: Access revocation, asset management, data security
 * - Legal Agent: Compliance, documentation, risk assessment
 * - Finance Agent: Final paycheck, expense reimbursement, benefits
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});

export interface Agent {
  id: string;
  name: string;
  role: 'hr' | 'it' | 'legal' | 'finance' | 'orchestrator';
  specialization: string[];
  systemPrompt: string;
  model: string;
  temperature: number;
}

export interface AgentMessage {
  id: string;
  agentId: string;
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface AgentTask {
  id: string;
  agentId: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result?: any;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface OrchestrationSession {
  id: string;
  employeeId: string;
  goal: string;
  agents: string[]; // Agent IDs involved
  tasks: AgentTask[];
  messages: AgentMessage[];
  status: 'active' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
}

// Agent definitions
const agents: Map<string, Agent> = new Map();
const sessions: Map<string, OrchestrationSession> = new Map();

/**
 * Initialize specialized agents
 */
export function initializeAgents(): void {
  // HR Agent
  agents.set('hr-agent', {
    id: 'hr-agent',
    name: 'HR Specialist',
    role: 'hr',
    specialization: ['exit_interviews', 'policy_enforcement', 'employee_relations', 'documentation'],
    systemPrompt: `You are an HR specialist focused on employee offboarding. 
Your responsibilities include:
- Conducting empathetic exit interviews
- Ensuring policy compliance
- Coordinating final paperwork
- Managing employee benefits transitions
- Maintaining professional relationships for potential rehires

Always be professional, empathetic, and detail-oriented.`,
    model: 'gpt-4o',
    temperature: 0.7
  });

  // IT Agent
  agents.set('it-agent', {
    id: 'it-agent',
    name: 'IT Security Specialist',
    role: 'it',
    specialization: ['access_revocation', 'asset_recovery', 'data_security', 'system_cleanup'],
    systemPrompt: `You are an IT security specialist responsible for technical offboarding.
Your responsibilities include:
- Revoking all system access immediately
- Ensuring data security and preventing data loss
- Recovering company assets (laptops, phones, badges)
- Archiving or transferring critical data
- Maintaining audit trails for security compliance

Prioritize security while ensuring business continuity.`,
    model: 'gpt-4o',
    temperature: 0.3
  });

  // Legal Agent
  agents.set('legal-agent', {
    id: 'legal-agent',
    name: 'Legal Compliance Officer',
    role: 'legal',
    specialization: ['compliance', 'documentation', 'risk_assessment', 'agreements'],
    systemPrompt: `You are a legal compliance officer specializing in employment law.
Your responsibilities include:
- Ensuring regulatory compliance (SOX, GDPR, etc.)
- Reviewing and preparing legal documents
- Assessing legal risks in offboarding
- Enforcing non-compete and confidentiality agreements
- Managing severance agreements

Focus on risk mitigation and regulatory compliance.`,
    model: 'gpt-4o',
    temperature: 0.2
  });

  // Finance Agent
  agents.set('finance-agent', {
    id: 'finance-agent',
    name: 'Finance Administrator',
    role: 'finance',
    specialization: ['payroll', 'expenses', 'benefits', 'reimbursements'],
    systemPrompt: `You are a finance administrator handling employee financial matters.
Your responsibilities include:
- Processing final paychecks accurately
- Handling expense reimbursements
- Managing benefits termination (401k, health insurance)
- Coordinating COBRA notifications
- Ensuring financial record accuracy

Prioritize accuracy and timeliness in all financial transactions.`,
    model: 'gpt-4o',
    temperature: 0.2
  });

  // Orchestrator Agent
  agents.set('orchestrator-agent', {
    id: 'orchestrator-agent',
    name: 'Offboarding Orchestrator',
    role: 'orchestrator',
    specialization: ['coordination', 'planning', 'communication', 'decision_making'],
    systemPrompt: `You are the orchestrator agent coordinating the entire offboarding process.
Your responsibilities include:
- Breaking down complex offboarding requests into specialized tasks
- Delegating tasks to appropriate specialist agents
- Coordinating communication between agents
- Ensuring all tasks are completed on schedule
- Making decisions when conflicts arise

Think strategically and coordinate effectively.`,
    model: 'gpt-4o',
    temperature: 0.5
  });
}

/**
 * Start orchestration session
 */
export function startOrchestration(
  employeeId: string,
  goal: string,
  requiredRoles?: Agent['role'][]
): OrchestrationSession {
  const sessionId = `session-${Date.now()}`;
  
  // Determine which agents to involve
  let involvedAgents: string[];
  if (requiredRoles) {
    involvedAgents = Array.from(agents.values())
      .filter(a => requiredRoles.includes(a.role))
      .map(a => a.id);
  } else {
    // Default: involve all specialist agents
    involvedAgents = ['hr-agent', 'it-agent', 'legal-agent', 'finance-agent'];
  }

  const session: OrchestrationSession = {
    id: sessionId,
    employeeId,
    goal,
    agents: involvedAgents,
    tasks: [],
    messages: [],
    status: 'active',
    createdAt: new Date()
  };

  sessions.set(sessionId, session);
  return session;
}

/**
 * Execute agent task
 */
export async function executeAgentTask(
  sessionId: string,
  agentId: string,
  taskDescription: string,
  context?: Record<string, any>
): Promise<AgentTask> {
  const session = sessions.get(sessionId);
  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  const agent = agents.get(agentId);
  if (!agent) {
    throw new Error(`Agent not found: ${agentId}`);
  }

  const task: AgentTask = {
    id: `task-${Date.now()}`,
    agentId,
    description: taskDescription,
    status: 'in_progress',
    createdAt: new Date()
  };

  session.tasks.push(task);

  try {
    // Call OpenAI with agent's system prompt
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: agent.systemPrompt
      },
      {
        role: 'user',
        content: `Employee ID: ${session.employeeId}
Goal: ${session.goal}

Task: ${taskDescription}

${context ? `Additional Context: ${JSON.stringify(context, null, 2)}` : ''}

Please complete this task and provide a detailed response with specific actions taken.`
      }
    ];

    const response = await openai.chat.completions.create({
      model: agent.model,
      messages,
      temperature: agent.temperature,
      max_tokens: 1000
    });

    const result = response.choices[0]?.message?.content || 'No response generated';

    task.result = result;
    task.status = 'completed';
    task.completedAt = new Date();

    // Add message to session
    session.messages.push({
      id: `msg-${Date.now()}`,
      agentId,
      content: result,
      timestamp: new Date(),
      metadata: { taskId: task.id }
    });

  } catch (error) {
    task.status = 'failed';
    task.error = error instanceof Error ? error.message : 'Unknown error';
    task.completedAt = new Date();
  }

  return task;
}

/**
 * Orchestrate complete offboarding
 */
export async function orchestrateOffboarding(
  employeeId: string,
  reason: string,
  lastWorkingDay: Date,
  additionalContext?: Record<string, any>
): Promise<OrchestrationSession> {
  // Start orchestration session
  const session = startOrchestration(
    employeeId,
    `Complete offboarding for employee ${employeeId}. Reason: ${reason}. Last working day: ${lastWorkingDay.toISOString()}`
  );

  // Define tasks for each agent
  const taskPlan = [
    {
      agentId: 'hr-agent',
      description: `Schedule and conduct exit interview. Ensure all HR documentation is completed. Address any employee concerns professionally.`,
      context: { reason, lastWorkingDay }
    },
    {
      agentId: 'it-agent',
      description: `Revoke all system access for employee. Create asset recovery plan for laptops, phones, and badges. Archive employee data securely.`,
      context: { lastWorkingDay, immediate: reason === 'termination' }
    },
    {
      agentId: 'legal-agent',
      description: `Review and ensure compliance with all legal requirements. Prepare necessary legal documents (NDA renewal, separation agreement). Assess any legal risks.`,
      context: { reason, additionalContext }
    },
    {
      agentId: 'finance-agent',
      description: `Calculate final paycheck including unused PTO. Process any pending expense reimbursements. Coordinate benefits termination and COBRA notification.`,
      context: { lastWorkingDay }
    }
  ];

  // Execute tasks in parallel
  const taskPromises = taskPlan.map(plan =>
    executeAgentTask(session.id, plan.agentId, plan.description, plan.context)
  );

  await Promise.all(taskPromises);

  // Check if all tasks completed successfully
  const allCompleted = session.tasks.every(t => t.status === 'completed');
  session.status = allCompleted ? 'completed' : 'failed';
  session.completedAt = new Date();

  return session;
}

/**
 * Get agent coordination summary
 */
export function getCoordinationSummary(sessionId: string): {
  session: OrchestrationSession;
  taskSummary: Record<string, { completed: number; failed: number; pending: number }>;
  timeline: Array<{ agent: string; task: string; timestamp: Date; status: string }>;
} {
  const session = sessions.get(sessionId);
  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  // Calculate task summary by agent
  const taskSummary: Record<string, { completed: number; failed: number; pending: number }> = {};
  
  session.tasks.forEach(task => {
    const agent = agents.get(task.agentId);
    const agentName = agent?.name || task.agentId;
    
    if (!taskSummary[agentName]) {
      taskSummary[agentName] = { completed: 0, failed: 0, pending: 0 };
    }

    if (task.status === 'completed') taskSummary[agentName].completed++;
    else if (task.status === 'failed') taskSummary[agentName].failed++;
    else taskSummary[agentName].pending++;
  });

  // Create timeline
  const timeline = session.tasks.map(task => ({
    agent: agents.get(task.agentId)?.name || task.agentId,
    task: task.description,
    timestamp: task.createdAt,
    status: task.status
  })).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  return {
    session,
    taskSummary,
    timeline
  };
}

/**
 * Get agent by ID
 */
export function getAgent(agentId: string): Agent | undefined {
  return agents.get(agentId);
}

/**
 * List all agents
 */
export function listAgents(role?: Agent['role']): Agent[] {
  const allAgents = Array.from(agents.values());
  if (role) {
    return allAgents.filter(a => a.role === role);
  }
  return allAgents;
}

/**
 * Get session
 */
export function getSession(sessionId: string): OrchestrationSession | undefined {
  return sessions.get(sessionId);
}

/**
 * List all sessions
 */
export function listSessions(filters?: {
  employeeId?: string;
  status?: OrchestrationSession['status'];
}): OrchestrationSession[] {
  let results = Array.from(sessions.values());

  if (filters?.employeeId) {
    results = results.filter(s => s.employeeId === filters.employeeId);
  }
  if (filters?.status) {
    results = results.filter(s => s.status === filters.status);
  }

  return results;
}

// Initialize agents on module load
initializeAgents();
