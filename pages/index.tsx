import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { useEffect, useState } from "react";

const org = process.env.NEXT_PUBLIC_ORG;

if (!org) {
  throw new Error("ORG environment variable is not set");
}

const properOrgName = `${org.slice(0, 1).toUpperCase()}${org.slice(1)}`;

type Data = {
  preparedOn: string;
  repos: Record<string, { name: string; url: string }>;
  collaborators: Record<
    string,
    {
      name: string;
      login: string;
      url: string;
      company: string | undefined;
      avatarUrl: string;
    }
  >;
  collaboratorsRepos: Record<string, string[]>;
};

const Home: NextPage = () => {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);

    async function fetchData() {
      const response = await fetch("/api/get-org-membership");

      if (!response.ok || response.status !== 200) {
        setError("Error fetching memberships");
        return;
      }

      setData(await response.json());
      setLoading(false);
    }

    fetchData();
  }, []);

  return (
    <div>
      <Head>
        <title>{`${properOrgName} Organization Members Audit`}</title>
        <meta
          name="description"
          content="Keep track of members and collaborators"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto mt-4 px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
          <h1 className="text-2xl viget-logo">
            {properOrgName} GitHub Organization Collaborators Audit
          </h1>

          <a
            className="whitespace-nowrap"
            href={`https://github.com/orgs/${org}/outside-collaborators`}
            rel="external noreferrer"
            target="_blank"
          >
            View Outside Collaborators
          </a>
        </div>

        {error && (
          <div className="rounded bg-red-600 text-white px-4 py-2 my-4">
            ⚠ {error}
          </div>
        )}

        {loading && (
          <div className="font-semibold my-4">
            ⌛︎ Hang tight, we’re assembling the TPS reports...
          </div>
        )}

        {data && (
          <>
            <p className="text-sm mb-4">
              <strong>
                {Object.keys(data?.collaborators).length} outside collaborators
              </strong>{" "}
              across <strong>{Object.keys(data?.repos).length} repos</strong> as
              of{" "}
              <strong>{new Date(data?.preparedOn).toLocaleDateString()}</strong>
            </p>
            <table className="table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Repos</th>
                </tr>
              </thead>

              <tbody>
                {Object.keys(data?.collaboratorsRepos!).map((userLogin) => (
                  <tr key={userLogin}>
                    <td className="!p-0">
                      <a
                        className="flex items-center group px-4 py-2"
                        href={data?.collaborators[userLogin].url}
                        rel="external noreferrer"
                        target="_blank"
                      >
                        <div className="block mr-2 shrink-0 rounded-full overflow-hidden leading-[0] border-2 border-transparent group-hover:border-blue-200">
                          <Image
                            src={data?.collaborators[userLogin].avatarUrl}
                            alt=""
                            width={16}
                            height={16}
                          />
                        </div>

                        {userLogin}
                      </a>
                    </td>
                    <td>
                      {data?.collaboratorsRepos[userLogin].map((repo, i) => [
                        i > 0 && ", ",
                        <a
                          key={repo}
                          href={data?.repos[repo].url}
                          rel="external noreferrer"
                          target="_blank"
                        >
                          {repo}
                        </a>,
                      ])}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </main>

      <footer className="container mx-auto px-8 my-10">
        <div className="flex justify-center items-center text-sm gap-4">
          <svg
            className="block shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
          >
            <path
              d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
              fill="white"
            />
          </svg>

          <a
            href={`https://github.com/vigetlabs/github-members-audit`}
            rel="external noreferrer"
            target="_blank"
          >
            https://github.com/vigetlabs/github-members-audit
          </a>
        </div>
      </footer>
    </div>
  );
};

export default Home;
