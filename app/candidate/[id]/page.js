import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Mail, Globe, FileText, Linkedin, Volume2, Briefcase, CheckCircle, User } from 'lucide-react';
import CandidateStatusActions from './CandidateStatusActions';
import EmailCandidateButton from './EmailCandidateButton';

async function getCandidateById(id) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('candidates')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

async function getCurrentUser() {
  const supabase = await createClient();
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return null;
    }

    // Get user profile from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', user.email)
      .single();

    if (profileError || !profile) {
      return { user, profile: null };
    }

    return { user, profile };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export default async function PublicCandidatePage({ params }) {
  console.log(params);
  const { id } = await params;
  const candidate = await getCandidateById(id);
  const currentUser = await getCurrentUser();

  if (!candidate) {
    notFound();
  }

  const isLoggedIn = !!currentUser?.user;
  const userProfile = currentUser?.profile;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold text-gray-900">Candidate Profile</h1>
              {isLoggedIn && userProfile && (
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border-2 border-blue-300 rounded-lg">
                  <User size={20} className="text-blue-600" />
                  <span className="text-blue-800 font-semibold">
                    Welcome, {userProfile.name || userProfile.email || 'User'}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                isLoggedIn 
                  ? '' 
                  : 'bg-blue-100 text-blue-800 border-2 border-blue-300'
              }`}>
                {isLoggedIn ? '' : 'Public View'}
              </span>
              
              {/* Show admin controls only for logged-in users */}
              {isLoggedIn && (
                <>
                  <EmailCandidateButton 
                    candidateEmail={candidate.email}
                    candidateName={candidate.persons_name}
                    isLoggedIn={isLoggedIn}
                  />
                  <CandidateStatusActions 
                    candidateId={candidate.id}
                    isBlacklisted={candidate.blacklist || false}
                    candidateStatus={candidate.candidate_status || 'Available'}
                    isLoggedIn={isLoggedIn}
                  />
                </>
              )}
            </div>
          </div>
          <p className="text-gray-600">
            {isLoggedIn 
              ? 'View and manage detailed information about this candidate' 
              : 'View detailed information about this candidate'
            }
          </p>
        </div>

        <div className="space-y-6">
          {/* Blacklist/Availability Status Banner - Only show for logged-in users */}
          {isLoggedIn && candidate.blacklist && (
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

          {isLoggedIn && candidate.candidate_status === 'Not Available' && !candidate.blacklist && (
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

          {/* Candidate Header with Name & Email */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border-2 border-blue-300">
            <div className="flex items-start justify-between">
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
              <div className="text-right">
                <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                  candidate?.candidate_status === 'Available' 
                    ? 'bg-green-100 text-green-800' 
                    : candidate?.candidate_status === 'Not Available'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {candidate?.candidate_status || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Access Links - Resume, LinkedIn, Voice, Email */}
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

          {/* Footer */}
          <div className="bg-gray-100 rounded-lg p-6 text-center">
            <p className="text-gray-600 text-sm">
              {isLoggedIn 
                ? 'You are viewing this candidate profile with administrative privileges.' 
                : 'This is a public profile page. For more information or to contact this candidate, please use the links provided above.'
              }
            </p>
            {isLoggedIn && userProfile && (
              <p className="text-gray-500 text-xs mt-2">
                Logged in as: {userProfile.name || userProfile.email}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}