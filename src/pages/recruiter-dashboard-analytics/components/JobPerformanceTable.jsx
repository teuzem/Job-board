import React, { useState, useEffect } from 'react';
import Icon from 'components/AppIcon';
import dashboardService from '../../../utils/dashboardService';
import { useAuth } from '../../../contexts/AuthContext';

const JobPerformanceTable = () => {
  const { user } = useAuth();
  const [sortField, setSortField] = useState('views_count');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filter, setFilter] = useState('all');
  const [jobsData, setJobsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load real-time job performance data
  useEffect(() => {
    let isMounted = true;

    const loadJobPerformance = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        setError(null);

        const result = await dashboardService.getJobPerformance(user.id);
        
        if (result.success && isMounted) {
          setJobsData(result.data || []);
        } else if (result.error && isMounted) {
          setError(result.error);
        }
      } catch (error) {
        if (isMounted) {
          setError('Failed to load job performance data');
          console.log('Error loading job performance:', error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadJobPerformance();

    // Set up real-time subscription
    const subscriptions = dashboardService.subscribeToMetrics(user?.id, 'recruiter', () => {
      if (isMounted) {
        loadJobPerformance();
      }
    });

    return () => {
      isMounted = false;
      subscriptions.forEach(sub => sub?.unsubscribe?.());
    };
  }, [user]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredJobs = filter === 'all' 
    ? jobsData 
    : jobsData.filter(job => job.status === filter);

  const sortedJobs = [...filteredJobs].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    // Handle string fields
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-success-50 text-success-600';
      case 'expired': case'closed':
        return 'bg-error-50 text-error-600';
      case 'draft':
        return 'bg-secondary-100 text-secondary-600';
      default:
        return 'bg-secondary-100 text-secondary-600';
    }
  };

  if (loading) {
    return (
      <div className="card overflow-hidden">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-secondary-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="h-4 bg-secondary-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card overflow-hidden">
        <div className="p-6 text-center">
          <div className="w-12 h-12 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Icon name="AlertCircle" size={24} color="#EF4444" />
          </div>
          <h3 className="text-lg font-medium text-text-primary mb-2">Unable to Load Job Performance</h3>
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
    <div className="card overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 px-6 pt-6">
        <h3 className="text-lg font-medium text-text-primary mb-3 sm:mb-0">Job Performance</h3>
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
          <div className="relative">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="input-field py-1.5 pl-3 pr-10 text-sm"
            >
              <option value="all">All Jobs</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="draft">Draft</option>
              <option value="closed">Closed</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <Icon name="ChevronDown" size={16} className="text-text-secondary" />
            </div>
          </div>
          <div className="relative flex-1 sm:flex-none">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icon name="Search" size={16} className="text-text-secondary" />
            </div>
            <input
              type="text"
              placeholder="Search jobs..."
              className="input-field py-1.5 pl-10 pr-4 text-sm w-full"
            />
          </div>
        </div>
      </div>
      
      {sortedJobs.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="Briefcase" size={32} color="#64748B" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">No jobs found</h3>
          <p className="text-text-secondary mb-4">You have not posted any jobs yet or no jobs match the current filter.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-surface-100">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Job Title
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Status
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('views_count')}
                  >
                    <div className="flex items-center">
                      <span>Views</span>
                      {sortField === 'views_count' && (
                        <Icon 
                          name={sortDirection === 'asc' ? 'ChevronUp' : 'ChevronDown'} 
                          size={16} 
                          className="ml-1" 
                        />
                      )}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('applications_count')}
                  >
                    <div className="flex items-center">
                      <span>Applications</span>
                      {sortField === 'applications_count' && (
                        <Icon 
                          name={sortDirection === 'asc' ? 'ChevronUp' : 'ChevronDown'} 
                          size={16} 
                          className="ml-1" 
                        />
                      )}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('conversionRate')}
                  >
                    <div className="flex items-center">
                      <span>Conversion</span>
                      {sortField === 'conversionRate' && (
                        <Icon 
                          name={sortDirection === 'asc' ? 'ChevronUp' : 'ChevronDown'} 
                          size={16} 
                          className="ml-1" 
                        />
                      )}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('costPerApplication')}
                  >
                    <div className="flex items-center">
                      <span>Cost/App</span>
                      {sortField === 'costPerApplication' && (
                        <Icon 
                          name={sortDirection === 'asc' ? 'ChevronUp' : 'ChevronDown'} 
                          size={16} 
                          className="ml-1" 
                        />
                      )}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Expires
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-background divide-y divide-border">
                {sortedJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-surface-50 transition-smooth">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-text-primary">{job.title}</div>
                      <div className="text-xs text-text-secondary">
                        {job.companies?.name || 'Unknown Company'} • {job.location}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                        {job.status?.charAt(0).toUpperCase() + job.status?.slice(1) || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                      {(job.views_count || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                      {job.applications_count || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                      {(job.conversionRate || 0).toFixed(2)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                      ${(job.costPerApplication || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                      {job.expires_date ? formatDate(job.expires_date) : 'No expiry'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button className="text-text-secondary hover:text-primary transition-smooth">
                          <Icon name="Eye" size={16} />
                        </button>
                        <button className="text-text-secondary hover:text-primary transition-smooth">
                          <Icon name="Edit" size={16} />
                        </button>
                        <button className="text-text-secondary hover:text-error transition-smooth">
                          <Icon name="Trash2" size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 flex items-center justify-between border-t border-border">
            <div className="text-sm text-text-secondary">
              Showing <span className="font-medium">{sortedJobs.length}</span> of <span className="font-medium">{jobsData.length}</span> jobs
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-1 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-100 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed">
                <Icon name="ChevronLeft" size={20} />
              </button>
              <button className="p-1 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-100 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed">
                <Icon name="ChevronRight" size={20} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default JobPerformanceTable;