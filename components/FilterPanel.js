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
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by name, email, or job title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleSearch}
            className="w-full pl-10 pr-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isPending}
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
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

      {showFilters && (
        <div className="border-t pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country
            </label>
            <select
              value={filters.country}
              onChange={(e) => setFilters({ ...filters, country: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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