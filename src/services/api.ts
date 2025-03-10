import OpenAI from 'openai';
import { Octokit } from 'octokit';
import type { Candidate, Repository } from '../types';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

const octokit = new Octokit({
  auth: import.meta.env.VITE_GITHUB_TOKEN
});

const MAX_KEYWORDS = 3;
const BATCH_SIZE = 10;
const MAX_PAGES = 3;
const MAX_TOKENS_PER_REQUEST = 300;
const MAX_DAILY_TOKENS = 100000;
let totalTokensUsed = 0;

let currentJobDescription = '';
let currentPage = 1;
let currentSearchTier = 0;
const seenUsernames = new Set<string>();
const processedCandidates = new Map<string, Candidate>();

// Search tiers represent progressively relaxed search criteria
const searchTiers = [
  { followers: 50, repos: 10 },    // Tier 0: High quality candidates
  { followers: 20, repos: 5 },     // Tier 1: Medium quality candidates
  { followers: 5, repos: 3 },      // Tier 2: Entry level candidates
  { followers: 1, repos: 1 }       // Tier 3: Everyone
];

export async function extractKeywords(jobDescription: string): Promise<string[]> {
  currentJobDescription = jobDescription;
  // Reset search state
  currentPage = 1;
  currentSearchTier = 0;
  seenUsernames.clear();
  processedCandidates.clear();
  totalTokensUsed = 0;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Using GPT-3.5 for keyword extraction to save tokens
      messages: [
        {
          role: "system",
          content: `Extract exactly ${MAX_KEYWORDS} primary technical skills from the job description. Return only a comma-separated list of programming languages or technical tools.`
        },
        {
          role: "user",
          content: jobDescription
        }
      ],
      max_tokens: 50 // Limiting tokens since we only need a short list
    });

    if (!response.choices[0]?.message?.content) {
      throw new Error('OpenAI API returned no content');
    }

    totalTokensUsed += response.usage?.total_tokens || 0;

    const keywords = response.choices[0].message.content
      .split(',')
      .map(k => k.trim())
      .filter(k => k)
      .slice(0, MAX_KEYWORDS);

    return keywords;
  } catch (error) {
    console.error('Error extracting keywords:', error);
    if (error instanceof Error) {
      if ((error as any).status === 401) {
        throw new Error('Invalid OpenAI API key. Please check your configuration.');
      }
      throw new Error(`Failed to extract keywords: ${error.message}`);
    }
    throw error;
  }
}

export async function fetchNextCandidate(
  keywords: string[],
  excludeUsernames: string[] = []
): Promise<Candidate | null> {
  try {
    if (!keywords.length) {
      throw new Error('No keywords provided for search');
    }

    excludeUsernames.forEach(username => seenUsernames.add(username));

    const tier = searchTiers[currentSearchTier];
    const query = `language:${keywords[0].toLowerCase()} followers:>${tier.followers} repos:>${tier.repos}`;

    const { data } = await octokit.rest.search.users({
      q: query,
      sort: 'repositories',
      per_page: BATCH_SIZE,
      page: currentPage,
      order: 'desc'
    });

    if (!data.items?.length) {
      return handleNoResults(keywords, excludeUsernames);
    }

    // Process candidates sequentially to avoid race conditions
    for (const user of data.items) {
      if (seenUsernames.has(user.login)) continue;
      
      // Check if we already processed this candidate
      const cachedCandidate = processedCandidates.get(user.login);
      if (cachedCandidate) {
        seenUsernames.add(user.login);
        return cachedCandidate;
      }

      const candidate = await processCandidate(user.login, keywords);
      if (candidate) {
        seenUsernames.add(user.login);
        processedCandidates.set(user.login, candidate);
        return candidate;
      }
    }

    return handleNoResults(keywords, excludeUsernames);
  } catch (error) {
    console.error('Error fetching next candidate:', error);
    if (error instanceof Error) {
      if (error.message.includes('API rate limit exceeded')) {
        throw new Error('GitHub API rate limit exceeded. Please try again in a few minutes.');
      }
      throw error;
    }
    throw new Error('An unexpected error occurred while searching for candidates.');
  }
}

async function handleNoResults(
  keywords: string[],
  excludeUsernames: string[]
): Promise<Candidate | null> {
  if (currentPage < MAX_PAGES) {
    currentPage++;
    return fetchNextCandidate(keywords, excludeUsernames);
  }
  if (currentSearchTier < searchTiers.length - 1) {
    currentSearchTier++;
    currentPage = 1;
    return fetchNextCandidate(keywords, excludeUsernames);
  }
  throw new Error('No more candidates available. Try adjusting the job description.');
}

