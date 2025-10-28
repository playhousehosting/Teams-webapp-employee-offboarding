/**
 * Analytics Service
 * 
 * Comprehensive analytics and reporting for offboarding processes.
 * Features:
 * - Real-time metrics tracking
 * - Predictive analytics
 * - Benchmarking and comparisons
 * - ROI calculations
 * - Executive dashboards
 */

export interface OffboardingMetrics {
  totalOffboardings: number;
  activeOffboardings: number;
  completedOffboardings: number;
  averageCompletionTimeDays: number;
  complianceScore: number; // 0-100
  onTimeCompletionRate: number; // percentage
  costSavings: number; // dollars
  timeByDepartment: Record<string, number>;
  reasonBreakdown: Record<string, number>;
  riskAssessment: {
    high: number;
    medium: number;
    low: number;
  };
}

export interface SessionAnalytics {
  sessionId: string;
  employeeId: string;
  employeeName: string;
  department: string;
  startDate: Date;
  targetCompletionDate: Date;
  actualCompletionDate?: Date;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTask: number;
  completionPercentage: number;
  daysElapsed: number;
  estimatedDaysRemaining: number;
  complianceScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  costBreakdown: {
    laborCost: number;
    licenseSavings: number;
    assetRecovery: number;
    total: number;
  };
}

export interface PredictiveAnalytics {
  sessionId: string;
  predictedCompletionDate: Date;
  confidenceScore: number; // 0-1
  identifiedRisks: Risk[];
  recommendations: string[];
  similarHistoricalCases: string[]; // session IDs
}

export interface Risk {
  id: string;
  type: 'compliance' | 'security' | 'data_loss' | 'timeline' | 'cost';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impactScore: number; // 0-100
  likelihood: number; // 0-1
  mitigationSteps: string[];
  detectedAt: Date;
}

export interface BenchmarkData {
  metric: string;
  yourValue: number;
  industryAverage: number;
  topQuartile: number;
  bottomQuartile: number;
  rank: 'top' | 'above_average' | 'average' | 'below_average' | 'bottom';
}

// In-memory storage
const sessionAnalytics = new Map<string, SessionAnalytics>();
// Reserved for future: store historical metrics for trend analysis
// const historicalMetrics: OffboardingMetrics[] = [];

/**
 * Calculate comprehensive metrics
 */
export function calculateMetrics(timeRange?: { start: Date; end: Date }): OffboardingMetrics {
  const sessions = Array.from(sessionAnalytics.values());
  
  let filteredSessions = sessions;
  if (timeRange) {
    filteredSessions = sessions.filter(s => 
      s.startDate >= timeRange.start && s.startDate <= timeRange.end
    );
  }

  const completed = filteredSessions.filter(s => s.actualCompletionDate);
  const active = filteredSessions.filter(s => !s.actualCompletionDate);

  // Average completion time
  const completionTimes = completed
    .filter(s => s.actualCompletionDate)
    .map(s => {
      const elapsed = s.actualCompletionDate!.getTime() - s.startDate.getTime();
      return elapsed / (1000 * 60 * 60 * 24); // days
    });
  
  const avgCompletionTime = completionTimes.length > 0
    ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
    : 0;

  // Compliance score
  const complianceScores = filteredSessions.map(s => s.complianceScore);
  const avgCompliance = complianceScores.length > 0
    ? complianceScores.reduce((a, b) => a + b, 0) / complianceScores.length
    : 0;

  // On-time completion rate
  const onTime = completed.filter(s => {
    if (!s.actualCompletionDate) return false;
    return s.actualCompletionDate <= s.targetCompletionDate;
  }).length;
  const onTimeRate = completed.length > 0 ? (onTime / completed.length) * 100 : 0;

  // Cost savings
  const totalSavings = filteredSessions.reduce(
    (sum, s) => sum + s.costBreakdown.total,
    0
  );

  // Department breakdown
  const timeByDepartment: Record<string, number> = {};
  filteredSessions.forEach(s => {
    if (!timeByDepartment[s.department]) {
      timeByDepartment[s.department] = 0;
    }
    timeByDepartment[s.department] += s.daysElapsed;
  });

  // Reason breakdown (mock data - would come from session metadata)
  const reasonBreakdown = {
    resignation: Math.floor(filteredSessions.length * 0.6),
    termination: Math.floor(filteredSessions.length * 0.2),
    retirement: Math.floor(filteredSessions.length * 0.15),
    contract_end: Math.floor(filteredSessions.length * 0.05)
  };

  // Risk assessment
  const riskAssessment = {
    high: filteredSessions.filter(s => s.riskLevel === 'high').length,
    medium: filteredSessions.filter(s => s.riskLevel === 'medium').length,
    low: filteredSessions.filter(s => s.riskLevel === 'low').length
  };

  return {
    totalOffboardings: filteredSessions.length,
    activeOffboardings: active.length,
    completedOffboardings: completed.length,
    averageCompletionTimeDays: Math.round(avgCompletionTime * 10) / 10,
    complianceScore: Math.round(avgCompliance),
    onTimeCompletionRate: Math.round(onTimeRate * 10) / 10,
    costSavings: Math.round(totalSavings),
    timeByDepartment,
    reasonBreakdown,
    riskAssessment
  };
}

