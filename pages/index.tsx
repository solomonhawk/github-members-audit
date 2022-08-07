import { useQuery } from "@tanstack/react-query";
import { Avatar } from "components/avatar";
import { Code } from "components/code";
import { ErrorView } from "components/error";
import { Footer } from "components/footer";
import { Header } from "components/header";
import { LoadingView } from "components/loading";
import { org } from "lib/env.client";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRef, useState } from "react";
import { DiGithubBadge } from "react-icons/di";
import cx from "clsx";

export type CollaboratorsData = {
  orgId: string;
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
  const { data, isLoading, error } = useQuery<CollaboratorsData, Error>(
    ["collaborators"],
    async function fetchData() {
      const response = await fetch("/api/collaborators");

      if (!response.ok || response.status !== 200) {
        if (response.status === 504) {
          throw new Error("Error fetching memberships, the request timed out!");
        } else {
          throw new Error("Sorry, something went wrong fetching memberships.");
        }
      }

      return response.json();
    },
    {
      retry: false,
      // staleTime: 1000 * 60 * 10, // 10 minutes
      staleTime: 1000 * 60 * 60, // 60 minutes
      refetchOnWindowFocus: false,
      keepPreviousData: true,
    }
  );

  const hasCachedData = useRef(!!data);

  return (
    <div>
      <Head>
        <title>{`${org} Organization Members Audit`}</title>
        <meta
          name="description"
          content="Keep track of members and collaborators"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header
        title={
          <>
            <Code>{org}</Code> GitHub Organization Collaborators Audit
          </>
        }
      />

      <main className="container mx-auto px-8">
        {error && <ErrorView error={error.message} />}

        {isLoading && (
          <LoadingView>Hang tight, assembling TPS reports...</LoadingView>
        )}

        {data && <Table data={data} animateIn={!hasCachedData.current} />}
      </main>

      <Footer />
    </div>
  );
};

function Table({
  data,
  animateIn,
}: {
  data: CollaboratorsData;
  animateIn: boolean;
}) {
  const [groupBy, setGroupBy] = useState<"repo" | "contributor">("contributor");

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
        <p className={cx("text-sm", { "animate-fade": animateIn })}>
          <strong>
            {Object.keys(data.collaborators).length} outside collaborators
          </strong>{" "}
          across <strong>{Object.keys(data.repos).length} repos</strong> as of{" "}
          <strong>{new Date(data.preparedOn).toLocaleDateString()}</strong>
        </p>

        <div className="flex items-center gap-2">
          <h2 className="text-xs font-semibold uppercase whitespace-nowrap">
            Group By:
          </h2>

          <div className="flex">
            <button
              disabled={groupBy === "contributor"}
              onClick={() => setGroupBy("contributor")}
              className={cx(
                "transition block rounded-sm md:rounded !rounded-r-none border border-gray-200 dark:border-gray-700 px-3 py-2 hover:no-underline hover:bg-gray-200 hover:text-gray-800 active:bg-gray-300 dark:hover:bg-gray-700 dark:hover:text-white dark:active:bg-gray-600 text-xs font-bold uppercase",
                {
                  "bg-gray-800 hover:bg-gray-800 text-white hover:text-white border-gray-800 dark:bg-gray-200 dark:hover:bg-gray-200 dark:text-black dark:hover:text-black dark:!border-gray-200":
                    groupBy === "contributor",
                }
              )}
            >
              Contributor
            </button>

            <button
              disabled={groupBy === "repo"}
              onClick={() => setGroupBy("repo")}
              className={cx(
                "transition block rounded-sm md:rounded !rounded-l-none border border-gray-200 dark:border-gray-700 px-3 py-2 hover:no-underline hover:bg-gray-200 hover:text-gray-800 active:bg-gray-300 dark:hover:bg-gray-700 dark:hover:text-white dark:active:bg-gray-600 text-xs font-bold uppercase",
                {
                  "bg-gray-800 hover:bg-gray-800 text-white hover:text-white active:text-white active:bg-gray-800 border-gray-800 dark:bg-gray-200 dark:hover:bg-gray-200 dark:text-black dark:hover:text-black dark:!border-gray-200 dark:active:bg-gray-200":
                    groupBy === "repo",
                }
              )}
            >
              Repository
            </button>
          </div>
        </div>
      </div>

      <table className={cx("table", { "animate-rise": animateIn })}>
        {groupBy === "contributor" ? (
          <CollaboratorsTable data={data} />
        ) : (
          <ReposTable data={data} />
        )}
      </table>
    </>
  );
}

