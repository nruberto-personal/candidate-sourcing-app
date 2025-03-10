import { create } from 'zustand';
import type { SearchState, Candidate } from '../types';
import { fetchNextCandidate } from '../services/api';

const useSearchStore = create<SearchState>((set, get) => ({
  currentKeywords: [],
  currentCandidate: null,
  acceptedCandidates: [],
  rejectedCandidates: [],
  isLoading: false,
  error: null,

  setKeywords: (keywords: string[]) => {
    set({ currentKeywords: keywords });
  },

  fetchNextCandidate: async () => {
    const state = get();
    set({ isLoading: true, error: null });

    try {
      const excludeUsernames = [
        ...state.rejectedCandidates,
        ...state.acceptedCandidates.map(c => c.name),
        state.currentCandidate?.name
      ].filter(Boolean) as string[];

      const candidate = await fetchNextCandidate(
        state.currentKeywords,
        excludeUsernames
      );

      set({ currentCandidate: candidate, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch next candidate',
        isLoading: false
      });
    }
  },

  acceptCandidate: (candidate: Candidate) => {
    set(state => ({
      acceptedCandidates: [...state.acceptedCandidates, candidate],
      currentCandidate: null
    }));
  },

  rejectCandidate: (candidate: Candidate) => {
    set(state => ({
      rejectedCandidates: [...state.rejectedCandidates, candidate.name],
      currentCandidate: null
    }));
  },

  reorderAcceptedCandidates: (newOrder: Candidate[]) => {
    set({ acceptedCandidates: newOrder });
  }
}));

export default useSearchStore;