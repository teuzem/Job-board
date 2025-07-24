import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";

import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";

const QuickActions = ({ onRefresh }) => {
  const [loading, setLoading] = useState({});
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleQuickAction = async (actionType, data = {}) => {
    setLoading(prev => ({ ...prev, [actionType]: true }));
    
    try {
      let result;
      
      switch (actionType) {
        case 'post_job': navigate('/job-posting-creation-management');
          return;
          
        case 'manage_company': navigate('/company-registration-profile-setup');
          return;
          
        case 'view_analytics':
          // Stay on current page, just refresh data
          if (onRefresh) {
            await onRefresh();
          }
          break;
          
        default:
          break;
      }
      
      if (result && !result.success) {
        console.log('Quick action error:', result.error);
      }
    } catch (error) {
      console.log('Quick action failed:', error);
    } finally {
      setLoading(prev => ({ ...prev, [actionType]: false }));
    }
  };

  const quickActions = [
    {
      id: 'post_job',
      title: 'Post New Job',
      description: 'Create and publish a new job posting',
      icon: 'Plus',
      color: 'primary',
      action: () => handleQuickAction('post_job')
    },
    {
      id: 'manage_company',
      title: 'Company Profile',
      description: 'Update company information and branding',
      icon: 'Building2',
      color: 'success',
      action: () => handleQuickAction('manage_company')
    },
    {
      id: 'view_analytics',
      title: 'Refresh Data',
      description: 'Get the latest analytics and metrics',
      icon: 'RefreshCw',
      color: 'info',
      action: () => handleQuickAction('view_analytics')
    }
  ];

  return (
    <div className="bg-background rounded-lg shadow-soft border border-border p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Icon name="Zap" size={20} color="#2563EB" />
        <h3 className="text-lg font-semibold text-text-primary">Quick Actions</h3>
      </div>
      
      <div className="space-y-3">
        {quickActions.map((action) => (
          <button
            key={action.id}
            onClick={action.action}
            disabled={loading[action.id]}
            className="w-full flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-surface transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              action.color === 'primary' ? 'bg-primary-50' :
              action.color === 'success' ? 'bg-success-50' :
              action.color === 'info' ? 'bg-info-50' : 'bg-gray-50'
            }`}>
              {loading[action.id] ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Icon 
                  name={action.icon} 
                  size={18} 
                  color={
                    action.color === 'primary' ? '#2563EB' :
                    action.color === 'success' ? '#16A34A' :
                    action.color === 'info' ? '#0EA5E9' : '#64748B'
                  } 
                />
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium text-text-primary text-sm">{action.title}</p>
              <p className="text-xs text-text-secondary">{action.description}</p>
            </div>
            <Icon name="ChevronRight" size={16} color="#64748B" />
          </button>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-border">
        <Button
          onClick={() => navigate('/job-search-browse')}
          variant="outline"
          className="w-full flex items-center justify-center space-x-2"
        >
          <Icon name="Search" size={16} />
          <span>Browse All Jobs</span>
        </Button>
      </div>
    </div>
  );
};

export default QuickActions;