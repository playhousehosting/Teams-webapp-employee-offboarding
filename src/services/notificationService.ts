/**
 * Notification Service
 * 
 * Multi-channel notification system with templates and scheduling.
 * Supports: Email, Teams, Slack, SMS, Webhooks
 */

export interface Notification {
  id: string;
  type: 'email' | 'teams' | 'slack' | 'sms' | 'webhook';
  recipients: string[];
  subject?: string;
  message: string;
  template?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  scheduledFor?: Date;
  sentAt?: Date;
  status: 'pending' | 'sent' | 'failed' | 'scheduled';
  metadata?: Record<string, any>;
  error?: string;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: 'email' | 'teams' | 'slack' | 'sms';
  subject?: string;
  body: string;
  variables: string[]; // {{variable}} placeholders
}

// In-memory storage
const notifications = new Map<string, Notification>();
const templates = new Map<string, NotificationTemplate>();

/**
 * Initialize default templates
 */
export function initializeNotificationTemplates() {
  const emailTemplates: NotificationTemplate[] = [
    {
      id: 'offboarding-started',
      name: 'Offboarding Started',
      type: 'email',
      subject: 'Employee Offboarding Started: {{employeeName}}',
      body: `Hello {{recipientName}},

An offboarding process has been started for {{employeeName}} ({{employeeId}}).

Details:
- Department: {{department}}
- Reason: {{reason}}
- Last Working Day: {{lastDay}}
- Session ID: {{sessionId}}

Please review and complete assigned tasks in the offboarding portal.

Best regards,
HR Team`,
      variables: ['recipientName', 'employeeName', 'employeeId', 'department', 'reason', 'lastDay', 'sessionId']
    },
    {
      id: 'approval-required',
      name: 'Approval Required',
      type: 'email',
      subject: 'Action Required: Approve Offboarding Task',
      body: `Hello {{approverName}},

Your approval is required for the following offboarding task:

Task: {{taskName}}
Employee: {{employeeName}}
Session ID: {{sessionId}}

Please review and approve/reject at your earliest convenience.

Approve: {{approveLink}}
Reject: {{rejectLink}}

Thank you,
Offboarding System`,
      variables: ['approverName', 'taskName', 'employeeName', 'sessionId', 'approveLink', 'rejectLink']
    },
    {
      id: 'task-overdue',
      name: 'Task Overdue Alert',
      type: 'teams',
      subject: '⚠️ Overdue Task Alert',
      body: `**Overdue Task Alert**

The following task is now overdue:

- **Task**: {{taskName}}
- **Assigned to**: {{assignee}}
- **Due date**: {{dueDate}}
- **Days overdue**: {{daysOverdue}}
- **Session**: {{sessionId}}

Please complete this task immediately to avoid compliance issues.`,
      variables: ['taskName', 'assignee', 'dueDate', 'daysOverdue', 'sessionId']
    },
    {
      id: 'offboarding-complete',
      name: 'Offboarding Complete',
      type: 'email',
      subject: 'Offboarding Completed: {{employeeName}}',
      body: `Hello Team,

The offboarding process for {{employeeName}} has been successfully completed.

Summary:
- Completion Date: {{completionDate}}
- Total Tasks: {{totalTasks}}
- Compliance Score: {{complianceScore}}%
- Duration: {{duration}} days

All access has been revoked and assets have been collected.

View full report: {{reportLink}}

Best regards,
HR Team`,
      variables: ['employeeName', 'completionDate', 'totalTasks', 'complianceScore', 'duration', 'reportLink']
    }
  ];

  emailTemplates.forEach(template => templates.set(template.id, template));
}

/**
 * Send notification
 */
