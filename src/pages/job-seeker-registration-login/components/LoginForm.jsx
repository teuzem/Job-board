import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from 'components/AppIcon';

const LoginForm = ({ onSuccess, isLoading }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  // Mock credentials for testing
  const mockCredentials = {
    email: 'john.doe@example.com',
    password: 'JobSeeker123!'
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    // Check mock credentials
    if (formData.email !== mockCredentials.email || formData.password !== mockCredentials.password) {
      setErrors({
        general: `Invalid credentials. Use email: ${mockCredentials.email} and password: ${mockCredentials.password}`
      });
      return;
    }

    onSuccess({
      email: formData.email,
      rememberMe: formData.rememberMe
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* General Error */}
      {errors.general && (
        <div className="bg-error-50 border border-error-100 rounded-md p-3">
          <div className="flex items-start">
            <Icon name="AlertCircle" size={16} color="var(--color-error)" className="mt-0.5 mr-2 flex-shrink-0" />
            <p className="text-sm text-error-600">{errors.general}</p>
          </div>
        </div>
      )}

      {/* Email Field */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">
          Email Address
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon name="Mail" size={16} color="#64748B" />
          </div>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`input-field pl-10 ${errors.email ? 'border-error focus:ring-error' : ''}`}
            placeholder="Enter your email"
            disabled={isLoading}
          />
        </div>
        {errors.email && (
          <p className="mt-1 text-sm text-error-600 flex items-center">
            <Icon name="AlertCircle" size={14} className="mr-1" />
            {errors.email}
          </p>
        )}
      </div>

      {/* Password Field */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-2">
          Password
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon name="Lock" size={16} color="#64748B" />
          </div>
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={`input-field pl-10 pr-10 ${errors.password ? 'border-error focus:ring-error' : ''}`}
            placeholder="Enter your password"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            disabled={isLoading}
          >
            <Icon 
              name={showPassword ? "EyeOff" : "Eye"} 
              size={16} 
              color="#64748B"
              className="hover:text-text-primary transition-smooth" 
            />
          </button>
        </div>
        {errors.password && (
          <p className="mt-1 text-sm text-error-600 flex items-center">
            <Icon name="AlertCircle" size={14} className="mr-1" />
            {errors.password}
          </p>
        )}
      </div>

      {/* Remember Me & Forgot Password */}
      <div className="flex items-center justify-between">
        <label className="flex items-center">
          <input
            type="checkbox"
            name="rememberMe"
            checked={formData.rememberMe}
            onChange={handleChange}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-border rounded"
            disabled={isLoading}
          />
          <span className="ml-2 text-sm text-text-secondary">Remember me</span>
        </label>
        <Link 
          to="/forgot-password" 
          className="text-sm text-primary-600 hover:text-primary-700 transition-smooth"
        >
          Forgot password?
        </Link>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full btn-primary flex items-center justify-center space-x-2 min-h-touch"
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Signing in...</span>
          </>
        ) : (
          <>
            <Icon name="LogIn" size={16} />
            <span>Sign In</span>
          </>
        )}
      </button>

      {/* Mock Credentials Helper */}
      <div className="bg-primary-50 border border-primary-100 rounded-md p-3 mt-4">
        <div className="flex items-start">
          <Icon name="Info" size={16} color="var(--color-primary)" className="mt-0.5 mr-2 flex-shrink-0" />
          <div className="text-sm">
            <p className="text-primary-700 font-medium mb-1">Demo Credentials:</p>
            <p className="text-primary-600">Email: {mockCredentials.email}</p>
            <p className="text-primary-600">Password: {mockCredentials.password}</p>
          </div>
        </div>
      </div>
    </form>
  );
};

export default LoginForm;