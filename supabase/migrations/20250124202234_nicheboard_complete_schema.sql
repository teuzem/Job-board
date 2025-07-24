-- Location: supabase/migrations/20250124202234_nicheboard_complete_schema.sql
-- Schema Analysis: Fresh project - creating complete job board schema
-- Integration Type: Complete new schema
-- Dependencies: None - initial migration

-- 1. Extensions & Types
CREATE TYPE public.user_role AS ENUM ('admin', 'recruiter', 'job_seeker');
CREATE TYPE public.employment_type AS ENUM ('full_time', 'part_time', 'contract', 'freelance', 'internship');
CREATE TYPE public.experience_level AS ENUM ('entry', 'mid_level', 'senior', 'executive');
CREATE TYPE public.job_status AS ENUM ('active', 'closed', 'draft', 'expired');
CREATE TYPE public.application_status AS ENUM ('pending', 'reviewing', 'interview', 'offered', 'hired', 'rejected');
CREATE TYPE public.subscription_tier AS ENUM ('free', 'premium', 'enterprise');

-- 2. Core User Profiles Table (PostgREST compatible)
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role public.user_role DEFAULT 'job_seeker'::public.user_role,
    phone TEXT,
    avatar_url TEXT,
    location TEXT,
    resume_url TEXT,
    bio TEXT,
    skills TEXT[],
    experience_years INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Companies Table
CREATE TABLE public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    website_url TEXT,
    industry TEXT,
    company_size TEXT,
    founded_year INTEGER,
    headquarters TEXT,
    subscription_tier public.subscription_tier DEFAULT 'free'::public.subscription_tier,
    subscription_expires_at TIMESTAMPTZ,
    recruiter_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Jobs Table
CREATE TABLE public.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT[],
    benefits TEXT[],
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    location TEXT NOT NULL,
    employment_type public.employment_type NOT NULL,
    experience_level public.experience_level NOT NULL,
    salary_min INTEGER,
    salary_max INTEGER,
    salary_currency TEXT DEFAULT 'USD',
    remote_work BOOLEAN DEFAULT false,
    featured BOOLEAN DEFAULT false,
    status public.job_status DEFAULT 'active'::public.job_status,
    views_count INTEGER DEFAULT 0,
    applications_count INTEGER DEFAULT 0,
    posted_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    expires_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. Job Applications Table
CREATE TABLE public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
    applicant_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    status public.application_status DEFAULT 'pending'::public.application_status,
    cover_letter TEXT,
    resume_url TEXT,
    screening_answers JSONB,
    applied_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(job_id, applicant_id)
);

-- 6. Saved Jobs Table
CREATE TABLE public.saved_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
    saved_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, job_id)
);

-- 7. Job Analytics Table
CREATE TABLE public.job_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
    view_date DATE DEFAULT CURRENT_DATE,
    views_count INTEGER DEFAULT 0,
    applications_count INTEGER DEFAULT 0,
    source_attribution JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(job_id, view_date)
);

-- 8. Essential Indexes
CREATE INDEX idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX idx_companies_recruiter_id ON public.companies(recruiter_id);
CREATE INDEX idx_jobs_company_id ON public.jobs(company_id);
CREATE INDEX idx_jobs_status ON public.jobs(status);
CREATE INDEX idx_jobs_employment_type ON public.jobs(employment_type);
CREATE INDEX idx_jobs_experience_level ON public.jobs(experience_level);
CREATE INDEX idx_jobs_remote_work ON public.jobs(remote_work);
CREATE INDEX idx_jobs_posted_date ON public.jobs(posted_date DESC);
CREATE INDEX idx_applications_job_id ON public.applications(job_id);
CREATE INDEX idx_applications_applicant_id ON public.applications(applicant_id);
CREATE INDEX idx_applications_status ON public.applications(status);
CREATE INDEX idx_saved_jobs_user_id ON public.saved_jobs(user_id);
CREATE INDEX idx_job_analytics_job_id ON public.job_analytics(job_id);

-- 9. Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_analytics ENABLE ROW LEVEL SECURITY;

-- 10. Helper Functions
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid() AND up.role = 'admin'::public.user_role
)
$$;

CREATE OR REPLACE FUNCTION public.is_recruiter()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid() AND up.role = 'recruiter'::public.user_role
)
$$;

CREATE OR REPLACE FUNCTION public.owns_company(company_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id = company_uuid AND c.recruiter_id = auth.uid()
)
$$;

