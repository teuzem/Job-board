import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import Header from "components/ui/Header";
import JobSeekerRegistrationLogin from "pages/job-seeker-registration-login";
import JobDetailApplication from "pages/job-detail-application";
import JobSearchBrowse from "pages/job-search-browse";
import JobSeekerDashboard from "pages/job-seeker-dashboard";
import RecruiterDashboardAnalytics from "pages/recruiter-dashboard-analytics";
import CompanyRegistrationProfileSetup from "pages/company-registration-profile-setup";
import JobPostingCreationManagement from "pages/job-posting-creation-management";
import AdminModerationManagement from "pages/admin-moderation-management";
import NotFound from "pages/NotFound";

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ScrollToTop />
        <Header />
        <RouterRoutes>
          <Route path="/" element={<JobSearchBrowse />} />
          <Route path="/job-seeker-registration-login" element={<JobSeekerRegistrationLogin />} />
          <Route path="/job-detail-application" element={<JobDetailApplication />} />
          <Route path="/job-search-browse" element={<JobSearchBrowse />} />
          <Route path="/job-seeker-dashboard" element={<JobSeekerDashboard />} />
          <Route path="/recruiter-dashboard-analytics" element={<RecruiterDashboardAnalytics />} />
          <Route path="/company-registration-profile-setup" element={<CompanyRegistrationProfileSetup />} />
          <Route path="/job-posting-creation-management" element={<JobPostingCreationManagement />} />
          <Route path="/admin-moderation-management" element={<AdminModerationManagement />} />
          <Route path="*" element={<NotFound />} />
        </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;