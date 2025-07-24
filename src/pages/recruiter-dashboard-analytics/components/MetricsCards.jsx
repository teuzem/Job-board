import React from "react";
import Icon from "../../../components/AppIcon";

const MetricsCards = ({ metrics }) => {
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

  const metricCards = [
    {
      title: "Active Jobs",
      value: metrics.jobs?.active || 0,
      icon: "Briefcase",
      color: "primary",
      bgColor: "bg-primary-50",
      iconColor: "#2563EB",
      trend: `${metrics.jobs?.total || 0} total jobs`,
      change: metrics.jobs?.draft ? `${metrics.jobs.draft} drafts` : null
    },
    {
      title: "Total Applications",
      value: metrics.applications?.total || 0,
      icon: "FileText",
      color: "success",
      bgColor: "bg-success-50",
      iconColor: "#16A34A",
      trend: `${metrics.applications?.pending || 0} pending review`,
      change: metrics.applications?.interview ? `${metrics.applications.interview} interviews` : null
    },
    {
      title: "Profile Views",
      value: metrics.totalViews || 0,
      icon: "Eye",
      color: "warning",
      bgColor: "bg-warning-50",
      iconColor: "#D97706",
      trend: "Job post views",
      change: "This month"
    },
    {
      title: "Companies",
      value: metrics.companies || 0,
      icon: "Building2",
      color: "info",
      bgColor: "bg-info-50",
      iconColor: "#0EA5E9",
      trend: "Active companies",
      change: "Under management"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metricCards.map((metric, index) => (
        <div
          key={index}
          className="bg-background rounded-lg shadow-soft border border-border p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 ${metric.bgColor} rounded-lg flex items-center justify-center`}>
              <Icon name={metric.icon} size={24} color={metric.iconColor} />
            </div>
            <div className="flex items-center space-x-1">
              {metric.change && (
                <span className="text-xs text-success-600 bg-success-50 px-2 py-1 rounded-full">
                  {metric.change}
                </span>
              )}
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-text-secondary mb-1">
              {metric.title}
            </h3>
            <p className="text-2xl font-bold text-text-primary mb-1">
              {metric.value}
            </p>
            <p className="text-xs text-text-tertiary">
              {metric.trend}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MetricsCards;