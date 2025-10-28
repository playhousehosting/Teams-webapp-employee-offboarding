/**
 * Approval Service
 * 
 * Handles multi-level approval workflows for offboarding tasks.
 * Features:
 * - Configurable approval chains
 * - Delegation during absences
 * - Escalation policies
 * - Parallel and sequential approvals
 */

import { v4 as uuidv4 } from 'uuid';

// Types
export interface Approver {
  id: string;
  name: string;
  email: string;
  role: 'HR' | 'IT' | 'Legal' | 'Finance' | 'Manager' | 'Executive';
  delegateTo?: string; // User ID of delegate
}

export interface ApprovalLevel {
  level: number;
  approvers: Approver[];
  requiredApprovals: number; // How many approvers needed at this level
  type: 'sequential' | 'parallel'; // All required or any one
  escalationTimeHours?: number; // Auto-escalate after X hours
  escalateTo?: string; // User ID to escalate to
}

export interface ApprovalRequest {
  id: string;
  sessionId: string;
  taskId: string;
  taskName: string;
  requestedBy: string;
  requestedAt: Date;
  currentLevel: number;
  status: 'pending' | 'approved' | 'rejected' | 'escalated';
  reason?: string;
  levels: ApprovalLevel[];
  history: ApprovalAction[];
  metadata?: Record<string, any>;
}

export interface ApprovalAction {
  id: string;
  approvalRequestId: string;
  approverId: string;
  approverName: string;
  action: 'approved' | 'rejected' | 'delegated' | 'escalated';
  timestamp: Date;
  comments?: string;
  level: number;
}

export interface ApprovalWorkflowTemplate {
  id: string;
  name: string;
  description: string;
  department?: string;
  taskType?: string;
  levels: ApprovalLevel[];
}

// In-memory storage (replace with database in production)
const approvalRequests = new Map<string, ApprovalRequest>();
const approvalTemplates = new Map<string, ApprovalWorkflowTemplate>();
const pendingApprovals = new Map<string, ApprovalRequest[]>(); // approverId -> requests

/**
 * Initialize default approval templates
 */
export function initializeApprovalTemplates() {
  // Standard offboarding approval (HR -> Manager -> IT)
  const standardTemplate: ApprovalWorkflowTemplate = {
    id: 'standard-offboarding',
    name: 'Standard Offboarding Approval',
    description: 'Default approval chain for employee offboarding',
    levels: [
      {
        level: 1,
        approvers: [
          { id: 'hr-001', name: 'HR Manager', email: 'hr@company.com', role: 'HR' }
        ],
        requiredApprovals: 1,
        type: 'sequential',
        escalationTimeHours: 24,
        escalateTo: 'hr-director'
      },
      {
        level: 2,
        approvers: [
          { id: 'manager-001', name: 'Department Manager', email: 'manager@company.com', role: 'Manager' }
        ],
        requiredApprovals: 1,
        type: 'sequential',
        escalationTimeHours: 24
      },
      {
        level: 3,
        approvers: [
          { id: 'it-001', name: 'IT Director', email: 'it@company.com', role: 'IT' }
        ],
        requiredApprovals: 1,
        type: 'sequential'
      }
    ]
  };

  // High-risk offboarding (additional legal/executive approval)
  const highRiskTemplate: ApprovalWorkflowTemplate = {
    id: 'high-risk-offboarding',
    name: 'High-Risk Offboarding Approval',
    description: 'Approval chain for sensitive roles or high-risk terminations',
    levels: [
      {
        level: 1,
        approvers: [
          { id: 'hr-001', name: 'HR Manager', email: 'hr@company.com', role: 'HR' },
          { id: 'legal-001', name: 'Legal Counsel', email: 'legal@company.com', role: 'Legal' }
        ],
        requiredApprovals: 2, // Both must approve
        type: 'parallel',
        escalationTimeHours: 12
      },
      {
        level: 2,
        approvers: [
          { id: 'exec-001', name: 'VP of Operations', email: 'vp@company.com', role: 'Executive' }
        ],
        requiredApprovals: 1,
        type: 'sequential',
        escalationTimeHours: 24
      },
      {
        level: 3,
        approvers: [
          { id: 'it-001', name: 'IT Director', email: 'it@company.com', role: 'IT' },
          { id: 'security-001', name: 'Security Officer', email: 'security@company.com', role: 'IT' }
        ],
        requiredApprovals: 2,
        type: 'parallel'
      }
    ]
  };

  // Fast-track approval (resigned employee, low risk)
  const fastTrackTemplate: ApprovalWorkflowTemplate = {
    id: 'fast-track-offboarding',
    name: 'Fast-Track Offboarding Approval',
    description: 'Expedited approval for voluntary resignations',
    levels: [
      {
        level: 1,
        approvers: [
          { id: 'hr-001', name: 'HR Manager', email: 'hr@company.com', role: 'HR' },
          { id: 'manager-001', name: 'Department Manager', email: 'manager@company.com', role: 'Manager' }
        ],
        requiredApprovals: 1, // Either can approve
        type: 'parallel',
        escalationTimeHours: 48
      }
    ]
  };

  approvalTemplates.set(standardTemplate.id, standardTemplate);
  approvalTemplates.set(highRiskTemplate.id, highRiskTemplate);
  approvalTemplates.set(fastTrackTemplate.id, fastTrackTemplate);
}