async function processCandidate(
  username: string,
  keywords: string[]
): Promise<Candidate | null> {
  try {
    const { data: userDetails } = await octokit.rest.users.getByUsername({
      username
    });

    if (userDetails.type === 'Organization') {
      return null;
    }

    const profile = await fetchGitHubProfile(username);
    if (profile) {
      const matchScore = calculateMatchScore(profile.skills, keywords);
      if (matchScore > 0) {
        profile.matchScore = matchScore;
        return profile;
      }
    }
    return null;
  } catch (error) {
    console.error(`Error processing candidate ${username}:`, error);
    return null;
  }
}

function calculateMatchScore(candidateSkills: string[], searchKeywords: string[]): number {
  const normalizedSkills = new Set(candidateSkills.map(skill => skill.toLowerCase()));
  const normalizedKeywords = searchKeywords.map(keyword => keyword.toLowerCase());
  
  let score = 0;
  if (Array.from(normalizedSkills).some(skill => 
    skill.includes(normalizedKeywords[0]) || 
    normalizedKeywords[0].includes(skill)
  )) {
    score += 5;
  }

  for (const keyword of normalizedKeywords.slice(1)) {
    if (Array.from(normalizedSkills).some(skill => 
      skill.includes(keyword) || 
      keyword.includes(skill)
    )) {
      score += 2;
    }
  }
  
  score *= (1 - (currentSearchTier * 0.1));
  return score;
}

async function fetchGitHubProfile(username: string): Promise<Candidate | null> {
  try {
    const [userResponse, reposResponse] = await Promise.all([
      octokit.rest.users.getByUsername({ username }),
      octokit.rest.repos.listForUser({ username, sort: 'pushed', per_page: 5 })
    ]);

    const repositories: Repository[] = await Promise.all(
      reposResponse.data
        .filter(repo => !repo.fork)
        .map(async (repo) => {
          try {
            const { data: languages } = await octokit.rest.repos.listLanguages({
              owner: username,
              repo: repo.name
            });

            return {
              name: repo.name,
              description: repo.description || '',
              languages: Object.keys(languages)
            };
          } catch (error) {
            return {
              name: repo.name,
              description: repo.description || '',
              languages: []
            };
          }
        })
    );

    if (totalTokensUsed >= MAX_DAILY_TOKENS) {
      return {
        name: username,
        profileUrl: userResponse.data.html_url,
        summary: userResponse.data.bio || '',
        profilePic: userResponse.data.avatar_url,
        justification: "Token limit reached. Please try again tomorrow.",
        skills: Array.from(new Set(repositories.flatMap(repo => repo.languages))),
        repositories,
        matchScore: 0
      };
    }

    const justification = await generateJustification(username, repositories);

    return {
      name: username,
      profileUrl: userResponse.data.html_url,
      summary: userResponse.data.bio || '',
      profilePic: userResponse.data.avatar_url,
      justification,
      skills: Array.from(new Set(repositories.flatMap(repo => repo.languages))),
      repositories,
      matchScore: 0
    };
  } catch (error) {
    console.error(`Error fetching profile for ${username}:`, error);
    return null;
  }
}

async function generateJustification(
  username: string,
  repositories: Repository[]
): Promise<string> {
  try {
    // Create a more concise repository summary
    const repoSummary = repositories
      .map(repo => `${repo.name} (${repo.languages.join(', ')})`)
      .join('; ');

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Using GPT-3.5 for justifications to save tokens
      messages: [
        {
          role: "system",
          content: "You are a technical recruiter. Write a brief justification focusing only on the candidate's technical skills and project experience."
        },
        {
          role: "user",
          content: `Based on their GitHub repositories (${repoSummary}), explain in 2 sentences why ${username} would be a good fit for a role requiring ${currentJobDescription.split('\n')[0]}`
        }
      ],
      max_tokens: MAX_TOKENS_PER_REQUEST,
      temperature: 0.7
    });

    if (!response.choices[0]?.message?.content) {
      throw new Error('OpenAI API returned no content for justification');
    }

    totalTokensUsed += response.usage?.total_tokens || 0;
    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error generating justification:', error);
    if (totalTokensUsed >= MAX_DAILY_TOKENS) {
      return 'Token limit reached. Please try again tomorrow.';
    }
    return 'Unable to generate justification due to an error.';
  }
}