export interface Candidate {
  name: string;
  profileUrl: string;
  summary: string;
  profilePic: string;
  justification: string;
  skills: string[];
  repositories: Repository[];
  matchScore?: number;
}

export interface Repository {
  name: string;
  description: string;
  languages: string[];
}

export interface SearchState {
  currentKeywords: string[];
  currentCandidate: Candidate | null;
  acceptedCandidates: Candidate[];
  rejectedCandidates: string[];
  isLoading: boolean;
  error: string | null;
  setKeywords: (keywords: string[]) => void;
  fetchNextCandidate: () => Promise<void>;
  acceptCandidate: (candidate: Candidate) => void;
  rejectCandidate: (candidate: Candidate) => void;
  reorderAcceptedCandidates: (newOrder: Candidate[]) => void;
}