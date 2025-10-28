/**
 * Alumni Network Portal
 * 
 * Manages former employee relationships, tracks boomerang hires,
 * and maintains alumni engagement for potential rehires.
 */

export interface AlumniProfile {
  id: string;
  employeeId: string;
  fullName: string;
  email: string;
  phone?: string;
  linkedinUrl?: string;
  
  // Employment history
  department: string;
  lastPosition: string;
  hireDate: Date;
  exitDate: Date;
  exitReason: 'resignation' | 'termination' | 'retirement' | 'layoff' | 'contract_end';
  
  // Rehire eligibility
  eligibleForRehire: boolean;
  rehireNotes?: string;
  rehireRestrictions?: string[];
  
  // Alumni engagement
  networkStatus: 'active' | 'inactive' | 'do_not_contact';
  lastContactDate?: Date;
  eventsAttended: number;
  referralsMade: number;
  
  // Skills & interests
  skills: string[];
  interests: string[];
  currentCompany?: string;
  currentRole?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface BoomerangHire {
  id: string;
  alumniId: string;
  originalExitDate: Date;
  rehireDate: Date;
  newPosition: string;
  newDepartment: string;
  
  // Rehire details
  recruiterNotes: string;
  improvementsSinceExit: string[];
  retentionStrategies: string[];
  
  status: 'candidate' | 'offer_extended' | 'accepted' | 'completed';
  createdAt: Date;
}

export interface AlumniEvent {
  id: string;
  name: string;
  description: string;
  date: Date;
  location: string;
  type: 'networking' | 'webinar' | 'social' | 'recruitment';
  
  attendees: string[]; // Alumni IDs
  capacity?: number;
  registrationDeadline?: Date;
  
