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
import { useRef } from "react";
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
  return (
    <>
      <p className={cx("text-sm mb-4", { "animate-fade": animateIn })}>
        <strong>
          {Object.keys(data.collaborators).length} outside collaborators
        </strong>{" "}
        across <strong>{Object.keys(data.repos).length} repos</strong> as of{" "}
        <strong>{new Date(data.preparedOn).toLocaleDateString()}</strong>
      </p>

      <table className={cx("table", { "animate-rise": animateIn })}>
        <thead>
          <tr>
            <th>Username</th>
            <th>Repos</th>
          </tr>
        </thead>

        <tbody>
          {Object.keys(data.collaboratorsRepos!).map((userLogin) => (
            <tr key={userLogin}>
              <td className="!p-0">
                <div className="flex justify-between">
                  <Link
                    href={`/collaborator?username=${userLogin}&orgId=${data.orgId}`}
                  >
                    <a className="inline-flex items-center px-4 py-2 grow">
                      <Avatar
                        src={data.collaborators[userLogin].avatarUrl}
                        className="block mr-2 shrink-0 w-4 h-4"
                      />

                      {userLogin}
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
          ))}
        </tbody>
      </table>
    </>
  );
}

export default Home;
