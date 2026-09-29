export interface SplatStudioGithubRepoResponse {
  repo: string;
  stargazers_count: number;
  fetchedAt: number;
  stale: boolean;
}

export interface SplatStudioGithubLatestReleaseResponse {
  repo: string;
  tag_name: string;
  html_url: string;
  fetchedAt: number;
  stale: boolean;
}
