import { 
    OffboardingSession, 
    OffboardingTask, 
    OffboardingConfig, 
    OffboardingProgress,
    TaskStatus,
    TaskCategory,
    TaskPriority,
    User
} from '../types/offboarding';
import { MicrosoftGraphService } from './graphService';

/**
 * Employee Offboarding Service
 * Orchestrates the complete employee offboarding process following Microsoft best practices
 */
export class OffboardingService {
    private graphService: MicrosoftGraphService;
    private defaultConfig: OffboardingConfig = {
        immediateDisable: true,
        revokeAllSessions: true,
        resetPassword: false, // Will be handled by session revocation
        removeFromGroups: true,
        removeFromTeams: true,
        disableDevices: true,
        removeLicenses: true,
        convertMailboxToShared: false, // Requires Exchange Online admin
        retainMailboxDays: 30,
        backupUserData: true,
        deleteUserAfterDays: 90,
        requireManagerApproval: false,
        notifyIT: true,
        notifyManager: true
    };

    constructor(graphService: MicrosoftGraphService) {
        this.graphService = graphService;
    }

    /**
     * Create a new offboarding session with predefined tasks
     */
    async createOffboardingSession(
        userId: string, 
        config: Partial<OffboardingConfig> = {}
    ): Promise<OffboardingSession> {
        const finalConfig = { ...this.defaultConfig, ...config };
        const user = await this.graphService.getUser(userId);
        
        const tasks = this.generateOffboardingTasks(user, finalConfig);
        
        const session: OffboardingSession = {
            id: this.generateSessionId(),
            userId: user.id,
            userDisplayName: user.displayName,
            userPrincipalName: user.userPrincipalName,
            status: 'created',
            tasks,
            createdAt: new Date(),
            lastUpdated: new Date(),
            backupLocations: []
        };

        return session;
    }

    /**
     * Generate comprehensive offboarding tasks based on user and configuration
     */
    private generateOffboardingTasks(user: User, config: OffboardingConfig): OffboardingTask[] {
        const tasks: OffboardingTask[] = [];

        // 1. Immediate Access Revocation (Highest Priority)
        if (config.immediateDisable) {
            tasks.push({
                id: 'disable-account',
                name: 'Disable User Account',
                description: 'Immediately disable the user account to prevent login',
                status: 'pending',
                category: 'access',
                priority: 'high',
                estimatedDuration: '1 min'
            });
        }

        if (config.revokeAllSessions) {
            tasks.push({
                id: 'revoke-sessions',
                name: 'Revoke All Active Sessions',
                description: 'Sign out user from all active sessions and invalidate tokens',
                status: 'pending',
                category: 'access',
                priority: 'high',
                estimatedDuration: '2 mins',
                dependencies: config.immediateDisable ? ['disable-account'] : []
            });
        }

        // 2. Group and Team Management
        if (config.removeFromGroups && user.memberOf && user.memberOf.length > 0) {
            tasks.push({
                id: 'remove-from-groups',
                name: 'Remove from Security Groups',
                description: `Remove user from ${user.memberOf.length} security and distribution groups`,
                status: 'pending',
                category: 'groups',
                priority: 'high',
                estimatedDuration: `${Math.ceil(user.memberOf.length / 5)} mins`
            });
        }

        if (config.removeFromTeams) {
            tasks.push({
                id: 'remove-from-teams',
                name: 'Remove from Microsoft Teams',
                description: 'Remove user from all Microsoft Teams memberships',
                status: 'pending',
                category: 'groups',
                priority: 'medium',
                estimatedDuration: '3 mins'
            });
        }

        // 3. License Management
        if (config.removeLicenses && user.assignedLicenses && user.assignedLicenses.length > 0) {
            tasks.push({
                id: 'remove-licenses',
                name: 'Remove License Assignments',
                description: `Remove ${user.assignedLicenses.length} assigned licenses to free up capacity`,
                status: 'pending',
                category: 'licenses',
                priority: 'medium',
                estimatedDuration: '2 mins'
            });
        }

        // 4. Device Management
        if (config.disableDevices && user.ownedDevices && user.ownedDevices.length > 0) {
            tasks.push({
                id: 'disable-devices',
                name: 'Disable User Devices',
                description: `Disable ${user.ownedDevices.length} registered devices`,
                status: 'pending',
                category: 'devices',
                priority: 'medium',
                estimatedDuration: '3 mins'
            });
        }

        // 5. Data Backup Tasks
        if (config.backupUserData) {
            tasks.push(
                {
                    id: 'backup-onedrive',
                    name: 'Identify OneDrive Data',
                    description: 'Catalog and prepare OneDrive files for backup or transfer',
                    status: 'pending',
                    category: 'data',
                    priority: 'medium',
                    estimatedDuration: '5 mins'
                },
                {
                    id: 'backup-email',
                    name: 'Prepare Email Backup',
                    description: 'Identify mailbox size and prepare for archival or forwarding',
                    status: 'pending',
                    category: 'data',
                    priority: 'low',
                    estimatedDuration: '3 mins'
                }
            );
        }

        // 6. Mailbox Management
        if (config.convertMailboxToShared) {
            tasks.push({
                id: 'convert-mailbox',
                name: 'Convert to Shared Mailbox',
                description: 'Convert user mailbox to shared mailbox for continued access',
                status: 'pending',
                category: 'cleanup',
                priority: 'low',
                estimatedDuration: '10 mins'
            });
        }

        // 7. Notifications
        if (config.notifyIT) {
            tasks.push({
                id: 'notify-it',
                name: 'Notify IT Department',
                description: 'Send offboarding completion notification to IT team',
                status: 'pending',
                category: 'cleanup',
                priority: 'low',
                estimatedDuration: '1 min'
            });
        }

        if (config.notifyManager) {
            tasks.push({
                id: 'notify-manager',
                name: 'Notify Manager',
                description: 'Send offboarding summary to user\'s manager',
                status: 'pending',
                category: 'cleanup',
                priority: 'low',
                estimatedDuration: '1 min'
            });
        }

        // 8. Final Cleanup (Scheduled for later)
        tasks.push({
            id: 'schedule-deletion',
            name: 'Schedule Account Deletion',
            description: `Schedule user account deletion after ${config.deleteUserAfterDays} days`,
            status: 'pending',
            category: 'cleanup',
            priority: 'low',
            estimatedDuration: '1 min'
        });

        return tasks.sort((a, b) => {
            // Sort by priority, then by dependencies
            const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
            const aPriority = priorityOrder[a.priority];
            const bPriority = priorityOrder[b.priority];
            
            if (aPriority !== bPriority) {
                return aPriority - bPriority;
            }
            
            // If same priority, tasks without dependencies come first
            const aDeps = a.dependencies?.length || 0;
            const bDeps = b.dependencies?.length || 0;
            return aDeps - bDeps;
        });
    }