/**
 * Create a new approval request
 */
export function createApprovalRequest(
  sessionId: string,
  taskId: string,
  taskName: string,
  requestedBy: string,
  templateId: string = 'standard-offboarding',
  metadata?: Record<string, any>
): ApprovalRequest {
  const template = approvalTemplates.get(templateId);
  if (!template) {
    throw new Error(`Approval template not found: ${templateId}`);
  }

  const request: ApprovalRequest = {
    id: uuidv4(),
    sessionId,
    taskId,
    taskName,
    requestedBy,
    requestedAt: new Date(),
    currentLevel: 1,
    status: 'pending',
    levels: JSON.parse(JSON.stringify(template.levels)), // Deep clone
    history: [],
    metadata
  };

  approvalRequests.set(request.id, request);

  // Add to pending approvals for level 1 approvers
  const level1 = request.levels[0];
  level1.approvers.forEach(approver => {
    const approverRequests = pendingApprovals.get(approver.id) || [];
    approverRequests.push(request);
    pendingApprovals.set(approver.id, approverRequests);
  });

  return request;
}

/**
 * Approve a request
 */
export function approveRequest(
  requestId: string,
  approverId: string,
  approverName: string,
  comments?: string
): ApprovalRequest {
  const request = approvalRequests.get(requestId);
  if (!request) {
    throw new Error(`Approval request not found: ${requestId}`);
  }

  if (request.status !== 'pending') {
    throw new Error(`Cannot approve request with status: ${request.status}`);
  }

  const currentLevel = request.levels[request.currentLevel - 1];
  const approver = currentLevel.approvers.find(a => a.id === approverId);
  
  if (!approver) {
    throw new Error(`Approver ${approverId} not authorized for level ${request.currentLevel}`);
  }

  // Record the approval action
  const action: ApprovalAction = {
    id: uuidv4(),
    approvalRequestId: requestId,
    approverId,
    approverName,
    action: 'approved',
    timestamp: new Date(),
    comments,
    level: request.currentLevel
  };
  request.history.push(action);

  // Check if level is complete
  const approvals = request.history.filter(
    h => h.level === request.currentLevel && h.action === 'approved'
  ).length;

  if (approvals >= currentLevel.requiredApprovals) {
    // Level complete, move to next level
    if (request.currentLevel < request.levels.length) {
      request.currentLevel++;
      
      // Add to pending approvals for next level
      const nextLevel = request.levels[request.currentLevel - 1];
      nextLevel.approvers.forEach(approver => {
        const approverRequests = pendingApprovals.get(approver.id) || [];
        approverRequests.push(request);
        pendingApprovals.set(approver.id, approverRequests);
      });
    } else {
      // All levels complete
      request.status = 'approved';
      
      // Remove from all pending queues
      clearPendingApprovals(requestId);
    }
  }

  return request;
}

/**
 * Reject a request
 */
export function rejectRequest(
  requestId: string,
  approverId: string,
  approverName: string,
  reason: string
): ApprovalRequest {
  const request = approvalRequests.get(requestId);
  if (!request) {
    throw new Error(`Approval request not found: ${requestId}`);
  }

  const action: ApprovalAction = {
    id: uuidv4(),
    approvalRequestId: requestId,
    approverId,
    approverName,
    action: 'rejected',
    timestamp: new Date(),
    comments: reason,
    level: request.currentLevel
  };
  request.history.push(action);
  request.status = 'rejected';
  request.reason = reason;

  clearPendingApprovals(requestId);

  return request;
}

/**
 * Delegate approval to another user
 */
