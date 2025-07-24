import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Icon from 'components/AppIcon';
import Breadcrumb from 'components/ui/Breadcrumb';
import SearchFilters from './components/SearchFilters';
import JobCard from './components/JobCard';
import AdvancedSearchModal from './components/AdvancedSearchModal';
import JobPreviewPanel from './components/JobPreviewPanel';
import jobService from '../../utils/jobService';
import { useAuth } from '../../contexts/AuthContext';

const JobSearchBrowse = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    location: [],
    employmentType: [],
    salaryRange: '',
    companySize: '',
    postingDate: '',
    experienceLevel: '',
    remoteWork: false
  });
  const [sortBy, setSortBy] = useState('relevance');
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [savedJobs, setSavedJobs] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [recentSearches] = useState(['React Developer', 'Product Manager', 'UX Designer']);
  const [searchSuggestions] = useState(['Frontend Developer', 'Backend Engineer', 'Full Stack Developer', 'DevOps Engineer']);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState(null);
  
  // Real-time data states
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [displayedJobs, setDisplayedJobs] = useState([]);
  const [jobsCount, setJobsCount] = useState(0);
  
  const searchInputRef = useRef(null);
  const observerRef = useRef(null);
  const subscriptionRef = useRef(null);

  // Load jobs from Supabase with real-time updates
  useEffect(() => {
    let isMounted = true;

    const loadJobs = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const filters = {
          search: searchQuery,
          location: selectedFilters.location,
          employmentType: selectedFilters.employmentType.map(type => type.toLowerCase().replace(/[-\s]/g, '_')),
          experienceLevel: selectedFilters.experienceLevel?.toLowerCase().replace(/[-\s]/g, '_'),
          remoteWork: selectedFilters.remoteWork,
          postingDate: selectedFilters.postingDate,
          salaryMin: selectedFilters.salaryMin,
          salaryMax: selectedFilters.salaryMax
        };

        const result = await jobService.getJobs(filters);
        
        if (result.success && isMounted) {
          let sortedJobs = [...result.data];
          
          // Apply sorting
          sortedJobs.sort((a, b) => {
            switch (sortBy) {
              case 'date':
                return new Date(b.posted_date) - new Date(a.posted_date);
              case 'salary':
                const aSalary = a.salary_max || 0;
                const bSalary = b.salary_max || 0;
                return bSalary - aSalary;
              case 'relevance':
              default:
                // Featured jobs first, then by date
                if (a.featured && !b.featured) return -1;
                if (!a.featured && b.featured) return 1;
                return new Date(b.posted_date) - new Date(a.posted_date);
            }
          });
          
          setJobs(result.data);
          setFilteredJobs(sortedJobs);
          setDisplayedJobs(sortedJobs.slice(0, 6));
          setJobsCount(sortedJobs.length);
          setCurrentPage(1);
          setHasMore(sortedJobs.length > 6);
        } else if (result.error && isMounted) {
          setError(result.error);
        }
      } catch (error) {
        if (isMounted) {
          setError('Failed to load jobs. Please try again.');
          console.log('Error loading jobs:', error);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadJobs();

    // Set up real-time subscription
    subscriptionRef.current = jobService.subscribeToJobs((payload) => {
      if (isMounted) {
        loadJobs(); // Reload jobs when changes occur
      }
    });

    return () => {
      isMounted = false;
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [searchQuery, selectedFilters, sortBy]);

  // Load saved jobs for authenticated user
  useEffect(() => {
    let isMounted = true;

    const loadSavedJobs = async () => {
      if (!user?.id) return;

      try {
        const result = await jobService.getSavedJobs(user.id);
        if (result.success && isMounted) {
          const savedJobIds = new Set(result.data.map(item => item.job_id));
          setSavedJobs(savedJobIds);
        }
      } catch (error) {
        console.log('Error loading saved jobs:', error);
      }
    };

    loadSavedJobs();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMoreJobs();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading]);

  const loadMoreJobs = () => {
    if (isLoading) return;

    setIsLoading(true);
    setTimeout(() => {
      const nextPage = currentPage + 1;
      const startIndex = (nextPage - 1) * 6;
      const endIndex = startIndex + 6;
      const newJobs = filteredJobs.slice(startIndex, endIndex);

      if (newJobs.length > 0) {
        setDisplayedJobs(prev => [...prev, ...newJobs]);
        setCurrentPage(nextPage);
      }

      if (endIndex >= filteredJobs.length) {
        setHasMore(false);
      }

      setIsLoading(false);
    }, 1000);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
  };

  const handleSaveJob = async (jobId) => {
    if (!user?.id) {
      setError('Please sign in to save jobs');
      return;
    }

    try {
      const result = await jobService.toggleSaveJob(jobId, user.id);
      
      if (result.success) {
        setSavedJobs(prev => {
          const newSaved = new Set(prev);
          if (result.saved) {
            newSaved.add(jobId);
          } else {
            newSaved.delete(jobId);
          }
          return newSaved;
        });
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to save job. Please try again.');
      console.log('Error saving job:', error);
    }
  };

  const handleFilterChange = (filterType, value) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (selectedFilters.location.length > 0) count++;
    if (selectedFilters.employmentType.length > 0) count++;
    if (selectedFilters.salaryRange) count++;
    if (selectedFilters.companySize) count++;
    if (selectedFilters.postingDate) count++;
    if (selectedFilters.experienceLevel) count++;
    if (selectedFilters.remoteWork) count++;
    return count;
  };

  const clearAllFilters = () => {
    setSelectedFilters({
      location: [],
      employmentType: [],
      salaryRange: '',
      companySize: '',
      postingDate: '',
      experienceLevel: '',
      remoteWork: false
    });
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  // Convert database format to display format
  const formatJobData = (job) => {
    if (!job) return null;
    
    return {
      ...job,
      company: job.companies?.name || 'Unknown Company',
      logo: job.companies?.logo_url || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=64&h=64&fit=crop&crop=center',
      employmentType: job.employment_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown',
      experienceLevel: job.experience_level?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown',
      salaryRange: job.salary_min && job.salary_max 
        ? `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`
        : 'Salary not specified',
      postedDate: new Date(job.posted_date)
    };
  };

  // Error display component
  if (error) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="AlertCircle" size={32} color="#EF4444" />
          </div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">Unable to Load Jobs</h2>
          <p className="text-text-secondary mb-4 max-w-md">{error}</p>
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
    <div className="min-h-screen bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumb />
        
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">Find Your Next Opportunity</h1>
          <p className="text-text-secondary">Discover jobs from top companies in your field</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <form onSubmit={handleSearchSubmit} className="relative">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Icon name="Search" size={20} color="#64748B" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(e.target.value.length > 0);
                }}
                onFocus={() => setShowSuggestions(searchQuery.length > 0)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Search jobs, companies, or skills..."
                className="w-full pl-12 pr-12 py-4 text-lg border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-smooth bg-background shadow-soft"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setShowSuggestions(false);
                  }}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                >
                  <Icon name="X" size={20} color="#64748B" />
                </button>
              )}
            </div>

            {/* Search Suggestions */}
            {showSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-modal z-50">
                {searchQuery && (
                  <div className="p-4 border-b border-border-light">
                    <h4 className="text-sm font-medium text-text-secondary mb-2">Search for "{searchQuery}"</h4>
                    <button
                      onClick={() => {
                        setShowSuggestions(false);
                        searchInputRef.current?.blur();
                      }}
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      Press Enter to search
                    </button>
                  </div>
                )}
                
                {searchSuggestions.filter(suggestion => 
                  suggestion.toLowerCase().includes(searchQuery.toLowerCase())
                ).length > 0 && (
                  <div className="p-4 border-b border-border-light">
                    <h4 className="text-sm font-medium text-text-secondary mb-2">Suggestions</h4>
                    <div className="space-y-1">
                      {searchSuggestions
                        .filter(suggestion => suggestion.toLowerCase().includes(searchQuery.toLowerCase()))
                        .slice(0, 3)
                        .map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setSearchQuery(suggestion);
                              setShowSuggestions(false);
                            }}
                            className="block w-full text-left px-2 py-1 text-sm text-text-primary hover:bg-surface rounded transition-smooth"
                          >
                            {suggestion}
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                {recentSearches.length > 0 && (
                  <div className="p-4">
                    <h4 className="text-sm font-medium text-text-secondary mb-2">Recent Searches</h4>
                    <div className="space-y-1">
                      {recentSearches.slice(0, 3).map((search, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setSearchQuery(search);
                            setShowSuggestions(false);
                          }}
                          className="flex items-center space-x-2 w-full text-left px-2 py-1 text-sm text-text-secondary hover:text-text-primary hover:bg-surface rounded transition-smooth"
                        >
                          <Icon name="Clock" size={14} />
                          <span>{search}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </form>
        </div>

        {/* Mobile Filter Toggle */}
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
            className="flex items-center space-x-2 px-4 py-2 bg-background border border-border rounded-lg shadow-soft"
          >
            <Icon name="Filter" size={20} />
            <span>Filters</span>
            {getActiveFiltersCount() > 0 && (
              <span className="bg-primary text-white text-xs px-2 py-1 rounded-full">
                {getActiveFiltersCount()}
              </span>
            )}
          </button>
        </div>

        <div className="flex gap-6">
          {/* Filters Sidebar - Desktop */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <SearchFilters
              selectedFilters={selectedFilters}
              onFilterChange={handleFilterChange}
              onClearAll={clearAllFilters}
              activeFiltersCount={getActiveFiltersCount()}
            />
          </div>

          {/* Mobile Filters Panel */}
          {isMobileFiltersOpen && (
            <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50">
              <div className="absolute right-0 top-0 h-full w-80 bg-background overflow-y-auto">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-text-primary">Filters</h3>
                  <button
                    onClick={() => setIsMobileFiltersOpen(false)}
                    className="p-2 hover:bg-surface rounded-lg transition-smooth"
                  >
                    <Icon name="X" size={20} />
                  </button>
                </div>
                <div className="p-4">
                  <SearchFilters
                    selectedFilters={selectedFilters}
                    onFilterChange={handleFilterChange}
                    onClearAll={clearAllFilters}
                    activeFiltersCount={getActiveFiltersCount()}
                    onClose={() => setIsMobileFiltersOpen(false)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
              <div className="flex items-center space-x-4">
                <p className="text-text-secondary">
                  <span className="font-medium text-text-primary">{jobsCount}</span> jobs found
                </p>
                
                {getActiveFiltersCount() > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Clear all filters
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setIsAdvancedSearchOpen(true)}
                  className="flex items-center space-x-2 px-3 py-2 text-sm text-text-secondary hover:text-text-primary border border-border rounded-lg hover:bg-surface transition-smooth"
                >
                  <Icon name="Settings" size={16} />
                  <span>Advanced</span>
                </button>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-background"
                >
                  <option value="relevance">Most Relevant</option>
                  <option value="date">Most Recent</option>
                  <option value="salary">Highest Salary</option>
                </select>
              </div>
            </div>

            {/* Active Filters */}
            {getActiveFiltersCount() > 0 && (
              <div className="mb-6">
                <div className="flex flex-wrap gap-2">
                  {selectedFilters.location.map((location) => (
                    <span
                      key={location}
                      className="inline-flex items-center space-x-1 px-3 py-1 bg-primary-50 text-primary-700 text-sm rounded-full"
                    >
                      <span>{location}</span>
                      <button
                        onClick={() => handleFilterChange('location', selectedFilters.location.filter(l => l !== location))}
                        className="hover:bg-primary-100 rounded-full p-0.5"
                      >
                        <Icon name="X" size={12} />
                      </button>
                    </span>
                  ))}
                  
                  {selectedFilters.employmentType.map((type) => (
                    <span
                      key={type}
                      className="inline-flex items-center space-x-1 px-3 py-1 bg-primary-50 text-primary-700 text-sm rounded-full"
                    >
                      <span>{type}</span>
                      <button
                        onClick={() => handleFilterChange('employmentType', selectedFilters.employmentType.filter(t => t !== type))}
                        className="hover:bg-primary-100 rounded-full p-0.5"
                      >
                        <Icon name="X" size={12} />
                      </button>
                    </span>
                  ))}

                  {selectedFilters.remoteWork && (
                    <span className="inline-flex items-center space-x-1 px-3 py-1 bg-primary-50 text-primary-700 text-sm rounded-full">
                      <span>Remote Work</span>
                      <button
                        onClick={() => handleFilterChange('remoteWork', false)}
                        className="hover:bg-primary-100 rounded-full p-0.5"
                      >
                        <Icon name="X" size={12} />
                      </button>
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Job Listings */}
            <div className="space-y-4">
              {displayedJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={formatJobData(job)}
                  isSaved={savedJobs.has(job.id)}
                  onSave={() => handleSaveJob(job.id)}
                  onSelect={() => setSelectedJobId(job.id)}
                  isSelected={selectedJobId === job.id}
                  formatTimeAgo={formatTimeAgo}
                />
              ))}

              {/* Loading Skeleton */}
              {isLoading && (
                <div className="space-y-4">
                  {[...Array(3)].map((_, index) => (
                    <div key={index} className="bg-background border border-border rounded-lg p-6 animate-pulse">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-secondary-200 rounded-lg"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-secondary-200 rounded w-3/4"></div>
                          <div className="h-3 bg-secondary-200 rounded w-1/2"></div>
                          <div className="h-3 bg-secondary-200 rounded w-1/3"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Load More Trigger */}
              {hasMore && !isLoading && (
                <div ref={observerRef} className="h-10 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}

              {/* No More Results */}
              {!hasMore && displayedJobs.length > 0 && (
                <div className="text-center py-8">
                  <p className="text-text-secondary">You have reached the end of the results</p>
                </div>
              )}

              {/* No Results */}
              {jobsCount === 0 && !isLoading && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon name="Search" size={32} color="#64748B" />
                  </div>
                  <h3 className="text-lg font-semibold text-text-primary mb-2">No jobs found</h3>
                  <p className="text-text-secondary mb-4">Try adjusting your search criteria or filters</p>
                  <button
                    onClick={clearAllFilters}
                    className="btn-primary"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Job Preview Panel - Desktop */}
          {selectedJobId && (
            <div className="hidden xl:block w-96 flex-shrink-0">
              <JobPreviewPanel
                job={formatJobData(filteredJobs.find(j => j.id === selectedJobId))}
                onClose={() => setSelectedJobId(null)}
                isSaved={savedJobs.has(selectedJobId)}
                onSave={() => handleSaveJob(selectedJobId)}
                formatTimeAgo={formatTimeAgo}
              />
            </div>
          )}
        </div>

        {/* Floating Action Button - Mobile */}
        <div className="fixed bottom-6 right-6 lg:hidden">
          <div className="flex flex-col space-y-3">
            <Link
              to="/job-seeker-dashboard"
              className="w-14 h-14 bg-secondary-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-secondary-700 transition-smooth"
            >
              <Icon name="Bookmark" size={24} />
            </Link>
            <button
              onClick={() => setIsAdvancedSearchOpen(true)}
              className="w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary-700 transition-smooth"
            >
              <Icon name="Bell" size={24} />
            </button>
          </div>
        </div>

        {/* Advanced Search Modal */}
        <AdvancedSearchModal
          isOpen={isAdvancedSearchOpen}
          onClose={() => setIsAdvancedSearchOpen(false)}
          selectedFilters={selectedFilters}
          onFilterChange={handleFilterChange}
        />
      </div>
    </div>
  );
};

export default JobSearchBrowse;