    /**
     * Execute the offboarding process
     */
    async executeOffboarding(session: OffboardingSession): Promise<OffboardingSession> {
        const updatedSession = { ...session };
        updatedSession.status = 'in-progress';
        updatedSession.startedAt = new Date();
        updatedSession.lastUpdated = new Date();

        for (const task of updatedSession.tasks) {
            // Skip tasks with unmet dependencies
            if (task.dependencies && task.dependencies.length > 0) {
                const unmetDeps = task.dependencies.filter(depId => {
                    const depTask = updatedSession.tasks.find(t => t.id === depId);
                    return !depTask || depTask.status !== 'completed';
                });

                if (unmetDeps.length > 0) {
                    task.status = 'pending';
                    continue;
                }
            }

            try {
                task.status = 'in-progress';
                await this.executeTask(task, updatedSession);
                task.status = 'completed';
                task.completedAt = new Date();
            } catch (error) {
                console.error(`Task ${task.id} failed:`, error);
                task.status = 'failed';
                task.error = error instanceof Error ? error.message : 'Unknown error';
                
                // For high priority tasks, we might want to stop the process
                if (task.priority === 'high' && task.category === 'access') {
                    updatedSession.status = 'failed';
                    break;
                }
            }
            
            updatedSession.lastUpdated = new Date();
        }

        // Update final session status
        const failedTasks = updatedSession.tasks.filter(t => t.status === 'failed');
        const completedTasks = updatedSession.tasks.filter(t => t.status === 'completed');

        if (failedTasks.length === 0) {
            updatedSession.status = 'completed';
        } else if (completedTasks.length > failedTasks.length) {
            updatedSession.status = 'completed'; // Partial success
        } else {
            updatedSession.status = 'failed';
        }

        updatedSession.completedAt = new Date();
        return updatedSession;
    }

    /**
     * Execute individual offboarding task
     */
    private async executeTask(task: OffboardingTask, session: OffboardingSession): Promise<void> {
        switch (task.id) {
            case 'disable-account':
                await this.graphService.disableUser(session.userId);
                break;

            case 'revoke-sessions':
                await this.graphService.revokeUserSessions(session.userId);
                break;

            case 'remove-from-groups':
                await this.graphService.removeUserFromAllGroups(session.userId);
                break;

            case 'remove-licenses':
                await this.graphService.removeUserLicenses(session.userId);
                break;

            case 'backup-onedrive':
                // In a real implementation, this would involve SharePoint APIs
                await this.simulateTask(2000);
                break;

            case 'backup-email':
                // In a real implementation, this would involve Exchange Online APIs
                await this.simulateTask(3000);
                break;

            case 'notify-it':
            case 'notify-manager':
                // In a real implementation, this would send emails or Teams messages
                await this.simulateTask(1000);
                break;

            case 'schedule-deletion':
                // In a real implementation, this would create a scheduled task
                await this.simulateTask(500);
                break;

            default:
                console.warn(`Unknown task: ${task.id}`);
                await this.simulateTask(1000);
        }
    }

    /**
     * Get offboarding progress
     */
    getOffboardingProgress(session: OffboardingSession): OffboardingProgress {
        const totalTasks = session.tasks.length;
        const completedTasks = session.tasks.filter(t => t.status === 'completed').length;
        const failedTasks = session.tasks.filter(t => t.status === 'failed').length;
        const inProgressTask = session.tasks.find(t => t.status === 'in-progress');

        const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        return {
            totalTasks,
            completedTasks,
            failedTasks,
            currentTask: inProgressTask?.name,
            progressPercentage
        };
    }

    /**
     * Simulate task execution for demo purposes
     */
    private async simulateTask(duration: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, duration));
    }

    /**
     * Generate unique session ID
     */
    private generateSessionId(): string {
        return `offboard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}