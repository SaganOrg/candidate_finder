import DashboardFilterPanel from '@/components/FilterPanel';
import CandidateTable from '@/components/CandidateTable';
import { fetchCandidatesForDashboard, fetchFilterOptionsForDashboard } from './dashboard-actions';

export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }) {
  // Await searchParams for Next.js 15+ compatibility
  const awaitedSearchParams = await searchParams;
  
  // Convert searchParams to a plain object
  const params = {};
  for (const key in awaitedSearchParams) {
    params[key] = Array.isArray(awaitedSearchParams[key])
      ? awaitedSearchParams[key][0]
      : awaitedSearchParams[key];
  }

  // Fetch candidates using vector search and filter options
  const [{ candidates, totalCount }, filterOptions] = await Promise.all([
    fetchCandidatesForDashboard(params),
    fetchFilterOptionsForDashboard()
  ]);

  const currentPage = Number(params.page || 1);
  const pageSize = Number(params.pageSize || 20);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Candidate Dashboard</h1>
          <p className="text-gray-600">
            Manage and search candidates using AI-powered semantic search
          </p>
        </div>

        <div className="space-y-6">
          {/* Filter Panel with Vector Search */}
          <DashboardFilterPanel 
            filterOptions={filterOptions}
            currentFilters={params}
            currentSearch={params.search}
          />

          {/* Results Summary */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-gray-600">
                  Showing {candidates.length} of {totalCount} candidates
                  {currentPage > 1 && ` (Page ${currentPage})`}
                </div>
                {params.search && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-purple-100 border border-purple-300 rounded-full">
                    <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                    <span className="text-purple-800 text-sm font-medium">AI Search Active</span>
                  </div>
                )}
               
              </div>
              
              <div className="text-sm text-gray-500">
                {totalCount > 0 && `${Math.ceil(totalCount / pageSize)} total pages`}
              </div>

            </div>
            
            {/* Search Query Display */}
            {params.search && (
              <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <span className="text-sm font-medium text-purple-900">Search Query:</span>
                <p className="text-sm text-purple-700 mt-1">{params.search}</p>
              </div>
            )}

            {/* Active Filters Display */}
            {(params.country || params.status || params.job_roles || params.accent || params.industry || params.has_resume) && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="text-sm font-medium text-blue-900">Active Filters:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {params.country && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                      Country: {params.country}
                    </span>
                  )}
                  {params.status && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                      Status: {params.status}
                    </span>
                  )}
                  {params.job_roles && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                      Role: {params.job_roles}
                    </span>
                  )}
                  {params.accent && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                      Accent: {params.accent}
                    </span>
                  )}
                  {params.industry && (
                    <span className="px-2 py-1 bg-pink-100 text-pink-800 rounded text-xs">
                      Industry: {params.industry}
                    </span>
                  )}
                  {params.has_resume === 'true' && (
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs">
                      Has Resume
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Candidate Table */}
          <CandidateTable
            candidates={candidates}
            totalCount={totalCount}
            currentPage={currentPage}
            pageSize={pageSize}
          />

          {/* No Results State */}
          {candidates.length === 0 && totalCount === 0 && (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No candidates found</h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your search terms or filters to find more candidates.
                </p>
                <div className="text-sm text-gray-500">
                  <p className="font-medium mb-2">Search tips:</p>
                  <ul className="text-left space-y-1">
                    <li>• Use natural language: experienced React developer</li>
                    <li>• Try broader keywords: developer instead of senior react developer</li>
                    <li>• Remove some filters to expand your search</li>
                    <li>• Check spelling and try alternative terms</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}