export function delegateApproval(
  requestId: string,
  fromApproverId: string,
  toApproverId: string,
  toApproverName: string,
  _toApproverEmail: string,
  reason: string
): ApprovalRequest {
  const request = approvalRequests.get(requestId);
  if (!request) {
    throw new Error(`Approval request not found: ${requestId}`);
  }

  const currentLevel = request.levels[request.currentLevel - 1];
  const approver = currentLevel.approvers.find(a => a.id === fromApproverId);
  
  if (!approver) {
    throw new Error(`Approver ${fromApproverId} not found at level ${request.currentLevel}`);
  }

  // Update the approver to the delegate
  approver.delegateTo = toApproverId;

  // Record delegation action
  const action: ApprovalAction = {
    id: uuidv4(),
    approvalRequestId: requestId,
    approverId: fromApproverId,
    approverName: `${approver.name} (delegated to ${toApproverName})`,
    action: 'delegated',
    timestamp: new Date(),
    comments: reason,
    level: request.currentLevel
  };
  request.history.push(action);

  // Move from one pending queue to another
  removePendingApproval(fromApproverId, requestId);
  const delegateRequests = pendingApprovals.get(toApproverId) || [];
  delegateRequests.push(request);
  pendingApprovals.set(toApproverId, delegateRequests);

  return request;
}

/**
 * Escalate approval due to timeout
 */
export function escalateApproval(requestId: string): ApprovalRequest {
  const request = approvalRequests.get(requestId);
  if (!request) {
    throw new Error(`Approval request not found: ${requestId}`);
  }

  const currentLevel = request.levels[request.currentLevel - 1];
  if (!currentLevel.escalateTo) {
    throw new Error(`No escalation path defined for level ${request.currentLevel}`);
  }

  const action: ApprovalAction = {
    id: uuidv4(),
    approvalRequestId: requestId,
    approverId: 'system',
    approverName: 'System',
    action: 'escalated',
    timestamp: new Date(),
    comments: `Escalated to ${currentLevel.escalateTo} after ${currentLevel.escalationTimeHours} hours`,
    level: request.currentLevel
  };
  request.history.push(action);
  request.status = 'escalated';

  // Add to escalation target's pending queue
  const escalateRequests = pendingApprovals.get(currentLevel.escalateTo) || [];
  escalateRequests.push(request);
  pendingApprovals.set(currentLevel.escalateTo, escalateRequests);

  return request;
}

/**
 * Get pending approvals for a user
 */
export function getPendingApprovals(approverId: string): ApprovalRequest[] {
  return pendingApprovals.get(approverId) || [];
}

/**
 * Get approval request by ID
 */
export function getApprovalRequest(requestId: string): ApprovalRequest | undefined {
  return approvalRequests.get(requestId);
}

/**
 * Get all approval requests for a session
 */
export function getSessionApprovals(sessionId: string): ApprovalRequest[] {
  return Array.from(approvalRequests.values()).filter(r => r.sessionId === sessionId);
}

/**
 * Get approval template
 */
export function getApprovalTemplate(templateId: string): ApprovalWorkflowTemplate | undefined {
  return approvalTemplates.get(templateId);
}

/**
 * List all templates
 */
export function listApprovalTemplates(): ApprovalWorkflowTemplate[] {
  return Array.from(approvalTemplates.values());
}

/**
 * Check for overdue approvals that need escalation
 */
export function checkEscalations(): ApprovalRequest[] {
  const now = new Date();
  const escalated: ApprovalRequest[] = [];

  approvalRequests.forEach(request => {
    if (request.status !== 'pending') return;

    const currentLevel = request.levels[request.currentLevel - 1];
    if (!currentLevel.escalationTimeHours) return;

    const hoursSinceRequest = (now.getTime() - request.requestedAt.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceRequest >= currentLevel.escalationTimeHours) {
      try {
        escalateApproval(request.id);
        escalated.push(request);
      } catch (error) {
        console.error(`Failed to escalate ${request.id}:`, error);
      }
    }
  });

  return escalated;
}

// Helper functions
function clearPendingApprovals(requestId: string) {
  pendingApprovals.forEach((requests, approverId) => {
    const filtered = requests.filter(r => r.id !== requestId);
    if (filtered.length > 0) {
      pendingApprovals.set(approverId, filtered);
    } else {
      pendingApprovals.delete(approverId);
    }
  });
}

function removePendingApproval(approverId: string, requestId: string) {
  const requests = pendingApprovals.get(approverId) || [];
  const filtered = requests.filter(r => r.id !== requestId);
  if (filtered.length > 0) {
    pendingApprovals.set(approverId, filtered);
  } else {
    pendingApprovals.delete(approverId);
  }
}

// Initialize templates on module load
initializeApprovalTemplates();
