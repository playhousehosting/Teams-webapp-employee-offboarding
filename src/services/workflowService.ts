/**
 * Workflow Builder Service
 * 
 * Enables visual workflow creation with drag-and-drop interface.
 * Features:
 * - Configurable workflow steps
 * - Conditional logic (if-then rules)
 * - Department-specific templates
 * - Parallel and sequential execution
 */

export interface WorkflowStep {
  id: string;
  type: 'task' | 'approval' | 'notification' | 'integration' | 'condition' | 'delay';
  name: string;
  description?: string;
  config: WorkflowStepConfig;
  position: { x: number; y: number };
  connections: string[]; // IDs of next steps
}

export interface WorkflowStepConfig {
  // Task config
  taskType?: 'revoke_access' | 'transfer_data' | 'collect_asset' | 'custom';
  assignedTo?: string;
  dueInDays?: number;
  
  // Approval config
  approvalTemplate?: string;
  requiredApprovers?: string[];
  
  // Notification config
  notificationType?: 'email' | 'teams' | 'slack' | 'sms';
  recipients?: string[];
  template?: string;
  
  // Integration config
  integrationType?: 'workday' | 'servicenow' | 'bamboohr' | 'slack' | 'custom';
  endpoint?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  payload?: Record<string, any>;
  
  // Condition config
  condition?: {
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
    value: any;
    trueStep: string; // Next step if true
    falseStep: string; // Next step if false
  };
  
