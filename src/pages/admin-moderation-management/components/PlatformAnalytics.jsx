// src/pages/admin-moderation-management/components/PlatformAnalytics.jsx
import React from "react";
import Icon from "../../../components/AppIcon";

const PlatformAnalytics = ({ metrics }) => {
  if (!metrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-background rounded-lg shadow-soft border border-border p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  const platformMetrics = [
    {
      title: "Total Users",
      value: metrics.users?.total || 0,
      icon: "Users",
      color: "primary",
      bgColor: "bg-primary-50",
      iconColor: "#2563EB",
      details: [
        { label: "Job Seekers", value: metrics.users?.jobSeekers || 0 },
        { label: "Recruiters", value: metrics.users?.recruiters || 0 },
        { label: "Admins", value: metrics.users?.admins || 0 }
      ]
    },
    {
      title: "Active Jobs",
      value: metrics.jobs?.active || 0,
      icon: "Briefcase",
      color: "success",
      bgColor: "bg-success-50",
      iconColor: "#16A34A",
      details: [
        { label: "Active", value: metrics.jobs?.active || 0 },
        { label: "Draft", value: metrics.jobs?.draft || 0 },
        { label: "Closed", value: metrics.jobs?.closed || 0 }
      ]
    },
    {
      title: "Companies",
      value: metrics.companies?.total || 0,
      icon: "Building2",
      color: "warning",
      bgColor: "bg-warning-50",
      iconColor: "#D97706",
      details: [
        { label: "Free", value: metrics.companies?.free || 0 },
        { label: "Premium", value: metrics.companies?.premium || 0 },
        { label: "Enterprise", value: metrics.companies?.enterprise || 0 }
      ]
    },
    {
      title: "Applications",
      value: metrics.applications?.total || 0,
      icon: "FileText",
      color: "info",
      bgColor: "bg-info-50",
      iconColor: "#0EA5E9",
      details: [
        { label: "Pending", value: metrics.applications?.pending || 0 },
        { label: "Reviewing", value: metrics.applications?.reviewing || 0 },
        { label: "Interview", value: metrics.applications?.interview || 0 }
      ]
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {platformMetrics.map((metric, index) => (
        <div
          key={index}
          className="bg-background rounded-lg shadow-soft border border-border p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 ${metric.bgColor} rounded-lg flex items-center justify-center`}>
              <Icon name={metric.icon} size={24} color={metric.iconColor} />
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-text-primary">
                {metric.value}
              </p>
              <p className="text-sm text-text-secondary">
                {metric.title}
              </p>
            </div>
          </div>
          
          <div className="space-y-1">
            {metric.details.map((detail, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <span className="text-text-tertiary">{detail.label}</span>
                <span className="text-text-secondary font-medium">{detail.value}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PlatformAnalytics;