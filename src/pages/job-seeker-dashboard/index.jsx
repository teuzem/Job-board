import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useRealTimeData } from "../../hooks/useRealTimeData";
import Icon from "../../components/AppIcon";
import Button from "../../components/ui/Button";
import ProfileSection from "../../components/ui/ProfileSection";
import DashboardSidebar from "./components/DashboardSidebar";
import MobileNavigation from "./components/MobileNavigation";
import DashboardMetrics from "./components/DashboardMetrics";
import ApplicationTracker from "./components/ApplicationTracker";
import SavedJobs from "./components/SavedJobs";
import JobAlerts from "./components/JobAlerts";
import ProfileCompletion from "./components/ProfileCompletion";
import RecentActivity from "./components/RecentActivity";

const JobSeekerDashboard = () => {
  const [activeSection, setActiveSection] = useState("overview");
  const [showProfile, setShowProfile] = useState(false);
  const { user, userProfile, loading: authLoading } = useAuth();
  const { data: metrics, loading, error, refresh } = useRealTimeData('dashboard');

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading your dashboard...</p>
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-2">Authentication Required</h2>
          <p className="text-text-secondary mb-4">Please sign in to access your dashboard.</p>
          <Button onClick={() => window.location.href = '/job-seeker-registration-login'}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-text-primary">
                  Welcome back, {userProfile?.full_name?.split(' ')[0] || 'there'}! 👋
                </h1>
                <p className="text-text-secondary mt-1">
                  Here's what's happening with your job search
                </p>
              </div>
              <Button
                onClick={() => setShowProfile(true)}
                variant="outline"
                className="hidden sm:flex items-center space-x-2"
              >
                <Icon name="User" size={16} />
                <span>View Profile</span>
              </Button>
            </div>

            <DashboardMetrics metrics={metrics} />
            
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <ApplicationTracker 
                  applications={metrics?.recentApplications || []} 
                  onRefresh={refresh}
                />
                <RecentActivity userId={user?.id} />
              </div>
              
              <div className="space-y-6">
                <ProfileCompletion 
                  completion={metrics?.profileCompletion || 0}
                  onEditProfile={() => setShowProfile(true)}
                />
                <JobAlerts />
              </div>
            </div>
          </div>
        );
      
      case "applications":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-text-primary">My Applications</h1>
              <Button
                onClick={refresh}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Icon name="RefreshCw" size={16} />
                <span>Refresh</span>
              </Button>
            </div>
            <ApplicationTracker 
              applications={metrics?.recentApplications || []} 
              onRefresh={refresh}
              showAll={true}
            />
          </div>
        );
      
      case "saved":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-text-primary">Saved Jobs</h1>
              <Button
                onClick={refresh}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Icon name="RefreshCw" size={16} />
                <span>Refresh</span>
              </Button>
            </div>
            <SavedJobs userId={user?.id} />
          </div>
        );
      
      case "profile":
        return (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-text-primary">Profile Settings</h1>
            <div className="bg-background rounded-lg shadow-soft border border-border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-text-primary">Personal Information</h3>
                  <p className="text-text-secondary">Manage your profile details and preferences</p>
                </div>
                <Button 
                  onClick={() => setShowProfile(true)}
                  className="flex items-center space-x-2"
                >
                  <Icon name="Edit2" size={16} />
                  <span>Edit Profile</span>
                </Button>
              </div>
            </div>
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
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Layout */}
      <div className="hidden lg:flex">
        <DashboardSidebar 
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
        <main className="flex-1 p-8">
          {renderContent()}
        </main>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden">
        <div className="p-4">
          {renderContent()}
        </div>
        <MobileNavigation
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
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

export default JobSeekerDashboard;