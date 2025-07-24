import React from "react";
import Icon from "../../../components/AppIcon";

const DashboardMetrics = ({ metrics }) => {
  if (!metrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
      title: "Total Applications",
      value: metrics.applications?.total || 0,
      icon: "FileText",
      color: "primary",
      bgColor: "bg-primary-50",
      iconColor: "#2563EB",
      trend: `${metrics.applications?.pending || 0} pending`
    },
    {
      title: "Interview Invites",
      value: metrics.applications?.interviewing || 0,
      icon: "Calendar",
      color: "success",
      bgColor: "bg-success-50",
      iconColor: "#16A34A",
      trend: `${metrics.applications?.offered || 0} offers received`
    },
    {
      title: "Saved Jobs",
      value: metrics.savedJobs || 0,
      icon: "Bookmark",
      color: "warning",
      bgColor: "bg-warning-50",
      iconColor: "#D97706",
      trend: "Ready to apply"
    },
    {
      title: "Profile Completion",
      value: `${metrics.profileCompletion || 0}%`,
      icon: "User",
      color: "info",
      bgColor: "bg-info-50",
      iconColor: "#0EA5E9",
      trend: metrics.profileCompletion === 100 ? "Complete!" : "Improve visibility"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metricCards.map((metric, index) => (
        <div
          key={index}
          className="bg-background rounded-lg shadow-soft border border-border p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 ${metric.bgColor} rounded-lg flex items-center justify-center`}>
              <Icon name={metric.icon} size={24} color={metric.iconColor} />
            </div>
            {metric.title === "Profile Completion" && (
              <div className="w-8 h-8">
                <div className="w-full h-full rounded-full border-2 border-gray-200 relative">
                  <div 
                    className="absolute inset-0 rounded-full border-2 border-info-500 transform -rotate-90 origin-center"
                    style={{
                      clipPath: `polygon(50% 0%, 50% 50%, ${
                        50 + 50 * Math.cos((metrics.profileCompletion / 100) * 2 * Math.PI - Math.PI / 2)
                      }% ${
                        50 + 50 * Math.sin((metrics.profileCompletion / 100) * 2 * Math.PI - Math.PI / 2)
                      }%, 50% 50%)`
                    }}
                  />
                </div>
              </div>
            )}
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

export default DashboardMetrics;