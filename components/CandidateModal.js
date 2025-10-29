'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Save, ExternalLink, Mail, FileText, Linkedin, Globe, Briefcase, CheckCircle, Volume2, Ban, UserCheck, UserX, Send, Loader2, Info, User, Clock } from 'lucide-react';
import { createCandidate, updateCandidate } from '@/lib/actions/candidates';
import { createBrowserClient } from '@supabase/ssr';

// Initialize Supabase client
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function CandidateModal({ mode, candidate, onClose }) {

  // const supabase = createClient();

  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  
  // Email modal states
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [emailToEmail, setEmailToEmail] = useState('');
  const [emailCcEmails, setEmailCcEmails] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [emailError, setEmailError] = useState('');

  // Status management states
  const [candidateStatus, setCandidateStatus] = useState(candidate?.candidate_status || '');
  const [isBlacklisted, setIsBlacklisted] = useState(candidate?.blacklist || false);
  const [isHired, setIsHired] = useState(candidate?.hired || false);
  const [statusLoading, setStatusLoading] = useState(false);
  
  // Last updated by user profile state
  const [lastUpdatedByUser, setLastUpdatedByUser] = useState(null);
  const [loadingLastUpdatedBy, setLoadingLastUpdatedBy] = useState(false);
  
  // Define isViewMode early to avoid reference errors
  const isViewMode = mode === 'view';
  
  // Fetch last updated by user profile using direct Supabase call
  useEffect(() => {
  console.log(candidate);
  
  const fetchLastUpdatedByUser = async () => {
    // Early return if no candidate ID
    if (!candidate?.id) return;

    setLoadingLastUpdatedBy(true);
    
    try {
      // Step 1: Fetch the last_update_by from candidates table
      const { data: candidateData, error: candidateError } = await supabase
        .from('candidates')
        .select('last_update_by')
        .eq('id', candidate.id)
        .single();
      
      if (candidateError) {
        console.error('Error fetching candidate data:', candidateError);
        return;
      }

      const lastUpdatedId = candidateData?.last_update_by;

      // Early return if no last_update_by value
      if (!lastUpdatedId) {
        console.log('No last_update_by found for candidate:', candidate.id);
        return;
      }

      // Step 2: Fetch the user profile from profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', lastUpdatedId)
        .single();
      
      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        console.log('User profile not found for:', lastUpdatedId);
        return;
      }

      if (profileData) {
        setLastUpdatedByUser(profileData);
      }

    } catch (error) {
      console.error('Unexpected error in fetchLastUpdatedByUser:', error);
    } finally {
      setLoadingLastUpdatedBy(false);
    }
  };

  if (isViewMode) {
    fetchLastUpdatedByUser();
  }
}, [candidate?.id, isViewMode]);
  
  const [formData, setFormData] = useState({
    persons_name: candidate?.persons_name || '',
    email: candidate?.email || '',
    country: candidate?.country || '',
    candidate_job_title: candidate?.candidate_job_title || '',
    candidate_status: candidate?.candidate_status || '',
    industry: candidate?.industry || '',
    job_roles: candidate?.job_roles || '',
    english_accent: candidate?.english_accent || '',
    candidate_bio: candidate?.candidate_bio || '',
    linkedin_link: candidate?.linkedin_link || '',
    resume_link: candidate?.resume_link || '',
    voice_link: candidate?.voice_link || '',
    desired_rate: candidate?.desired_rate || '',
    Experience_Role: candidate?.Experience_Role || '',
    Skills_Technical: candidate?.Skills_Technical || '',
    Education_Certifications: candidate?.Education_Certifications || '',
    Work_Style: candidate?.Work_Style || '',
    Communication_Skills: candidate?.Communication_Skills || '',
    Language_Proficiency: candidate?.Language_Proficiency || '',
    Industry_Background: candidate?.Industry_Background || '',
  });

  const fromEmail = 'hiring@email.saganrecruitment.com';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    startTransition(async () => {
      let result;
      
      if (mode === 'create') {
        // Get current user ID for last_update_by field using Supabase
        try {
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          
          if (userError || !user?.id) {
            setError('Unable to get user information. Please try again.');
            return;
          }

          const candidateData = {
            ...formData,
            last_update_by: user.id
          };

          result = await createCandidate(candidateData);
        } catch (err) {
          console.error('Error getting user data:', err);
          setError('Failed to get user information. Please try again.');
          return;
        }
      } else if (mode === 'edit') {
        // Get current user ID for last_update_by field using Supabase
        try {
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          
          if (userError || !user?.id) {
            setError('Unable to get user information. Please try again.');
            return;
          }

          const candidateData = {
            ...formData,
            last_update_by: user.id
          };

          result = await updateCandidate(candidate.id, candidateData);
        } catch (err) {
          console.error('Error getting user data:', err);
          setError('Failed to get user information. Please try again.');
          return;
        }
      }

      if (result?.error) {
        setError(result.error);
      } else {
        router.refresh();
        onClose();
      }
    });
  };

  // Email validation helper
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const parseCcEmails = (ccString) => {
    if (!ccString.trim()) return [];
    
    return ccString
      .split(',')
      .map(email => email.trim())
      .filter(email => email.length > 0);
  };

  // Email modal handlers
  const handleOpenEmailModal = () => {
    setIsEmailModalOpen(true);
    setEmailSuccess(false);
    setEmailError('');
    
    // Pre-fill TO email with candidate email
    setEmailToEmail(candidate?.email || '');
    
    // Pre-fill subject
    setEmailSubject(`Thank you for your interest in Sagan`);
    
    // Pre-fill with email template
    setEmailMessage(`Hi ${candidate?.persons_name || 'there'},

Thank you for reaching out, and I appreciate your continued interest in opportunities with Sagan.

I understand how challenging the job search process can be, especially when you're consistently putting in the effort. Please know that many of the roles we support are highly competitive, with numerous qualified applicants. That said, your initiative in asking for feedback is a great sign of your commitment to growth.

While I can't provide detailed feedback on individual applications, I'd be happy to offer a few general tips that may help strengthen your chances:

• Tailor your resume for each role, highlighting experience that closely matches the job description.
• Use clear, results-driven language, quantifying your accomplishments where possible.
• Ensure alignment with the role's key requirements, such as availability in specific time zones, tool proficiency, and salary expectations.

I also encourage you to continue checking and applying through our careers page: https://www.careers-page.com/sagan#openings. We're constantly adding new roles, and your profile may be a better match for upcoming opportunities.

Thanks again for reaching out, and I wish you the very best in your job search.`);
  };

  const handleCloseEmailModal = () => {
    setIsEmailModalOpen(false);
    setEmailSubject('');
    setEmailMessage('');
    setEmailToEmail('');
    setEmailCcEmails('');
    setEmailError('');
    setEmailSuccess(false);
  };

  const handleSendEmail = async () => {
    // Validation
    if (!emailSubject.trim()) {
      setEmailError('Subject is required');
      return;
    }
    if (!emailMessage.trim()) {
      setEmailError('Message is required');
      return;
    }
    if (!emailToEmail.trim()) {
      setEmailError('TO email is required');
      return;
    }
    if (!validateEmail(emailToEmail)) {
      setEmailError('Please enter a valid TO email address');
      return;
    }

    // Validate CC emails
    const ccEmailArray = parseCcEmails(emailCcEmails);
    for (const ccEmail of ccEmailArray) {
      if (!validateEmail(ccEmail)) {
        setEmailError(`Invalid CC email address: ${ccEmail}`);
        return;
      }
    }

    setEmailLoading(true);
    setEmailError('');

    try {
      const response = await fetch('/api/send-candidate-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: emailToEmail.trim(),
          cc: emailCcEmails.trim(),
          subject: emailSubject.trim(),
          message: emailMessage.trim(),
        }),
      });

      const responseText = await response.text();
      console.log('Raw response:', responseText);

      let result;
      try {
        result = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        if (response.ok) {
          result = { success: true };
        } else {
          throw new Error('Invalid response from server');
        }
      }

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send email');
      }

      console.log('Email sent successfully:', result);
      setEmailSuccess(true);
      
      setTimeout(() => {
        handleCloseEmailModal();
      }, 2000);
    } catch (err) {
      console.error('Error sending email:', err);
      setEmailError(err.message || 'Failed to send email. Please try again.');
    } finally {
      setEmailLoading(false);
    }
  };

  // Status management handlers using direct Supabase calls
  const handleToggleHired = async () => {
    if (!candidate?.id) return;
    
    setStatusLoading(true);
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user?.id) {
        throw new Error('Unable to get user information');
      }

      const newHiredStatus = !isHired;
      
      // Update candidate in Supabase
      const updateData = {
        hired: newHiredStatus,
        last_update_by: user.id,
        // up: new Date().toISOString()
      };

      // If hiring, remove from blacklist and set as unavailable
      if (newHiredStatus) {
        updateData.blacklist = false;
        updateData.candidate_status = 'Not Available';
      }

      const { data, error } = await supabase
        .from('candidates')
        .update(updateData)
        .eq('id', candidate.id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message || 'Failed to update hired status');
      }

      setIsHired(newHiredStatus);
      
      // If hiring, remove from blacklist and set as unavailable
      if (newHiredStatus) {
        setIsBlacklisted(false);
        setCandidateStatus('Not Available');
      }

      // Refresh the last updated by info
      if (data?.last_update_by) {
        const { data: userData, error: userFetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.last_update_by)
          .single();
        
        if (!userFetchError && userData) {
          setLastUpdatedByUser(userData);
        }
      }

      router.refresh();
    } catch (error) {
      console.error('Error toggling hired status:', error);
      setError(`Failed to update hired status: ${error.message}`);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleToggleBlacklist = async () => {
    if (!candidate?.id) return;
    
    setStatusLoading(true);
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user?.id) {
        throw new Error('Unable to get user information');
      }

      const newBlacklistStatus = !isBlacklisted;
      
      // Update candidate in Supabase
      const updateData = {
        blacklist: newBlacklistStatus,
        last_update_by: user.id,
        // updated_at: new Date().toISOString()
      };

      // If blacklisting, also set as unavailable and remove hired status
      if (newBlacklistStatus) {
        updateData.candidate_status = 'Not Available';
        updateData.hired = false;
      }

      const { data, error } = await supabase
        .from('candidates')
        .update(updateData)
        .eq('id', candidate.id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message || 'Failed to update blacklist status');
      }

      setIsBlacklisted(newBlacklistStatus);
      
      // If blacklisting, also set as unavailable and remove hired status
      if (newBlacklistStatus) {
        setCandidateStatus('Not Available');
        setIsHired(false);
      }

      // Refresh the last updated by info
      if (data?.last_update_by) {
        const { data: userData, error: userFetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.last_update_by)
          .single();
        
        if (!userFetchError && userData) {
          setLastUpdatedByUser(userData);
        }
      }

      router.refresh();
    } catch (error) {
      console.error('Error toggling blacklist:', error);
      setError(`Failed to update blacklist status: ${error.message}`);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleToggleAvailability = async () => {
    if (!candidate?.id) return;
    
    const newStatus = candidateStatus === 'Available' ? 'Not Available' : 'Available';
    
    setStatusLoading(true);
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user?.id) {
        throw new Error('Unable to get user information');
      }

      // Update candidate in Supabase
      const { data, error } = await supabase
        .from('candidates')
        .update({
          candidate_status: newStatus,
          last_update_by: user.id,
          // updated_at: new Date().toISOString()
        })
        .eq('id', candidate.id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message || 'Failed to update availability status');
      }

      setCandidateStatus(newStatus);

      // Refresh the last updated by info
      if (data?.last_update_by) {
        const { data: userData, error: userFetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.last_update_by)
          .single();
        
        if (!userFetchError && userData) {
          setLastUpdatedByUser(userData);
        }
      }

      router.refresh();
    } catch (error) {
      console.error('Error toggling availability:', error);
      setError(`Failed to update availability status: ${error.message}`);
    } finally {
      setStatusLoading(false);
    }
  };

  const title = mode === 'view' ? 'Candidate Profile' : mode === 'edit' ? 'Edit Candidate' : 'Add New Candidate';

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
        <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full my-8">
          <div className="sticky top-0 bg-white border-b px-6 py-4 rounded-t-lg z-10">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition"
                disabled={isPending || statusLoading}
              >
                <X size={24} />
              </button>
            </div>
            {isViewMode && (
              <div className="flex flex-wrap items-center gap-3">
                {/* Email Button */}
                <button
                  onClick={handleOpenEmailModal}
                  disabled={statusLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-semibold transition disabled:opacity-50"
                >
                  <Mail size={18} />
                  Send Email
                </button>

                {/* Hired Toggle Button */}
                <button
                  onClick={handleToggleHired}
                  disabled={statusLoading}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition disabled:opacity-50 ${
                    isHired
                      ? 'bg-green-100 text-green-800 hover:bg-green-200 border-2 border-green-400'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-gray-300'
                  }`}
                >
                  <UserCheck size={18} />
                  {isHired ? 'Hired ✅' : 'Mark Hired'}
                </button>

                {/* Availability Toggle Button */}
                <button
                  onClick={handleToggleAvailability}
                  disabled={statusLoading || isBlacklisted || isHired}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition disabled:opacity-50 ${
                    candidateStatus === 'Available'
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                  }`}
                >
                  {candidateStatus === 'Available' ? (
                    <>
                      <UserX size={18} />
                      Mark Not Available
                    </>
                  ) : (
                    <>
                      <UserCheck size={18} />
                      Mark Available
                    </>
                  )}
                </button>

                {/* Blacklist Toggle Button */}
                <button
                  onClick={handleToggleBlacklist}
                  disabled={statusLoading || isHired}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition disabled:opacity-50 ${
                    isBlacklisted
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {isBlacklisted ? (
                    <>
                      <CheckCircle size={18} />
                      Remove from Blacklist
                    </>
                  ) : (
                    <>
                      <Ban size={18} />
                      Blacklist Candidate
                    </>
                  )}
                </button>

                {/* Status Indicators */}
                {candidateStatus === 'Available' && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                    ✓ Available
                  </span>
                )}
                {candidateStatus === 'Not Available' && (
                  <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-semibold">
                    ⏸ Not Available
                  </span>
                )}
                {isHired && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                    ✅ Hired
                  </span>
                )}
                {isBlacklisted && (
                  <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                    ⚠️ Blacklisted
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {isViewMode ? (
              <div className="space-y-6">
                {/* Status Banners */}
                {isBlacklisted && (
                  <div className="bg-red-50 border-2 border-red-400 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🚫</span>
                      <div>
                        <p className="font-bold text-red-900">Blacklisted Candidate</p>
                        <p className="text-sm text-red-700">This candidate is currently blacklisted</p>
                      </div>
                    </div>
                  </div>
                )}

                {candidateStatus === 'Not Available' && !isBlacklisted && (
                  <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">⏸️</span>
                      <div>
                        <p className="font-bold text-yellow-900">Not Available</p>
                        <p className="text-sm text-yellow-700">This candidate is currently not available</p>
                      </div>
                    </div>
                  </div>
                )}

                {isHired && (
                  <div className="bg-green-50 border-2 border-green-400 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">✅</span>
                      <div>
                        <p className="font-bold text-green-900">Hired Candidate</p>
                        <p className="text-sm text-green-700">This candidate has been successfully hired</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Candidate Header with Name & Email + Last Updated By */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border-2 border-blue-300">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Side - Candidate Info */}
                    <div className="flex-1">
                      <h3 className="text-3xl font-bold text-gray-900 mb-2">
                        {candidate?.persons_name || 'N/A'}
                      </h3>
                      <p className="text-lg text-gray-700 mb-3">
                        {candidate?.candidate_job_title || 'No Title'}
                      </p>
                      <div className="flex flex-wrap gap-3">
                        {candidate?.email && (
                          <a
                            href={`mailto:${candidate.email}`}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition border border-gray-300 font-medium"
                          >
                            <Mail size={18} />
                            {candidate.email}
                          </a>
                        )}
                        {candidate?.country && (
                          <span className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg text-sm text-gray-700 border border-gray-300 font-medium">
                            <Globe size={18} />
                            {candidate.country}
                          </span>
                        )}
                        {candidate?.desired_rate && (
                          <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 rounded-lg text-sm text-green-800 font-bold border border-green-300">
                            💰 ${candidate.desired_rate}/hr
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right Side - Last Updated By & Status */}
                    <div className="flex flex-col items-end justify-between">
                      {/* Status */}
                      <div className="mb-4">
                        <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                          candidateStatus === 'Available' 
                            ? 'bg-green-100 text-green-800' 
                            : candidateStatus === 'Not Available'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {candidateStatus || 'N/A'}
                        </span>
                      </div>

                      {/* Last Updated By Section */}
                      <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-blue-200 w-full">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-blue-600 rounded-lg flex-shrink-0">
                            <Clock size={16} className="text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 text-sm mb-1">
                              Last Updated By
                            </h4>
                            {loadingLastUpdatedBy ? (
                              <div className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                <span className="text-xs text-gray-500">Loading...</span>
                              </div>
                            ) : lastUpdatedByUser ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <User size={14} className="text-blue-600 flex-shrink-0" />
                                  <span className="text-sm font-medium text-gray-900 truncate">
                                    {lastUpdatedByUser.email}
                                  </span>
                                </div>
                                {candidate?.last_updated && (
                                  <div className="flex items-center gap-2">
                                    <Clock size={14} className="text-gray-400 flex-shrink-0" />
                                    <span className="text-xs text-gray-500">
                                      {new Date(candidate.last_updated).toLocaleString()}
                                    </span>
                                  </div>
                                )}
                                <div className="text-xs text-blue-600 font-medium">
                                  ID: {( candidate?.last_update_by || '').substring(0, 8)}...
                                </div>
                              </div>
                            ) : (
                              <div className="text-xs text-gray-500">
                                { candidate?.last_update_by ? 'User not found' : 'No update history'}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Access Links */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {candidate?.resume_link && (
                    <a
                      href={candidate.resume_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border-2 border-blue-300 transition group"
                    >
                      <div className="p-2 bg-blue-600 rounded-lg">
                        <FileText size={20} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">Resume</p>
                        <p className="text-xs text-gray-600">View CV</p>
                      </div>
                      <ExternalLink size={16} className="text-blue-600 group-hover:translate-x-1 transition" />
                    </a>
                  )}
                  
                  {candidate?.linkedin_link && (
                    <a
                      href={candidate.linkedin_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border-2 border-blue-300 transition group"
                    >
                      <div className="p-2 bg-blue-700 rounded-lg">
                        <Linkedin size={20} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">LinkedIn</p>
                        <p className="text-xs text-gray-600">Profile</p>
                      </div>
                      <ExternalLink size={16} className="text-blue-600 group-hover:translate-x-1 transition" />
                    </a>
                  )}

                  {candidate?.voice_link && (
                    <a
                      href={candidate.voice_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border-2 border-purple-300 transition group"
                    >
                      <div className="p-2 bg-purple-600 rounded-lg">
                        <Volume2 size={20} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">Voice</p>
                        <p className="text-xs text-gray-600">Listen</p>
                      </div>
                      <ExternalLink size={16} className="text-purple-600 group-hover:translate-x-1 transition" />
                    </a>
                  )}

                  {candidate?.email && (
                    <a
                      href={`mailto:${candidate.email}?subject=Client Accounting Manager Opportunity&body=Hi ${candidate.persons_name},%0D%0A%0D%0AI would like to discuss an opportunity for a Client Accounting Manager position.`}
                      className="flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg border-2 border-green-300 transition group"
                    >
                      <div className="p-2 bg-green-600 rounded-lg">
                        <Mail size={20} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">Email</p>
                        <p className="text-xs text-gray-600">Contact</p>
                      </div>
                      <ExternalLink size={16} className="text-green-600 group-hover:translate-x-1 transition" />
                    </a>
                  )}
                </div>

                {/* Skills_Technical - MOST IMPORTANT */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 rounded-lg p-6 shadow-sm">
                  <h4 className="font-bold text-gray-900 mb-3 text-xl flex items-center gap-2">
                    <span className="text-2xl">💻</span> Technical Skills
                  </h4>
                  <p className="text-gray-900 whitespace-pre-wrap leading-relaxed text-base">
                    {candidate?.Skills_Technical || 'Not specified'}
                  </p>
                </div>

                {/* Experience_Role */}
                <div className="bg-white border-2 border-purple-300 rounded-lg p-6 shadow-sm">
                  <h4 className="font-bold text-gray-900 mb-3 text-xl flex items-center gap-2">
                    <Briefcase size={24} className="text-purple-600" />
                    Experience & Role History
                  </h4>
                  <p className="text-gray-900 whitespace-pre-wrap leading-relaxed text-base">
                    {candidate?.Experience_Role || 'Not specified'}
                  </p>
                </div>

                {/* Communication_Skills */}
                <div className="bg-white border-2 border-indigo-300 rounded-lg p-6 shadow-sm">
                  <h4 className="font-bold text-gray-900 mb-3 text-xl flex items-center gap-2">
                    <span className="text-2xl">💬</span> Communication Skills
                  </h4>
                  <p className="text-gray-900 whitespace-pre-wrap leading-relaxed text-base mb-4">
                    {candidate?.Communication_Skills || 'Not specified'}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-indigo-200">
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-1">Language Proficiency:</p>
                      <p className="text-base text-gray-900">{candidate?.Language_Proficiency || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-1">English Accent:</p>
                      <p className="text-base text-gray-900">{candidate?.english_accent || 'Not specified'}</p>
                    </div>
                  </div>
                </div>

                {/* Job_Roles */}
                <div className="bg-white border-2 border-blue-300 rounded-lg p-6 shadow-sm">
                  <h4 className="font-bold text-gray-900 mb-3 text-xl flex items-center gap-2">
                    <Briefcase size={24} className="text-blue-600" />
                    Job Roles
                  </h4>
                  <p className="text-gray-900 whitespace-pre-wrap leading-relaxed text-base">
                    {candidate?.job_roles || 'Not specified'}
                  </p>
                </div>

                {/* Education_Certifications */}
                <div className="bg-white border-2 border-teal-300 rounded-lg p-6 shadow-sm">
                  <h4 className="font-bold text-gray-900 mb-3 text-xl flex items-center gap-2">
                    <span className="text-2xl">🎓</span> Education & Certifications
                  </h4>
                  <p className="text-gray-900 whitespace-pre-wrap leading-relaxed text-base">
                    {candidate?.Education_Certifications || 'Not specified'}
                  </p>
                </div>

                {/* Work_Style */}
                <div className="bg-white border-2 border-orange-300 rounded-lg p-6 shadow-sm">
                  <h4 className="font-bold text-gray-900 mb-3 text-xl flex items-center gap-2">
                    <span className="text-2xl">⚙️</span> Work Style
                  </h4>
                  <p className="text-gray-900 whitespace-pre-wrap leading-relaxed text-base">
                    {candidate?.Work_Style || 'Not specified'}
                  </p>
                </div>

                {/* Industry_Background */}
                <div className="bg-white border-2 border-pink-300 rounded-lg p-6 shadow-sm">
                  <h4 className="font-bold text-gray-900 mb-3 text-xl flex items-center gap-2">
                    <span className="text-2xl">🏢</span> Industry Background
                  </h4>
                  <p className="text-sm mb-3">
                    <span className="font-semibold text-gray-900">Current Industry:</span>{' '}
                    <span className="text-gray-900 text-base">{candidate?.industry || 'Not specified'}</span>
                  </p>
                  <p className="text-gray-900 whitespace-pre-wrap leading-relaxed text-base">
                    {candidate?.Industry_Background || 'Not specified'}
                  </p>
                </div>

                {/* Country & Desired_Rate Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border-2 border-cyan-300 rounded-lg p-6 shadow-sm">
                    <h4 className="font-bold text-gray-900 mb-3 text-xl flex items-center gap-2">
                      <Globe size={24} className="text-cyan-600" />
                      Location (Country)
                    </h4>
                    <p className="text-2xl font-bold text-gray-900">
                      {candidate?.country || 'Not specified'}
                    </p>
                  </div>

                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-6 shadow-sm">
                    <h4 className="font-bold text-gray-900 mb-3 text-xl flex items-center gap-2">
                      <span className="text-2xl">💰</span> Desired Rate
                    </h4>
                    <p className="text-2xl font-bold text-gray-900">
                      ${candidate?.desired_rate || 'Not specified'}
                    </p>
                  </div>
                </div>

                {/* Candidate Bio */}
                {candidate?.candidate_bio && (
                  <div className="bg-white border-2 border-gray-300 rounded-lg p-6 shadow-sm">
                    <h4 className="font-bold text-gray-900 mb-3 text-xl flex items-center gap-2">
                      <span className="text-2xl">📝</span> Candidate Bio
                    </h4>
                    <p className="text-gray-900 whitespace-pre-wrap leading-relaxed text-base">
                      {candidate.candidate_bio}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="persons_name" className="block text-sm font-medium text-gray-700 mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      id="persons_name"
                      name="persons_name"
                      value={formData.persons_name}
                      onChange={handleChange}
                      required
                      disabled={isPending}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 text-black bg-white"
                      placeholder="Enter candidate name"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={isPending}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 text-black bg-white"
                      placeholder="Enter email"
                    />
                  </div>

                  <div>
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                      Country *
                    </label>
                    <input
                      type="text"
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      disabled={isPending}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 text-black bg-white"
                      placeholder="Enter country"
                    />
                  </div>

                  <div>
                    <label htmlFor="desired_rate" className="block text-sm font-medium text-gray-700 mb-2">
                      Desired Rate ($/hr or $/month) *
                    </label>
                    <input
                      type="text"
                      id="desired_rate"
                      name="desired_rate"
                      value={formData.desired_rate}
                      onChange={handleChange}
                      disabled={isPending}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 text-black bg-white"
                      placeholder="e.g., 20 or 3000"
                    />
                  </div>

                  <div>
                    <label htmlFor="candidate_job_title" className="block text-sm font-medium text-gray-700 mb-2">
                      Job Title
                    </label>
                    <input
                      type="text"
                      id="candidate_job_title"
                      name="candidate_job_title"
                      value={formData.candidate_job_title}
                      onChange={handleChange}
                      disabled={isPending}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 text-black bg-white"
                      placeholder="Enter job title"
                    />
                  </div>

                  <div>
                    <label htmlFor="candidate_status" className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <input
                      type="text"
                      id="candidate_status"
                      name="candidate_status"
                      value={formData.candidate_status}
                      onChange={handleChange}
                      disabled={isPending}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 text-black bg-white"
                      placeholder="Enter status"
                    />
                  </div>

                  <div>
                    <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-2">
                      Industry
                    </label>
                    <input
                      type="text"
                      id="industry"
                      name="industry"
                      value={formData.industry}
                      onChange={handleChange}
                      disabled={isPending}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 text-black bg-white"
                      placeholder="Enter industry"
                    />
                  </div>

                  <div>
                    <label htmlFor="english_accent" className="block text-sm font-medium text-gray-700 mb-2">
                      English Accent
                    </label>
                    <input
                      type="text"
                      id="english_accent"
                      name="english_accent"
                      value={formData.english_accent}
                      onChange={handleChange}
                      disabled={isPending}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 text-black bg-white"
                      placeholder="e.g., American, British, Neutral"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="resume_link" className="block text-sm font-medium text-gray-700 mb-2">
                      Resume Link *
                    </label>
                    <input
                      type="url"
                      id="resume_link"
                      name="resume_link"
                      value={formData.resume_link}
                      onChange={handleChange}
                      disabled={isPending}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 text-black bg-white"
                      placeholder="https://..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="linkedin_link" className="block text-sm font-medium text-gray-700 mb-2">
                      LinkedIn URL
                    </label>
                    <input
                      type="url"
                      id="linkedin_link"
                      name="linkedin_link"
                      value={formData.linkedin_link}
                      onChange={handleChange}
                      disabled={isPending}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 text-black bg-white"
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="voice_link" className="block text-sm font-medium text-gray-700 mb-2">
                      Voice Link
                    </label>
                    <input
                      type="url"
                      id="voice_link"
                      name="voice_link"
                      value={formData.voice_link}
                      onChange={handleChange}
                      disabled={isPending}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 text-black bg-white"
                      placeholder="https://..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="Skills_Technical" className="block text-sm font-medium text-gray-700 mb-2">
                      Technical Skills * (QBO, GAAP, Accounting Software)
                    </label>
                    <textarea
                      id="Skills_Technical"
                      name="Skills_Technical"
                      value={formData.Skills_Technical}
                      onChange={handleChange}
                      rows={4}
                      disabled={isPending}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 resize-none text-black bg-white"
                      placeholder="e.g., QuickBooks Online, NetSuite, Excel, US GAAP, Financial Reporting, etc."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="Experience_Role" className="block text-sm font-medium text-gray-700 mb-2">
                      Experience & Role History * (Accounting, Leadership, Client Management)
                    </label>
                    <textarea
                      id="Experience_Role"
                      name="Experience_Role"
                      value={formData.Experience_Role}
                      onChange={handleChange}
                      rows={4}
                      disabled={isPending}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 resize-none text-black bg-white"
                      placeholder="Describe work experience, accounting background, team leadership, and client management experience"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="Communication_Skills" className="block text-sm font-medium text-gray-700 mb-2">
                      Communication Skills * (Written & Verbal English)
                    </label>
                    <textarea
                      id="Communication_Skills"
                      name="Communication_Skills"
                      value={formData.Communication_Skills}
                      onChange={handleChange}
                      rows={3}
                      disabled={isPending}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 resize-none text-black bg-white"
                      placeholder="Describe written and verbal communication abilities, client-facing experience"
                    />
                  </div>

                  <div>
                    <label htmlFor="Language_Proficiency" className="block text-sm font-medium text-gray-700 mb-2">
                      Language Proficiency *
                    </label>
                    <input
                      type="text"
                      id="Language_Proficiency"
                      name="Language_Proficiency"
                      value={formData.Language_Proficiency}
                      onChange={handleChange}
                      disabled={isPending}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 text-black bg-white"
                      placeholder="e.g., English (Fluent), Spanish (Native)"
                    />
                  </div>

                  <div>
                    <label htmlFor="Work_Style" className="block text-sm font-medium text-gray-700 mb-2">
                      Work Style * (Remote, Collaboration)
                    </label>
                    <input
                      type="text"
                      id="Work_Style"
                      name="Work_Style"
                      value={formData.Work_Style}
                      onChange={handleChange}
                      disabled={isPending}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 text-black bg-white"
                      placeholder="e.g., Remote, Collaborative, Independent"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="job_roles" className="block text-sm font-medium text-gray-700 mb-2">
                      Job Roles * (Manager, Lead, Supervisor)
                    </label>
                    <textarea
                      id="job_roles"
                      name="job_roles"
                      value={formData.job_roles}
                      onChange={handleChange}
                      rows={3}
                      disabled={isPending}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 resize-none text-black bg-white"
                      placeholder="Enter job roles, leadership positions"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="Education_Certifications" className="block text-sm font-medium text-gray-700 mb-2">
                      Education & Certifications * (CPA, Degrees, GAAP)
                    </label>
                    <textarea
                      id="Education_Certifications"
                      name="Education_Certifications"
                      value={formData.Education_Certifications}
                      onChange={handleChange}
                      rows={3}
                      disabled={isPending}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 resize-none text-black bg-white"
                      placeholder="e.g., CPA, Bachelor's in Accounting, US GAAP Certification, etc."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="Industry_Background" className="block text-sm font-medium text-gray-700 mb-2">
                      Industry Background
                    </label>
                    <textarea
                      id="Industry_Background"
                      name="Industry_Background"
                      value={formData.Industry_Background}
                      onChange={handleChange}
                      rows={3}
                      disabled={isPending}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 resize-none text-black bg-white"
                      placeholder="Describe relevant industry experience"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="candidate_bio" className="block text-sm font-medium text-gray-700 mb-2">
                      Candidate Bio
                    </label>
                    <textarea
                      id="candidate_bio"
                      name="candidate_bio"
                      value={formData.candidate_bio}
                      onChange={handleChange}
                      rows={4}
                      disabled={isPending}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 resize-none text-black bg-white"
                      placeholder="Enter candidate bio..."
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSubmit}
                    disabled={isPending || !formData.persons_name}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save size={18} />
                    {isPending ? 'Saving...' : mode === 'create' ? 'Create Candidate' : 'Save Changes'}
                  </button>
                  <button
                    onClick={onClose}
                    disabled={isPending}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Email Modal */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            {/* Email Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Send Email</h2>
                <p className="text-xs text-blue-600 mt-1">
                  ✓ Administrative access confirmed
                </p>
              </div>
              <button
                onClick={handleCloseEmailModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
                disabled={emailLoading}
              >
                <X size={24} className="text-gray-600" />
              </button>
            </div>

            {/* Email Modal Body */}
            <div className="p-6 space-y-4">
              {/* Success Message */}
              {emailSuccess && (
                <div className="bg-green-50 border-2 border-green-400 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">✅</span>
                    <div>
                      <p className="font-bold text-green-900">Email Sent Successfully!</p>
                      <p className="text-sm text-green-700">Your email has been sent to {emailToEmail}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {emailError && (
                <div className="bg-red-50 border-2 border-red-400 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">❌</span>
                    <div>
                      <p className="font-bold text-red-900">Error</p>
                      <p className="text-sm text-red-700">{emailError}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* FROM Field (Read-only) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  From
                </label>
                <input
                  type="email"
                  value={fromEmail}
                  disabled
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                />
              </div>

              {/* TO Field (Editable) */}
              <div>
                <label htmlFor="emailToEmail" className="block text-sm font-semibold text-gray-700 mb-2">
                  To *
                </label>
                <input
                  id="emailToEmail"
                  type="email"
                  value={emailToEmail}
                  onChange={(e) => setEmailToEmail(e.target.value)}
                  placeholder="Enter recipient email"
                  disabled={emailLoading || emailSuccess}
                  className="w-full px-4 py-3 border-2 text-black border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              {/* CC Field */}
              <div>
                <label htmlFor="emailCcEmails" className="block text-sm font-semibold text-gray-700 mb-2">
                  CC (Optional)
                </label>
                <input
                  id="emailCcEmails"
                  type="text"
                  value={emailCcEmails}
                  onChange={(e) => setEmailCcEmails(e.target.value)}
                  placeholder="Enter CC emails separated by commas"
                  disabled={emailLoading || emailSuccess}
                  className="w-full px-4 py-3 border-2 text-black border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                
                {/* CC Usage Instructions */}
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">CC Email Rules:</p>
                      <ul className="text-xs space-y-1">
                        <li>• Separate multiple emails with commas</li>
                        <li>• Example: manager@company.com, hr@company.com, director@company.com</li>
                        <li>• Spaces around commas are automatically trimmed</li>
                        <li>• All emails will be validated before sending</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Show parsed CC emails preview */}
                {emailCcEmails.trim() && (
                  <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded">
                    <p className="text-xs font-medium text-gray-700 mb-1">CC Recipients ({parseCcEmails(emailCcEmails).length}):</p>
                    <div className="flex flex-wrap gap-1">
                      {parseCcEmails(emailCcEmails).map((email, index) => (
                        <span 
                          key={index} 
                          className={`px-2 py-1 rounded text-xs ${
                            validateEmail(email) 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {email}
                          {!validateEmail(email) && ' ❌'}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Subject Field */}
              <div>
                <label htmlFor="emailSubject" className="block text-sm font-semibold text-gray-700 mb-2">
                  Subject *
                </label>
                <input
                  id="emailSubject"
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Enter email subject"
                  disabled={emailLoading || emailSuccess}
                  className="w-full px-4 py-3 border-2 text-black border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              {/* Message Field */}
              <div>
                <label htmlFor="emailMessage" className="block text-sm font-semibold text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  id="emailMessage"
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  placeholder="Enter your message here..."
                  rows={12}
                  disabled={emailLoading || emailSuccess}
                  className="w-full px-4 py-3 border-2 text-black border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Your message will be formatted as HTML before sending
                </p>
              </div>
            </div>

            {/* Email Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={handleCloseEmailModal}
                disabled={emailLoading}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                disabled={emailLoading || emailSuccess}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {emailLoading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    Send Email
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}