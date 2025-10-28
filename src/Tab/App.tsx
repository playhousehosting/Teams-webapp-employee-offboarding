import React from "react";
import * as teamsJs from "@microsoft/teams-js";

import "./App.css";

export default function App() {
  const [content, setContent] = React.useState("");
  const [showDemo, setShowDemo] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      teamsJs.app.initialize().then(() => {
        teamsJs.app.getContext().then((context: teamsJs.app.Context) => {
          if (context?.app?.host?.name) {
            setContent(`Your app is running in ${context.app.host.name}`);
          }
        });
      });
    })();
  }, []);

  const demoUsers = [
    {
      id: "1",
      displayName: "Sarah Johnson",
      userPrincipalName: "sarah.johnson@contoso.com",
      jobTitle: "Marketing Manager",
      department: "Marketing",
      accountEnabled: true,
      assignedLicenses: ["Office 365 E3", "Project Plan 1"],
      memberOf: ["Marketing Team", "Project Leads", "Office 365 Users"],
      ownedDevices: ["DESKTOP-ABC123", "iPhone 13"]
    },
    {
      id: "2", 
      displayName: "Michael Chen",
      userPrincipalName: "michael.chen@contoso.com",
      jobTitle: "Software Developer",
      department: "IT",
      accountEnabled: true,
      assignedLicenses: ["Office 365 E5", "Visual Studio"],
      memberOf: ["Developers", "IT Team", "Office 365 Users"],
      ownedDevices: ["LAPTOP-DEF456", "Surface Pro 9"]
    }
  ];

  const [selectedUser, setSelectedUser] = React.useState(null);
  const [offboardingStarted, setOffboardingStarted] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [currentTask, setCurrentTask] = React.useState("");

  const offboardingTasks = [
    "Disabling user account",
    "Revoking all active sessions", 
    "Removing from security groups",
    "Removing from Teams",
    "Removing license assignments",
    "Disabling devices",
    "Preparing data backup",
    "Sending notifications"
  ];

  const startOffboarding = (user: any) => {
    setSelectedUser(user);
    setOffboardingStarted(true);
    setProgress(0);
    
    // Simulate offboarding process
    offboardingTasks.forEach((task, index) => {
      setTimeout(() => {
        setCurrentTask(task);
        setProgress(((index + 1) / offboardingTasks.length) * 100);
      }, (index + 1) * 2000);
    });
  };

  if (!showDemo) {
    return (
      <div className="App" style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ color: '#0078d4', fontSize: '2.5em', marginBottom: '16px' }}>
            🛡️ Employee Offboarding Portal
          </h1>
          <p style={{ fontSize: '1.2em', color: '#605e5c', lineHeight: '1.6' }}>
            Secure and automated employee departure management for Microsoft 365
          </p>
        </div>

        {content && (
          <div style={{ 
            background: '#f3f2f1', 
            padding: '20px', 
            borderRadius: '8px',
            marginBottom: '30px',
            border: '1px solid #e1dfdd'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#323130' }}>Teams Context</h3>
            <pre style={{ margin: 0, color: '#605e5c' }}>
              <code>{content}</code>
            </pre>
          </div>
        )}

        <div style={{ 
          background: 'linear-gradient(135deg, #0078d4, #106ebe)',
          color: 'white',
          padding: '40px',
          borderRadius: '12px',
          marginBottom: '40px',
          textAlign: 'center'
        }}>
          <h2 style={{ margin: '0 0 20px 0' }}>Comprehensive Offboarding Features</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            <div>
              <h4 style={{ margin: '0 0 10px 0' }}>🔒 Access Revocation</h4>
              <p style={{ margin: 0, opacity: 0.9 }}>Immediately disable accounts and revoke all active sessions</p>
            </div>
            <div>
              <h4 style={{ margin: '0 0 10px 0' }}>👥 Group Management</h4>
              <p style={{ margin: 0, opacity: 0.9 }}>Remove from security groups, Teams, and distribution lists</p>
            </div>
            <div>
              <h4 style={{ margin: '0 0 10px 0' }}>📱 Device Control</h4>
              <p style={{ margin: 0, opacity: 0.9 }}>Disable and wipe corporate devices via Intune</p>
            </div>
            <div>
              <h4 style={{ margin: '0 0 10px 0' }}>📊 License Recovery</h4>
              <p style={{ margin: 0, opacity: 0.9 }}>Automatically reclaim and redistribute licenses</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowDemo(true)}
            style={{
              background: 'white',
              color: '#0078d4',
              border: 'none',
              padding: '16px 32px',
              fontSize: '18px',
              fontWeight: 'bold',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'transform 0.2s'
            }}
            onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
          >
            🚀 Launch Interactive Demo
          </button>
        </div>

        <div style={{ 
          background: '#fff4ce',
          border: '1px solid #fde047',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '30px'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#92400e' }}>⚠️ Security & Compliance</h3>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#92400e' }}>
            <li>Azure AD authentication with granular permissions</li>
            <li>Complete audit trail for all offboarding actions</li>
            <li>Role-based access control for admin operations</li>
            <li>Follows Microsoft security best practices</li>
            <li>GDPR and SOX compliance ready</li>
          </ul>
        </div>

        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <p style={{ color: '#605e5c', margin: 0 }}>
            Built with Microsoft Graph API • React & TypeScript • Fluent UI
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="App" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        background: 'white',
        padding: '24px',
        borderRadius: '8px',
        marginBottom: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '32px' }}>👤</span>
          <div>
            <h1 style={{ margin: 0, color: '#323130', fontSize: '24px' }}>Employee Offboarding Portal</h1>
            <p style={{ margin: 0, color: '#605e5c' }}>Secure employee departure management</p>
          </div>
        </div>
        <button
          onClick={() => setShowDemo(false)}
          style={{
            background: '#f3f2f1',
            border: '1px solid #e1dfdd',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          ← Back to Overview
        </button>
      </div>

      {!selectedUser ? (
        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ color: '#323130', marginBottom: '20px' }}>Select Employee for Offboarding</h2>
          
          <div style={{ marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="Search by name, email, or username..."
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e1dfdd',
                borderRadius: '4px',
                fontSize: '16px'
              }}
            />
          </div>

          <div style={{ display: 'grid', gap: '16px' }}>
            {demoUsers.map((user) => (
              <div
                key={user.id}
                style={{
                  border: '1px solid #e1dfdd',
                  borderRadius: '8px',
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s',
                  background: '#fafafa'
                }}
                onClick={() => startOffboarding(user)}
                onMouseOver={(e) => e.target.style.borderColor = '#0078d4'}
                onMouseOut={(e) => e.target.style.borderColor = '#e1dfdd'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: '#0078d4',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '20px',
                    fontWeight: 'bold'
                  }}>
                    {user.displayName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 4px 0', color: '#323130' }}>{user.displayName}</h3>
                    <p style={{ margin: '0 0 4px 0', color: '#605e5c' }}>{user.userPrincipalName}</p>
                    <p style={{ margin: 0, color: '#605e5c', fontSize: '14px' }}>
                      {user.jobTitle} • {user.department}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: '#605e5c', marginBottom: '8px' }}>
                      {user.memberOf.length} groups • {user.assignedLicenses.length} licenses • {user.ownedDevices.length} devices
                    </div>
                    <span style={{
                      background: '#d4edda',
                      color: '#155724',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      Active
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : offboardingStarted ? (
        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ color: '#323130', marginBottom: '20px' }}>
            Offboarding Progress: {selectedUser.displayName}
          </h2>

          <div style={{
            background: '#f3f2f1',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '30px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontWeight: 'bold' }}>Overall Progress</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <div style={{
              background: '#e1dfdd',
              height: '20px',
              borderRadius: '10px',
              overflow: 'hidden'
            }}>
              <div
                style={{
                  background: progress === 100 ? '#107c10' : '#0078d4',
                  height: '100%',
                  width: `${progress}%`,
                  transition: 'width 0.5s ease'
                }}
              />
            </div>
            {currentTask && (
              <p style={{ margin: '10px 0 0 0', color: '#605e5c', fontStyle: 'italic' }}>
                Current: {currentTask}...
              </p>
            )}
          </div>

          <div style={{ display: 'grid', gap: '12px' }}>
            {offboardingTasks.map((task, index) => {
              const isCompleted = (index + 1) / offboardingTasks.length * 100 <= progress;
              const isCurrent = Math.ceil(progress / (100 / offboardingTasks.length)) - 1 === index && progress < 100;
              
              return (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '16px',
                    border: '1px solid #e1dfdd',
                    borderRadius: '6px',
                    background: isCompleted ? '#d4edda' : isCurrent ? '#fff3cd' : '#fafafa'
                  }}
                >
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: isCompleted ? '#28a745' : isCurrent ? '#ffc107' : '#e1dfdd',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {isCompleted ? '✓' : isCurrent ? '●' : index + 1}
                  </div>
                  <span style={{
                    color: isCompleted ? '#155724' : isCurrent ? '#856404' : '#605e5c',
                    fontWeight: isCurrent ? 'bold' : 'normal'
                  }}>
                    {task}
                  </span>
                </div>
              );
            })}
          </div>

          {progress === 100 && (
            <div style={{
              background: '#d4edda',
              border: '1px solid #c3e6cb',
              color: '#155724',
              padding: '20px',
              borderRadius: '8px',
              marginTop: '30px',
              textAlign: 'center'
            }}>
              <h3 style={{ margin: '0 0 10px 0' }}>✅ Offboarding Completed Successfully!</h3>
              <p style={{ margin: 0 }}>
                {selectedUser.displayName} has been securely offboarded. All access has been revoked and audit logs have been generated.
              </p>
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setOffboardingStarted(false);
                  setProgress(0);
                  setCurrentTask('');
                }}
                style={{
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  marginTop: '16px',
                  fontWeight: 'bold'
                }}
              >
                Process Another Employee
              </button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
