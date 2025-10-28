// Types for Microsoft Graph API responses and our application data structures

export interface User {
    id: string;
    displayName: string;
    userPrincipalName: string;
    mail?: string;
    department?: string;
    jobTitle?: string;
    employeeId?: string;
    lastSignInDateTime?: string;
    accountEnabled: boolean;
    assignedLicenses: AssignedLicense[];
    memberOf?: GroupMembership[];
    ownedDevices?: Device[];
    registeredDevices?: Device[];
}

export interface AssignedLicense {
    skuId: string;
    disabledPlans: string[];
}

export interface GroupMembership {
    id: string;
    displayName: string;
    groupType?: string;
    mail?: string;
    securityEnabled?: boolean;
    mailEnabled?: boolean;
}

export interface Device {
    id: string;
    displayName: string;
    deviceId: string;
    operatingSystem: string;
    accountEnabled: boolean;
    isManaged: boolean;
    lastSignInDateTime?: string;
}

export interface OffboardingTask {
    id: string;
    name: string;
    description: string;
    status: 'pending' | 'in-progress' | 'completed' | 'failed' | 'skipped';
    category: 'access' | 'data' | 'devices' | 'groups' | 'licenses' | 'cleanup';
    priority: 'high' | 'medium' | 'low';
    estimatedDuration?: string;
    completedAt?: Date;
    error?: string;
    dependencies?: string[];
}

export interface OffboardingSession {
    id: string;
    userId: string;
    userDisplayName: string;
    userPrincipalName: string;
    status: 'created' | 'in-progress' | 'completed' | 'failed';
    tasks: OffboardingTask[];
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    lastUpdated: Date;
    notes?: string;
    backupLocations?: BackupLocation[];
}

export interface BackupLocation {
    type: 'onedrive' | 'sharepoint' | 'teams' | 'email';
    location: string;
    size?: string;
    lastModified?: Date;
}

export interface OffboardingConfig {
    immediateDisable: boolean;
    revokeAllSessions: boolean;
    resetPassword: boolean;
    removeFromGroups: boolean;
    removeFromTeams: boolean;
    disableDevices: boolean;
    removeLicenses: boolean;
    convertMailboxToShared: boolean;
    retainMailboxDays: number;
    forwardEmailTo?: string;
    backupUserData: boolean;
    deleteUserAfterDays: number;
    requireManagerApproval: boolean;
    notifyIT: boolean;
    notifyManager: boolean;
}

export interface GraphError {
    code: string;
    message: string;
    details?: any;
}

export interface OffboardingProgress {
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    currentTask?: string;
    progressPercentage: number;
    estimatedTimeRemaining?: string;
}

// Enums for better type safety
export enum OffboardingStatus {
    NOT_STARTED = 'not-started',
    IN_PROGRESS = 'in-progress', 
    COMPLETED = 'completed',
    FAILED = 'failed',
    CANCELLED = 'cancelled'
}

export enum TaskCategory {
    ACCESS_REVOCATION = 'access',
    DATA_BACKUP = 'data',
    DEVICE_MANAGEMENT = 'devices',
    GROUP_MANAGEMENT = 'groups',
    LICENSE_MANAGEMENT = 'licenses',
    CLEANUP = 'cleanup'
}

export enum TaskPriority {
    HIGH = 'high',
    MEDIUM = 'medium',
    LOW = 'low'
}

export enum TaskStatus {
    PENDING = 'pending',
    IN_PROGRESS = 'in-progress',
    COMPLETED = 'completed',
    FAILED = 'failed',
    SKIPPED = 'skipped'
}