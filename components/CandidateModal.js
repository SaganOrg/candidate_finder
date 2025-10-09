'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { X, Save, ExternalLink, Mail, FileText, Linkedin, Globe, Briefcase, CheckCircle, Volume2, Ban, UserCheck, UserX } from 'lucide-react';
import { createCandidate, updateCandidate } from '@/lib/actions/candidates';

export default function CandidateModal({ mode, candidate, onClose }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  
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
        result = await createCandidate(formData);
      } else if (mode === 'edit') {
        result = await updateCandidate(candidate.id, formData);
      }

      if (result?.error) {
        setError(result.error);
      } else {
        router.refresh();
        onClose();
      }
    });
  };

  const isViewMode = mode === 'view';
  const title = mode === 'view' ? 'Candidate Profile' : mode === 'edit' ? 'Edit Candidate' : 'Add New Candidate';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full my-8">
        <div className="sticky top-0 bg-white border-b px-6 py-4 rounded-t-lg z-10">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
              disabled={isPending}
            >
              <X size={24} />
            </button>
          </div>
          {isViewMode && (
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={async () => {
                  const action = candidate?.candidate_status === 'Available' ? 'mark as Not Available' : 'mark as Available';
                  if (!confirm(`Are you sure you want to ${action} ${candidate?.persons_name}?`)) return;
                  
                  startTransition(async () => {
                    const { toggleAvailability } = await import('@/lib/actions/candidates');
                    const result = await toggleAvailability(candidate.id, candidate.candidate_status);
                    
                    if (result.error) {
                      alert('Error updating availability: ' + result.error);
                    } else {
                      router.refresh();
                      onClose();
                    }
                  });
                }}
                disabled={isPending}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition ${
                  candidate?.candidate_status === 'Available'
                    ? 'bg-orange-600 text-white hover:bg-orange-700'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {candidate?.candidate_status === 'Available' ? (
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

              <button
                onClick={async () => {
                  if (!confirm(`Are you sure you want to ${candidate?.blacklist ? 'remove from blacklist' : 'blacklist'} ${candidate?.persons_name}?`)) return;
                  
                  startTransition(async () => {
                    const { toggleBlacklist } = await import('@/lib/actions/candidates');
                    const result = await toggleBlacklist(candidate.id, candidate.blacklist);
                    
                    if (result.error) {
                      alert('Error updating blacklist status: ' + result.error);
                    } else {
                      router.refresh();
                      onClose();
                    }
                  });
                }}
                disabled={isPending}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition ${
                  candidate?.blacklist
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {candidate?.blacklist ? (
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

              {candidate?.candidate_status === 'Available' && (
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                  ✓ Available
                </span>
              )}
              {candidate?.candidate_status === 'Not Available' && (
                <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-semibold">
                  ⏸ Not Available
                </span>
              )}
              {candidate?.blacklist && (
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
                    <span className="inline-block px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
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
  );
}