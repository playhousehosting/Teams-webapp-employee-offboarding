import { Client } from '@microsoft/microsoft-graph-client';
import { AuthCodeMSALBrowserAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/authCodeMsalBrowser';
import { PublicClientApplication, AccountInfo } from '@azure/msal-browser';
import { User, GroupMembership, Device, AssignedLicense, GraphError } from '../types/offboarding';

/**
 * Microsoft Graph Service for handling all Graph API operations
 * Follows Microsoft best practices for authentication and error handling
 */
export class MicrosoftGraphService {
    private graphClient: Client | null = null;
    private msalInstance: PublicClientApplication;
    private account: AccountInfo | null = null;

    constructor(msalInstance: PublicClientApplication) {
        this.msalInstance = msalInstance;
    }

    /**
     * Initialize the Graph client with proper authentication
     */
    async initializeGraphClient(scopes: string[] = ['User.Read']): Promise<void> {
        try {
            this.account = this.msalInstance.getActiveAccount();
            if (!this.account) {
                const accounts = this.msalInstance.getAllAccounts();
                if (accounts.length > 0) {
                    this.account = accounts[0];
                    this.msalInstance.setActiveAccount(this.account);
                } else {
                    throw new Error('No authenticated account found');
                }
            }

            const authProvider = new AuthCodeMSALBrowserAuthenticationProvider(this.msalInstance, {
                account: this.account,
                scopes: scopes,
                interactionType: 'popup'
            });

            this.graphClient = Client.initWithMiddleware({ authProvider });
        } catch (error) {
            console.error('Failed to initialize Graph client:', error);
            throw error;
        }
    }

    /**
     * Get user information by ID or UPN
     */
    async getUser(userIdOrUpn: string): Promise<User> {
        if (!this.graphClient) {
            throw new Error('Graph client not initialized');
        }

        try {
            const user = await this.graphClient
                .api(`/users/${userIdOrUpn}`)
                .select([
                    'id',
                    'displayName', 
                    'userPrincipalName',
                    'mail',
                    'department',
                    'jobTitle',
                    'employeeId',
                    'accountEnabled',
                    'assignedLicenses',
                    'signInActivity'
                ].join(','))
                .get();

            // Get user's group memberships
            const memberOf = await this.getUserGroups(userIdOrUpn);
            
            // Get user's devices
            const ownedDevices = await this.getUserDevices(userIdOrUpn);

            return {
                id: user.id,
                displayName: user.displayName,
                userPrincipalName: user.userPrincipalName,
                mail: user.mail,
                department: user.department,
                jobTitle: user.jobTitle,
                employeeId: user.employeeId,
                lastSignInDateTime: user.signInActivity?.lastSignInDateTime,
                accountEnabled: user.accountEnabled,
                assignedLicenses: user.assignedLicenses || [],
                memberOf: memberOf,
                ownedDevices: ownedDevices,
                registeredDevices: ownedDevices // For simplicity, combining owned and registered
            };
        } catch (error) {
            console.error('Error getting user:', error);
            throw this.handleGraphError(error);
        }
    }

    /**
     * Search users by display name or email
     */
    async searchUsers(query: string): Promise<User[]> {
        if (!this.graphClient) {
            throw new Error('Graph client not initialized');
        }

        try {
            const result = await this.graphClient
                .api('/users')
                .filter(`startswith(displayName,'${query}') or startswith(userPrincipalName,'${query}') or startswith(mail,'${query}')`)
                .select([
                    'id',
                    'displayName',
                    'userPrincipalName', 
                    'mail',
                    'department',
                    'jobTitle',
                    'accountEnabled'
                ].join(','))
                .top(50)
                .get();

            return result.value.map((user: any) => ({
                id: user.id,
                displayName: user.displayName,
                userPrincipalName: user.userPrincipalName,
                mail: user.mail,
                department: user.department,
                jobTitle: user.jobTitle,
                accountEnabled: user.accountEnabled,
                assignedLicenses: []
            }));
        } catch (error) {
            console.error('Error searching users:', error);
            throw this.handleGraphError(error);
        }
    }

    /**
     * Get user's group memberships
     */
    private async getUserGroups(userIdOrUpn: string): Promise<GroupMembership[]> {
        if (!this.graphClient) {
            throw new Error('Graph client not initialized');
        }

        try {
            const result = await this.graphClient
                .api(`/users/${userIdOrUpn}/memberOf`)
                .select([
                    'id',
                    'displayName',
                    'groupTypes',
                    'mail',
                    'securityEnabled',
                    'mailEnabled'
                ].join(','))
                .get();

            return result.value.map((group: any) => ({
                id: group.id,
                displayName: group.displayName,
                groupType: group.groupTypes?.join(','),
                mail: group.mail,
                securityEnabled: group.securityEnabled,
                mailEnabled: group.mailEnabled
            }));
        } catch (error) {
            console.error('Error getting user groups:', error);
            return [];
        }
    }

    /**
     * Get user's devices
     */
    private async getUserDevices(userIdOrUpn: string): Promise<Device[]> {
        if (!this.graphClient) {
            throw new Error('Graph client not initialized');
        }

        try {
            const result = await this.graphClient
                .api(`/users/${userIdOrUpn}/ownedDevices`)
                .select([
                    'id',
                    'displayName',
                    'deviceId', 
                    'operatingSystem',
                    'accountEnabled'
                ].join(','))
                .get();

            return result.value.map((device: any) => ({
                id: device.id,
                displayName: device.displayName,
                deviceId: device.deviceId,
                operatingSystem: device.operatingSystem,
                accountEnabled: device.accountEnabled,
                isManaged: false // Would need Intune API for this
            }));
        } catch (error) {
            console.error('Error getting user devices:', error);
            return [];
        }
    }

    /**
     * Disable user account
     */
    async disableUser(userId: string): Promise<void> {
        if (!this.graphClient) {
            throw new Error('Graph client not initialized');
        }

        try {
            await this.graphClient
                .api(`/users/${userId}`)
                .patch({
                    accountEnabled: false
                });
        } catch (error) {
            console.error('Error disabling user:', error);
            throw this.handleGraphError(error);
        }
    }

    /**
     * Revoke all user sessions
     */
    async revokeUserSessions(userId: string): Promise<void> {
        if (!this.graphClient) {
            throw new Error('Graph client not initialized');
        }

        try {
            await this.graphClient
                .api(`/users/${userId}/revokeSignInSessions`)
                .post({});
        } catch (error) {
            console.error('Error revoking user sessions:', error);
            throw this.handleGraphError(error);
        }
    }

    /**
     * Remove user from a group
     */
    async removeUserFromGroup(userId: string, groupId: string): Promise<void> {
        if (!this.graphClient) {
            throw new Error('Graph client not initialized');
        }

        try {
            await this.graphClient
                .api(`/groups/${groupId}/members/${userId}/$ref`)
                .delete();
        } catch (error) {
            console.error('Error removing user from group:', error);
            throw this.handleGraphError(error);
        }
    }

    /**
     * Remove user from all groups
     */
    async removeUserFromAllGroups(userId: string): Promise<{ success: string[], failed: string[] }> {
        const user = await this.getUser(userId);
        const results: { success: string[], failed: string[] } = { success: [], failed: [] };

        if (!user.memberOf) return results;

        for (const group of user.memberOf) {
            try {
                await this.removeUserFromGroup(userId, group.id);
                results.success.push(group.displayName);
            } catch (error) {
                console.error(`Failed to remove user from group ${group.displayName}:`, error);
                results.failed.push(group.displayName);
            }
        }

        return results;
    }

    /**
     * Remove user licenses
     */
    async removeUserLicenses(userId: string, licenseSkuIds?: string[]): Promise<void> {
        if (!this.graphClient) {
            throw new Error('Graph client not initialized');
        }

        try {
            const user = await this.getUser(userId);
            const licensesToRemove = licenseSkuIds || user.assignedLicenses.map(l => l.skuId);

            if (licensesToRemove.length > 0) {
                await this.graphClient
                    .api(`/users/${userId}/assignLicense`)
                    .post({
                        addLicenses: [],
                        removeLicenses: licensesToRemove
                    });
            }
        } catch (error) {
            console.error('Error removing user licenses:', error);
            throw this.handleGraphError(error);
        }
    }

    /**
     * Delete user account
     */
    async deleteUser(userId: string): Promise<void> {
        if (!this.graphClient) {
            throw new Error('Graph client not initialized');
        }

        try {
            await this.graphClient
                .api(`/users/${userId}`)
                .delete();
        } catch (error) {
            console.error('Error deleting user:', error);
            throw this.handleGraphError(error);
        }
    }

    /**
     * Get current user (for authentication check)
     */
    async getCurrentUser(): Promise<User> {
        if (!this.graphClient) {
            throw new Error('Graph client not initialized');
        }

        try {
            const user = await this.graphClient
                .api('/me')
                .select([
                    'id',
                    'displayName',
                    'userPrincipalName',
                    'mail',
                    'jobTitle'
                ].join(','))
                .get();

            return {
                id: user.id,
                displayName: user.displayName,
                userPrincipalName: user.userPrincipalName,
                mail: user.mail,
                jobTitle: user.jobTitle,
                accountEnabled: true,
                assignedLicenses: []
            };
        } catch (error) {
            console.error('Error getting current user:', error);
            throw this.handleGraphError(error);
        }
    }

    /**
     * Handle Graph API errors and convert to our custom error format
     */
    private handleGraphError(error: any): GraphError {
        if (error.code) {
            return {
                code: error.code,
                message: error.message,
                details: error
            };
        }

        return {
            code: 'UNKNOWN_ERROR',
            message: error.message || 'An unknown error occurred',
            details: error
        };
    }
}