import React from 'react';
import { Link } from 'react-router-dom';
import Icon from 'components/AppIcon';
import Image from 'components/AppImage';

const JobCard = ({ job, isSaved, onSave, onSelect, isSelected, formatTimeAgo }) => {
  return (
    <div 
      className={`bg-background border rounded-lg p-6 hover:shadow-modal transition-smooth cursor-pointer ${
        isSelected ? 'border-primary-500 ring-2 ring-primary-100' : 'border-border hover:border-primary-300'
      } ${job.featured ? 'ring-1 ring-accent-500' : ''}`}
      onClick={onSelect}
    >
      {job.featured && (
        <div className="flex items-center space-x-1 mb-3">
          <Icon name="Star" size={16} color="#059669" />
          <span className="text-xs font-medium text-accent-600 uppercase tracking-wide">Featured</span>
        </div>
      )}

      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4 flex-1">
          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-surface">
            <Image
              src={job.logo}
              alt={`${job.company} logo`}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-text-primary mb-1 hover:text-primary-600 transition-smooth">
                  {job.title}
                </h3>
                <p className="text-text-secondary font-medium">{job.company}</p>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSave();
                }}
                className={`p-2 rounded-lg transition-smooth ${
                  isSaved 
                    ? 'text-error bg-error-50 hover:bg-error-100' :'text-text-secondary hover:text-error hover:bg-error-50'
                }`}
              >
                <Icon name={isSaved ? "Heart" : "Heart"} size={20} fill={isSaved ? "currentColor" : "none"} />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary mb-3">
              <div className="flex items-center space-x-1">
                <Icon name="MapPin" size={16} />
                <span>{job.location}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <Icon name="Clock" size={16} />
                <span>{job.employmentType}</span>
              </div>

              {job.remoteWork && (
                <div className="flex items-center space-x-1">
                  <Icon name="Wifi" size={16} />
                  <span>Remote</span>
                </div>
              )}

              <div className="flex items-center space-x-1">
                <Icon name="DollarSign" size={16} />
                <span>{job.salaryRange}</span>
              </div>
            </div>

            <p className="text-text-secondary text-sm line-clamp-2 mb-4">
              {job.description.split('\n')[0]}
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              {job.requirements.slice(0, 3).map((requirement, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-secondary-100 text-secondary-700 text-xs rounded-full"
                >
                  {requirement}
                </span>
              ))}
              {job.requirements.length > 3 && (
                <span className="px-2 py-1 bg-secondary-100 text-secondary-700 text-xs rounded-full">
                  +{job.requirements.length - 3} more
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary">
                Posted {formatTimeAgo(job.postedDate)}
              </span>

              <div className="flex items-center space-x-2">
                <Link
                  to="/job-detail-application"
                  onClick={(e) => e.stopPropagation()}
                  className="px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 border border-primary-600 hover:border-primary-700 rounded-lg transition-smooth"
                >
                  View Details
                </Link>
                
                <Link
                  to="/job-detail-application"
                  onClick={(e) => e.stopPropagation()}
                  className="px-4 py-2 text-sm font-medium bg-primary text-white hover:bg-primary-700 rounded-lg transition-smooth"
                >
                  Apply Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobCard;