// Using GitHub Token from environment variables
const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN;

/**
 * Extracts a GitHub username from a given text (like a CV body)
 */
export const extractGithubUsername = (text) => {
  const match = text.match(/github\.com\/([a-zA-Z0-9-]+)/i);
  return match ? match[1] : null;
};

/**
 * Fetches candidate stats from GitHub
 */
export const verifyGithubStats = async (username) => {
  if (!username) return null;

  const headers = GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {};

  try {
    // Fetch basic user profile (total repos, etc.)
    const userRes = await fetch(`https://api.github.com/users/${username}`, { headers });
    if (!userRes.ok) throw new Error("GitHub User not found");
    const userData = await userRes.json();

    // Fetch repositories to analyze technologies and activity
    const reposRes = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`, { headers });
    const reposData = await reposRes.ok ? await reposRes.json() : [];

    // Calculate stats
    const languages = {};
    let totalStars = 0;
    
    reposData.forEach(repo => {
      totalStars += repo.stargazers_count;
      if (repo.language) {
        languages[repo.language] = (languages[repo.language] || 0) + 1;
      }
    });

    // Sort top languages
    const topLanguages = Object.entries(languages)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0])
      .slice(0, 3); // Get top 3 languages

    return {
      username: userData.login,
      publicRepos: userData.public_repos,
      totalStars,
      topLanguages,
      profileUrl: userData.html_url,
      verified: true
    };

  } catch (error) {
    console.error("GitHub Verification Error:", error);
    return null;
  }
};
