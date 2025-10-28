import React, { useState, useCallback } from 'react';
import {
    SearchBox,
    Persona,
    PersonaSize,
    PersonaPresence,
    Stack,
    Text,
    Spinner,
    MessageBar,
    MessageBarType,
    Button,
    Card,
    CardHeader,
    CardBody
} from '@fluentui/react-components';
import {
    Person24Regular,
    Search24Regular,
    PersonDelete24Regular
} from '@fluentui/react-icons';
import { User } from '../types/offboarding';
import { MicrosoftGraphService } from '../services/graphService';

interface UserSearchProps {
    graphService: MicrosoftGraphService;
    onUserSelected: (user: User) => void;
}

export const UserSearch: React.FC<UserSearchProps> = ({ graphService, onUserSelected }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const handleSearch = useCallback(async (query: string) => {
        if (!query.trim() || query.length < 2) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        setError(null);

        try {
            const results = await graphService.searchUsers(query);
            setSearchResults(results);
        } catch (error) {
            console.error('Search error:', error);
            setError('Failed to search users. Please try again.');
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    }, [graphService]);

    const handleUserSelection = async (user: User) => {
        setIsSearching(true);
        setError(null);
        
        try {
            // Get full user details including groups, devices, etc.
            const fullUser = await graphService.getUser(user.id);
            setSelectedUser(fullUser);
            onUserSelected(fullUser);
        } catch (error) {
            console.error('Error getting user details:', error);
            setError('Failed to get user details. Please try again.');
        } finally {
            setIsSearching(false);
        }
    };

    const startOffboarding = () => {
        if (selectedUser) {
            onUserSelected(selectedUser);
        }
    };

    return (
        <Stack tokens={{ childrenGap: 20 }}>
            {/* Search Section */}
            <Card>
                <CardHeader
                    header={
                        <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
                            <Person24Regular />
                            <Text weight="semibold" size={400}>
                                Search Employee for Offboarding
                            </Text>
                        </Stack>
                    }
                />
                <CardBody>
                    <Stack tokens={{ childrenGap: 16 }}>
                        <SearchBox
                            placeholder="Search by name, email, or username..."
                            value={searchQuery}
                            onChange={(_, data) => {
                                setSearchQuery(data.value);
                                handleSearch(data.value);
                            }}
                            contentBefore={<Search24Regular />}
                            disabled={isSearching}
                        />

                        {error && (
                            <MessageBar intent="error">
                                {error}
                            </MessageBar>
                        )}

                        {isSearching && (
                            <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
                                <Spinner size="tiny" />
                                <Text>Searching...</Text>
                            </Stack>
                        )}
                    </Stack>
                </CardBody>
            </Card>

            {/* Search Results */}
            {searchResults.length > 0 && (
                <Card>
                    <CardHeader
                        header={
                            <Text weight="semibold" size={400}>
                                Search Results ({searchResults.length})
                            </Text>
                        }
                    />
                    <CardBody>
                        <Stack tokens={{ childrenGap: 12 }}>
                            {searchResults.map((user) => (
                                <Card
                                    key={user.id}
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => handleUserSelection(user)}
                                >
                                    <CardBody>
                                        <Stack horizontal tokens={{ childrenGap: 12 }} verticalAlign="center">
                                            <Persona
                                                name={user.displayName}
                                                secondaryText={user.userPrincipalName}
                                                tertiaryText={user.jobTitle}
                                                size={PersonaSize.size48}
                                                presence={user.accountEnabled ? PersonaPresence.online : PersonaPresence.busy}
                                            />
                                            <Stack grow={1}>
                                                <Text weight="semibold">{user.displayName}</Text>
                                                <Text size={300}>{user.userPrincipalName}</Text>
                                                {user.jobTitle && (
                                                    <Text size={200} style={{ color: 'var(--colorNeutralForeground2)' }}>
                                                        {user.jobTitle} • {user.department}
                                                    </Text>
                                                )}
                                                <Text size={200} style={{ 
                                                    color: user.accountEnabled ? 'var(--colorPaletteGreenForeground1)' : 'var(--colorPaletteRedForeground1)' 
                                                }}>
                                                    {user.accountEnabled ? 'Active' : 'Disabled'}
                                                </Text>
                                            </Stack>
                                        </Stack>
                                    </CardBody>
                                </Card>
                            ))}
                        </Stack>
                    </CardBody>
                </Card>
            )}

            {/* Selected User Details */}
            {selectedUser && (
                <Card>
                    <CardHeader
                        header={
                            <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
                                <PersonDelete24Regular />
                                <Text weight="semibold" size={400}>
                                    Selected Employee for Offboarding
                                </Text>
                            </Stack>
                        }
                    />
                    <CardBody>
                        <Stack tokens={{ childrenGap: 16 }}>
                            <Stack horizontal tokens={{ childrenGap: 16 }} verticalAlign="start">
                                <Persona
                                    name={selectedUser.displayName}
                                    secondaryText={selectedUser.userPrincipalName}
                                    tertiaryText={selectedUser.jobTitle}
                                    size={PersonaSize.size72}
                                    presence={selectedUser.accountEnabled ? PersonaPresence.online : PersonaPresence.busy}
                                />
                                <Stack grow={1} tokens={{ childrenGap: 8 }}>
                                    <Text weight="semibold" size={500}>{selectedUser.displayName}</Text>
                                    <Text size={300}>{selectedUser.userPrincipalName}</Text>
                                    {selectedUser.jobTitle && (
                                        <Text size={300}>
                                            {selectedUser.jobTitle}
                                            {selectedUser.department && ` • ${selectedUser.department}`}
                                        </Text>
                                    )}
                                    {selectedUser.employeeId && (
                                        <Text size={300}>Employee ID: {selectedUser.employeeId}</Text>
                                    )}
                                </Stack>
                            </Stack>

                            {/* User Statistics */}
                            <Stack horizontal tokens={{ childrenGap: 24 }}>
                                <Stack>
                                    <Text weight="semibold">Group Memberships</Text>
                                    <Text size={400}>{selectedUser.memberOf?.length || 0} groups</Text>
                                </Stack>
                                <Stack>
                                    <Text weight="semibold">Licenses</Text>
                                    <Text size={400}>{selectedUser.assignedLicenses?.length || 0} licenses</Text>
                                </Stack>
                                <Stack>
                                    <Text weight="semibold">Devices</Text>
                                    <Text size={400}>{selectedUser.ownedDevices?.length || 0} devices</Text>
                                </Stack>
                                <Stack>
                                    <Text weight="semibold">Status</Text>
                                    <Text 
                                        size={400}
                                        style={{ 
                                            color: selectedUser.accountEnabled 
                                                ? 'var(--colorPaletteGreenForeground1)' 
                                                : 'var(--colorPaletteRedForeground1)' 
                                        }}
                                    >
                                        {selectedUser.accountEnabled ? 'Active' : 'Disabled'}
                                    </Text>
                                </Stack>
                            </Stack>

                            {selectedUser.accountEnabled && (
                                <MessageBar intent="warning">
                                    <strong>Warning:</strong> This will immediately disable the user's account and revoke all access. 
                                    Make sure you have proper authorization and have backed up any necessary data.
                                </MessageBar>
                            )}

                            <Button
                                appearance="primary"
                                size="large"
                                onClick={startOffboarding}
                                disabled={!selectedUser.accountEnabled}
                                icon={<PersonDelete24Regular />}
                            >
                                {selectedUser.accountEnabled ? 'Start Offboarding Process' : 'User Already Disabled'}
                            </Button>
                        </Stack>
                    </CardBody>
                </Card>
            )}
        </Stack>
    );
};