import { supabase } from './supabase';

class DashboardService {
  // Get job seeker dashboard metrics
  async getJobSeekerMetrics(userId) {
    try {
      // Get application count
      const { data: applications, error: appError } = await supabase
        .from('applications')
        .select('id, status, applied_at')
        .eq('applicant_id', userId);

      if (appError) {
        return { success: false, error: appError.message };
      }

      // Get saved jobs count
      const { data: savedJobs, error: savedError } = await supabase
        .from('saved_jobs')
        .select('id')
        .eq('user_id', userId);

      if (savedError) {
        return { success: false, error: savedError.message };
      }

      // Get profile completion percentage
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        return { success: false, error: profileError.message };
      }

      const profileFields = ['full_name', 'email', 'phone', 'location', 'bio', 'skills', 'resume_url'];
      const completedFields = profileFields.filter(field => profile[field] && profile[field].length > 0);
      const profileCompletion = Math.round((completedFields.length / profileFields.length) * 100);

      const metrics = {
        applications: {
          total: applications?.length || 0,
          pending: applications?.filter(app => app.status === 'pending')?.length || 0,
          interviewing: applications?.filter(app => app.status === 'interview')?.length || 0,
          offered: applications?.filter(app => app.status === 'offered')?.length || 0,
          rejected: applications?.filter(app => app.status === 'rejected')?.length || 0
        },
        savedJobs: savedJobs?.length || 0,
        profileCompletion,
        recentApplications: applications?.slice(-5) || []
      };

      return { success: true, data: metrics };
    } catch (error) {
      if (error?.message?.includes('Failed to fetch') || 
          error?.message?.includes('NetworkError')) {
        return { 
          success: false, 
          error: 'Cannot connect to database. Your Supabase project may be paused or deleted. Please visit your Supabase dashboard to check project status.'
        };
      }
      
      return { success: false, error: 'Failed to load dashboard metrics' };
    }
  }

  // Get recruiter dashboard metrics
  async getRecruiterMetrics(userId) {
    try {
      // Get company info
      const { data: companies, error: companyError } = await supabase
        .from('companies')
        .select('id')
        .eq('recruiter_id', userId);

      if (companyError) {
        return { success: false, error: companyError.message };
      }

      if (!companies || companies.length === 0) {
        return { 
          success: true, 
          data: { 
            jobs: { total: 0, active: 0, draft: 0, closed: 0 },
            applications: { total: 0, pending: 0, reviewing: 0, interview: 0 },
            companies: 0,
            recentApplications: []
          } 
        };
      }

      const companyIds = companies.map(c => c.id);

      // Get jobs data
      const { data: jobs, error: jobsError } = await supabase
        .from('jobs')
        .select('id, status, title, applications_count, views_count, created_at')
        .in('company_id', companyIds);

      if (jobsError) {
        return { success: false, error: jobsError.message };
      }

      // Get applications for recruiter's jobs
      const jobIds = jobs?.map(j => j.id) || [];
      let applications = [];
      if (jobIds.length > 0) {
        const { data: appsData, error: appsError } = await supabase
          .from('applications')
          .select(`
            id, status, applied_at, cover_letter,
            applicant:applicant_id(full_name, email),
            job:job_id(title)
          `)
          .in('job_id', jobIds)
          .order('applied_at', { ascending: false });

        if (appsError) {
          return { success: false, error: appsError.message };
        }
        applications = appsData || [];
      }

      const metrics = {
        jobs: {
          total: jobs?.length || 0,
          active: jobs?.filter(job => job.status === 'active')?.length || 0,
          draft: jobs?.filter(job => job.status === 'draft')?.length || 0,
          closed: jobs?.filter(job => job.status === 'closed')?.length || 0
        },
        applications: {
          total: applications.length,
          pending: applications.filter(app => app.status === 'pending').length,
          reviewing: applications.filter(app => app.status === 'reviewing').length,
          interview: applications.filter(app => app.status === 'interview').length,
          offered: applications.filter(app => app.status === 'offered').length
        },
        companies: companies.length,
        totalViews: jobs?.reduce((sum, job) => sum + (job.views_count || 0), 0) || 0,
        totalApplications: jobs?.reduce((sum, job) => sum + (job.applications_count || 0), 0) || 0,
        recentApplications: applications.slice(0, 10)
      };

      return { success: true, data: metrics };
    } catch (error) {
      if (error?.message?.includes('Failed to fetch') || 
          error?.message?.includes('NetworkError')) {
        return { 
          success: false, 
          error: 'Cannot connect to database. Your Supabase project may be paused or deleted. Please visit your Supabase dashboard to check project status.'
        };
      }
      
      return { success: false, error: 'Failed to load recruiter metrics' };
    }
  }

  // Get admin dashboard metrics
  async getAdminMetrics() {
    try {
      // Get users count by role
      const { data: users, error: usersError } = await supabase
        .from('user_profiles')
        .select('role, created_at');

      if (usersError) {
        return { success: false, error: usersError.message };
      }

      // Get jobs count
      const { data: jobs, error: jobsError } = await supabase
        .from('jobs')
        .select('status, created_at, views_count, applications_count');

      if (jobsError) {
        return { success: false, error: jobsError.message };
      }

      // Get companies count
      const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select('subscription_tier, created_at');

      if (companiesError) {
        return { success: false, error: companiesError.message };
      }

      // Get total applications
      const { data: applications, error: appsError } = await supabase
        .from('applications')
        .select('status, applied_at');

      if (appsError) {
        return { success: false, error: appsError.message };
      }

      const metrics = {
        users: {
          total: users?.length || 0,
          jobSeekers: users?.filter(u => u.role === 'job_seeker')?.length || 0,
          recruiters: users?.filter(u => u.role === 'recruiter')?.length || 0,
          admins: users?.filter(u => u.role === 'admin')?.length || 0
        },
        jobs: {
          total: jobs?.length || 0,
          active: jobs?.filter(j => j.status === 'active')?.length || 0,
          draft: jobs?.filter(j => j.status === 'draft')?.length || 0,
          closed: jobs?.filter(j => j.status === 'closed')?.length || 0
        },
        companies: {
          total: companies?.length || 0,
          free: companies?.filter(c => c.subscription_tier === 'free')?.length || 0,
          premium: companies?.filter(c => c.subscription_tier === 'premium')?.length || 0,
          enterprise: companies?.filter(c => c.subscription_tier === 'enterprise')?.length || 0
        },
        applications: {
          total: applications?.length || 0,
          pending: applications?.filter(a => a.status === 'pending')?.length || 0,
          reviewing: applications?.filter(a => a.status === 'reviewing')?.length || 0,
          interview: applications?.filter(a => a.status === 'interview')?.length || 0
        },
        totalViews: jobs?.reduce((sum, job) => sum + (job.views_count || 0), 0) || 0,
        totalApplications: jobs?.reduce((sum, job) => sum + (job.applications_count || 0), 0) || 0
      };

      return { success: true, data: metrics };
    } catch (error) {
      if (error?.message?.includes('Failed to fetch') || 
          error?.message?.includes('NetworkError')) {
        return { 
          success: false, 
          error: 'Cannot connect to database. Your Supabase project may be paused or deleted. Please visit your Supabase dashboard to check project status.'
        };
      }
      
      return { success: false, error: 'Failed to load admin metrics' };
    }
  }

  // Real-time subscription for dashboard updates
  subscribeToDashboardUpdates(userId, userRole, callback) {
    let subscription;

    if (userRole === 'job_seeker') {
      subscription = supabase
        .channel('dashboard-job-seeker')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'applications',
          filter: `applicant_id=eq.${userId}`
        }, callback)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'saved_jobs',
          filter: `user_id=eq.${userId}`
        }, callback)
        .subscribe();
    } else if (userRole === 'recruiter') {
      subscription = supabase
        .channel('dashboard-recruiter')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'jobs'
        }, callback)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'applications'
        }, callback)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'companies'
        }, callback)
        .subscribe();
    } else if (userRole === 'admin') {
      subscription = supabase
        .channel('dashboard-admin')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'user_profiles'
        }, callback)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'jobs'
        }, callback)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'companies'
        }, callback)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'applications'
        }, callback)
        .subscribe();
    }

    return subscription;
  }

  // Unsubscribe from real-time updates
  unsubscribeFromUpdates(subscription) {
    if (subscription) {
      supabase.removeChannel(subscription);
    }
  }

  // Quick actions for job seekers
  async saveJob(userId, jobId) {
    try {
      const { data, error } = await supabase
        .from('saved_jobs')
        .insert([{ user_id: userId, job_id: jobId }])
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'Failed to save job' };
    }
  }

  async unsaveJob(userId, jobId) {
    try {
      const { error } = await supabase
        .from('saved_jobs')
        .delete()
        .eq('user_id', userId)
        .eq('job_id', jobId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to unsave job' };
    }
  }

  // Quick actions for recruiters
  async updateJobStatus(jobId, status) {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .update({ status })
        .eq('id', jobId)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'Failed to update job status' };
    }
  }

  async updateApplicationStatus(applicationId, status) {
    try {
      const { data, error } = await supabase
        .from('applications')
        .update({ status })
        .eq('id', applicationId)
        .select(`
          id, status,
          applicant:applicant_id(full_name, email),
          job:job_id(title)
        `)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'Failed to update application status' };
    }
  }

  // Get recent activity for all user types
  async getRecentActivity(userId, userRole, limit = 10) {
    try {
      let activities = [];

      if (userRole === 'job_seeker') {
        const { data, error } = await supabase
          .from('applications')
          .select(`
            id, status, applied_at,
            job:job_id(title, company:company_id(name))
          `)
          .eq('applicant_id', userId)
          .order('applied_at', { ascending: false })
          .limit(limit);

        if (error) {
          return { success: false, error: error.message };
        }

        activities = data?.map(app => ({
          id: app.id,
          type: 'application',
          action: `Applied to ${app.job?.title} at ${app.job?.company?.name}`,
          status: app.status,
          timestamp: app.applied_at
        })) || [];

      } else if (userRole === 'recruiter') {
        // Get recent applications for recruiter's jobs
        const { data: companies } = await supabase
          .from('companies')
          .select('id')
          .eq('recruiter_id', userId);

        if (companies && companies.length > 0) {
          const companyIds = companies.map(c => c.id);
          
          const { data, error } = await supabase
            .from('applications')
            .select(`
              id, status, applied_at,
              applicant:applicant_id(full_name),
              job:job_id!inner(title, company_id)
            `)
            .in('job.company_id', companyIds)
            .order('applied_at', { ascending: false })
            .limit(limit);

          if (error) {
            return { success: false, error: error.message };
          }

          activities = data?.map(app => ({
            id: app.id,
            type: 'application_received',
            action: `${app.applicant?.full_name} applied to ${app.job?.title}`,
            status: app.status,
            timestamp: app.applied_at
          })) || [];
        }
      }

      return { success: true, data: activities };
    } catch (error) {
      return { success: false, error: 'Failed to load recent activity' };
    }
  }
}

export default new DashboardService();