export async function sendNotification(
  type: Notification['type'],
  recipients: string[],
  message: string,
  options?: {
    subject?: string;
    template?: string;
    variables?: Record<string, string>;
    priority?: Notification['priority'];
    scheduledFor?: Date;
    metadata?: Record<string, any>;
  }
): Promise<Notification> {
  let finalMessage = message;
  let finalSubject = options?.subject;

  // Apply template if provided
  if (options?.template) {
    const template = templates.get(options.template);
    if (template) {
      finalMessage = template.body;
      finalSubject = template.subject;

      // Replace variables
      if (options.variables) {
        Object.entries(options.variables).forEach(([key, value]) => {
          const regex = new RegExp(`{{${key}}}`, 'g');
          finalMessage = finalMessage.replace(regex, value);
          if (finalSubject) {
            finalSubject = finalSubject.replace(regex, value);
          }
        });
      }
    }
  }

  const notification: Notification = {
    id: `notif-${Date.now()}`,
    type,
    recipients,
    subject: finalSubject,
    message: finalMessage,
    template: options?.template,
    priority: options?.priority || 'normal',
    scheduledFor: options?.scheduledFor,
    status: options?.scheduledFor ? 'scheduled' : 'pending',
    metadata: options?.metadata
  };

  notifications.set(notification.id, notification);

  // Simulate sending (in production, call actual APIs)
  if (!options?.scheduledFor || options.scheduledFor <= new Date()) {
    await simulateSend(notification);
  }

  return notification;
}

/**
 * Simulate sending notification
 */
async function simulateSend(notification: Notification): Promise<void> {
  try {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100));

    console.log(`[${notification.type.toUpperCase()}] Sending to:`, notification.recipients);
    console.log(`Subject: ${notification.subject}`);
    console.log(`Message: ${notification.message.substring(0, 100)}...`);

    notification.status = 'sent';
    notification.sentAt = new Date();
  } catch (error) {
    notification.status = 'failed';
    notification.error = error instanceof Error ? error.message : 'Unknown error';
    console.error('Notification failed:', error);
  }
}

/**
 * Send bulk notifications
 */
export async function sendBulkNotifications(
  notifications: Array<{
    type: Notification['type'];
    recipients: string[];
    message: string;
    subject?: string;
    template?: string;
    variables?: Record<string, string>;
  }>
): Promise<Notification[]> {
  const results: Notification[] = [];

  for (const notif of notifications) {
    const result = await sendNotification(
      notif.type,
      notif.recipients,
      notif.message,
      {
        subject: notif.subject,
        template: notif.template,
        variables: notif.variables
      }
    );
    results.push(result);
  }

  return results;
}

/**
 * Schedule reminder
 */
export function scheduleReminder(
  type: Notification['type'],
  recipients: string[],
  message: string,
  scheduleDate: Date,
  options?: {
    subject?: string;
    recurrence?: 'daily' | 'weekly' | 'monthly';
  }
): Notification {
  const notification: Notification = {
    id: `reminder-${Date.now()}`,
    type,
    recipients,
    subject: options?.subject || 'Reminder',
    message,
    priority: 'normal',
    scheduledFor: scheduleDate,
    status: 'scheduled',
    metadata: { recurrence: options?.recurrence }
  };

  notifications.set(notification.id, notification);
  return notification;
}

/**
 * Send escalation alert
 */
export async function sendEscalationAlert(
  taskName: string,
  assignee: string,
  daysOverdue: number,
  escalateTo: string[],
  sessionId: string
): Promise<Notification> {
  return sendNotification(
    'teams',
    escalateTo,
    '',
    {
      template: 'task-overdue',
      variables: {
        taskName,
        assignee,
        dueDate: new Date(Date.now() - daysOverdue * 24 * 60 * 60 * 1000).toLocaleDateString(),
        daysOverdue: daysOverdue.toString(),
        sessionId
      },
      priority: 'urgent'
    }
  );
}

/**
 * Get notification history
 */
export function getNotificationHistory(filters?: {
  type?: Notification['type'];
  status?: Notification['status'];
  recipient?: string;
}): Notification[] {
  let results = Array.from(notifications.values());

  if (filters?.type) {
    results = results.filter(n => n.type === filters.type);
  }
  if (filters?.status) {
    results = results.filter(n => n.status === filters.status);
  }
  if (filters?.recipient) {
    results = results.filter(n => n.recipients.includes(filters.recipient!));
  }

  return results.sort((a, b) => {
    const dateA = a.sentAt?.getTime() || a.scheduledFor?.getTime() || 0;
    const dateB = b.sentAt?.getTime() || b.scheduledFor?.getTime() || 0;
    return dateB - dateA;
  });
}

/**
 * Process scheduled notifications
 */
export async function processScheduledNotifications(): Promise<number> {
  const now = new Date();
  let processed = 0;

  for (const notification of notifications.values()) {
    if (notification.status === 'scheduled' && notification.scheduledFor && notification.scheduledFor <= now) {
      await simulateSend(notification);
      processed++;
    }
  }

  return processed;
}

// Initialize templates
initializeNotificationTemplates();
