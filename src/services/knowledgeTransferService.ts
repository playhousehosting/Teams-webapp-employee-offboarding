/**
 * Knowledge Transfer Service
 * 
 * AI-powered knowledge extraction and transfer automation.
 * Features:
 * - Extract knowledge from emails and documents
 * - Generate successor playbooks
 * - Schedule knowledge transfer sessions
 * - Track completion and effectiveness
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL
});

export interface KnowledgeItem {
  id: string;
  sessionId: string;
  type: 'process' | 'contact' | 'tool' | 'password' | 'project' | 'custom';
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  source: 'email' | 'document' | 'manual' | 'ai_extracted';
  content: string;
  tags: string[];
  createdAt: Date;
  extractedBy?: string; // AI model or user ID
}

export interface KnowledgeTransferSession {
  id: string;
  offboardingSessionId: string;
  departingEmployee: string;
  successor: string;
  scheduledDate: Date;
  duration: number; // minutes
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  meetingLink?: string;
  agenda: string[];
  knowledgeItems: string[]; // IDs of KnowledgeItem
  notes?: string;
  recording?: string; // URL to recording
  completedAt?: Date;
}

export interface SuccessorPlaybook {
  id: string;
  sessionId: string;
  departingEmployee: string;
  successor: string;
  department: string;
  role: string;
  generatedAt: Date;
  sections: PlaybookSection[];
  status: 'draft' | 'review' | 'approved' | 'published';
}

export interface PlaybookSection {
  title: string;
  content: string;
  type: 'overview' | 'responsibilities' | 'processes' | 'contacts' | 'tools' | 'tips';
  order: number;
}

// In-memory storage
const knowledgeItems = new Map<string, KnowledgeItem>();
const transferSessions = new Map<string, KnowledgeTransferSession>();
const playbooks = new Map<string, SuccessorPlaybook>();

/**
 * Extract knowledge from text using AI
 */
export async function extractKnowledgeFromText(
  sessionId: string,
  text: string,
  source: 'email' | 'document'
): Promise<KnowledgeItem[]> {
  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a knowledge extraction expert. Analyze the provided text and extract important knowledge items that should be transferred to a successor. Focus on:
- Critical processes and workflows
- Important contacts and relationships
- Tools and systems used
- Passwords and access information (if mentioned)
- Ongoing projects and their status
- Institutional knowledge and tips

Return a JSON array of knowledge items with: type, title, description, priority, content, tags`
        },
        {
          role: 'user',
          content: `Extract knowledge from this ${source}:\n\n${text}`
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(response.choices[0].message.content || '{"items": []}');
    const items: KnowledgeItem[] = [];

    if (result.items && Array.isArray(result.items)) {
      result.items.forEach((item: any) => {
        const knowledgeItem: KnowledgeItem = {
          id: `knowledge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          sessionId,
          type: item.type || 'custom',
          title: item.title || 'Untitled',
          description: item.description || '',
          priority: item.priority || 'medium',
          source,
          content: item.content || '',
          tags: item.tags || [],
          createdAt: new Date(),
          extractedBy: 'ai-gpt4o'
        };
        
        knowledgeItems.set(knowledgeItem.id, knowledgeItem);
        items.push(knowledgeItem);
      });
    }

    return items;
  } catch (error) {
    console.error('Error extracting knowledge:', error);
    return [];
  }
}

/**
 * Generate successor playbook using AI
 */
