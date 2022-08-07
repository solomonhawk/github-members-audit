const org = process.env.NEXT_PUBLIC_ORG as string;
const githubToken = process.env.GITHUB_TOKEN as string;
const authCredentials = process.env.BASIC_AUTH_CREDENTIALS as string;

if (!org) {
  throw new Error("ORG environment variable is not set");
}

if (!githubToken) {
  throw new Error("GITHUB_TOKEN environment variable is not set");
}

if (!authCredentials) {
  throw new Error("BASIC_AUTH_CREDENTIALS environment variable is not set");
}

export { org, githubToken };
