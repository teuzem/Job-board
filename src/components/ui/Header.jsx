import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../AppIcon';

const Header = () => {
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const { user, userProfile, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const userMenuRef = useRef(null);
  const location = useLocation();

  const isAuthenticated = !!user;
  const userRole = userProfile?.role || 'anonymous';

  const navigationItems = {
    'job_seeker': [
      { label: 'Browse Jobs', path: '/job-search-browse', icon: 'Search' },
      { label: 'Dashboard', path: '/job-seeker-dashboard', icon: 'LayoutDashboard' },
      { label: 'Applications', path: '/job-detail-application', icon: 'FileText' },
    ],
    'recruiter': [
      { label: 'Browse Jobs', path: '/job-search-browse', icon: 'Search' },
      { label: 'Dashboard', path: '/recruiter-dashboard-analytics', icon: 'BarChart3' },
      { label: 'Post Job', path: '/job-posting-creation-management', icon: 'Plus' },
      { label: 'Company', path: '/company-registration-profile-setup', icon: 'Building2' },
    ],
    'admin': [
      { label: 'Browse Jobs', path: '/job-search-browse', icon: 'Search' },
      { label: 'Admin Panel', path: '/admin-moderation-management', icon: 'Shield' },
      { label: 'Analytics', path: '/recruiter-dashboard-analytics', icon: 'BarChart3' },
    ],
    'anonymous': [
      { label: 'Browse Jobs', path: '/job-search-browse', icon: 'Search' },
      { label: 'Sign In', path: '/job-seeker-registration-login', icon: 'LogIn' },
    ]
  };

  const currentNavItems = isAuthenticated ? navigationItems[userRole] : navigationItems['anonymous'];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchExpanded(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/job-search-browse?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setIsSearchExpanded(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const isActivePath = (path) => {
    return location.pathname === path;
  };

  const getUserDisplayName = () => {
    if (loading) return 'Loading...';
    return userProfile?.full_name || user?.email?.split('@')[0] || 'User';
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsUserMenuOpen(false);
      navigate('/job-search-browse');
    } catch (error) {
      console.log('Sign out error:', error);
    }
  };

  const getUserMenuItems = () => {
    const commonItems = [
      { 
        label: 'Profile', 
        icon: 'User', 
        action: () => {
          setIsUserMenuOpen(false);
          if (userRole === 'job_seeker') {
            navigate('/job-seeker-dashboard');
          } else if (userRole === 'recruiter') {
            navigate('/company-registration-profile-setup');
          } else {
            navigate('/admin-moderation-management');
          }
        }
      },
      { 
        label: 'Settings', 
        icon: 'Settings', 
        action: () => {
          setIsUserMenuOpen(false);
          // Navigate to settings page based on role
          if (userRole === 'job_seeker') {
            navigate('/job-seeker-dashboard');
          } else if (userRole === 'recruiter') {
            navigate('/recruiter-dashboard-analytics');
          } else {
            navigate('/admin-moderation-management');
          }
        }
      },
    ];

    const roleSpecificItems = {
      'job_seeker': [
        { 
          label: 'Saved Jobs', 
          icon: 'Bookmark', 
          action: () => {
            setIsUserMenuOpen(false);
            navigate('/job-seeker-dashboard');
          }
        },
        { 
          label: 'Application History', 
          icon: 'Clock', 
          action: () => {
            setIsUserMenuOpen(false);
            navigate('/job-seeker-dashboard');
          }
        },
      ],
      'recruiter': [
        { 
          label: 'Company Profile', 
          icon: 'Building2', 
          action: () => {
            setIsUserMenuOpen(false);
            navigate('/company-registration-profile-setup');
          }
        },
        { 
          label: 'Job Analytics', 
          icon: 'BarChart3', 
          action: () => {
            setIsUserMenuOpen(false);
            navigate('/recruiter-dashboard-analytics');
          }
        },
      ],
      'admin': [
        { 
          label: 'User Management', 
          icon: 'Users', 
          action: () => {
            setIsUserMenuOpen(false);
            navigate('/admin-moderation-management');
          }
        },
        { 
          label: 'System Settings', 
          icon: 'Cog', 
          action: () => {
            setIsUserMenuOpen(false);
            navigate('/admin-moderation-management');
          }
        },
      ]
    };

    return [
      ...commonItems,
      ...(roleSpecificItems[userRole] || []),
      { 
        label: 'Sign Out', 
        icon: 'LogOut', 
        action: handleSignOut, 
        className: 'text-error border-t border-border-light pt-2 mt-2' 
      }
    ];
  };

  if (loading) {
    return (
      <header className="sticky top-0 z-1040 bg-background border-b border-border shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center space-x-2 group">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center transition-smooth group-hover:bg-primary-700">
                  <Icon name="Briefcase" size={20} color="white" />
                </div>
                <span className="text-xl font-semibold text-text-primary hidden sm:block">NicheBoard</span>
              </Link>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-1040 bg-background border-b border-border shadow-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center transition-smooth group-hover:bg-primary-700">
                <Icon name="Briefcase" size={20} color="white" />
              </div>
              <span className="text-xl font-semibold text-text-primary hidden sm:block">NicheBoard</span>
            </Link>
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-8" ref={searchRef}>
            <form onSubmit={handleSearchSubmit} className="w-full">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Icon name="Search" size={20} color="#64748B" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search jobs, companies, or skills..."
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-smooth bg-surface"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <Icon name="X" size={16} color="#64748B" />
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {currentNavItems?.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-smooth min-h-touch ${
                  isActivePath(item.path)
                    ? 'bg-primary-50 text-primary-600' :'text-text-secondary hover:text-text-primary hover:bg-surface'
                }`}
              >
                <Icon name={item.icon} size={16} />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* User Menu & Mobile Controls */}
          <div className="flex items-center space-x-2">
            {/* Search Icon - Mobile */}
            <button
              onClick={() => setIsSearchExpanded(!isSearchExpanded)}
              className="md:hidden p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface transition-smooth min-h-touch min-w-touch"
            >
              <Icon name="Search" size={20} />
            </button>

            {/* User Menu */}
            {isAuthenticated && (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={toggleUserMenu}
                  className="flex items-center space-x-2 p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface transition-smooth min-h-touch"
                >
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    {userProfile?.avatar_url ? (
                      <img 
                        src={userProfile.avatar_url} 
                        alt={getUserDisplayName()}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <Icon name="User" size={16} color="#2563EB" />
                    )}
                  </div>
                  <span className="hidden lg:block text-sm font-medium truncate max-w-32">
                    {getUserDisplayName()}
                  </span>
                  <Icon name="ChevronDown" size={16} className={`transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* User Dropdown */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-background rounded-lg shadow-modal border border-border z-1050">
                    <div className="py-2">
                      <div className="px-4 py-2 border-b border-border-light">
                        <p className="text-sm font-medium text-text-primary truncate">
                          {getUserDisplayName()}
                        </p>
                        <p className="text-xs text-text-secondary truncate">
                          {user?.email}
                        </p>
                        <p className="text-xs text-text-tertiary capitalize">
                          {userRole.replace('_', ' ')}
                        </p>
                      </div>
                      {getUserMenuItems().map((item, index) => (
                        <button
                          key={index}
                          onClick={item.action}
                          className={`w-full flex items-center space-x-3 px-4 py-2 text-sm text-left hover:bg-surface transition-smooth ${item.className || ''}`}
                        >
                          <Icon name={item.icon} size={16} />
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface transition-smooth min-h-touch min-w-touch"
            >
              <Icon name={isMobileMenuOpen ? "X" : "Menu"} size={20} />
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {isSearchExpanded && (
          <div className="md:hidden pb-4" ref={searchRef}>
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Icon name="Search" size={20} color="#64748B" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search jobs, companies, or skills..."
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-smooth bg-surface"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <Icon name="X" size={16} color="#64748B" />
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border">
            <nav className="py-4 space-y-1">
              {currentNavItems?.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-md text-base font-medium transition-smooth min-h-touch ${
                    isActivePath(item.path)
                      ? 'bg-primary-50 text-primary-600' :'text-text-secondary hover:text-text-primary hover:bg-surface'
                  }`}
                >
                  <Icon name={item.icon} size={20} />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;