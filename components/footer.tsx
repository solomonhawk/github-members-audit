import { DiGithubBadge } from "react-icons/di";
import { GoRepoForked } from "react-icons/go";

export function Footer() {
  return (
    <footer className="container mx-auto px-8 my-10 space-y-4">
      <p className="container mx-auto max-w-md text-sm text-center">
        The source for this app is available on github. Feel free to fork it and
        set up a deployment on Vercel with your own GitHub access key,
        organization name, and basic auth credentials.
      </p>

      <div className="flex justify-center items-center text-sm gap-2">
        <DiGithubBadge className="shrink-0 w-6 h-6" />

        <a
          href={`https://github.com/solomonhawk/github-members-audit`}
          rel="external noreferrer"
          target="_blank"
        >
          https://github.com/solomonhawk/github-members-audit ⧉
        </a>
      </div>

      <div className="flex justify-center gap-2">
        <a
          className="rounded-sm flex items-center gap-1 border border-gray-200 dark:border-gray-700 px-4 py-2 hover:no-underline hover:bg-gray-200 hover:text-gray-800 dark:hover:bg-gray-700 dark:hover:text-white"
          href="https://github.com/solomonhawk/github-members-audit/fork"
          rel="external noreferrer"
          target="_blank"
        >
          <GoRepoForked />
          Fork on GitHub
        </a>
      </div>
    </footer>
  );
}