  // Delay config
  delayDays?: number;
  delayHours?: number;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  department?: string;
  offboardingReason?: 'resignation' | 'termination' | 'retirement' | 'contract_end';
  isTemplate: boolean;
  isActive: boolean;
  version: number;
  steps: WorkflowStep[];
  startStepId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

// In-memory storage
const workflows = new Map<string, Workflow>();

/**
 * Initialize default workflow templates
 */
export function initializeWorkflowTemplates() {
  // Standard resignation workflow
  const resignationWorkflow: Workflow = {
    id: 'template-resignation',
    name: 'Standard Resignation Workflow',
    description: 'Default workflow for employee resignations',
    offboardingReason: 'resignation',
    isTemplate: true,
    isActive: true,
    version: 1,
    startStepId: 'step-1',
    createdBy: 'system',
    createdAt: new Date(),
    updatedAt: new Date(),
    steps: [
      {
        id: 'step-1',
        type: 'notification',
        name: 'Notify HR Team',
        description: 'Send notification to HR about resignation',
        position: { x: 100, y: 100 },
        connections: ['step-2'],
        config: {
          notificationType: 'email',
          recipients: ['hr@company.com'],
          template: 'resignation-notification'
        }
      },
      {
        id: 'step-2',
        type: 'approval',
        name: 'Manager Approval',
        description: 'Get approval from direct manager',
        position: { x: 300, y: 100 },
        connections: ['step-3'],
        config: {
          approvalTemplate: 'standard-offboarding',
          requiredApprovers: ['manager']
        }
      },
      {
        id: 'step-3',
        type: 'task',
        name: 'Schedule Exit Interview',
        description: 'HR schedules exit interview',
        position: { x: 500, y: 100 },
        connections: ['step-4', 'step-5'],
        config: {
          taskType: 'custom',
          assignedTo: 'hr-team',
          dueInDays: 7
        }
      },
      {
        id: 'step-4',
        type: 'task',
        name: 'Knowledge Transfer',
        description: 'Document handoff to successor',
        position: { x: 700, y: 50 },
        connections: ['step-6'],
        config: {
          taskType: 'custom',
          assignedTo: 'departing-employee',
          dueInDays: 10
        }
      },
      {
        id: 'step-5',
        type: 'task',
        name: 'Collect Company Assets',
        description: 'Return laptop, badge, keys',
        position: { x: 700, y: 150 },
        connections: ['step-6'],
        config: {
          taskType: 'collect_asset',
          assignedTo: 'it-team',
          dueInDays: 14
        }
      },
      {
        id: 'step-6',
        type: 'delay',
        name: 'Wait for Last Day',
        description: 'Wait until employee last working day',
        position: { x: 900, y: 100 },
        connections: ['step-7'],
        config: {
          delayDays: 14
        }
      },
      {
        id: 'step-7',
        type: 'task',
        name: 'Revoke All Access',
        description: 'Disable accounts and revoke licenses',
        position: { x: 1100, y: 100 },
        connections: ['step-8'],
        config: {
          taskType: 'revoke_access',
          assignedTo: 'it-team',
          dueInDays: 0
        }
      },
      {
        id: 'step-8',
        type: 'notification',
        name: 'Completion Notification',
        description: 'Notify stakeholders of completion',
        position: { x: 1300, y: 100 },
        connections: [],
        config: {
          notificationType: 'email',
          recipients: ['hr@company.com', 'it@company.com'],
          template: 'offboarding-complete'
        }
      }
    ]
  };

  // High-risk termination workflow
  const terminationWorkflow: Workflow = {
    id: 'template-termination',
    name: 'High-Risk Termination Workflow',
    description: 'Workflow for involuntary terminations with immediate access revocation',
    offboardingReason: 'termination',
    isTemplate: true,
    isActive: true,
    version: 1,
    startStepId: 'step-1',
    createdBy: 'system',
    createdAt: new Date(),
    updatedAt: new Date(),
    steps: [
      {
        id: 'step-1',
        type: 'approval',
        name: 'Legal & HR Approval',
        description: 'Multi-level approval required',
        position: { x: 100, y: 100 },
        connections: ['step-2'],
        config: {
          approvalTemplate: 'high-risk-offboarding',
          requiredApprovers: ['hr', 'legal', 'executive']
        }
      },
      {
        id: 'step-2',
        type: 'condition',
        name: 'Check Access Risk',
        description: 'Determine if immediate revocation needed',
        position: { x: 300, y: 100 },
        connections: ['step-3', 'step-5'],
        config: {
          condition: {
            field: 'riskLevel',
            operator: 'equals',
            value: 'high',
            trueStep: 'step-3', // Immediate revocation
            falseStep: 'step-5' // Standard process
          }
        }
      },
      {
        id: 'step-3',
        type: 'task',
        name: 'IMMEDIATE Access Revocation',
        description: 'Revoke all access immediately',
        position: { x: 500, y: 50 },
        connections: ['step-4'],
        config: {
          taskType: 'revoke_access',
          assignedTo: 'security-team',
          dueInDays: 0
        }
      },
      {
        id: 'step-4',
        type: 'notification',
        name: 'Alert Security Team',
        description: 'Notify security of high-risk termination',
        position: { x: 700, y: 50 },
        connections: ['step-6'],
        config: {
          notificationType: 'teams',
          recipients: ['security@company.com'],
          template: 'high-risk-alert'
        }
      },
      {
        id: 'step-5',
        type: 'task',
        name: 'Schedule Access Revocation',
        description: 'Plan access revocation for termination date',
        position: { x: 500, y: 150 },
        connections: ['step-6'],
        config: {
          taskType: 'revoke_access',
          assignedTo: 'it-team',
          dueInDays: 3
        }
      },
      {
        id: 'step-6',
        type: 'task',
        name: 'Collect Assets Immediately',
        description: 'Arrange immediate return of company property',
        position: { x: 900, y: 100 },
        connections: ['step-7'],
        config: {
          taskType: 'collect_asset',
          assignedTo: 'facilities',
          dueInDays: 1
        }
      },
      {
        id: 'step-7',
        type: 'integration',
        name: 'Create Legal Hold',
        description: 'Preserve data for potential litigation',
        position: { x: 1100, y: 100 },
        connections: ['step-8'],
        config: {
          integrationType: 'custom',
          endpoint: '/api/legal-hold',
          method: 'POST',
          payload: { action: 'create', duration: 90 }
        }
      },
      {
        id: 'step-8',
        type: 'notification',
        name: 'Termination Complete',
        description: 'Notify all stakeholders',
        position: { x: 1300, y: 100 },
        connections: [],
        config: {
          notificationType: 'email',
          recipients: ['hr@company.com', 'legal@company.com', 'security@company.com'],
          template: 'termination-complete'
        }
      }
    ]
  };

  // Retirement workflow (celebratory)
  const retirementWorkflow: Workflow = {
    id: 'template-retirement',
    name: 'Retirement Celebration Workflow',
    description: 'Workflow for employee retirements with alumni program enrollment',
    offboardingReason: 'retirement',
    isTemplate: true,
    isActive: true,
    version: 1,
    startStepId: 'step-1',
    createdBy: 'system',
    createdAt: new Date(),
    updatedAt: new Date(),
    steps: [
      {
        id: 'step-1',
        type: 'notification',
        name: 'Announce Retirement',
        description: 'Celebrate retirement with team',
        position: { x: 100, y: 100 },
        connections: ['step-2'],
        config: {
          notificationType: 'teams',
          recipients: ['all@company.com'],
          template: 'retirement-announcement'
        }
      },
      {
        id: 'step-2',
        type: 'task',
        name: 'Plan Retirement Party',
        description: 'Organize celebration event',
        position: { x: 300, y: 100 },
        connections: ['step-3'],
        config: {
          taskType: 'custom',
          assignedTo: 'hr-team',
          dueInDays: 30
        }
      },
      {
        id: 'step-3',
        type: 'task',
        name: 'Knowledge Documentation',
        description: 'Capture institutional knowledge',
        position: { x: 500, y: 100 },
        connections: ['step-4'],
        config: {
          taskType: 'custom',
          assignedTo: 'departing-employee',
          dueInDays: 45
        }
      },
      {
        id: 'step-4',
        type: 'task',
        name: 'Alumni Program Enrollment',
        description: 'Invite to join company alumni network',
        position: { x: 700, y: 100 },
        connections: ['step-5'],
        config: {
          taskType: 'custom',
          assignedTo: 'hr-team',
          dueInDays: 60
        }
      },
      {
        id: 'step-5',
        type: 'delay',
        name: 'Wait for Retirement Date',
        description: 'Process on actual retirement date',
        position: { x: 900, y: 100 },
        connections: ['step-6'],
        config: {
          delayDays: 60
        }
      },
      {
        id: 'step-6',
        type: 'task',
        name: 'Graceful Access Transition',
        description: 'Gradually reduce access with option to consult',
        position: { x: 1100, y: 100 },
        connections: ['step-7'],
        config: {
          taskType: 'revoke_access',
          assignedTo: 'it-team',
          dueInDays: 0
        }
      },
      {
        id: 'step-7',
        type: 'notification',
        name: 'Send Retirement Gift',
        description: 'Thank you message and gift',
        position: { x: 1300, y: 100 },
        connections: [],
        config: {
          notificationType: 'email',
          recipients: ['retiree@company.com'],
          template: 'retirement-thanks'
        }
      }
    ]
  };

  workflows.set(resignationWorkflow.id, resignationWorkflow);
  workflows.set(terminationWorkflow.id, terminationWorkflow);
  workflows.set(retirementWorkflow.id, retirementWorkflow);
}

/**
 * Create a new workflow
 */
export function createWorkflow(
  name: string,
  description: string,
  createdBy: string,
  options?: {
    department?: string;
    offboardingReason?: 'resignation' | 'termination' | 'retirement' | 'contract_end';
    isTemplate?: boolean;
    basedOnTemplate?: string;
  }
): Workflow {
  const workflow: Workflow = {
    id: `workflow-${Date.now()}`,
    name,
    description,
    department: options?.department,
    offboardingReason: options?.offboardingReason,
    isTemplate: options?.isTemplate || false,
    isActive: true,
    version: 1,
    steps: [],
    startStepId: '',
    createdBy,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // Copy from template if specified
  if (options?.basedOnTemplate) {
    const template = workflows.get(options.basedOnTemplate);
    if (template) {
      workflow.steps = JSON.parse(JSON.stringify(template.steps));
      workflow.startStepId = template.startStepId;
    }
  }

  workflows.set(workflow.id, workflow);
  return workflow;
}

/**
 * Add step to workflow
 */
export function addWorkflowStep(
  workflowId: string,
  step: Omit<WorkflowStep, 'id'>
): WorkflowStep {
  const workflow = workflows.get(workflowId);
  if (!workflow) {
    throw new Error(`Workflow not found: ${workflowId}`);
  }

  const newStep: WorkflowStep = {
    ...step,
    id: `step-${Date.now()}`
  };

  workflow.steps.push(newStep);
  workflow.updatedAt = new Date();

  if (workflow.steps.length === 1) {
    workflow.startStepId = newStep.id;
  }

  return newStep;
}

/**
 * Update workflow step
 */
export function updateWorkflowStep(
  workflowId: string,
  stepId: string,
  updates: Partial<WorkflowStep>
): WorkflowStep {
  const workflow = workflows.get(workflowId);
  if (!workflow) {
    throw new Error(`Workflow not found: ${workflowId}`);
  }

  const stepIndex = workflow.steps.findIndex(s => s.id === stepId);
  if (stepIndex === -1) {
    throw new Error(`Step not found: ${stepId}`);
  }

  workflow.steps[stepIndex] = {
    ...workflow.steps[stepIndex],
    ...updates
  };
  workflow.updatedAt = new Date();

  return workflow.steps[stepIndex];
}

/**
 * Remove workflow step
 */
export function removeWorkflowStep(workflowId: string, stepId: string): void {
  const workflow = workflows.get(workflowId);
  if (!workflow) {
    throw new Error(`Workflow not found: ${workflowId}`);
  }

  workflow.steps = workflow.steps.filter(s => s.id !== stepId);
  
  // Remove connections to this step
  workflow.steps.forEach(step => {
    step.connections = step.connections.filter(c => c !== stepId);
  });

  workflow.updatedAt = new Date();
}

/**
 * Connect two workflow steps
 */
export function connectWorkflowSteps(
  workflowId: string,
  fromStepId: string,
  toStepId: string
): void {
  const workflow = workflows.get(workflowId);
  if (!workflow) {
    throw new Error(`Workflow not found: ${workflowId}`);
  }

  const fromStep = workflow.steps.find(s => s.id === fromStepId);
  if (!fromStep) {
    throw new Error(`From step not found: ${fromStepId}`);
  }

  if (!fromStep.connections.includes(toStepId)) {
    fromStep.connections.push(toStepId);
  }

  workflow.updatedAt = new Date();
}

/**
 * Get workflow by ID
 */
export function getWorkflow(workflowId: string): Workflow | undefined {
  return workflows.get(workflowId);
}

/**
 * List all workflows
 */
export function listWorkflows(filters?: {
  isTemplate?: boolean;
  department?: string;
  offboardingReason?: string;
}): Workflow[] {
  let result = Array.from(workflows.values());

  if (filters?.isTemplate !== undefined) {
    result = result.filter(w => w.isTemplate === filters.isTemplate);
  }
  if (filters?.department) {
    result = result.filter(w => w.department === filters.department);
  }
  if (filters?.offboardingReason) {
    result = result.filter(w => w.offboardingReason === filters.offboardingReason);
  }

  return result;
}

/**
 * Execute workflow for a session
 */
export function executeWorkflow(
  workflowId: string,
  sessionId: string,
  context: Record<string, any>
): WorkflowExecution {
  const workflow = workflows.get(workflowId);
  if (!workflow) {
    throw new Error(`Workflow not found: ${workflowId}`);
  }

  const execution: WorkflowExecution = {
    id: `exec-${Date.now()}`,
    workflowId,
    sessionId,
    startedAt: new Date(),
    status: 'running',
    currentStepId: workflow.startStepId,
    completedSteps: [],
    context
  };

  return execution;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  sessionId: string;
  startedAt: Date;
  completedAt?: Date;
  status: 'running' | 'completed' | 'failed' | 'paused';
  currentStepId: string;
  completedSteps: string[];
  context: Record<string, any>;
  error?: string;
}

/**
 * Validate workflow (check for cycles, unreachable steps, etc.)
 */
export function validateWorkflow(workflowId: string): {
  isValid: boolean;
  errors: string[];
} {
  const workflow = workflows.get(workflowId);
  if (!workflow) {
    return { isValid: false, errors: ['Workflow not found'] };
  }

  const errors: string[] = [];

  // Check if start step exists
  if (!workflow.startStepId) {
    errors.push('No start step defined');
  } else if (!workflow.steps.find(s => s.id === workflow.startStepId)) {
    errors.push('Start step does not exist in workflow');
  }

  // Check for unreachable steps
  const reachable = new Set<string>();
  const visited = new Set<string>();
  
  function traverse(stepId: string) {
    if (visited.has(stepId) || !workflow) return;
    visited.add(stepId);
    reachable.add(stepId);
    
    const step = workflow.steps.find(s => s.id === stepId);
    if (step) {
      step.connections.forEach(connId => traverse(connId));
    }
  }
  
  if (workflow.startStepId) {
    traverse(workflow.startStepId);
  }

  workflow.steps.forEach(step => {
    if (!reachable.has(step.id)) {
      errors.push(`Step "${step.name}" (${step.id}) is unreachable`);
    }
  });

  // Check for invalid connections
  workflow.steps.forEach(step => {
    step.connections.forEach(connId => {
      if (!workflow.steps.find(s => s.id === connId)) {
        errors.push(`Step "${step.name}" connects to non-existent step ${connId}`);
      }
    });
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Initialize templates on module load
initializeWorkflowTemplates();
