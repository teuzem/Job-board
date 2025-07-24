import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useRealTimeData } from "../../hooks/useRealTimeData";
import Icon from "../../components/AppIcon";
import Button from "../../components/ui/Button";
import ProfileSection from "../../components/ui/ProfileSection";
import PlatformAnalytics from "./components/PlatformAnalytics";
import UserManagementSection from "./components/UserManagementSection";
import ContentModerationPanel from "./components/ContentModerationPanel";
import SystemMonitoring from "./components/SystemMonitoring";
import ConfigurationPanels from "./components/ConfigurationPanels";
import AuditTrail from "./components/AuditTrail";
import ModerationQueue from "./components/ModerationQueue";

const AdminModerationManagement = () => {
  const [activeSection, setActiveSection] = useState("overview");
  const [showProfile, setShowProfile] = useState(false);
  const { user, userProfile, loading: authLoading } = useAuth();
  const { data: metrics, loading, error, refresh } = useRealTimeData('dashboard');

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="AlertCircle" size={32} color="#DC2626" />
          </div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">Unable to Load Dashboard</h2>
          <p className="text-text-secondary mb-4">{error}</p>
          <Button onClick={refresh} className="flex items-center space-x-2 mx-auto">
            <Icon name="RefreshCw" size={16} />
            <span>Try Again</span>
          </Button>
        </div>
      </div>
    );
  }

  if (!user || userProfile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-warning-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="Shield" size={32} color="#D97706" />
          </div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">Access Restricted</h2>
          <p className="text-text-secondary mb-4">
            {!user ? 'Please sign in to access the admin dashboard.' : 'You need admin privileges to access this area.'}
          </p>
          <Button onClick={() => window.location.href = '/job-seeker-registration-login'}>
            {!user ? 'Sign In' : 'Go Back'}
          </Button>
        </div>
      </div>
    );
  }

  const sidebarSections = [
    { id: "overview", label: "Overview", icon: "BarChart3" },
    { id: "users", label: "User Management", icon: "Users" },
    { id: "moderation", label: "Content Moderation", icon: "Shield" },
    { id: "system", label: "System Monitoring", icon: "Activity" },
    { id: "configuration", label: "Configuration", icon: "Settings" },
    { id: "audit", label: "Audit Trail", icon: "FileText" }
  ];

  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-text-primary">
                  Admin Dashboard
                </h1>
                <p className="text-text-secondary mt-1">
                  Platform overview and system management
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  onClick={() => setShowProfile(true)}
                  variant="outline"
                  className="hidden sm:flex items-center space-x-2"
                >
                  <Icon name="User" size={16} />
                  <span>Profile</span>
                </Button>
                <Button
                  onClick={refresh}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <Icon name="RefreshCw" size={16} />
                  <span>Refresh</span>
                </Button>
              </div>
            </div>

            <PlatformAnalytics metrics={metrics} />
            
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <SystemMonitoring />
                <ModerationQueue />
              </div>
              
              <div className="space-y-6">
                <div className="bg-background rounded-lg shadow-soft border border-border p-6">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <Button 
                      onClick={() => setActiveSection('users')}
                      variant="outline" 
                      className="w-full justify-start"
                    >
                      <Icon name="Users" size={16} />
                      <span>Manage Users</span>
                    </Button>
                    <Button 
                      onClick={() => setActiveSection('moderation')}
                      variant="outline" 
                      className="w-full justify-start"
                    >
                      <Icon name="Shield" size={16} />
                      <span>Content Review</span>
                    </Button>
                    <Button 
                      onClick={() => setActiveSection('system')}
                      variant="outline" 
                      className="w-full justify-start"
                    >
                      <Icon name="Activity" size={16} />
                      <span>System Status</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "users":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-text-primary">User Management</h1>
              <Button
                onClick={refresh}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Icon name="RefreshCw" size={16} />
                <span>Refresh</span>
              </Button>
            </div>
            <UserManagementSection metrics={metrics} onRefresh={refresh} />
          </div>
        );

      case "moderation":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-text-primary">Content Moderation</h1>
              <Button
                onClick={refresh}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Icon name="RefreshCw" size={16} />
                <span>Refresh</span>
              </Button>
            </div>
            <ContentModerationPanel onRefresh={refresh} />
          </div>
        );

      case "system":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-text-primary">System Monitoring</h1>
              <Button
                onClick={refresh}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Icon name="RefreshCw" size={16} />
                <span>Refresh</span>
              </Button>
            </div>
            <SystemMonitoring showAll={true} />
          </div>
        );

      case "configuration":
        return (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-text-primary">Platform Configuration</h1>
            <ConfigurationPanels />
          </div>
        );

      case "audit":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-text-primary">Audit Trail</h1>
              <Button
                onClick={refresh}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Icon name="RefreshCw" size={16} />
                <span>Refresh</span>
              </Button>
            </div>
            <AuditTrail />
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <Icon name="Construction" size={48} color="#64748B" className="mx-auto mb-4" />
            <h3 className="text-lg font-medium text-text-primary mb-2">Coming Soon</h3>
            <p className="text-text-secondary">This section is under development</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-background border-r border-border pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <Icon name="Shield" size={24} color="#2563EB" />
            <span className="ml-2 text-lg font-semibold text-text-primary">Admin Panel</span>
          </div>
          <div className="mt-8 flex-grow flex flex-col">
            <nav className="flex-1 px-2 space-y-1">
              {sidebarSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-left transition-colors ${
                    activeSection === section.id
                      ? 'bg-primary-50 text-primary-600' :'text-text-secondary hover:bg-surface hover:text-text-primary'
                  }`}
                >
                  <Icon 
                    name={section.icon} 
                    size={16} 
                    color={activeSection === section.id ? '#2563EB' : '#64748B'} 
                  />
                  <span className="ml-3">{section.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {renderContent()}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile menu */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border">
        <div className="grid grid-cols-3 gap-1 p-2">
          {sidebarSections.slice(0, 3).map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex flex-col items-center justify-center py-2 px-1 text-xs font-medium rounded-md transition-colors ${
                activeSection === section.id
                  ? 'bg-primary-50 text-primary-600' :'text-text-secondary hover:bg-surface hover:text-text-primary'
              }`}
            >
              <Icon 
                name={section.icon} 
                size={16} 
                color={activeSection === section.id ? '#2563EB' : '#64748B'} 
              />
              <span className="mt-1">{section.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Profile Modal */}
      {showProfile && (
        <ProfileSection 
          onClose={() => setShowProfile(false)}
        />
      )}
    </div>
  );
};

export default AdminModerationManagement;