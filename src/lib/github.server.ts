const GATEWAY_URL = "https://connector-gateway.lovable.dev/github";

export type RepoSummary = {
  fullName: string;
  description: string | null;
  url: string;
  stars: number;
  forks: number;
  openIssues: number;
  defaultBranch: string;
  pushedAt: string | null;
  private: boolean;
};

export type IssueSummary = {
  id: number;
  number: number;
  title: string;
  state: string;
  url: string;
  author: string;
  createdAt: string;
  isPullRequest: boolean;
};

export type CommitSummary = {
  sha: string;
  message: string;
  author: string;
  url: string;
  date: string | null;
};

async function gh(path: string): Promise<unknown> {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const connectionKey = process.env["GITHUB_API_KEY"];
  if (!lovableKey || !connectionKey) {
    throw new Error("GitHub is not connected yet. Link the GitHub connector to use this panel.");
  }

  const response = await fetch(`${GATEWAY_URL}/${path}`, {
    method: "GET",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": connectionKey,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`GitHub gateway request failed [${response.status}]: ${body}`);
    throw new Error(`GitHub request failed [${response.status}]: ${body.slice(0, 300)}`);
  }

  return response.json();
}

type RawRepo = {
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  default_branch: string;
  pushed_at: string | null;
  private: boolean;
};

type RawIssue = {
  id: number;
  number: number;
  title: string;
  state: string;
  html_url: string;
  user: { login: string } | null;
  created_at: string;
  pull_request?: unknown;
};

type RawCommit = {
  sha: string;
  html_url: string;
  commit: { message: string; author: { name?: string; date?: string } | null };
  author: { login: string } | null;
};

export async function listMyRepos(): Promise<RepoSummary[]> {
  const raw = (await gh("user/repos?sort=pushed&per_page=20&affiliation=owner,collaborator,organization_member")) as RawRepo[];
  return raw.map((r) => ({
    fullName: r.full_name,
    description: r.description,
    url: r.html_url,
    stars: r.stargazers_count,
    forks: r.forks_count,
    openIssues: r.open_issues_count,
    defaultBranch: r.default_branch,
    pushedAt: r.pushed_at,
    private: r.private,
  }));
}

export async function getRepoActivity(owner: string, repo: string) {
  const [repoRaw, issuesRaw, commitsRaw] = await Promise.all([
    gh(`repos/${owner}/${repo}`) as Promise<RawRepo>,
    gh(`repos/${owner}/${repo}/issues?state=open&per_page=10`) as Promise<RawIssue[]>,
    gh(`repos/${owner}/${repo}/commits?per_page=10`) as Promise<RawCommit[]>,
  ]);

  const summary: RepoSummary = {
    fullName: repoRaw.full_name,
    description: repoRaw.description,
    url: repoRaw.html_url,
    stars: repoRaw.stargazers_count,
    forks: repoRaw.forks_count,
    openIssues: repoRaw.open_issues_count,
    defaultBranch: repoRaw.default_branch,
    pushedAt: repoRaw.pushed_at,
    private: repoRaw.private,
  };

  const issues: IssueSummary[] = issuesRaw.map((i) => ({
    id: i.id,
    number: i.number,
    title: i.title,
    state: i.state,
    url: i.html_url,
    author: i.user?.login ?? "unknown",
    createdAt: i.created_at,
    isPullRequest: Boolean(i.pull_request),
  }));

  const commits: CommitSummary[] = commitsRaw.map((c) => ({
    sha: c.sha.slice(0, 7),
    message: c.commit.message.split("\n")[0] ?? "",
    author: c.author?.login ?? c.commit.author?.name ?? "unknown",
    url: c.html_url,
    date: c.commit.author?.date ?? null,
  }));

  return { repo: summary, issues, commits };
}