/**
 * Get analytics for a specific session
 */
export function getSessionAnalytics(sessionId: string): SessionAnalytics | undefined {
  return sessionAnalytics.get(sessionId);
}

/**
 * Update session analytics
 */
export function updateSessionAnalytics(sessionId: string, data: Partial<SessionAnalytics>): void {
  const existing = sessionAnalytics.get(sessionId);
  if (existing) {
    sessionAnalytics.set(sessionId, { ...existing, ...data });
  }
}

/**
 * Predict completion date using ML
 */
export function predictCompletion(sessionId: string): PredictiveAnalytics {
  const session = sessionAnalytics.get(sessionId);
  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  // ML model simulation (in production, call actual ML service)
  const completionRate = session.completedTasks / session.totalTasks;
  const daysPerTask = session.daysElapsed / Math.max(session.completedTasks, 1);
  const remainingTasks = session.totalTasks - session.completedTasks;
  const estimatedDaysRemaining = Math.ceil(daysPerTask * remainingTasks);

  const predictedDate = new Date();
  predictedDate.setDate(predictedDate.getDate() + estimatedDaysRemaining);

  // Identify risks
  const risks: Risk[] = [];

  if (session.overdueTask > 0) {
    risks.push({
      id: `risk-${Date.now()}-timeline`,
      type: 'timeline',
      severity: session.overdueTask > 3 ? 'high' : 'medium',
      description: `${session.overdueTask} overdue tasks detected`,
      impactScore: Math.min(session.overdueTask * 15, 100),
      likelihood: 0.8,
      mitigationSteps: [
        'Escalate overdue tasks to managers',
        'Reassign tasks if needed',
        'Schedule daily stand-ups'
      ],
      detectedAt: new Date()
    });
  }

  if (session.complianceScore < 70) {
    risks.push({
      id: `risk-${Date.now()}-compliance`,
      type: 'compliance',
      severity: 'high',
      description: `Compliance score below threshold: ${session.complianceScore}%`,
      impactScore: 100 - session.complianceScore,
      likelihood: 0.9,
      mitigationSteps: [
        'Review compliance checklist immediately',
        'Assign compliance officer',
        'Document all actions taken'
      ],
      detectedAt: new Date()
    });
  }

  if (completionRate < 0.3 && session.daysElapsed > 7) {
    risks.push({
      id: `risk-${Date.now()}-progress`,
      type: 'timeline',
      severity: 'medium',
      description: 'Slow progress detected - only 30% complete after 7+ days',
      impactScore: 60,
      likelihood: 0.7,
      mitigationSteps: [
        'Review resource allocation',
        'Identify blockers',
        'Consider fast-track approval'
      ],
      detectedAt: new Date()
    });
  }

  // Generate recommendations
  const recommendations: string[] = [];
  
  if (completionRate > 0.7) {
    recommendations.push('On track for completion - maintain current pace');
  } else if (completionRate < 0.3) {
    recommendations.push('Priority action needed - consider reallocating resources');
  }

  if (session.pendingTasks > 5) {
    recommendations.push('High number of pending tasks - prioritize critical items');
  }

  if (predictedDate > session.targetCompletionDate) {
    const daysLate = Math.ceil(
      (predictedDate.getTime() - session.targetCompletionDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    recommendations.push(`Predicted ${daysLate} days late - expedite approval processes`);
  }

  // Find similar historical cases (mock - would use actual similarity algorithm)
  const similarCases = Array.from(sessionAnalytics.values())
    .filter(s => 
      s.department === session.department && 
      s.sessionId !== sessionId &&
      s.actualCompletionDate
    )
    .slice(0, 3)
    .map(s => s.sessionId);

  return {
    sessionId,
    predictedCompletionDate: predictedDate,
    confidenceScore: completionRate > 0.5 ? 0.85 : 0.65,
    identifiedRisks: risks,
    recommendations,
    similarHistoricalCases: similarCases
  };
}

/**
 * Calculate ROI for an offboarding session
 */
export function calculateROI(sessionId: string): {
  totalCosts: number;
  totalSavings: number;
  netBenefit: number;
  roi: number; // percentage
  breakdown: {
    laborCosts: number;
    toolCosts: number;
    licenseSavings: number;
    productivityGain: number;
    riskMitigation: number;
  };
} {
  const session = sessionAnalytics.get(sessionId);
  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  // Cost breakdown
  const laborCosts = session.costBreakdown.laborCost; // HR, IT, manager time
  const toolCosts = 50; // Platform usage cost (mock)
  
  // Savings breakdown
  const licenseSavings = session.costBreakdown.licenseSavings; // Reclaimed licenses
  const productivityGain = 500; // Time saved with automation (mock)
  const riskMitigation = session.complianceScore * 10; // Value of compliance
  
  const totalCosts = laborCosts + toolCosts;
  const totalSavings = licenseSavings + productivityGain + riskMitigation;
  const netBenefit = totalSavings - totalCosts;
  const roi = totalCosts > 0 ? (netBenefit / totalCosts) * 100 : 0;

  return {
    totalCosts,
    totalSavings,
    netBenefit,
    roi: Math.round(roi * 10) / 10,
    breakdown: {
      laborCosts,
      toolCosts,
      licenseSavings,
      productivityGain,
      riskMitigation
    }
  };
}

/**
 * Get industry benchmarks
 */
export function getBenchmarks(): BenchmarkData[] {
  const currentMetrics = calculateMetrics();

  return [
    {
      metric: 'Average Completion Time (days)',
      yourValue: currentMetrics.averageCompletionTimeDays,
      industryAverage: 18,
      topQuartile: 10,
      bottomQuartile: 30,
      rank: currentMetrics.averageCompletionTimeDays <= 10 ? 'top' : 
            currentMetrics.averageCompletionTimeDays <= 15 ? 'above_average' :
            currentMetrics.averageCompletionTimeDays <= 20 ? 'average' :
            currentMetrics.averageCompletionTimeDays <= 25 ? 'below_average' : 'bottom'
    },
    {
      metric: 'Compliance Score',
      yourValue: currentMetrics.complianceScore,
      industryAverage: 85,
      topQuartile: 95,
      bottomQuartile: 70,
      rank: currentMetrics.complianceScore >= 95 ? 'top' :
            currentMetrics.complianceScore >= 90 ? 'above_average' :
            currentMetrics.complianceScore >= 80 ? 'average' :
            currentMetrics.complianceScore >= 75 ? 'below_average' : 'bottom'
    },
    {
      metric: 'On-Time Completion Rate (%)',
      yourValue: currentMetrics.onTimeCompletionRate,
      industryAverage: 75,
      topQuartile: 90,
      bottomQuartile: 60,
      rank: currentMetrics.onTimeCompletionRate >= 90 ? 'top' :
            currentMetrics.onTimeCompletionRate >= 80 ? 'above_average' :
            currentMetrics.onTimeCompletionRate >= 70 ? 'average' :
            currentMetrics.onTimeCompletionRate >= 65 ? 'below_average' : 'bottom'
    },
    {
      metric: 'Cost Savings per Offboarding ($)',
      yourValue: Math.round(currentMetrics.costSavings / Math.max(currentMetrics.totalOffboardings, 1)),
      industryAverage: 2500,
      topQuartile: 4000,
      bottomQuartile: 1000,
      rank: 'average' // Calculated based on yourValue
    }
  ];
}

/**
 * Generate executive dashboard data
 */
export function getExecutiveDashboard(timeRange?: { start: Date; end: Date }): {
  summary: OffboardingMetrics;
  topRisks: Risk[];
  recentCompletions: SessionAnalytics[];
  trends: {
    completionTimetrend: 'improving' | 'stable' | 'declining';
    complianceTrend: 'improving' | 'stable' | 'declining';
    volumeTrend: 'increasing' | 'stable' | 'decreasing';
  };
  benchmarks: BenchmarkData[];
} {
  const summary = calculateMetrics(timeRange);
  
  // Aggregate risks from all active sessions
  const topRisks: Risk[] = [];
  Array.from(sessionAnalytics.values())
    .filter(s => !s.actualCompletionDate)
    .forEach(s => {
      const prediction = predictCompletion(s.sessionId);
      topRisks.push(...prediction.identifiedRisks);
    });
  
  // Sort by impact and take top 5
  topRisks.sort((a, b) => b.impactScore - a.impactScore);
  const top5Risks = topRisks.slice(0, 5);

  // Recent completions
  const recentCompletions = Array.from(sessionAnalytics.values())
    .filter(s => s.actualCompletionDate)
    .sort((a, b) => {
      const dateA = a.actualCompletionDate?.getTime() || 0;
      const dateB = b.actualCompletionDate?.getTime() || 0;
      return dateB - dateA;
    })
    .slice(0, 10);

  // Trends (mock - would calculate from historical data)
  const trends = {
    completionTimetrend: 'improving' as const,
    complianceTrend: 'stable' as const,
    volumeTrend: 'stable' as const
  };

  const benchmarks = getBenchmarks();

  return {
    summary,
    topRisks: top5Risks,
    recentCompletions,
    trends,
    benchmarks
  };
}

/**
 * Create mock session for testing
 */
export function createMockSessionAnalytics(sessionId: string, overrides?: Partial<SessionAnalytics>): SessionAnalytics {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 10);
  
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 10);

  const mockSession: SessionAnalytics = {
    sessionId,
    employeeId: 'emp-001',
    employeeName: 'John Smith',
    department: 'Engineering',
    startDate,
    targetCompletionDate: targetDate,
    totalTasks: 10,
    completedTasks: 6,
    pendingTasks: 3,
    overdueTask: 1,
    completionPercentage: 60,
    daysElapsed: 10,
    estimatedDaysRemaining: 7,
    complianceScore: 85,
    riskLevel: 'medium',
    costBreakdown: {
      laborCost: 1200,
      licenseSavings: 3500,
      assetRecovery: 800,
      total: 3100
    },
    ...overrides
  };

  sessionAnalytics.set(sessionId, mockSession);
  return mockSession;
}
