/**
 * Configuration object to be passed to MSAL instance on creation.
 * For a full list of MSAL.js configuration parameters, visit:
 * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/configuration.md
 */
export const msalConfig = {
    auth: {
        clientId: import.meta.env.VITE_CLIENT_ID || "your-client-id-here", // Replace with your actual client ID
        authority: `https://login.microsoftonline.com/${import.meta.env.VITE_TENANT_ID || "common"}`, // Replace with your tenant ID if needed
        redirectUri: import.meta.env.VITE_REDIRECT_URI || "http://localhost:3978", // Must be registered as a redirect URI
    },
    cache: {
        cacheLocation: "sessionStorage", // This configures where your cache will be stored
        storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
    },
    system: {
        loggerOptions: {
            loggerCallback: (level: number, message: string, containsPii: boolean) => {
                if (containsPii) {
                    return;
                }
                switch (level) {
                    case 0: // Error
                        console.error(message);
                        return;
                    case 1: // Warning
                        console.warn(message);
                        return;
                    case 2: // Info
                        console.info(message);
                        return;
                    case 3: // Verbose
                        console.debug(message);
                        return;
                    default:
                        return;
                }
            }
        }
    }
};

/**
 * Scopes you add here will be prompted for user consent during sign-in.
 * By default, MSAL.js will add OIDC scopes (openid, profile, email) to any login request.
 */
export const loginRequest = {
    scopes: ["User.Read"]
};

/**
 * Required scopes for Microsoft Graph operations
 */
export const graphScopes = {
    // Basic user information
    userRead: ["User.Read"],
    
    // User management scopes for offboarding
    userReadWriteAll: ["User.ReadWrite.All"],
    
    // Group management
    groupReadWriteAll: ["Group.ReadWrite.All"],
    
    // Directory operations
    directoryReadWriteAll: ["Directory.ReadWrite.All"],
    
    // License management
    organizationReadWriteAll: ["Organization.ReadWrite.All"],
    
    // Device management
    deviceManagementManagedDevicesReadWriteAll: ["DeviceManagementManagedDevices.ReadWrite.All"],
    
    // Teams membership
    teamMemberReadWriteAll: ["TeamMember.ReadWrite.All"],
    
    // Security groups
    groupMemberReadWriteAll: ["GroupMember.ReadWrite.All"],
    
    // Mail settings
    mailboxSettingsReadWrite: ["MailboxSettings.ReadWrite"],
    
    // Complete offboarding scope set
    offboardingScopes: [
        "User.ReadWrite.All",
        "Group.ReadWrite.All", 
        "Directory.ReadWrite.All",
        "GroupMember.ReadWrite.All",
        "TeamMember.ReadWrite.All",
        "Organization.ReadWrite.All",
        "DeviceManagementManagedDevices.ReadWrite.All",
        "MailboxSettings.ReadWrite"
    ]
};

/**
 * Add here the endpoints and scopes when obtaining an access token for protected web APIs. For more information, see:
 * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/resources-and-scopes.md
 */
export const protectedResources = {
    graphMe: {
        endpoint: "https://graph.microsoft.com/v1.0/me",
        scopes: ["User.Read"],
    },
    graphUsers: {
        endpoint: "https://graph.microsoft.com/v1.0/users",
        scopes: ["User.ReadWrite.All"],
    },
    graphGroups: {
        endpoint: "https://graph.microsoft.com/v1.0/groups",
        scopes: ["Group.ReadWrite.All"],
    }
};