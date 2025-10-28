import { Client } from "@microsoft/microsoft-graph-client";
import { TokenCredentialAuthenticationProvider } from "@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials";
import { ClientSecretCredential } from "@azure/identity";

// Initialize Graph client with app-only authentication
let graphClient: Client | null = null;

export function getGraphClient(): Client {
  if (graphClient) {
    return graphClient;
  }

  const clientId = process.env.M365_CLIENT_ID || process.env.REACT_APP_CLIENT_ID;
  const tenantId = process.env.M365_TENANT_ID || process.env.REACT_APP_TENANT_ID || "common";
  const clientSecret = process.env.M365_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Microsoft Graph credentials not configured. Please set M365_CLIENT_ID and M365_CLIENT_SECRET in .localConfigs"
    );
  }

  // Create credential for app-only authentication
  const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);

  // Create authentication provider
  const authProvider = new TokenCredentialAuthenticationProvider(credential, {
    scopes: ["https://graph.microsoft.com/.default"],
  });

  // Initialize Graph client
  graphClient = Client.initWithMiddleware({
    authProvider: authProvider,
  });

  return graphClient;
}

// User search functions
export async function searchUsers(query: string) {
  const client = getGraphClient();
  
  try {
    const response = await client
      .api("/users")
      .filter(`startsWith(displayName,'${query}') or startsWith(mail,'${query}')`)
      .select("id,displayName,mail,jobTitle,department,accountEnabled")
      .top(10)
      .get();

    return response.value;
  } catch (error: any) {
    console.error("[GRAPH] User search error:", error.message);
    throw new Error(`Failed to search users: ${error.message}`);
  }
}

export async function getUser(userId: string) {
  const client = getGraphClient();
  
  try {
    const user = await client
      .api(`/users/${userId}`)
      .select("id,displayName,mail,jobTitle,department,accountEnabled,assignedLicenses")
      .get();

    return user;
  } catch (error: any) {
    console.error("[GRAPH] Get user error:", error.message);
    throw new Error(`Failed to get user: ${error.message}`);
  }
}

// License and access management
export async function revokeUserAccess(userId: string, services: string[]) {
  const client = getGraphClient();
  const results: any[] = [];

  try {
    // Disable the account
    if (services.includes("account") || services.includes("all")) {
      await client.api(`/users/${userId}`).patch({
        accountEnabled: false,
      });
      results.push({ service: "account", status: "disabled" });
    }

    // Revoke licenses (for email, teams, etc.)
    if (services.includes("email") || services.includes("teams") || services.includes("office365") || services.includes("all")) {
      const user = await client.api(`/users/${userId}`).select("assignedLicenses").get();
      
      if (user.assignedLicenses && user.assignedLicenses.length > 0) {
        const licenseIds = user.assignedLicenses.map((l: any) => l.skuId);
        
        await client.api(`/users/${userId}/assignLicense`).post({
          addLicenses: [],
          removeLicenses: licenseIds,
        });
        
        results.push({ service: "licenses", status: "revoked", count: licenseIds.length });
      }
    }

    // Revoke SharePoint access (remove from groups)
    if (services.includes("sharepoint") || services.includes("all")) {
      const groups = await client.api(`/users/${userId}/memberOf`).get();
      
      for (const group of groups.value) {
        try {
          await client.api(`/groups/${group.id}/members/${userId}/$ref`).delete();
          results.push({ service: "sharepoint_group", status: "removed", group: group.displayName });
        } catch (err) {
          // Continue if removal fails
        }
      }
    }

    return results;
  } catch (error: any) {
    console.error("[GRAPH] Revoke access error:", error.message);
    throw new Error(`Failed to revoke access: ${error.message}`);
  }
}

// OneDrive and mailbox delegation
export async function transferUserData(fromUserId: string, toUserId: string, dataTypes: string[]) {
  const client = getGraphClient();
  const results: any[] = [];

  try {
    // Transfer mailbox (delegate access)
    if (dataTypes.includes("emails") || dataTypes.includes("mailbox") || dataTypes.includes("all")) {
      // Grant full access to mailbox
      // Note: This requires Exchange Online PowerShell for full mailbox access
      // For now, we'll document what needs to be done
      results.push({
        dataType: "mailbox",
        status: "pending_manual",
        message: "Mailbox delegation requires Exchange Online admin action",
        action: `Run: Add-MailboxPermission -Identity "${fromUserId}" -User "${toUserId}" -AccessRights FullAccess`,
      });
    }

    // Transfer OneDrive files
    if (dataTypes.includes("files") || dataTypes.includes("onedrive") || dataTypes.includes("all")) {
      // Get the source user's drive
      const drive = await client.api(`/users/${fromUserId}/drive`).get();
      
      results.push({
        dataType: "onedrive",
        status: "accessible",
        message: `OneDrive accessible for transfer`,
        driveId: drive.id,
        action: `Use SharePoint admin to transfer ownership or grant access to ${toUserId}`,
      });
    }

    // Transfer calendar (delegate access)
    if (dataTypes.includes("calendar") || dataTypes.includes("all")) {
      // Grant calendar permissions
      await client.api(`/users/${fromUserId}/calendar/permissions`).post({
        emailAddress: {
          address: toUserId,
          name: toUserId,
        },
        role: "read",
      });
      
      results.push({
        dataType: "calendar",
        status: "delegated",
        message: "Calendar read access granted",
      });
    }

    return results;
  } catch (error: any) {
    console.error("[GRAPH] Transfer data error:", error.message);
    throw new Error(`Failed to transfer data: ${error.message}`);
  }
}

// Group and team memberships
export async function getUserMemberships(userId: string) {
  const client = getGraphClient();
  
  try {
    const memberships = await client
      .api(`/users/${userId}/memberOf`)
      .select("id,displayName,mail,groupTypes")
      .get();

    return memberships.value;
  } catch (error: any) {
    console.error("[GRAPH] Get memberships error:", error.message);
    throw new Error(`Failed to get user memberships: ${error.message}`);
  }
}
