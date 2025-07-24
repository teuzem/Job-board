import { useState, useEffect, useCallback } from 'react';
        import { useAuth } from '../contexts/AuthContext';
        import dashboardService from '../utils/dashboardService';

        export const useRealTimeData = (dataType = 'dashboard') => {
          const [data, setData] = useState(null);
          const [loading, setLoading] = useState(true);
          const [error, setError] = useState(null);
          const { user, userProfile } = useAuth();

          const refreshData = useCallback(async () => {
            if (!user || !userProfile) return;

            try {
              setLoading(true);
              setError(null);
              
              let result;
              
              if (dataType === 'dashboard') {
                if (userProfile.role === 'job_seeker') {
                  result = await dashboardService.getJobSeekerMetrics(user.id);
                } else if (userProfile.role === 'recruiter') {
                  result = await dashboardService.getRecruiterMetrics(user.id);
                } else if (userProfile.role === 'admin') {
                  result = await dashboardService.getAdminMetrics();
                }
              } else if (dataType === 'activity') {
                result = await dashboardService.getRecentActivity(user.id, userProfile.role);
              }

              if (result?.success) {
                setData(result.data);
              } else {
                setError(result?.error || 'Failed to load data');
              }
            } catch (err) {
              setError('Failed to load data');
              console.log('Real-time data error:', err);
            } finally {
              setLoading(false);
            }
          }, [user, userProfile, dataType]);

          useEffect(() => {
            if (!user || !userProfile) {
              setLoading(false);
              return;
            }

            // Initial data load
            refreshData();

            // Set up real-time subscription
            const subscription = dashboardService.subscribeToDashboardUpdates(
              user.id,
              userProfile.role,
              (payload) => {
                console.log('Real-time update received:', payload);
                // Refresh data when changes occur
                refreshData();
              }
            );

            return () => {
              if (subscription) {
                dashboardService.unsubscribeFromUpdates(subscription);
              }
            };
          }, [user, userProfile, refreshData]);

          return { data, loading, error, refresh: refreshData };
        };

        export default useRealTimeData;