function CollaboratorsTable({ data }: { data: CollaboratorsData }) {
  return (
    <>
      <thead>
        <tr>
          <th>Username</th>
          <th>Repos</th>
        </tr>
      </thead>

      <tbody>
        {sortAlphabetically(Object.keys(data.collaboratorsRepos)).map(
          (userLogin) => (
            <tr key={userLogin}>
              <td className="!p-0 w-1/4">
                <div className="flex justify-between whitespace-nowrap">
                  <Link
                    href={`/collaborator?username=${userLogin}&orgId=${data.orgId}`}
                  >
                    <a className="inline-flex items-center px-4 py-2 grow gap-2">
                      <Avatar
                        src={data.collaborators[userLogin].avatarUrl}
                        className="block shrink-0 w-4 h-4"
                      />

                      {userLogin}

                      <small className="opacity-50 text-black dark:text-white font-normal">
                        {data.collaborators[userLogin].name}
                      </small>
                    </a>
                  </Link>

                  <a
                    className="p-2 shrink-0 flex items-center"
                    href={data.collaborators[userLogin].url}
                    rel="external noreferrer"
                    target="_blank"
                  >
                    <DiGithubBadge className="w-4 h-4" />
                  </a>
                </div>
              </td>

              <td>
                {data.collaboratorsRepos[userLogin].map((repo, i) => [
                  i > 0 && ", ",
                  <a
                    key={repo}
                    href={data.repos[repo].url}
                    rel="external noreferrer"
                    target="_blank"
                  >
                    {repo}
                  </a>,
                ])}
              </td>
            </tr>
          )
        )}
      </tbody>
    </>
  );
}

function ReposTable({ data }: { data: CollaboratorsData }) {
  const rows = Object.values(data.repos)
    .map((repo) => {
      return {
        repo,
        collaborators: Object.entries(data.collaboratorsRepos)
          .filter(([_, repoNames]) => {
            return repoNames.includes(repo.name);
          })
          .map(([userLogin]) => {
            return data.collaborators[userLogin];
          }),
      };
    })
    .sort((a, b) => {
      return a.repo.name.localeCompare(b.repo.name);
    });

  return (
    <>
      <thead>
        <tr>
          <th>Repo</th>
          <th>Users</th>
        </tr>
      </thead>

      <tbody>
        {rows.map((row) => (
          <tr key={row.repo.name}>
            <td className="w-1/4">
              <a href={row.repo.url} rel="external noreferrer" target="_blank">
                {row.repo.name}
              </a>
            </td>

            <td className="!p-0">
              {row.collaborators.map((collaborator) => (
                <div key={collaborator.login} className="flex justify-between">
                  <Link
                    href={`/collaborator?username=${collaborator.login}&orgId=${data.orgId}`}
                  >
                    <a className="inline-flex items-center px-4 py-2 grow gap-2">
                      <Avatar
                        src={collaborator.avatarUrl}
                        className="block shrink-0 w-4 h-4"
                      />

                      {collaborator.login}

                      <small className="opacity-50 text-black dark:text-white font-normal">
                        {collaborator.name}
                      </small>
                    </a>
                  </Link>

                  <a
                    className="p-2 shrink-0 flex items-center"
                    href={collaborator.url}
                    rel="external noreferrer"
                    target="_blank"
                  >
                    <DiGithubBadge className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </td>
          </tr>
        ))}
      </tbody>
    </>
  );
}

function sortAlphabetically(strings: string[]) {
  return strings.sort((a, b) => {
    return a.localeCompare(b);
  });
}

export default Home;
