import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Icon from 'components/AppIcon';
import dashboardService from '../../../utils/dashboardService';
import { useAuth } from '../../../contexts/AuthContext';

const ApplicationsChart = () => {
  const { user } = useAuth();
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState(30);

  // Load real-time application analytics
  useEffect(() => {
    let isMounted = true;

    const loadAnalytics = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        setError(null);

        const result = await dashboardService.getApplicationAnalytics(user.id, dateRange);
        
        if (result.success && isMounted) {
          // Fill in missing dates with 0 applications
          const endDate = new Date();
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - dateRange);
          
          const dataMap = {};
          result.data?.forEach(item => {
            dataMap[item.date] = item.applications;
          });

          const filledData = [];
          for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toDateString();
            filledData.push({
              date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              applications: dataMap[dateStr] || 0
            });
          }

          setChartData(filledData);
        } else if (result.error && isMounted) {
          setError(result.error);
        }
      } catch (error) {
        if (isMounted) {
          setError('Failed to load application analytics');
          console.log('Error loading analytics:', error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadAnalytics();

    // Set up real-time subscription
    const subscriptions = dashboardService.subscribeToMetrics(user?.id, 'recruiter', () => {
      if (isMounted) {
        loadAnalytics();
      }
    });

    return () => {
      isMounted = false;
      subscriptions.forEach(sub => sub?.unsubscribe?.());
    };
  }, [user, dateRange]);

  if (error) {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-text-primary">Applications Overview</h3>
        </div>
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Icon name="AlertCircle" size={24} color="#EF4444" />
          </div>
          <h4 className="text-lg font-medium text-text-primary mb-2">Unable to Load Analytics</h4>
          <p className="text-text-secondary mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-text-primary">Applications Overview</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setDateRange(7)}
            className={`px-3 py-1 text-sm rounded-md transition-smooth ${
              dateRange === 7 
                ? 'bg-primary text-white' :'bg-surface-100 text-text-secondary hover:text-text-primary'
            }`}
          >
            7d
          </button>
          <button
            onClick={() => setDateRange(30)}
            className={`px-3 py-1 text-sm rounded-md transition-smooth ${
              dateRange === 30 
                ? 'bg-primary text-white' :'bg-surface-100 text-text-secondary hover:text-text-primary'
            }`}
          >
            30d
          </button>
          <button
            onClick={() => setDateRange(90)}
            className={`px-3 py-1 text-sm rounded-md transition-smooth ${
              dateRange === 90 
                ? 'bg-primary text-white' :'bg-surface-100 text-text-secondary hover:text-text-primary'
            }`}
          >
            90d
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-pulse">
            <div className="h-4 bg-secondary-200 rounded w-48 mb-4"></div>
            <div className="space-y-2">
              {[...Array(8)].map((_, index) => (
                <div key={index} className="h-3 bg-secondary-200 rounded w-full"></div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="date" 
                stroke="#6B7280"
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                stroke="#6B7280"
                fontSize={12}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                labelStyle={{ color: '#374151' }}
              />
              <Line
                type="monotone"
                dataKey="applications"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      
      <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-sm text-text-secondary">
        <span>
          Total applications: {chartData.reduce((sum, item) => sum + item.applications, 0)}
        </span>
        <span>
          Last {dateRange} days
        </span>
      </div>
    </div>
  );
};

export default ApplicationsChart;