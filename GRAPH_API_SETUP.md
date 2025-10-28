# Microsoft Graph API Setup Guide

This guide explains how to enable real Microsoft Graph API calls in your M365 Offboarding Agent.

## Current Status

By default, the agent uses **mock data** to demonstrate functionality without requiring Microsoft 365 credentials. To use real Microsoft Graph API calls, follow the setup instructions below.

## Prerequisites

- Microsoft 365 tenant (work or school account)
- Global Administrator access to create app registrations
- Azure Portal access

## Setup Steps

### 1. Create an Azure AD App Registration

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Enter details:
   - **Name**: `M365 Offboarding Agent`
   - **Supported account types**: `Accounts in this organizational directory only`
   - **Redirect URI**: Leave blank (this is for app-only auth)
5. Click **Register**

### 2. Configure API Permissions

1. In your app registration, go to **API permissions**
2. Click **Add a permission** > **Microsoft Graph** > **Application permissions**
3. Add the following permissions:
   - `User.Read.All` - Read all users
   - `User.ReadWrite.All` - Manage user accounts
   - `Directory.Read.All` - Read directory data
   - `Group.ReadWrite.All` - Manage groups
   - `Mail.ReadWrite` - Manage mailboxes (for delegation)
   - `Files.ReadWrite.All` - Manage OneDrive files
   - `Calendars.ReadWrite` - Manage calendars

4. Click **Grant admin consent** (requires Global Administrator)

### 3. Create a Client Secret

1. Go to **Certificates & secrets**
2. Click **New client secret**
3. Enter a description: `M365 Agent Secret`
4. Choose expiration: `24 months` (or your org's policy)
5. Click **Add**
6. **⚠️ IMPORTANT**: Copy the secret **Value** immediately (it won't be shown again)

### 4. Get Your Configuration Values

From your app registration's **Overview** page, copy:
- **Application (client) ID**
- **Directory (tenant) ID**

### 5. Update `.localConfigs`

Edit your `.localConfigs` file and update these values:

```bash
# Microsoft Graph API for Agent (App-only auth)
M365_CLIENT_ID=your-application-client-id-here
M365_CLIENT_SECRET=your-client-secret-value-here
M365_TENANT_ID=your-tenant-id-here
USE_REAL_GRAPH_API=true
```

### 6. Restart the Application

```bash
# Stop the current process (Ctrl+C in terminal)
npm run dev:teamsfx
```

## Testing Real API Calls

Once configured, test with real user queries:

```
"Search for john.doe@yourcompany.com"
"Find all users in the Engineering department"
"Revoke access for user@company.com"
```

The agent will now query real Microsoft Graph data!

## API Functions

### search_employee
- **Real API**: Searches Azure AD users by display name or email
- **Permissions needed**: `User.Read.All`
- **Returns**: User details including ID, name, email, department, job title

### revoke_access
- **Real API**: Disables accounts, revokes licenses, removes from groups
- **Permissions needed**: `User.ReadWrite.All`, `Group.ReadWrite.All`
- **Actions**:
  - Disables the user account (`accountEnabled: false`)
  - Revokes all assigned licenses
  - Removes from security and Microsoft 365 groups

### transfer_data
- **Real API**: Manages mailbox delegation, OneDrive access, calendar permissions
- **Permissions needed**: `Mail.ReadWrite`, `Files.ReadWrite.All`, `Calendars.ReadWrite`
- **Actions**:
  - Documents mailbox delegation steps (requires Exchange Online admin)
  - Provides OneDrive access info
  - Grants calendar read permissions

## Security Considerations

⚠️ **Important Security Notes**:

1. **App-only authentication** has powerful permissions - protect your client secret!
2. Never commit `.localConfigs` to source control
3. Store secrets in Azure Key Vault for production
4. Use least-privilege permissions (only grant what you need)
5. Regularly rotate client secrets
6. Monitor the Azure AD audit logs for agent actions
7. Consider implementing approval workflows for destructive operations

## Fallback Behavior

The agent gracefully falls back to mock data if:
- `USE_REAL_GRAPH_API=false` in configuration
- Microsoft Graph API credentials are not configured
- API calls fail (network issues, permission errors, etc.)

This ensures the demo continues working even without real API access.

## Troubleshooting

### "401 Unauthorized" errors
- Check that admin consent was granted for all permissions
- Verify client ID and secret are correct
- Ensure tenant ID is correct

### "403 Forbidden" errors
- Missing required API permissions
- Need to grant admin consent again after adding permissions

### "404 Not Found" errors
- User ID doesn't exist
- Check that you're using the correct user ID format (GUID or UPN)

### Agent still using mock data
- Verify `USE_REAL_GRAPH_API=true` in `.localConfigs`
- Check console logs for "[GRAPH]" messages
- Restart the application after changing configuration

## Advanced: Production Deployment

For production use:

1. **Use Azure Key Vault** for secrets:
   ```typescript
   const secretClient = new SecretClient(vaultUrl, credential);
   const secret = await secretClient.getSecret("M365-Client-Secret");
   ```

2. **Implement Managed Identity** (when deployed to Azure):
   ```typescript
   const credential = new DefaultAzureCredential();
   ```

3. **Add approval workflows** for high-risk operations
4. **Log all actions** to audit trail
5. **Implement rate limiting** to prevent abuse
6. **Use certificate-based auth** instead of client secrets

## Resources

- [Microsoft Graph API Documentation](https://docs.microsoft.com/graph/overview)
- [App-only authentication](https://docs.microsoft.com/graph/auth-v2-service)
- [Microsoft Graph SDK for JavaScript](https://github.com/microsoftgraph/msgraph-sdk-javascript)
- [Azure Identity SDK](https://docs.microsoft.com/javascript/api/overview/azure/identity-readme)
