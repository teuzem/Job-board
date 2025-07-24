import { supabase } from './supabase';

class JobService {
  // Get all jobs with real-time filtering and search
  async getJobs(filters = {}) {
    try {
      let query = supabase
        .from('jobs')
        .select(`
          *,
          companies (
            id,
            name,
            logo_url,
            industry,
            company_size
          )
        `)
        .eq('status', 'active')
        .order('posted_date', { ascending: false });

      // Apply search filter
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      // Apply location filter
      if (filters.location?.length > 0) {
        const locationFilter = filters.location.map(loc => `location.ilike.%${loc}%`).join(',');
        query = query.or(locationFilter);
      }

      // Apply employment type filter
      if (filters.employmentType?.length > 0) {
        query = query.in('employment_type', filters.employmentType);
      }

      // Apply experience level filter
      if (filters.experienceLevel) {
        query = query.eq('experience_level', filters.experienceLevel);
      }

      // Apply remote work filter
      if (filters.remoteWork) {
        query = query.eq('remote_work', true);
      }

      // Apply salary range filter
      if (filters.salaryMin || filters.salaryMax) {
        if (filters.salaryMin) {
          query = query.gte('salary_max', filters.salaryMin);
        }
        if (filters.salaryMax) {
          query = query.lte('salary_min', filters.salaryMax);
        }
      }

      // Apply posting date filter
      if (filters.postingDate) {
        const now = new Date();
        const daysAgo = {
          '24h': 1,
          '3d': 3,
          '7d': 7,
          '30d': 30
        }[filters.postingDate];

        if (daysAgo) {
          const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
          query = query.gte('posted_date', cutoffDate.toISOString());
        }
      }

      const { data, error } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      if (error?.message?.includes('Failed to fetch') || 
          error?.message?.includes('NetworkError')) {
        return { 
          success: false, 
          error: 'Cannot connect to database. Your Supabase project may be paused or deleted. Please visit your Supabase dashboard to check project status.'
        };
      }
      
      return { success: false, error: 'Failed to fetch jobs' };
    }
  }

  // Get single job by ID
  async getJobById(jobId) {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          companies (
            id,
            name,
            description,
            logo_url,
            website_url,
            industry,
            company_size,
            founded_year,
            headquarters
          )
        `)
        .eq('id', jobId)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      // Increment view count
      await this.incrementJobViews(jobId);

      return { success: true, data };
    } catch (error) {
      if (error?.message?.includes('Failed to fetch') || 
          error?.message?.includes('NetworkError')) {
        return { 
          success: false, 
          error: 'Cannot connect to database. Your Supabase project may be paused or deleted. Please visit your Supabase dashboard to check project status.'
        };
      }
      
      return { success: false, error: 'Failed to fetch job details' };
    }
  }

  // Increment job view count
  async incrementJobViews(jobId) {
    try {
      const { error } = await supabase.rpc('increment_job_views', {
        job_uuid: jobId
      });

      if (error) {
        console.log('Failed to increment job views:', error.message);
      }
    } catch (error) {
      console.log('Error incrementing job views:', error);
    }
  }

  // Get jobs count with filters (for real-time filtering)
  async getJobsCount(filters = {}) {
    try {
      let query = supabase
        .from('jobs')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active');

      // Apply same filters as getJobs
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      if (filters.location?.length > 0) {
        const locationFilter = filters.location.map(loc => `location.ilike.%${loc}%`).join(',');
        query = query.or(locationFilter);
      }

      if (filters.employmentType?.length > 0) {
        query = query.in('employment_type', filters.employmentType);
      }

      if (filters.experienceLevel) {
        query = query.eq('experience_level', filters.experienceLevel);
      }

      if (filters.remoteWork) {
        query = query.eq('remote_work', true);
      }

      if (filters.salaryMin || filters.salaryMax) {
        if (filters.salaryMin) {
          query = query.gte('salary_max', filters.salaryMin);
        }
        if (filters.salaryMax) {
          query = query.lte('salary_min', filters.salaryMax);
        }
      }

      if (filters.postingDate) {
        const now = new Date();
        const daysAgo = {
          '24h': 1,
          '3d': 3,
          '7d': 7,
          '30d': 30
        }[filters.postingDate];

        if (daysAgo) {
          const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
          query = query.gte('posted_date', cutoffDate.toISOString());
        }
      }

      const { count, error } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, count: count || 0 };
    } catch (error) {
      return { success: false, error: 'Failed to fetch jobs count' };
    }
  }

  // Save/unsave a job
  async toggleSaveJob(jobId, userId) {
    try {
      // Check if job is already saved
      const { data: existing, error: checkError } = await supabase
        .from('saved_jobs')
        .select('id')
        .eq('job_id', jobId)
        .eq('user_id', userId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        return { success: false, error: checkError.message };
      }

      if (existing) {
        // Unsave the job
        const { error: deleteError } = await supabase
          .from('saved_jobs')
          .delete()
          .eq('job_id', jobId)
          .eq('user_id', userId);

        if (deleteError) {
          return { success: false, error: deleteError.message };
        }

        return { success: true, saved: false };
      } else {
        // Save the job
        const { error: insertError } = await supabase
          .from('saved_jobs')
          .insert({ job_id: jobId, user_id: userId });

        if (insertError) {
          return { success: false, error: insertError.message };
        }

        return { success: true, saved: true };
      }
    } catch (error) {
      return { success: false, error: 'Failed to toggle save job' };
    }
  }

  // Get user's saved jobs
  async getSavedJobs(userId) {
    try {
      const { data, error } = await supabase
        .from('saved_jobs')
        .select(`
          job_id,
          saved_at,
          jobs (
            *,
            companies (
              name,
              logo_url
            )
          )
        `)
        .eq('user_id', userId)
        .order('saved_at', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      return { success: false, error: 'Failed to fetch saved jobs' };
    }
  }

  // Subscribe to real-time job updates
  subscribeToJobs(callback) {
    const subscription = supabase
      .channel('jobs_changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'jobs'
        },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();

    return subscription;
  }

  // Subscribe to real-time job count updates
  subscribeToJobCount(filters, callback) {
    const subscription = supabase
      .channel('job_count_changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'jobs'
        },
        async () => {
          const result = await this.getJobsCount(filters);
          if (result.success) {
            callback(result.count);
          }
        }
      )
      .subscribe();

    return subscription;
  }

  // Apply for a job  
  async applyForJob(jobId, userId, applicationData) {
    try {
      const { data, error } = await supabase
        .from('applications')
        .insert({
          job_id: jobId,
          applicant_id: userId,
          cover_letter: applicationData.coverLetter,
          resume_url: applicationData.resumeUrl,
          screening_answers: applicationData.screeningAnswers
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'Failed to submit application' };
    }
  }

  // Get similar jobs
  async getSimilarJobs(jobId, limit = 5) {
    try {
      // First get the current job details
      const { data: currentJob, error: currentJobError } = await supabase
        .from('jobs')
        .select('title, employment_type, experience_level, company_id')
        .eq('id', jobId)
        .single();

      if (currentJobError) {
        return { success: false, error: currentJobError.message };
      }

      // Find similar jobs
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          companies (
            name,
            logo_url
          )
        `)
        .eq('status', 'active')
        .neq('id', jobId)
        .or(`employment_type.eq.${currentJob.employment_type},experience_level.eq.${currentJob.experience_level},company_id.eq.${currentJob.company_id}`)
        .limit(limit);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      return { success: false, error: 'Failed to fetch similar jobs' };
    }
  }
}

export default new JobService();