CREATE OR REPLACE FUNCTION public.can_manage_job(job_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
    SELECT 1 FROM public.jobs j
    JOIN public.companies c ON j.company_id = c.id
    WHERE j.id = job_uuid AND (
        c.recruiter_id = auth.uid() OR
        public.is_admin()
    )
)
$$;

CREATE OR REPLACE FUNCTION public.increment_job_views(job_uuid UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update job views count
    UPDATE public.jobs 
    SET views_count = views_count + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = job_uuid;
    
    -- Update analytics
    INSERT INTO public.job_analytics (job_id, view_date, views_count)
    VALUES (job_uuid, CURRENT_DATE, 1)
    ON CONFLICT (job_id, view_date)
    DO UPDATE SET views_count = public.job_analytics.views_count + 1;
END;
$$;

-- 11. RLS Policies
-- User profiles: users manage own profiles, admins see all
CREATE POLICY "users_view_own_profile" ON public.user_profiles FOR SELECT
USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "users_update_own_profile" ON public.user_profiles FOR UPDATE
USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Companies: recruiters manage own companies, public read for active
CREATE POLICY "public_view_companies" ON public.companies FOR SELECT
USING (true);

CREATE POLICY "recruiters_manage_companies" ON public.companies FOR ALL
USING (public.owns_company(id) OR public.is_admin())
WITH CHECK (public.owns_company(id) OR public.is_admin());

-- Jobs: public read for active jobs, recruiters manage own
CREATE POLICY "public_view_active_jobs" ON public.jobs FOR SELECT
USING (status = 'active'::public.job_status OR public.can_manage_job(id));

CREATE POLICY "recruiters_manage_jobs" ON public.jobs FOR ALL
USING (public.can_manage_job(id))
WITH CHECK (public.can_manage_job(id));

-- Applications: applicants see own, recruiters see for their jobs
CREATE POLICY "users_view_own_applications" ON public.applications FOR SELECT
USING (
    applicant_id = auth.uid() OR
    public.can_manage_job(job_id) OR
    public.is_admin()
);

CREATE POLICY "users_create_applications" ON public.applications FOR INSERT
WITH CHECK (applicant_id = auth.uid());

CREATE POLICY "users_update_own_applications" ON public.applications FOR UPDATE
USING (applicant_id = auth.uid())
WITH CHECK (applicant_id = auth.uid());

-- Saved jobs: users manage own saved jobs
CREATE POLICY "users_manage_saved_jobs" ON public.saved_jobs FOR ALL
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Job analytics: recruiters see for their jobs, admins see all
CREATE POLICY "recruiters_view_job_analytics" ON public.job_analytics FOR SELECT
USING (public.can_manage_job(job_id) OR public.is_admin());

-- 12. Automatic profile creation trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name, role)
    VALUES (
        NEW.id, 
        NEW.email, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'job_seeker'::public.user_role)
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 13. Update timestamps trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON public.companies
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_jobs_updated_at
    BEFORE UPDATE ON public.jobs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_applications_updated_at
    BEFORE UPDATE ON public.applications
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 14. Complete Mock Data with 10 Jobs
DO $$
DECLARE
    admin_uuid UUID := gen_random_uuid();
    recruiter1_uuid UUID := gen_random_uuid();
    recruiter2_uuid UUID := gen_random_uuid();
    jobseeker1_uuid UUID := gen_random_uuid();
    jobseeker2_uuid UUID := gen_random_uuid();
    
    company1_uuid UUID := gen_random_uuid();
    company2_uuid UUID := gen_random_uuid();
    company3_uuid UUID := gen_random_uuid();
    company4_uuid UUID := gen_random_uuid();
    company5_uuid UUID := gen_random_uuid();
    
    job1_uuid UUID := gen_random_uuid();
    job2_uuid UUID := gen_random_uuid();
    job3_uuid UUID := gen_random_uuid();
    job4_uuid UUID := gen_random_uuid();
    job5_uuid UUID := gen_random_uuid();
    job6_uuid UUID := gen_random_uuid();
    job7_uuid UUID := gen_random_uuid();
    job8_uuid UUID := gen_random_uuid();
    job9_uuid UUID := gen_random_uuid();
    job10_uuid UUID := gen_random_uuid();
