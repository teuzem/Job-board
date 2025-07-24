import React, { useState } from 'react';
        import { useAuth } from '../../contexts/AuthContext';
        import Icon from '../AppIcon';
        import Button from './Button';
        import Input from './Input';

        const ProfileSection = ({ onClose }) => {
          const { user, userProfile, updateProfile, loading } = useAuth();
          const [isEditing, setIsEditing] = useState(false);
          const [formData, setFormData] = useState({
            full_name: userProfile?.full_name || '',
            phone: userProfile?.phone || '',
            location: userProfile?.location || '',
            bio: userProfile?.bio || '',
            skills: userProfile?.skills?.join(', ') || '',
            experience_years: userProfile?.experience_years || 0
          });
          const [updateLoading, setUpdateLoading] = useState(false);
          const [updateError, setUpdateError] = useState(null);
          const [updateSuccess, setUpdateSuccess] = useState(false);

          if (loading) {
            return (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-1050">
                <div className="bg-background rounded-lg shadow-modal w-full max-w-2xl mx-4 p-6">
                  <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                      <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          const handleInputChange = (e) => {
            const { name, value } = e.target;
            setFormData(prev => ({
              ...prev,
              [name]: value
            }));
          };

          const handleSubmit = async (e) => {
            e.preventDefault();
            setUpdateLoading(true);
            setUpdateError(null);
            setUpdateSuccess(false);

            try {
              const updateData = {
                ...formData,
                skills: formData.skills ? formData.skills.split(',').map(s => s.trim()).filter(s => s) : [],
                experience_years: parseInt(formData.experience_years) || 0
              };

              const result = await updateProfile(updateData);

              if (result.success) {
                setUpdateSuccess(true);
                setIsEditing(false);
                setTimeout(() => setUpdateSuccess(false), 3000);
              } else {
                setUpdateError(result.error || 'Failed to update profile');
              }
            } catch (error) {
              setUpdateError('Something went wrong. Please try again.');
              console.log('Profile update error:', error);
            } finally {
              setUpdateLoading(false);
            }
          };

          const handleCancel = () => {
            setFormData({
              full_name: userProfile?.full_name || '',
              phone: userProfile?.phone || '',
              location: userProfile?.location || '',
              bio: userProfile?.bio || '',
              skills: userProfile?.skills?.join(', ') || '',
              experience_years: userProfile?.experience_years || 0
            });
            setIsEditing(false);
            setUpdateError(null);
          };

          const getProfileCompletion = () => {
            if (!userProfile) return 0;
            const fields = ['full_name', 'phone', 'location', 'bio', 'skills'];
            const completed = fields.filter(field => {
              const value = userProfile[field];
              return value && (Array.isArray(value) ? value.length > 0 : value.trim().length > 0);
            });
            return Math.round((completed.length / fields.length) * 100);
          };

          return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-1050">
              <div className="bg-background rounded-lg shadow-modal w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                      {userProfile?.avatar_url ? (
                        <img 
                          src={userProfile.avatar_url} 
                          alt={userProfile.full_name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <Icon name="User" size={24} color="#2563EB" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-text-primary">
                        {userProfile?.full_name || 'User Profile'}
                      </h2>
                      <p className="text-sm text-text-secondary">
                        {user?.email} • {userProfile?.role?.replace('_', ' ')?.toLowerCase()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface transition-smooth"
                  >
                    <Icon name="X" size={20} />
                  </button>
                </div>

                {/* Profile Completion */}
                <div className="p-6 border-b border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-text-primary">Profile Completion</span>
                    <span className="text-sm text-text-secondary">{getProfileCompletion()}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-500"
                      style={{ width: `${getProfileCompletion()}%` }}
                    ></div>
                  </div>
                </div>

                {/* Success/Error Messages */}
                {updateSuccess && (
                  <div className="mx-6 mt-4 p-3 bg-success-50 border border-success-200 rounded-md">
                    <div className="flex items-center">
                      <Icon name="CheckCircle" size={16} color="#16A34A" />
                      <span className="ml-2 text-sm text-success-800">Profile updated successfully!</span>
                    </div>
                  </div>
                )}

                {updateError && (
                  <div className="mx-6 mt-4 p-3 bg-error-50 border border-error-200 rounded-md">
                    <div className="flex items-center">
                      <Icon name="AlertCircle" size={16} color="#DC2626" />
                      <span className="ml-2 text-sm text-error-800">{updateError}</span>
                    </div>
                  </div>
                )}

                {/* Profile Content */}
                <div className="p-6">
                  {!isEditing ? (
                    <div className="space-y-6">
                      {/* View Mode */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-text-primary mb-1">
                            Full Name
                          </label>
                          <p className="text-text-secondary">
                            {userProfile?.full_name || 'Not provided'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-text-primary mb-1">
                            Phone
                          </label>
                          <p className="text-text-secondary">
                            {userProfile?.phone || 'Not provided'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-text-primary mb-1">
                            Location
                          </label>
                          <p className="text-text-secondary">
                            {userProfile?.location || 'Not provided'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-text-primary mb-1">
                            Experience
                          </label>
                          <p className="text-text-secondary">
                            {userProfile?.experience_years ? `${userProfile.experience_years} years` : 'Not provided'}
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-1">
                          Bio
                        </label>
                        <p className="text-text-secondary">
                          {userProfile?.bio || 'No bio provided'}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-1">
                          Skills
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {userProfile?.skills && userProfile.skills.length > 0 ? (
                            userProfile.skills.map((skill, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-primary-50 text-primary-700 rounded-md text-sm"
                              >
                                {skill}
                              </span>
                            ))
                          ) : (
                            <p className="text-text-secondary">No skills added</p>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button
                          onClick={() => setIsEditing(true)}
                          className="flex items-center space-x-2"
                        >
                          <Icon name="Edit2" size={16} />
                          <span>Edit Profile</span>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Edit Mode */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                          label="Full Name"
                          name="full_name"
                          value={formData.full_name}
                          onChange={handleInputChange}
                          required
                        />
                        <Input
                          label="Phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          type="tel"
                        />
                        <Input
                          label="Location"
                          name="location"
                          value={formData.location}
                          onChange={handleInputChange}
                          placeholder="City, Country"
                        />
                        <Input
                          label="Years of Experience"
                          name="experience_years"
                          value={formData.experience_years}
                          onChange={handleInputChange}
                          type="number"
                          min="0"
                          max="50"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                          Bio
                        </label>
                        <textarea
                          name="bio"
                          value={formData.bio}
                          onChange={handleInputChange}
                          rows={4}
                          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                          placeholder="Tell us about yourself..."
                        />
                      </div>

                      <Input
                        label="Skills"
                        name="skills"
                        value={formData.skills}
                        onChange={handleInputChange}
                        placeholder="React, JavaScript, Node.js (separate with commas)"
                        helpText="Enter your skills separated by commas"
                      />

                      <div className="flex justify-end space-x-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleCancel}
                          disabled={updateLoading}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          loading={updateLoading}
                          className="flex items-center space-x-2"
                        >
                          <Icon name="Save" size={16} />
                          <span>Save Changes</span>
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          );
        };

        export default ProfileSection;