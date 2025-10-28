import React, { useEffect, useState } from 'react';
import {
    Stack,
    Text,
    ProgressBar,
    Card,
    CardHeader,
    CardBody,
    Badge,
    Button,
    MessageBar,
    MessageBarType
} from '@fluentui/react-components';
import {
    CheckmarkCircle24Regular,
    ErrorCircle24Regular,
    Clock24Regular,
    Play24Regular,
    Pause24Regular
} from '@fluentui/react-icons';
import { 
    OffboardingSession, 
    OffboardingTask, 
    OffboardingProgress,
    TaskStatus 
} from '../types/offboarding';
import { OffboardingService } from '../services/offboardingService';

interface OffboardingProgressProps {
    session: OffboardingSession;
    offboardingService: OffboardingService;
    onSessionUpdate: (session: OffboardingSession) => void;
}

export const OffboardingProgressComponent: React.FC<OffboardingProgressProps> = ({
    session,
    offboardingService,
    onSessionUpdate
}) => {
    const [currentSession, setCurrentSession] = useState<OffboardingSession>(session);
    const [isExecuting, setIsExecuting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const progress = offboardingService.getOffboardingProgress(currentSession);

    useEffect(() => {
        setCurrentSession(session);
    }, [session]);

    const executeOffboarding = async () => {
        setIsExecuting(true);
        setError(null);

        try {
            const updatedSession = await offboardingService.executeOffboarding(currentSession);
            setCurrentSession(updatedSession);
            onSessionUpdate(updatedSession);
        } catch (error) {
            console.error('Offboarding execution error:', error);
            setError(error instanceof Error ? error.message : 'Failed to execute offboarding');
        } finally {
            setIsExecuting(false);
        }
    };

    const getTaskStatusIcon = (status: TaskStatus) => {
        switch (status) {
            case 'completed':
                return <CheckmarkCircle24Regular style={{ color: 'var(--colorPaletteGreenForeground1)' }} />;
            case 'failed':
                return <ErrorCircle24Regular style={{ color: 'var(--colorPaletteRedForeground1)' }} />;
            case 'in-progress':
                return <Play24Regular style={{ color: 'var(--colorPaletteBlueForeground1)' }} />;
            default:
                return <Clock24Regular style={{ color: 'var(--colorNeutralForeground3)' }} />;
        }
    };

    const getTaskStatusBadge = (status: TaskStatus) => {
        switch (status) {
            case 'completed':
                return <Badge appearance="filled" color="success">Completed</Badge>;
            case 'failed':
                return <Badge appearance="filled" color="danger">Failed</Badge>;
            case 'in-progress':
                return <Badge appearance="filled" color="informative">In Progress</Badge>;
            case 'skipped':
                return <Badge appearance="outline" color="warning">Skipped</Badge>;
            default:
                return <Badge appearance="outline">Pending</Badge>;
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'access': return 'var(--colorPaletteRedForeground1)';
            case 'groups': return 'var(--colorPaletteBlueForeground1)';
            case 'licenses': return 'var(--colorPaletteOrangeForeground1)';
            case 'devices': return 'var(--colorPalettePurpleForeground1)';
            case 'data': return 'var(--colorPaletteGreenForeground1)';
            case 'cleanup': return 'var(--colorNeutralForeground2)';
            default: return 'var(--colorNeutralForeground2)';
        }
    };

    return (
        <Stack tokens={{ childrenGap: 20 }}>
            {/* Session Overview */}
            <Card>
                <CardHeader
                    header={
                        <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
                            <Text weight="semibold" size={500}>
                                Offboarding Progress for {currentSession.userDisplayName}
                            </Text>
                        </Stack>
                    }
                />
                <CardBody>
                    <Stack tokens={{ childrenGap: 16 }}>
                        <Stack horizontal tokens={{ childrenGap: 24 }} verticalAlign="center">
                            <Stack>
                                <Text weight="semibold">Status</Text>
                                <Text size={400} style={{ 
                                    color: currentSession.status === 'completed' 
                                        ? 'var(--colorPaletteGreenForeground1)' 
                                        : currentSession.status === 'failed'
                                        ? 'var(--colorPaletteRedForeground1)'
                                        : 'var(--colorPaletteBlueForeground1)'
                                }}>
                                    {currentSession.status.charAt(0).toUpperCase() + currentSession.status.slice(1)}
                                </Text>
                            </Stack>
                            <Stack>
                                <Text weight="semibold">Progress</Text>
                                <Text size={400}>{progress.completedTasks} of {progress.totalTasks} tasks</Text>
                            </Stack>
                            <Stack>
                                <Text weight="semibold">Created</Text>
                                <Text size={400}>{currentSession.createdAt.toLocaleString()}</Text>
                            </Stack>
                            {currentSession.completedAt && (
                                <Stack>
                                    <Text weight="semibold">Completed</Text>
                                    <Text size={400}>{currentSession.completedAt.toLocaleString()}</Text>
                                </Stack>
                            )}
                        </Stack>

                        <ProgressBar value={progress.progressPercentage / 100} />
                        
                        <Stack horizontal tokens={{ childrenGap: 12 }}>
                            <Text size={300}>
                                {progress.progressPercentage}% Complete
                            </Text>
                            {progress.currentTask && (
                                <Text size={300} style={{ color: 'var(--colorPaletteBlueForeground1)' }}>
                                    Current: {progress.currentTask}
                                </Text>
                            )}
                        </Stack>

                        {error && (
                            <MessageBar intent="error">
                                {error}
                            </MessageBar>
                        )}

                        {currentSession.status === 'created' && (
                            <Button
                                appearance="primary"
                                size="large"
                                onClick={executeOffboarding}
                                disabled={isExecuting}
                                icon={<Play24Regular />}
                            >
                                {isExecuting ? 'Executing Offboarding...' : 'Start Offboarding Process'}
                            </Button>
                        )}
                    </Stack>
                </CardBody>
            </Card>

            {/* Task List */}
            <Card>
                <CardHeader
                    header={
                        <Text weight="semibold" size={400}>
                            Offboarding Tasks ({currentSession.tasks.length})
                        </Text>
                    }
                />
                <CardBody>
                    <Stack tokens={{ childrenGap: 12 }}>
                        {currentSession.tasks.map((task) => (
                            <Card key={task.id} appearance="outline">
                                <CardBody>
                                    <Stack horizontal tokens={{ childrenGap: 12 }} verticalAlign="start">
                                        {getTaskStatusIcon(task.status as TaskStatus)}
                                        
                                        <Stack grow={1} tokens={{ childrenGap: 4 }}>
                                            <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
                                                <Text weight="semibold" size={400}>
                                                    {task.name}
                                                </Text>
                                                {getTaskStatusBadge(task.status as TaskStatus)}
                                                <Badge 
                                                    appearance="outline" 
                                                    style={{ 
                                                        borderColor: getCategoryColor(task.category),
                                                        color: getCategoryColor(task.category)
                                                    }}
                                                >
                                                    {task.category}
                                                </Badge>
                                                <Badge 
                                                    appearance="tint" 
                                                    color={task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'subtle'}
                                                >
                                                    {task.priority} priority
                                                </Badge>
                                            </Stack>
                                            
                                            <Text size={300} style={{ color: 'var(--colorNeutralForeground2)' }}>
                                                {task.description}
                                            </Text>
                                            
                                            <Stack horizontal tokens={{ childrenGap: 16 }}>
                                                {task.estimatedDuration && (
                                                    <Text size={200}>
                                                        Duration: {task.estimatedDuration}
                                                    </Text>
                                                )}
                                                {task.completedAt && (
                                                    <Text size={200} style={{ color: 'var(--colorPaletteGreenForeground1)' }}>
                                                        Completed: {task.completedAt.toLocaleTimeString()}
                                                    </Text>
                                                )}
                                            </Stack>
                                            
                                            {task.error && (
                                                <Text size={300} style={{ color: 'var(--colorPaletteRedForeground1)' }}>
                                                    Error: {task.error}
                                                </Text>
                                            )}
                                            
                                            {task.dependencies && task.dependencies.length > 0 && (
                                                <Text size={200} style={{ color: 'var(--colorNeutralForeground3)' }}>
                                                    Depends on: {task.dependencies.join(', ')}
                                                </Text>
                                            )}
                                        </Stack>
                                    </Stack>
                                </CardBody>
                            </Card>
                        ))}
                    </Stack>
                </CardBody>
            </Card>

            {/* Summary */}
            {currentSession.status === 'completed' || currentSession.status === 'failed' && (
                <Card>
                    <CardHeader
                        header={
                            <Text weight="semibold" size={400}>
                                Offboarding Summary
                            </Text>
                        }
                    />
                    <CardBody>
                        <Stack tokens={{ childrenGap: 12 }}>
                            <Stack horizontal tokens={{ childrenGap: 24 }}>
                                <Stack>
                                    <Text weight="semibold" style={{ color: 'var(--colorPaletteGreenForeground1)' }}>
                                        ✓ Completed Tasks
                                    </Text>
                                    <Text size={500}>{progress.completedTasks}</Text>
                                </Stack>
                                {progress.failedTasks > 0 && (
                                    <Stack>
                                        <Text weight="semibold" style={{ color: 'var(--colorPaletteRedForeground1)' }}>
                                            ✗ Failed Tasks
                                        </Text>
                                        <Text size={500}>{progress.failedTasks}</Text>
                                    </Stack>
                                )}
                            </Stack>
                            
                            {currentSession.status === 'completed' && progress.failedTasks === 0 && (
                                <MessageBar intent="success">
                                    <strong>Offboarding completed successfully!</strong> 
                                    {' '}The user has been securely offboarded and all access has been revoked.
                                </MessageBar>
                            )}
                            
                            {currentSession.status === 'completed' && progress.failedTasks > 0 && (
                                <MessageBar intent="warning">
                                    <strong>Offboarding completed with some issues.</strong> 
                                    {' '}Please review the failed tasks and complete them manually if necessary.
                                </MessageBar>
                            )}
                            
                            {currentSession.status === 'failed' && (
                                <MessageBar intent="error">
                                    <strong>Offboarding failed.</strong> 
                                    {' '}Critical tasks could not be completed. Please review and retry.
                                </MessageBar>
                            )}
                        </Stack>
                    </CardBody>
                </Card>
            )}
        </Stack>
    );
};