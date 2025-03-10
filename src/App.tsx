import React, { useState, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import CandidateCard from './components/CandidateCard';
import AcceptedCandidatesList from './components/AcceptedCandidatesList';
import useSearchStore from './store/searchStore';
import { extractKeywords } from './services/api';

function App() {
  const [jobDescription, setJobDescription] = useState('');
  const {
    currentCandidate,
    acceptedCandidates,
    isLoading,
    error,
    setKeywords,
    fetchNextCandidate,
    acceptCandidate,
    rejectCandidate,
    reorderAcceptedCandidates
  } = useSearchStore();

  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleAccept = async () => {
    if (currentCandidate && !isTransitioning) {
      setIsTransitioning(true);
      acceptCandidate(currentCandidate);
      await fetchNextCandidate();
      setIsTransitioning(false);
    }
  };

  const handleReject = async () => {
    if (currentCandidate && !isTransitioning) {
      setIsTransitioning(true);
      rejectCandidate(currentCandidate);
      await fetchNextCandidate();
      setIsTransitioning(false);
    }
  };

  const handleSearch = async () => {
    if (!jobDescription.trim()) {
      useSearchStore.setState({ 
        error: 'Please enter a job description' 
      });
      return;
    }
    
    try {
      const keywords = await extractKeywords(jobDescription);
      console.log('Extracted keywords:', keywords);
      
      setKeywords(keywords);
      await fetchNextCandidate();
    } catch (err) {
      console.error('Search failed:', err);
      useSearchStore.setState({
        error: err instanceof Error ? err.message : 'Failed to fetch candidates'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-900">
          AI-Powered Candidate Sourcing
        </h1>

        <div className="mb-8">
          <div className="relative">
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Enter job description..."
              className="w-full h-32 p-4 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 transition-colors"
            />
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="absolute bottom-4 right-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
              {isLoading ? 'Searching...' : 'Find Candidates'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {(isLoading || currentCandidate) && (
          <div className="mb-8">
            <CandidateCard
              candidate={currentCandidate || {
                name: '',
                profileUrl: '',
                summary: '',
                profilePic: '',
                justification: '',
                skills: [],
                repositories: []
              }}
              onAccept={handleAccept}
              onReject={handleReject}
              isLoading={isLoading || isTransitioning}
            />
          </div>
        )}

        <AcceptedCandidatesList
          candidates={acceptedCandidates}
          onReorder={reorderAcceptedCandidates}
        />
      </div>
    </div>
  );
}

export default App;