  createdAt: Date;
}

export interface AlumniReferral {
  id: string;
  alumniId: string;
  candidateName: string;
  candidateEmail: string;
  position: string;
  status: 'submitted' | 'screening' | 'interviewing' | 'hired' | 'rejected';
  submittedAt: Date;
  bonus?: number;
}

// In-memory storage
const alumni = new Map<string, AlumniProfile>();
const boomerangHires = new Map<string, BoomerangHire>();
const events = new Map<string, AlumniEvent>();
const referrals = new Map<string, AlumniReferral>();

/**
 * Create alumni profile
 */
export function createAlumniProfile(data: {
  employeeId: string;
  fullName: string;
  email: string;
  phone?: string;
  linkedinUrl?: string;
  department: string;
  lastPosition: string;
  hireDate: Date;
  exitDate: Date;
  exitReason: AlumniProfile['exitReason'];
  eligibleForRehire: boolean;
  rehireNotes?: string;
  skills?: string[];
  interests?: string[];
}): AlumniProfile {
  const profile: AlumniProfile = {
    id: `alumni-${Date.now()}`,
    employeeId: data.employeeId,
    fullName: data.fullName,
    email: data.email,
    phone: data.phone,
    linkedinUrl: data.linkedinUrl,
    department: data.department,
    lastPosition: data.lastPosition,
    hireDate: data.hireDate,
    exitDate: data.exitDate,
    exitReason: data.exitReason,
    eligibleForRehire: data.eligibleForRehire,
    rehireNotes: data.rehireNotes,
    networkStatus: 'active',
    eventsAttended: 0,
    referralsMade: 0,
    skills: data.skills || [],
    interests: data.interests || [],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  alumni.set(profile.id, profile);
  return profile;
}

/**
 * Update alumni profile
 */
export function updateAlumniProfile(
  alumniId: string,
  updates: Partial<AlumniProfile>
): AlumniProfile {
  const profile = alumni.get(alumniId);
  if (!profile) {
    throw new Error(`Alumni profile not found: ${alumniId}`);
  }

  Object.assign(profile, updates, { updatedAt: new Date() });
  return profile;
}

/**
 * Search alumni
 */
export function searchAlumni(criteria: {
  skills?: string[];
  department?: string;
  exitReason?: AlumniProfile['exitReason'];
  eligibleForRehire?: boolean;
  lastExitBefore?: Date;
  lastExitAfter?: Date;
}): AlumniProfile[] {
  let results = Array.from(alumni.values());

  if (criteria.skills && criteria.skills.length > 0) {
    results = results.filter(a =>
      criteria.skills!.some(skill => a.skills.includes(skill))
    );
  }

  if (criteria.department) {
    results = results.filter(a => a.department === criteria.department);
  }

  if (criteria.exitReason) {
    results = results.filter(a => a.exitReason === criteria.exitReason);
  }

  if (criteria.eligibleForRehire !== undefined) {
    results = results.filter(a => a.eligibleForRehire === criteria.eligibleForRehire);
  }

  if (criteria.lastExitBefore) {
    results = results.filter(a => a.exitDate < criteria.lastExitBefore!);
  }

  if (criteria.lastExitAfter) {
    results = results.filter(a => a.exitDate > criteria.lastExitAfter!);
  }

  return results;
}

/**
 * Track boomerang hire
 */
export function createBoomerangHire(data: {
  alumniId: string;
  originalExitDate: Date;
  rehireDate: Date;
  newPosition: string;
  newDepartment: string;
  recruiterNotes: string;
  improvementsSinceExit?: string[];
  retentionStrategies?: string[];
}): BoomerangHire {
  const hire: BoomerangHire = {
    id: `boomerang-${Date.now()}`,
    alumniId: data.alumniId,
    originalExitDate: data.originalExitDate,
    rehireDate: data.rehireDate,
    newPosition: data.newPosition,
    newDepartment: data.newDepartment,
    recruiterNotes: data.recruiterNotes,
    improvementsSinceExit: data.improvementsSinceExit || [],
    retentionStrategies: data.retentionStrategies || [],
    status: 'candidate',
    createdAt: new Date()
  };

  boomerangHires.set(hire.id, hire);
  return hire;
}

/**
 * Update boomerang hire status
 */
export function updateBoomerangHire(
  hireId: string,
  status: BoomerangHire['status']
): BoomerangHire {
  const hire = boomerangHires.get(hireId);
  if (!hire) {
    throw new Error(`Boomerang hire not found: ${hireId}`);
  }

  hire.status = status;
  return hire;
}

/**
 * Get boomerang hire analytics
 */
export function getBoomerangAnalytics(): {
  totalBoomerangs: number;
  successRate: number;
  averageTimeToRehire: number; // days
  topDepartments: Array<{ department: string; count: number }>;
  retentionComparison: {
    boomerangRetention: number;
    newHireRetention: number;
  };
} {
  const hires = Array.from(boomerangHires.values());
  const completed = hires.filter(h => h.status === 'completed');

  // Calculate average time to rehire
  const avgTime = completed.reduce((sum, h) => {
    const days = Math.floor(
      (h.rehireDate.getTime() - h.originalExitDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return sum + days;
  }, 0) / (completed.length || 1);

  // Top departments
  const deptCounts: Record<string, number> = {};
  completed.forEach(h => {
    deptCounts[h.newDepartment] = (deptCounts[h.newDepartment] || 0) + 1;
  });
  const topDepartments = Object.entries(deptCounts)
    .map(([department, count]) => ({ department, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalBoomerangs: completed.length,
    successRate: hires.length > 0 ? (completed.length / hires.length) * 100 : 0,
    averageTimeToRehire: Math.round(avgTime),
    topDepartments,
    retentionComparison: {
      boomerangRetention: 87, // Simulated: boomerangs typically have higher retention
      newHireRetention: 68
    }
  };
}

/**
 * Create alumni event
 */
export function createAlumniEvent(data: {
  name: string;
  description: string;
  date: Date;
  location: string;
  type: AlumniEvent['type'];
  capacity?: number;
  registrationDeadline?: Date;
}): AlumniEvent {
  const event: AlumniEvent = {
    id: `event-${Date.now()}`,
    name: data.name,
    description: data.description,
    date: data.date,
    location: data.location,
    type: data.type,
    attendees: [],
    capacity: data.capacity,
    registrationDeadline: data.registrationDeadline,
    createdAt: new Date()
  };

  events.set(event.id, event);
  return event;
}

/**
 * Register for event
 */
export function registerForEvent(eventId: string, alumniId: string): AlumniEvent {
  const event = events.get(eventId);
  if (!event) {
    throw new Error(`Event not found: ${eventId}`);
  }

  const profile = alumni.get(alumniId);
  if (!profile) {
    throw new Error(`Alumni profile not found: ${alumniId}`);
  }

  // Check capacity
  if (event.capacity && event.attendees.length >= event.capacity) {
    throw new Error('Event is at capacity');
  }

  // Check registration deadline
  if (event.registrationDeadline && new Date() > event.registrationDeadline) {
    throw new Error('Registration deadline has passed');
  }

  // Register
  if (!event.attendees.includes(alumniId)) {
    event.attendees.push(alumniId);
    profile.eventsAttended++;
    profile.lastContactDate = new Date();
  }

  return event;
}

/**
 * Submit referral
 */
export function submitReferral(data: {
  alumniId: string;
  candidateName: string;
  candidateEmail: string;
  position: string;
  bonus?: number;
}): AlumniReferral {
  const profile = alumni.get(data.alumniId);
  if (!profile) {
    throw new Error(`Alumni profile not found: ${data.alumniId}`);
  }

  const referral: AlumniReferral = {
    id: `referral-${Date.now()}`,
    alumniId: data.alumniId,
    candidateName: data.candidateName,
    candidateEmail: data.candidateEmail,
    position: data.position,
    status: 'submitted',
    submittedAt: new Date(),
    bonus: data.bonus
  };

  referrals.set(referral.id, referral);
  profile.referralsMade++;
  profile.lastContactDate = new Date();

  return referral;
}

/**
 * Update referral status
 */
export function updateReferralStatus(
  referralId: string,
  status: AlumniReferral['status']
): AlumniReferral {
  const referral = referrals.get(referralId);
  if (!referral) {
    throw new Error(`Referral not found: ${referralId}`);
  }

  referral.status = status;
  return referral;
}

/**
 * Get alumni engagement report
 */
export function getEngagementReport(): {
  totalAlumni: number;
  activeAlumni: number;
  engagementRate: number;
  topReferrers: Array<{ name: string; referrals: number }>;
  upcomingEvents: AlumniEvent[];
  recentBoomerangs: BoomerangHire[];
} {
  const allAlumni = Array.from(alumni.values());
  const activeAlumni = allAlumni.filter(a => a.networkStatus === 'active');

  // Calculate engagement rate (alumni with recent activity)
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const engaged = activeAlumni.filter(
    a => a.lastContactDate && a.lastContactDate > threeMonthsAgo
  );

  // Top referrers
  const topReferrers = allAlumni
    .filter(a => a.referralsMade > 0)
    .sort((a, b) => b.referralsMade - a.referralsMade)
    .slice(0, 5)
    .map(a => ({ name: a.fullName, referrals: a.referralsMade }));

  // Upcoming events
  const now = new Date();
  const upcomingEvents = Array.from(events.values())
    .filter(e => e.date > now)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 5);

  // Recent boomerangs
  const recentBoomerangs = Array.from(boomerangHires.values())
    .filter(h => h.status === 'completed')
    .sort((a, b) => b.rehireDate.getTime() - a.rehireDate.getTime())
    .slice(0, 5);

  return {
    totalAlumni: allAlumni.length,
    activeAlumni: activeAlumni.length,
    engagementRate: activeAlumni.length > 0 ? (engaged.length / activeAlumni.length) * 100 : 0,
    topReferrers,
    upcomingEvents,
    recentBoomerangs
  };
}

/**
 * Get alumni profile
 */
export function getAlumniProfile(alumniId: string): AlumniProfile | undefined {
  return alumni.get(alumniId);
}

/**
 * List all alumni
 */
export function listAlumni(filters?: {
  networkStatus?: AlumniProfile['networkStatus'];
  eligibleForRehire?: boolean;
}): AlumniProfile[] {
  let results = Array.from(alumni.values());

  if (filters?.networkStatus) {
    results = results.filter(a => a.networkStatus === filters.networkStatus);
  }
  if (filters?.eligibleForRehire !== undefined) {
    results = results.filter(a => a.eligibleForRehire === filters.eligibleForRehire);
  }

  return results;
}
