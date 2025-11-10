'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Clock, Database, Upload, Users, Activity } from 'lucide-react';

export default function AdminMigrationPage() {
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  
  const [currentStep, setCurrentStep] = useState('idle'); // idle, preview, processing, complete
  const [previewData, setPreviewData] = useState(null);
  const [migrationProgress, setMigrationProgress] = useState({
    airtableToSupabase: { completed: 0, total: 0, status: 'pending' },
    supabaseToSupabase: { completed: 0, total: 0, status: 'pending' },
    embeddings: { completed: 0, total: 0, status: 'pending' }
  });
  
  const [logs, setLogs] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { message, type, timestamp }]);
  };

  const handlePreview = async () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      addLog('Please select both start and end dates', 'error');
      return;
    }

    setCurrentStep('preview');
    addLog('Fetching preview data from Airtable...');

    try {
      const response = await fetch('/api/admin/migration/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dateRange)
      });

      const data = await response.json();
      
      if (response.ok) {
        setPreviewData(data);
        addLog(`Found ${data.totalRecords} records in the specified date range`, 'success');
        if (data.newRecords < data.totalRecords) {
          addLog(`${data.totalRecords - data.newRecords} records will be skipped as duplicates`, 'warning');
        }
      } else {
        addLog(`Preview failed: ${data.error}`, 'error');
        setCurrentStep('idle');
      }
    } catch (error) {
      addLog(`Preview error: ${error.message}`, 'error');
      setCurrentStep('idle');
    }
  };

  const handleStartMigration = async () => {
    if (!previewData) return;

    // Check if there are new records to process
    if (previewData.newRecords === 0) {
      addLog('No new records to process. All records in this date range already exist in the system.', 'warning');
      return;
    }

    setIsProcessing(true);
    setCurrentStep('processing');
    addLog('Starting migration process...', 'success');

    // Show warning about not closing the page
    const warningShown = window.confirm(
      'IMPORTANT: This migration will take time to complete. Please DO NOT close this tab or browser window during the process. Click OK to continue.'
    );

    if (!warningShown) {
      setIsProcessing(false);
      setCurrentStep('preview');
      return;
    }

    try {
      // Step 1: Airtable to Supabase
      await runAirtableToSupabase();
      
      // Step 2: Supabase to Supabase (data transformation)
      // await runSupabaseToSupabase();
      
      // Step 3: Generate embeddings and process data
      // await runEmbeddingGeneration();
      
      setCurrentStep('complete');
      addLog('Migration completed successfully!', 'success');
      
    } catch (error) {
      addLog(`Migration failed: ${error.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const runAirtableToSupabase = async () => {
    addLog('Phase 1: Migrating data from Airtable to Supabase...');
    setMigrationProgress(prev => ({
      ...prev,
      airtableToSupabase: { ...prev.airtableToSupabase, status: 'running' }
    }));

    const response = await fetch('/api/admin/migration/airtable-to-supabase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dateRange)
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          if (data.type === 'progress') {
            setMigrationProgress(prev => ({
              ...prev,
              airtableToSupabase: {
                completed: data.completed,
                total: data.total,
                status: 'running'
              }
            }));
            addLog(`Airtable migration: ${data.completed}/${data.total} records`);
          } else if (data.type === 'complete') {
            setMigrationProgress(prev => ({
              ...prev,
              airtableToSupabase: { ...prev.airtableToSupabase, status: 'complete' }
            }));
            addLog('Airtable to Supabase migration completed', 'success');
            return;
          } else if (data.type === 'error') {
            addLog(data.message, 'error');
          }
        } catch (e) {
          // Ignore parsing errors for partial chunks
        }
      }
    }
  };

  const runSupabaseToSupabase = async () => {
    addLog('Phase 2: Transforming data to candidates table...');
    setMigrationProgress(prev => ({
      ...prev,
      supabaseToSupabase: { ...prev.supabaseToSupabase, status: 'running' }
    }));

    const response = await fetch('/api/admin/migration/supabase-to-supabase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dateRange })
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          if (data.type === 'progress') {
            setMigrationProgress(prev => ({
              ...prev,
              supabaseToSupabase: {
                completed: data.completed,
                total: data.total,
                status: 'running'
              }
            }));
            addLog(`Data transformation: ${data.completed}/${data.total} records`);
          } else if (data.type === 'complete') {
            setMigrationProgress(prev => ({
              ...prev,
              supabaseToSupabase: { ...prev.supabaseToSupabase, status: 'complete' }
            }));
            addLog('Data transformation completed', 'success');
            return;
          } else if (data.type === 'error') {
            addLog(data.message, 'error');
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }
    }
  };

  const runEmbeddingGeneration = async () => {
    addLog('Phase 3: Generating embeddings and processing resume data...');
    setMigrationProgress(prev => ({
      ...prev,
      embeddings: { ...prev.embeddings, status: 'running' }
    }));

    const response = await fetch('/api/admin/migration/generate-embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dateRange })
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          if (data.type === 'progress') {
            setMigrationProgress(prev => ({
              ...prev,
              embeddings: {
                completed: data.completed,
                total: data.total,
                status: 'running'
              }
            }));
            addLog(`Embedding generation: ${data.completed}/${data.total} candidates processed`);
            if (data.currentCandidate) {
              addLog(`Processing: ${data.currentCandidate}`);
            }
          } else if (data.type === 'complete') {
            setMigrationProgress(prev => ({
              ...prev,
              embeddings: { ...prev.embeddings, status: 'complete' }
            }));
            addLog(`Embedding generation completed: ${data.totalSuccessful}/${data.totalProcessed} successful`, 'success');
            return;
          } else if (data.type === 'error') {
            addLog(data.message, 'error');
          }
        } catch (e) {
          // Ignore parsing errors for partial chunks
        }
      }
    }
  };

  // Warn user before closing page during migration
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isProcessing) {
        e.preventDefault();
        e.returnValue = 'Migration is in progress. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isProcessing]);

  const getStepStatus = (step) => {
    const status = migrationProgress[step]?.status || 'pending';
    switch (status) {
      case 'complete': return { icon: CheckCircle, color: 'text-green-600' };
      case 'running': return { icon: Activity, color: 'text-blue-600 animate-spin' };
      default: return { icon: Clock, color: 'text-gray-400' };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Migration Center</h1>
          <p className="text-gray-600">
            Migrate candidate data from Airtable with date range selection and duplicate detection
          </p>
        </div>

        {/* Warning Banner */}
        {isProcessing && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
              <div className="text-yellow-800">
                <p className="font-medium">Migration in Progress</p>
                <p className="text-sm">Please do not close this browser tab or window until migration is complete.</p>
              </div>
            </div>
          </div>
        )}

        {/* Date Range Selection */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Select Date Range</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full border border-gray-300 text-black rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isProcessing}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full border border-gray-300 text-black rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isProcessing}
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={handlePreview}
              disabled={isProcessing || currentStep === 'preview'}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Database className="w-4 h-4" />
              Preview Data
            </button>
            
            {currentStep === 'preview' && previewData && previewData.newRecords > 0 && (
              <button
                onClick={handleStartMigration}
                disabled={isProcessing}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Start Migration ({previewData.newRecords} records)
              </button>
            )}
          </div>
        </div>

        {/* Enhanced Preview Data */}
        {previewData && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Preview Results</h2>
            
            {/* Main Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <Users className="w-8 h-8 text-blue-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{previewData.totalRecords}</p>
                    <p className="text-sm text-blue-700">Total Records</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-green-600">{previewData.newRecords}</p>
                    <p className="text-sm text-green-700">New Records</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="w-8 h-8 text-yellow-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-yellow-600">{(previewData.duplicateEmails || 0) + (previewData.duplicateAirtableIds || 0)}</p>
                    <p className="text-sm text-yellow-700">Total Duplicates</p>
                  </div>
                </div>
              </div>
              
              {/* <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <Clock className="w-8 h-8 text-orange-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-orange-600">{previewData.estimatedTime}</p>
                    <p className="text-sm text-orange-700">Est. Time (min)</p>
                  </div>
                </div>
              </div> */}
            </div>

            {/* Processing Efficiency */}
            {previewData.summary && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-purple-900 mb-2">Processing Efficiency</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-700">
                      <span className="font-bold">{previewData.summary.processingEfficiency}%</span> of records will be processed
                    </p>
                    <p className="text-purple-600 text-sm">
                      {previewData.newRecords} new records out of {previewData.totalRecords} total
                    </p>
                  </div>
                  <div className="w-32 bg-purple-200 rounded-full h-3">
                    <div 
                      className="bg-purple-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${previewData.summary.processingEfficiency || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Duplicate Details */}
            {((previewData.duplicateEmails || 0) > 0 || (previewData.duplicateAirtableIds || 0) > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Email Duplicates */}
                {(previewData.duplicateEmails || 0) > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-semibold text-red-900 mb-2">
                      Email Duplicates ({previewData.duplicateEmails})
                    </h4>
                    <p className="text-red-700 text-sm mb-3">
                      These records have emails already in the candidates table
                    </p>
                    {previewData.duplicateInfo?.emailDuplicates?.length > 0 && (
                      <div className="space-y-2">
                        {previewData.duplicateInfo.emailDuplicates.map((duplicate, index) => (
                          <div key={index} className="bg-red-100 p-2 rounded text-xs">
                            <p className="font-medium">{duplicate.name}</p>
                            <p className="text-red-600">{duplicate.email}</p>
                          </div>
                        ))}
                        {previewData.duplicateEmails > 5 && (
                          <p className="text-red-600 text-xs">
                            ...and {previewData.duplicateEmails - 5} more
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Airtable ID Duplicates */}
                {(previewData.duplicateAirtableIds || 0) > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <h4 className="font-semibold text-orange-900 mb-2">
                      Airtable ID Duplicates ({previewData.duplicateAirtableIds})
                    </h4>
                    <p className="text-orange-700 text-sm mb-3">
                      These records are already in the airtable_candidates table
                    </p>
                    {previewData.duplicateInfo?.airtableIdDuplicates?.length > 0 && (
                      <div className="space-y-2">
                        {previewData.duplicateInfo.airtableIdDuplicates.map((duplicate, index) => (
                          <div key={index} className="bg-orange-100 p-2 rounded text-xs">
                            <p className="font-medium">{duplicate.name}</p>
                            <p className="text-orange-600">ID: {duplicate.airtableId}</p>
                          </div>
                        ))}
                        {previewData.duplicateAirtableIds > 5 && (
                          <p className="text-orange-600 text-xs">
                            ...and {previewData.duplicateAirtableIds - 5} more
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Detailed Breakdown */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Detailed Breakdown</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Valid Records</p>
                  <p className="font-bold text-gray-900">{previewData.validRecords}</p>
                </div>
                <div>
                  <p className="text-gray-600">With Resume</p>
                  <p className="font-bold text-gray-900">{previewData.recordsWithResume}</p>
                </div>
                <div>
                  <p className="text-gray-600">With Email</p>
                  <p className="font-bold text-gray-900">{previewData.recordsWithEmail}</p>
                </div>
                <div>
                  <p className="text-gray-600">Processing Time</p>
                  <p className="font-bold text-gray-900">{previewData.estimatedTime} min</p>
                </div>
              </div>
            </div>

            {/* Sample Record */}
            {previewData.sampleRecord && (
              <div className="mt-4 bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Sample New Record</h4>
                <div className="text-sm text-blue-800">
                  <p><span className="font-medium">Name:</span> {previewData.sampleRecord.name}</p>
                  <p><span className="font-medium">Email:</span> {previewData.sampleRecord.email}</p>
                  <p><span className="font-medium">Created:</span> {previewData.sampleRecord.createdTime}</p>
                  {previewData.sampleRecord.airtableId && (
                    <p><span className="font-medium">Airtable ID:</span> {previewData.sampleRecord.airtableId}</p>
                  )}
                </div>
              </div>
            )}

            {/* No New Records Warning */}
            {previewData.newRecords === 0 && previewData.totalRecords > 0 && (
              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                  <div className="text-yellow-800">
                    <p className="font-medium">No New Records to Process</p>
                    <p className="text-sm">All {previewData.totalRecords} records in this date range are already in the system.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Migration Progress */}
        {currentStep === 'processing' && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Migration Progress</h2>
            <div className="space-y-4">
              {Object.entries(migrationProgress).map(([key, progress]) => {
                const { icon: Icon, color } = getStepStatus(key);
                const stepNames = {
                  airtableToSupabase: 'Airtable → Supabase',
                  supabaseToSupabase: 'Data Transformation', 
                  embeddings: 'AI Processing & Embeddings'
                };
                
                return (
                  <div key={key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      <Icon className={`w-5 h-5 mr-3 ${color}`} />
                      <span className="font-medium">{stepNames[key]}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600">
                        {progress.completed}/{progress.total}
                      </span>
                      {progress.total > 0 && (
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(progress.completed / progress.total) * 100}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Activity Logs */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Activity Logs</h2>
          <div className="bg-gray-50 rounded-lg p-4 h-64 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500">No activity yet...</p>
            ) : (
              <div className="space-y-2">
                {logs.map((log, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-gray-400 font-mono">{log.timestamp}</span>
                    <span className={`font-medium ${
                      log.type === 'error' ? 'text-red-600' :
                      log.type === 'success' ? 'text-green-600' :
                      log.type === 'warning' ? 'text-yellow-600' :
                      'text-gray-600'
                    }`}>
                      {log.message}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}