BEGIN
    -- Create auth users with required fields
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
        is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
        recovery_token, recovery_sent_at, email_change_token_new, email_change,
        email_change_sent_at, email_change_token_current, email_change_confirm_status,
        reauthentication_token, reauthentication_sent_at, phone, phone_change,
        phone_change_token, phone_change_sent_at
    ) VALUES
        (admin_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'admin@nicheboard.com', crypt('admin123', gen_salt('bf', 10)), now(), now(), now(),
         '{"full_name": "Admin User", "role": "admin"}'::jsonb, '{"provider": "email", "providers": ["email"]}'::jsonb,
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null),
        (recruiter1_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'recruiter@techcorp.com', crypt('recruiter123', gen_salt('bf', 10)), now(), now(), now(),
         '{"full_name": "Sarah Johnson", "role": "recruiter"}'::jsonb, '{"provider": "email", "providers": ["email"]}'::jsonb,
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null),
        (recruiter2_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'recruiter@innovatelabs.com', crypt('recruiter123', gen_salt('bf', 10)), now(), now(), now(),
         '{"full_name": "Michael Chen", "role": "recruiter"}'::jsonb, '{"provider": "email", "providers": ["email"]}'::jsonb,
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null),
        (jobseeker1_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'john.developer@email.com', crypt('jobseeker123', gen_salt('bf', 10)), now(), now(), now(),
         '{"full_name": "John Developer", "role": "job_seeker"}'::jsonb, '{"provider": "email", "providers": ["email"]}'::jsonb,
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null),
        (jobseeker2_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'jane.designer@email.com', crypt('jobseeker123', gen_salt('bf', 10)), now(), now(), now(),
         '{"full_name": "Jane Designer", "role": "job_seeker"}'::jsonb, '{"provider": "email", "providers": ["email"]}'::jsonb,
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null);

    -- Create companies
    INSERT INTO public.companies (id, name, description, logo_url, website_url, industry, company_size, founded_year, headquarters, subscription_tier, recruiter_id) VALUES
        (company1_uuid, 'TechCorp Solutions', 'Leading technology solutions provider specializing in enterprise software development and digital transformation.', 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=128&h=128&fit=crop&crop=center', 'https://techcorp.com', 'Technology', '100-500', 2015, 'San Francisco, CA', 'premium'::public.subscription_tier, recruiter1_uuid),
        (company2_uuid, 'InnovateLabs', 'Innovative startup focused on AI and machine learning solutions for modern businesses.', 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=128&h=128&fit=crop&crop=center', 'https://innovatelabs.com', 'Artificial Intelligence', '50-100', 2018, 'New York, NY', 'premium'::public.subscription_tier, recruiter2_uuid),
        (company3_uuid, 'DesignStudio Pro', 'Creative agency specializing in user experience design and digital product development.', 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=128&h=128&fit=crop&crop=center', 'https://designstudio.pro', 'Design', '10-50', 2020, 'Austin, TX', 'free'::public.subscription_tier, recruiter1_uuid),
        (company4_uuid, 'CloudTech Systems', 'Cloud infrastructure and DevOps solutions provider for scalable applications.', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=128&h=128&fit=crop&crop=center', 'https://cloudtech.systems', 'Cloud Computing', '200-500', 2012, 'Seattle, WA', 'enterprise'::public.subscription_tier, recruiter2_uuid),
        (company5_uuid, 'GrowthCo Marketing', 'Full-service digital marketing agency helping businesses achieve sustainable growth.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=128&h=128&fit=crop&crop=center', 'https://growthco.marketing', 'Marketing', '100-200', 2017, 'Miami, FL', 'premium'::public.subscription_tier, recruiter1_uuid);

    -- Create 10 jobs (expanding from original 8)
    INSERT INTO public.jobs (id, title, description, requirements, benefits, company_id, location, employment_type, experience_level, salary_min, salary_max, remote_work, featured, status, views_count, applications_count, posted_date, expires_date) VALUES
        (job1_uuid, 'Senior React Developer', 'We are looking for a Senior React Developer to join our dynamic team. You will be responsible for building scalable web applications using modern React patterns and best practices. Key responsibilities include developing user interfaces, optimizing application performance, and collaborating with cross-functional teams to deliver high-quality software solutions.', 
         ARRAY['5+ years React experience', 'TypeScript proficiency', 'Redux/Context API', 'Testing frameworks', 'Git version control'], 
         ARRAY['Health insurance', 'Dental coverage', '401k matching', 'Flexible work hours', 'Professional development budget'], 
         company1_uuid, 'San Francisco, CA', 'full_time'::public.employment_type, 'senior'::public.experience_level, 120000, 160000, true, true, 'active'::public.job_status, 1245, 48, now() - interval '2 days', now() + interval '28 days'),
        
        (job2_uuid, 'Product Manager', 'Join our product team as a Product Manager where you will drive product strategy and execution for our flagship SaaS platform. You will work closely with engineering, design, and marketing teams to define product roadmaps, gather user feedback, and ensure successful product launches.',
         ARRAY['3+ years product management', 'Agile methodologies', 'Data analysis skills', 'User research experience', 'Roadmap planning'], 
         ARRAY['Competitive salary', 'Stock options', 'Health benefits', 'Unlimited PTO', 'Learning stipend'], 
         company2_uuid, 'New York, NY', 'full_time'::public.employment_type, 'mid_level'::public.experience_level, 130000, 170000, false, false, 'active'::public.job_status, 987, 32, now() - interval '1 day', now() + interval '29 days'),
        
        (job3_uuid, 'UX/UI Designer', 'We are seeking a talented UX/UI Designer to create intuitive and engaging user experiences for our digital products. You will be responsible for conducting user research, creating wireframes and prototypes, and collaborating with development teams to implement designs.',
         ARRAY['4+ years UX/UI design', 'Figma/Sketch proficiency', 'User research skills', 'Prototyping experience', 'Design systems'], 
         ARRAY['Creative environment', 'Design tools budget', 'Conference attendance', 'Flexible schedule', 'Remote work options'], 
         company3_uuid, 'Austin, TX', 'contract'::public.employment_type, 'mid_level'::public.experience_level, 80000, 110000, true, false, 'active'::public.job_status, 756, 18, now() - interval '3 days', now() + interval '27 days'),
        
        (job4_uuid, 'DevOps Engineer', 'Join our infrastructure team as a DevOps Engineer to help scale our cloud-native applications and improve deployment processes. You will work with containerization, CI/CD pipelines, and cloud platforms to ensure reliable and efficient software delivery.',
         ARRAY['AWS/Azure experience', 'Docker/Kubernetes', 'CI/CD pipelines', 'Infrastructure as Code', 'Monitoring tools'], 
         ARRAY['Cutting-edge technology', 'Cloud certifications', 'Performance bonuses', 'Health coverage', 'Retirement plan'], 
         company4_uuid, 'Seattle, WA', 'full_time'::public.employment_type, 'senior'::public.experience_level, 140000, 180000, true, true, 'active'::public.job_status, 1102, 41, now() - interval '4 days', now() + interval '26 days'),
        
        (job5_uuid, 'Data Scientist', 'We are looking for a Data Scientist to join our analytics team and help drive data-driven decision making across the organization. You will work with large datasets, build predictive models, and create insights that directly impact business strategy and product development.',
         ARRAY['Python/R proficiency', 'Machine learning', 'SQL expertise', 'Statistical analysis', 'Data visualization'], 
         ARRAY['Research opportunities', 'Conference presentations', 'Advanced analytics tools', 'Collaborative environment', 'Growth opportunities'], 
         company2_uuid, 'Boston, MA', 'full_time'::public.employment_type, 'mid_level'::public.experience_level, 110000, 150000, false, false, 'active'::public.job_status, 543, 15, now() - interval '5 days', now() + interval '25 days'),
        
        (job6_uuid, 'Frontend Developer', 'Join our creative team as a Frontend Developer to build beautiful and responsive web applications for our diverse client base. You will work with modern JavaScript frameworks and collaborate with designers to bring creative visions to life.',
         ARRAY['3+ years frontend development', 'React/Vue.js', 'CSS/SASS', 'Responsive design', 'Performance optimization'], 
         ARRAY['Creative projects', 'Skill development', 'Team collaboration', 'Work-life balance', 'Modern tech stack'], 
         company3_uuid, 'Los Angeles, CA', 'part_time'::public.employment_type, 'mid_level'::public.experience_level, 60000, 80000, true, false, 'active'::public.job_status, 687, 22, now() - interval '6 days', now() + interval '24 days'),
        
        (job7_uuid, 'Backend Engineer', 'We are seeking a Backend Engineer to design and implement scalable server-side applications and APIs. You will work with microservices architecture, databases, and cloud platforms to build robust backend systems that power our applications.',
         ARRAY['Node.js/Python/Java', 'Database design', 'API development', 'Microservices', 'Cloud platforms'], 
         ARRAY['Technical challenges', 'Scalability projects', 'Team mentoring', 'Innovation time', 'Professional growth'], 
         company1_uuid, 'Chicago, IL', 'full_time'::public.employment_type, 'senior'::public.experience_level, 125000, 165000, true, false, 'active'::public.job_status, 834, 29, now() - interval '7 days', now() + interval '23 days'),
        
        (job8_uuid, 'Marketing Manager', 'Join our marketing team as a Marketing Manager to develop and execute comprehensive marketing strategies that drive growth and brand awareness. You will manage campaigns across multiple channels, analyze performance metrics, and collaborate with cross-functional teams to achieve business objectives.',
         ARRAY['5+ years marketing experience', 'Digital marketing', 'Analytics tools', 'Campaign management', 'Content strategy'], 
         ARRAY['Marketing budget', 'Campaign freedom', 'Analytics tools', 'Brand building', 'Growth opportunities'], 
         company5_uuid, 'Miami, FL', 'full_time'::public.employment_type, 'senior'::public.experience_level, 90000, 120000, false, false, 'active'::public.job_status, 492, 12, now() - interval '8 days', now() + interval '22 days'),
        
        (job9_uuid, 'Full Stack Developer', 'We are looking for a Full Stack Developer to work on both frontend and backend development of our web applications. You will be responsible for the complete development lifecycle, from database design to user interface implementation.',
         ARRAY['Full stack development', 'React/Angular frontend', 'Node.js/Python backend', 'Database management', 'API integration'], 
         ARRAY['End-to-end ownership', 'Technology variety', 'Learning opportunities', 'Innovation projects', 'Competitive pay'], 
         company1_uuid, 'Remote', 'full_time'::public.employment_type, 'mid_level'::public.experience_level, 95000, 130000, true, true, 'active'::public.job_status, 1156, 38, now() - interval '1 day', now() + interval '29 days'),
        
        (job10_uuid, 'AI/ML Engineer', 'Join our AI team as a Machine Learning Engineer to develop and deploy cutting-edge AI solutions. You will work on natural language processing, computer vision, and predictive analytics projects that solve real-world business problems.',
         ARRAY['Machine learning frameworks', 'Python/TensorFlow/PyTorch', 'Deep learning', 'Model deployment', 'Data preprocessing'], 
         ARRAY['AI research', 'GPU resources', 'Conference attendance', 'Publication opportunities', 'Innovation budget'], 
         company2_uuid, 'San Francisco, CA', 'full_time'::public.employment_type, 'senior'::public.experience_level, 150000, 200000, true, true, 'active'::public.job_status, 2134, 67, now() - interval '3 hours', now() + interval '29 days');

    -- Create some sample applications
    INSERT INTO public.applications (job_id, applicant_id, status, cover_letter, screening_answers) VALUES
        (job1_uuid, jobseeker1_uuid, 'pending'::public.application_status, 'I am excited to apply for the Senior React Developer position. With over 5 years of React experience, I believe I would be a great fit for your team.', '{"experience": "5+ years", "availability": "2 weeks"}'),
        (job2_uuid, jobseeker1_uuid, 'reviewing'::public.application_status, 'I am interested in the Product Manager role and have relevant experience in agile methodologies.', '{"pm_experience": "3 years", "tools": "Jira, Confluence"}'),
        (job3_uuid, jobseeker2_uuid, 'interview'::public.application_status, 'As a UX/UI designer with 4 years of experience, I am passionate about creating user-centered designs.', '{"portfolio": "https://portfolio.com", "tools": "Figma, Adobe"}');

    -- Create saved jobs
    INSERT INTO public.saved_jobs (user_id, job_id) VALUES
        (jobseeker1_uuid, job1_uuid),
        (jobseeker1_uuid, job3_uuid),
        (jobseeker1_uuid, job7_uuid),
        (jobseeker2_uuid, job2_uuid),
        (jobseeker2_uuid, job4_uuid);

    -- Create job analytics
    INSERT INTO public.job_analytics (job_id, view_date, views_count, applications_count) VALUES
        (job1_uuid, CURRENT_DATE - interval '1 day', 245, 8),
        (job1_uuid, CURRENT_DATE, 156, 12),
        (job2_uuid, CURRENT_DATE - interval '1 day', 187, 6),
        (job2_uuid, CURRENT_DATE, 98, 4),
        (job9_uuid, CURRENT_DATE, 234, 15),
        (job10_uuid, CURRENT_DATE, 456, 23);

EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'Foreign key error: %', SQLERRM;
    WHEN unique_violation THEN
        RAISE NOTICE 'Unique constraint error: %', SQLERRM;
    WHEN OTHERS THEN
        RAISE NOTICE 'Unexpected error: %', SQLERRM;
END $$;