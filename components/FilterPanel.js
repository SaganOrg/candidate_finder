'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter, X } from 'lucide-react';

export default function FilterPanel({ filterOptions, currentFilters, currentSearch }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState(currentSearch);
  
  const [filters, setFilters] = useState({
    country: currentFilters.country || '',
    status: currentFilters.candidate_status || '',
    job_roles: currentFilters.job_roles || '',
    accent: currentFilters.english_accent || '',
    industry: currentFilters.industry || '',
    has_resume: currentFilters.has_resume || false,
  });

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (searchTerm) params.set('search', searchTerm);
    else params.delete('search');
    
    if (filters.country) params.set('country', filters.country);
    else params.delete('country');
    
    if (filters.status) params.set('status', filters.status);
    else params.delete('status');
    
    if (filters.job_roles) params.set('job_roles', filters.job_roles);
    else params.delete('job_roles');
    
    if (filters.accent) params.set('accent', filters.accent);
    else params.delete('accent');
    
    if (filters.industry) params.set('industry', filters.industry);
    else params.delete('industry');
    
    if (filters.has_resume) params.set('has_resume', 'true');
    else params.delete('has_resume');
    
    params.set('page', '1');
    
    startTransition(() => {
      router.push(`/dashboard?${params.toString()}`);
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({
      country: '',
      status: '',
      job_roles: '',
      accent: '',
      industry: '',
      has_resume: false,
    });
    
    startTransition(() => {
      router.push('/dashboard');
    });
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      applyFilters();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black" size={20} />
            <input
              type="text"
              placeholder="Search by comma-separated keywords (e.g., USA, developer, remote)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleSearch}
              className="w-full pl-10 pr-4 py-2 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isPending}
            />
          </div>
          
        

          {searchTerm && (
            <div className="mt-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
              <span className="text-xs font-medium text-green-900">Active Keywords:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {searchTerm.split(',').map((k, index) => k.trim()).filter(k => k).map((keyword, index) => (
                  <span key={index} className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-800 rounded-lg transition"
          disabled={isPending}
        >
          <Filter size={18} />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
        <button
          onClick={applyFilters}
          disabled={isPending}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition disabled:opacity-50"
        >
          <Search size={18} />
          Search
        </button>
      </div>

        {/* Search Rules Info */}
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-gray-700 space-y-2">
            <div className="font-semibold text-blue-900">Search Rules:</div>
            <ul className="space-y-1 ml-4 list-disc">
              <li>
                <span className="font-medium">Comma-separated keywords:</span> &quot;USA, developer, remote&quot; → Searches for these 3 keywords across all 16 columns
              </li>
              <li>
             <span className="font-medium">Multiple terms:</span> &quot;Python, Senior&quot; → Finds candidates with Python OR Senior in any searchable field
              </li>
              <li>
             <span className="font-medium">Partial matching:</span> &quot;dev&quot; will match &quot;developer&quot;, &quot;development&quot;, etc. (case-insensitive)
              </li>
            </ul>
            <div className="text-xs text-gray-600 mt-2">
              Searches across: country, region, bio, job title, roles, accent, industry, email, work style, education, location, communication, language, experience, skills
            </div>
            <div className="text-xs text-red-600 mt-2">
              Note: If no data showed please refresh the page. 
            </div>
          </div>

      {showFilters && (
        <div className="border-t pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country
            </label>
            <select
              value={filters.country}
              onChange={(e) => setFilters({ ...filters, country: e.target.value })}
              className="w-full px-4 py-2 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={isPending}
            >
              <option value="">All Countries</option>
              {filterOptions.countries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-4 py-2 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={isPending}
            >
              <option value="">All Statuses</option>
              {filterOptions.statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Roles
            </label>
            <input
              type="text"
              placeholder="Enter job role"
              value={filters.job_roles}
              onChange={(e) => setFilters({ ...filters, job_roles: e.target.value })}
              className="w-full px-4 py-2 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={isPending}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              English Accent
            </label>
            <select
              value={filters.accent}
              onChange={(e) => setFilters({ ...filters, accent: e.target.value })}
              className="w-full px-4 py-2 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={isPending}
            >
              <option value="">All Accents</option>
              {filterOptions.accents.map((accent) => (
                <option key={accent} value={accent}>
                  {accent}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Industry
            </label>
            <select
              value={filters.industry}
              onChange={(e) => setFilters({ ...filters, industry: e.target.value })}
              className="w-full px-4 py-2 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={isPending}
            >
              <option value="">All Industries</option>
              {filterOptions.industries.map((industry) => (
                <option key={industry} value={industry}>
                  {industry}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resume Availability
            </label>
            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="has_resume"
                checked={filters.has_resume}
                onChange={(e) => setFilters({ ...filters, has_resume: e.target.checked })}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                disabled={isPending}
              />
              <label htmlFor="has_resume" className="text-sm text-gray-700">
                Has Resume Link
              </label>
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={clearFilters}
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition disabled:opacity-50"
            >
              <X size={18} />
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {isPending && (
        <div className="flex items-center justify-center py-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading...</span>
        </div>
      )}
    </div>
  );
}