import { useQuery } from "@tanstack/react-query";
import cx from "clsx";
import { Avatar } from "components/avatar";
import { Code } from "components/code";
import { ErrorView } from "components/error";
import { Footer } from "components/footer";
import { Header } from "components/header";
import { LoadingView } from "components/loading";
import { CollaboratorsData, fetchCollaborators } from "data/collaborators";
import { org } from "lib/env.client";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { DiGithubBadge } from "react-icons/di";
import { GoPerson, GoRepo } from "react-icons/go";

const Home: NextPage = () => {
  const { data, isLoading, error } = useQuery<CollaboratorsData, Error>(
    ["collaborators"],
    fetchCollaborators,
    {
      retry: false,
      staleTime: 1000 * 60 * 10, // 10 minutes
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
        <meta name="color-scheme" content="dark light" />
      </Head>

      <Header
        title={
          <>
            <Code>{org}</Code> GitHub Organization Collaborators Audit
          </>
        }
      />

      <main className="container mx-auto px-4 md:px-8">
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

type GroupBy = "repo" | "user";

function isGroupBy(s: unknown): s is GroupBy {
  if (typeof s === "string") {
    return ["repo", "user"].includes(s);
  }

  return false;
}

function Table({
  data,
  animateIn,
}: {
  data: CollaboratorsData;
  animateIn: boolean;
}) {
  const router = useRouter();
  const initialGroupBy = isGroupBy(router.query.view)
    ? router.query.view
    : "user";

  const [groupBy, setGroupBy] = useState<GroupBy>(initialGroupBy);

  useEffect(() => {
    if (router.query.view !== groupBy) {
      router.replace({
        query: {
          view: groupBy,
        },
      });
    }
  }, [router, groupBy]);

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
        <p className={cx("text-sm", { "animate-fade": animateIn })}>
          <strong>
            {Object.keys(data.collaborators).length} outside collaborators
          </strong>{" "}
          <span className="opacity-70">across</span>{" "}
          <strong>{Object.keys(data.repos).length} repos</strong>{" "}
          <span className="opacity-70">as of</span>{" "}
          <strong>{new Date(data.preparedOn).toLocaleDateString()}</strong>
        </p>

        <div className="flex items-center gap-2">
          <span className="sr-only">Group By:</span>

          <div className="flex">
            <button
              disabled={groupBy === "user"}
              onClick={() => setGroupBy("user")}
              className={cx(
                "transition flex items-center gap-2 rounded-sm md:rounded !rounded-r-none border border-r-none border-gray-200 dark:border-gray-700 px-3 py-2 hover:no-underline hover:bg-gray-200 hover:text-gray-800 active:bg-gray-300 dark:hover:bg-gray-700 dark:hover:text-white dark:active:bg-gray-600 text-xs font-bold uppercase",
                {
                  "bg-green-600 hover:bg-green-600 text-white hover:text-white border-green-600 dark:bg-green-500 dark:hover:bg-green-500 dark:text-black dark:hover:text-black dark:!border-green-500 dark:active:bg-green-600":
                    groupBy === "user",
                }
              )}
            >
              <GoPerson />
              User
            </button>

            <button
              disabled={groupBy === "repo"}
              onClick={() => setGroupBy("repo")}
              className={cx(
                "transition flex items-center gap-2 rounded-sm md:rounded !rounded-l-none border border-l-none border-gray-200 dark:border-gray-700 px-3 py-2 hover:no-underline hover:bg-gray-200 hover:text-gray-800 active:bg-gray-300 dark:hover:bg-gray-700 dark:hover:text-white dark:active:bg-gray-600 text-xs font-bold uppercase",
                {
                  "bg-green-600 hover:bg-green-600 text-white hover:text-white border-green-600 dark:bg-green-500 dark:hover:bg-green-500 dark:text-black dark:hover:text-black dark:!border-green-500 dark:active:bg-green-600":
                    groupBy === "repo",
                }
              )}
            >
              <GoRepo />
              Repo
            </button>
          </div>
        </div>
      </div>

      <div className={cx("table-wrapper", { "animate-rise": animateIn })}>
        <table className="table">
          {groupBy === "user" ? (
            <CollaboratorsTable data={data} />
          ) : (
            <ReposTable data={data} />
          )}
        </table>
      </div>
    </>
  );
}

function CollaboratorsTable({ data }: { data: CollaboratorsData }) {
  return (
    <>
      <thead>
        <tr>
          <th>User</th>
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
                    className="p-2 shrink-0 flex items-center text-gray-700/50 dark:text-gray-300/50"
                    href={data.collaborators[userLogin].url}
                    rel="external noreferrer"
                    target="_blank"
                    title={`View ${
                      data.collaborators[userLogin].name || userLogin
                    }'s github profile`}
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
                    className="p-2 shrink-0 flex items-center text-gray-700/50 dark:text-gray-300/50"
                    href={collaborator.url}
                    rel="external noreferrer"
                    target="_blank"
                    title={`View ${
                      collaborator.name || collaborator.login
                    }'s github profile`}
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
