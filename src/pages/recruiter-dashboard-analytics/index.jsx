import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useRealTimeData } from "../../hooks/useRealTimeData";
import Icon from "../../components/AppIcon";
import Button from "../../components/ui/Button";
import ProfileSection from "../../components/ui/ProfileSection";
import MetricsCards from "./components/MetricsCards";
import QuickActions from "./components/QuickActions";
import ApplicationsChart from "./components/ApplicationsChart";
import CandidatePipeline from "./components/CandidatePipeline";
import JobPerformanceTable from "./components/JobPerformanceTable";
import RecentActivity from "./components/RecentActivity";
import DemographicInsights from "./components/DemographicInsights";
import SourceAttribution from "./components/SourceAttribution";
import PaymentHistory from "./components/PaymentHistory";

const RecruiterDashboardAnalytics = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [showProfile, setShowProfile] = useState(false);
  const { user, userProfile, loading: authLoading } = useAuth();
  const { data: metrics, loading, error, refresh } = useRealTimeData('dashboard');

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading your analytics...</p>
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

  const tabs = [
    { id: "overview", label: "Overview", icon: "BarChart3" },
    { id: "analytics", label: "Analytics", icon: "TrendingUp" },
    { id: "candidates", label: "Candidates", icon: "Users" },
    { id: "jobs", label: "Job Performance", icon: "Briefcase" },
    { id: "billing", label: "Billing", icon: "CreditCard" }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-text-primary">
                  Recruiter Dashboard
                </h1>
                <p className="text-text-secondary mt-1">
                  Track your hiring progress and analytics
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

            <MetricsCards metrics={metrics} />
            
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <ApplicationsChart metrics={metrics} />
                <RecentActivity 
                  activities={metrics?.recentApplications || []} 
                  onRefresh={refresh}
                />
              </div>
              
              <div className="space-y-6">
                <QuickActions onRefresh={refresh} />
                <CandidatePipeline applications={metrics?.applications} />
              </div>
            </div>
          </div>
        );

      case "analytics":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-text-primary">Analytics & Insights</h1>
              <Button
                onClick={refresh}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Icon name="RefreshCw" size={16} />
                <span>Refresh</span>
              </Button>
            </div>
            
            <MetricsCards metrics={metrics} />
            
            <div className="grid lg:grid-cols-2 gap-6">
              <ApplicationsChart metrics={metrics} />
              <DemographicInsights />
            </div>
            
            <SourceAttribution />
          </div>
        );

      case "candidates":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-text-primary">Candidate Pipeline</h1>
              <Button
                onClick={refresh}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Icon name="RefreshCw" size={16} />
                <span>Refresh</span>
              </Button>
            </div>
            
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <RecentActivity 
                  activities={metrics?.recentApplications || []} 
                  onRefresh={refresh}
                  showAll={true}
                />
              </div>
              <div>
                <CandidatePipeline applications={metrics?.applications} />
              </div>
            </div>
          </div>
        );

      case "jobs":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-text-primary">Job Performance</h1>
              <Button
                onClick={refresh}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Icon name="RefreshCw" size={16} />
                <span>Refresh</span>
              </Button>
            </div>
            
            <JobPerformanceTable onRefresh={refresh} />
          </div>
        );

      case "billing":
        return (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-text-primary">Billing & Subscription</h1>
            <PaymentHistory />
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="border-b border-border mb-8">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary' :'border-transparent text-text-secondary hover:text-text-primary hover:border-gray-300'
                }`}
              >
                <Icon name={tab.icon} size={16} />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {renderTabContent()}
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

export default RecruiterDashboardAnalytics;