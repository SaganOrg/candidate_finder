import { getCandidates, getFilterOptions } from '@/lib/actions/candidates';
import CandidateTable from '@/components/CandidateTable';
import FilterPanel from '@/components/FilterPanel';
import { Suspense } from 'react';

export default async function DashboardPage({ searchParams }) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search || '';
  
  const filters = {
    country: params.country || '',
    candidate_status: params.status || '',
    job_roles: params.job_roles || '',
    english_accent: params.accent || '',
    industry: params.industry || '',
  };

  const [candidatesResult, filterOptions] = await Promise.all([
    getCandidates(page, 50, filters, search),
    getFilterOptions(),
  ]);

  const { data: candidates, count, error } = candidatesResult;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Candidates</h1>
          <p className="text-gray-600 mt-1">
            Manage and filter your candidate database
          </p>
        </div>
      </div>

      <Suspense fallback={<div>Loading filters...</div>}>
        <FilterPanel 
          filterOptions={filterOptions}
          currentFilters={filters}
          currentSearch={search}
        />
      </Suspense>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Error loading candidates: {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-4">
        <p className="text-gray-600">
          Showing <span className="font-semibold">{candidates.length}</span> of{' '}
          <span className="font-semibold">{count.toLocaleString()}</span> candidates
        </p>
      </div>

      <Suspense fallback={<div>Loading candidates...</div>}>
        <CandidateTable 
          candidates={candidates} 
          totalCount={count}
          currentPage={page}
          pageSize={50}
        />
      </Suspense>
    </div>
  );
}