export async function generateSuccessorPlaybook(
  sessionId: string,
  departingEmployee: string,
  successor: string,
  department: string,
  role: string
): Promise<SuccessorPlaybook> {
  // Get all knowledge items for this session
  const sessionKnowledge = Array.from(knowledgeItems.values())
    .filter(item => item.sessionId === sessionId)
    .sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

  // Create knowledge summary
  const knowledgeSummary = sessionKnowledge
    .map(item => `- ${item.title} (${item.type}, ${item.priority}): ${item.description}`)
    .join('\n');

  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are creating a comprehensive handoff playbook for a successor taking over a role. Create detailed, actionable sections that will help the successor ramp up quickly. Be specific and practical.`
        },
        {
          role: 'user',
          content: `Generate a successor playbook for:
Role: ${role}
Department: ${department}
Departing: ${departingEmployee}
Successor: ${successor}

Knowledge to include:
${knowledgeSummary || 'No specific knowledge items provided - create a general template.'}

Create sections for:
1. Overview - role summary and key objectives
2. Responsibilities - daily, weekly, monthly tasks
3. Processes - step-by-step workflows
4. Contacts - key stakeholders and relationships
5. Tools - systems, access, and how to use them
6. Tips - insights and gotchas from the departing employee

Return as JSON with sections array containing: title, content, type, order`
        }
      ],
      temperature: 0.5,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(response.choices[0].message.content || '{"sections": []}');
    
    const playbook: SuccessorPlaybook = {
      id: `playbook-${Date.now()}`,
      sessionId,
      departingEmployee,
      successor,
      department,
      role,
      generatedAt: new Date(),
      sections: result.sections || [],
      status: 'draft'
    };

    playbooks.set(playbook.id, playbook);
    return playbook;
  } catch (error) {
    console.error('Error generating playbook:', error);
    
    // Return basic template if AI fails
    const fallbackPlaybook: SuccessorPlaybook = {
      id: `playbook-${Date.now()}`,
      sessionId,
      departingEmployee,
      successor,
      department,
      role,
      generatedAt: new Date(),
      sections: [
        {
          title: 'Overview',
          content: `This playbook will help ${successor} transition into the ${role} role in ${department}.`,
          type: 'overview',
          order: 1
        },
        {
          title: 'Key Responsibilities',
          content: 'Daily, weekly, and monthly responsibilities will be documented here.',
          type: 'responsibilities',
          order: 2
        },
        {
          title: 'Important Processes',
          content: 'Critical workflows and procedures are outlined in this section.',
          type: 'processes',
          order: 3
        },
        {
          title: 'Key Contacts',
          content: 'Important stakeholders and their contact information.',
          type: 'contacts',
          order: 4
        },
        {
          title: 'Tools & Systems',
          content: 'Systems you will use and how to access them.',
          type: 'tools',
          order: 5
        },
        {
          title: 'Pro Tips',
          content: 'Helpful insights from your predecessor.',
          type: 'tips',
          order: 6
        }
      ],
      status: 'draft'
    };

    playbooks.set(fallbackPlaybook.id, fallbackPlaybook);
    return fallbackPlaybook;
  }
}

/**
 * Schedule knowledge transfer session
 */
export function scheduleTransferSession(
  offboardingSessionId: string,
  departingEmployee: string,
  successor: string,
  scheduledDate: Date,
  duration: number = 60,
  options?: {
    meetingLink?: string;
    agenda?: string[];
    knowledgeItems?: string[];
  }
): KnowledgeTransferSession {
  const session: KnowledgeTransferSession = {
    id: `transfer-${Date.now()}`,
    offboardingSessionId,
    departingEmployee,
    successor,
    scheduledDate,
    duration,
    status: 'scheduled',
    meetingLink: options?.meetingLink,
    agenda: options?.agenda || [
      'Introduction and context',
      'Review of key responsibilities',
      'Walkthrough of critical processes',
      'Discussion of ongoing projects',
      'Q&A and next steps'
    ],
    knowledgeItems: options?.knowledgeItems || []
  };

  transferSessions.set(session.id, session);
  return session;
}

/**
 * Start transfer session
 */
export function startTransferSession(sessionId: string): KnowledgeTransferSession {
  const session = transferSessions.get(sessionId);
  if (!session) {
    throw new Error(`Transfer session not found: ${sessionId}`);
  }

  session.status = 'in_progress';
  return session;
}

/**
 * Complete transfer session
 */
export function completeTransferSession(
  sessionId: string,
  notes?: string,
  recording?: string
): KnowledgeTransferSession {
  const session = transferSessions.get(sessionId);
  if (!session) {
    throw new Error(`Transfer session not found: ${sessionId}`);
  }

  session.status = 'completed';
  session.completedAt = new Date();
  session.notes = notes;
  session.recording = recording;

  return session;
}

/**
 * Add manual knowledge item
 */
export function addKnowledgeItem(
  sessionId: string,
  type: KnowledgeItem['type'],
  title: string,
  description: string,
  content: string,
  priority: KnowledgeItem['priority'] = 'medium',
  tags: string[] = []
): KnowledgeItem {
  const item: KnowledgeItem = {
    id: `knowledge-${Date.now()}`,
    sessionId,
    type,
    title,
    description,
    priority,
    source: 'manual',
    content,
    tags,
    createdAt: new Date()
  };

  knowledgeItems.set(item.id, item);
  return item;
}

/**
 * Get knowledge items for a session
 */
export function getKnowledgeItems(
  sessionId: string,
  filters?: {
    type?: KnowledgeItem['type'];
    priority?: KnowledgeItem['priority'];
  }
): KnowledgeItem[] {
  let items = Array.from(knowledgeItems.values())
    .filter(item => item.sessionId === sessionId);

  if (filters?.type) {
    items = items.filter(item => item.type === filters.type);
  }
  if (filters?.priority) {
    items = items.filter(item => item.priority === filters.priority);
  }

  return items.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

/**
 * Get transfer sessions for offboarding
 */
export function getTransferSessions(offboardingSessionId: string): KnowledgeTransferSession[] {
  return Array.from(transferSessions.values())
    .filter(s => s.offboardingSessionId === offboardingSessionId)
    .sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());
}

/**
 * Get playbook
 */
export function getPlaybook(playbookId: string): SuccessorPlaybook | undefined {
  return playbooks.get(playbookId);
}

/**
 * Get playbooks for session
 */
export function getSessionPlaybooks(sessionId: string): SuccessorPlaybook[] {
  return Array.from(playbooks.values())
    .filter(p => p.sessionId === sessionId)
    .sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime());
}

/**
 * Update playbook status
 */
export function updatePlaybookStatus(
  playbookId: string,
  status: SuccessorPlaybook['status']
): SuccessorPlaybook {
  const playbook = playbooks.get(playbookId);
  if (!playbook) {
    throw new Error(`Playbook not found: ${playbookId}`);
  }

  playbook.status = status;
  return playbook;
}

/**
 * Generate knowledge transfer report
 */
export function generateTransferReport(offboardingSessionId: string): {
  totalKnowledgeItems: number;
  itemsByType: Record<string, number>;
  itemsByPriority: Record<string, number>;
  scheduledSessions: number;
  completedSessions: number;
  playbooksGenerated: number;
  completionScore: number; // 0-100
} {
  const items = Array.from(knowledgeItems.values())
    .filter(item => item.sessionId === offboardingSessionId);
  
  const sessions = Array.from(transferSessions.values())
    .filter(s => s.offboardingSessionId === offboardingSessionId);
  
  const sessionPlaybooks = Array.from(playbooks.values())
    .filter(p => p.sessionId === offboardingSessionId);

  const itemsByType: Record<string, number> = {};
  const itemsByPriority: Record<string, number> = {};

  items.forEach(item => {
    itemsByType[item.type] = (itemsByType[item.type] || 0) + 1;
    itemsByPriority[item.priority] = (itemsByPriority[item.priority] || 0) + 1;
  });

  const completedSessions = sessions.filter(s => s.status === 'completed').length;
  
  // Calculate completion score
  let score = 0;
  if (items.length > 0) score += 25; // Has knowledge items
  if (items.length >= 10) score += 25; // Comprehensive knowledge
  if (completedSessions > 0) score += 25; // Completed at least one session
  if (sessionPlaybooks.length > 0 && sessionPlaybooks[0].status === 'published') score += 25; // Published playbook

  return {
    totalKnowledgeItems: items.length,
    itemsByType,
    itemsByPriority,
    scheduledSessions: sessions.length,
    completedSessions,
    playbooksGenerated: sessionPlaybooks.length,
    completionScore: score
  };
}
