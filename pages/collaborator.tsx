import { useQuery } from "@tanstack/react-query";
import { Avatar } from "components/avatar";
import { Code } from "components/code";
import { ErrorView } from "components/error";
import { Footer } from "components/footer";
import { Header } from "components/header";
import { LoadingView } from "components/loading";
import { GetUserProfileWithContributionsQuery } from "generated/graphql";
import { org } from "lib/env.client";
import { NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import type { CollaboratorsData } from "pages";
import cx from "clsx";
import { useRef, useState } from "react";
import {
  GoMarkGithub,
  GoChevronDown,
  GoChevronLeft,
  GoChevronUp,
  GoRepo,
} from "react-icons/go";
import { useMediaQuery } from "utils/use-media-query";
import Link from "next/link";

function notNull<T>(s: T): s is NonNullable<T> {
  return s !== null;
}

type ArrayValue<T> = T extends Array<infer U> ? U : never;
type RecordValue<R> = R extends Record<infer K, infer T> ? T : never;

const Collaborator: NextPage = () => {
  const { query } = useRouter();
  const { username, orgId } = query;

  const {
    data: userData,
    isLoading: isLoadingUserData,
    error: userDataError,
  } = useQuery<GetUserProfileWithContributionsQuery, Error>(
    ["collaborator", username],
    async function fetchData() {
      const response = await fetch(
        `/api/collaborator?username=${username}&orgId=${orgId}`
      );

      if (!response.ok || response.status !== 200) {
        if (response.status === 504) {
          throw new Error("Error fetching user, the request timed out!");
        } else {
          throw new Error("Sorry, something went wrong fetching user data.");
        }
      }

      return response.json();
    },
    {
      enabled: !!username && !!orgId,
      retry: false,
      staleTime: 1000 * 60 * 10, // 10 minutes
      refetchOnWindowFocus: false,
      keepPreviousData: true,
    }
  );

  const {
    data: collaboratorsData,
    isLoading: isLoadingCollaborators,
    error: collaboratorsError,
  } = useQuery<CollaboratorsData, Error>(
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
      staleTime: 1000 * 60 * 10, // 10 minutes
      refetchOnWindowFocus: false,
      keepPreviousData: true,
    }
  );

  const hasCachedData = useRef(!!userData && !!collaboratorsData);

  if (
    !username ||
    !orgId ||
    typeof username !== "string" ||
    typeof orgId !== "string"
  ) {
    if (typeof window !== "undefined") {
      throw new Error("Missing username or orgId");
    }

    return null;
  }

  return (
    <div>
      <Head>
        <title>{`${org} Collaborator ${username}`}</title>
        <meta name="description" content="Outside collaborator details" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="color-scheme" content="dark light" />
      </Head>

      <Header
        title={
          <>
            <Code>{username}</Code> Collaborator Details
          </>
        }
        startAdornment={
          <Link href="/">
            <a className="hidden sm:flex hover:no-underline rounded-full aspect-square w-6 text-xs border border-gray-300 dark:border-gray-700 items-center justify-center mr-2 shrink-0 hover:border-blue-500 dark:hover:border-blue-300">
              <span className="sr-only">Back to home</span>
              <GoChevronLeft />
            </a>
          </Link>
        }
      />

      <main className="container mx-auto px-4 md:px-8">
        {userDataError && <ErrorView error={userDataError.message} />}
        {collaboratorsError && <ErrorView error={collaboratorsError.message} />}

        {(isLoadingUserData || isLoadingCollaborators) && (
          <LoadingView>Sit tight, querying collaborator details...</LoadingView>
        )}

        {userData && collaboratorsData && (
          <Details
            username={username}
            user={userData.user!}
            collaboratorsData={collaboratorsData}
            animateIn={!hasCachedData.current}
          />
        )}
      </main>

      <Footer />
    </div>
  );
};

// XXX: shuold be able to pull these from the generated types
type Repos = Record<
  string,
  RecordValue<CollaboratorsData["repos"]> & {
    commits: {
      url: any;
      commitCount: number;
      occurredAt: any;
    }[];
    comments: {
      id: string;
      url: any;
      bodyText: string;
      bodyHTML: string;
      createdAt: any;
      repository: {
        id: string;
        name: string;
        owner: {
          login: string;
        };
      };
      issue: {
        id: string;
        title: string;
        url: any;
      };
    }[];
  }
>;

function Details({
  username,
  user,
  collaboratorsData,
  animateIn,
}: {
  username: string;
  user: NonNullable<GetUserProfileWithContributionsQuery["user"]>;
  collaboratorsData: CollaboratorsData;
  animateIn: boolean;
}) {
  const { colSpan, rowSpan } = useMediaQuery(
    ["(min-width: 768px)"],
    [{ rowSpan: 999, colSpan: undefined }],
    { rowSpan: undefined, colSpan: 999 }
  );

  // XXX: that's a lot of data fiddling... extract to a fn at least
  const repos = collaboratorsData.collaboratorsRepos[username].reduce<Repos>(
    (acc, repoName) => {
      acc[repoName] = {
        ...collaboratorsData.repos[repoName],
        commits: [],
        comments: [],
      };
      return acc;
    },
    {}
  );

  const commitContributionsByRepository =
    user.contributionsCollection.commitContributionsByRepository.filter(
      (summary) => summary.repository.owner.login === org
    );

  for (const summary of commitContributionsByRepository) {
    repos[summary.repository.name].commits = (
      summary.contributions.nodes || []
    ).filter(notNull);
  }

  const totalCommits = commitContributionsByRepository.reduce(
    (acc, summary) => {
      return acc + summary.contributions.totalCount;
    },
    0
  );

  const issueComments = (user.issueComments.nodes || [])
    .filter((comment) => {
      return comment?.repository.owner.login === org;
    })
    .filter(notNull);

  for (const comment of issueComments) {
    if (
      !collaboratorsData.collaboratorsRepos[username].includes(
        comment.repository.name
      )
    ) {
      continue;
    }

    repos[comment.repository.name].comments.push(comment);
  }

  const issueCommentCount = issueComments.length;

  return (
    <div className={cx("table-wrapper", { "animate-rise": animateIn })}>
      <table className="table">
        <tbody>
          <tr>
            <th
              rowSpan={rowSpan}
              colSpan={colSpan}
              className="!p-0 w-1 align-top"
            >
              <div className="p-4 md:p-6 text-left flex flex-row md:flex-col gap-4 md:gap-6">
                <div className="block shrink-0 leading-[0] order-1 ml-auto md:order-none md:ml-0">
                  <Avatar
                    src={user.avatarUrl}
                    className="w-20 h-20 sm:w-32 sm:h-32 lg:w-40 lg:h-40 border-4 border-gray-300 dark:border-gray-700"
                  />
                </div>

                <div className="space-y-6">
                  <div>
                    <h2 className="text-white text-xl leading-none mb-1">
                      <a
                        href={user.url}
                        rel="external noreferrer"
                        target="_blank"
                      >
                        {username}
                      </a>
                    </h2>

                    {user.company && (
                      <p className="font-normal mb-4">{user.company}</p>
                    )}
                  </div>

                  {user.bio && <p className="font-normal">{user.bio}</p>}

                  <div>
                    <a
                      className="whitespace-nowrap flex gap-2 items-center mb-1"
                      href={`https://github.com/orgs/${org}/people/${username}`}
                      rel="external noreferrer"
                      target="_blank"
                    >
                      <GoMarkGithub className="shrink-0 text-gray-800 dark:text-gray-200" />
                      <span className="text-sm">View Org Membership ⧉</span>
                    </a>

                    <div className="flex items-center gap-2 font-normal">
                      <GoRepo className="shrink-0 text-gray-800 dark:text-gray-200" />{" "}
                      {collaboratorsData.collaboratorsRepos[username].length}{" "}
                      {collaboratorsData.collaboratorsRepos[username].length ===
                      1
                        ? "repository"
                        : "repositories"}
                    </div>
                  </div>
                  {(user.organizations?.nodes?.length ?? 0) > 0 ? (
                    <div className="space-y-2">
                      <h3 className="font-semibold text-sm">
                        Other Organizations:
                      </h3>

                      <ul>
                        {user.organizations.nodes!.map((org) => (
                          <li key={org?.login}>
                            <a
                              className="block w-full"
                              href={`https://github.com/${org?.login}`}
                              rel="external noreferrer"
                              target="_blank"
                            >
                              {org?.name}
                            </a>
                          </li>
                        ))}
                      </ul>

                      <small className="block font-normal leading-tight opacity-80">
                        Note: This list is likely not exhaustive.
                      </small>
                    </div>
                  ) : null}

                  <div className="space-y-1">
                    <h3 className="font-semibold mb-2">Recent Activity:</h3>

                    <p className="font-normal text-xs opacity-80">
                      {totalCommits} commit
                      {totalCommits === 1 ? "" : "s"}
                    </p>

                    <p className="font-normal text-xs opacity-80">
                      {issueCommentCount} issue comment
                      {issueCommentCount === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
              </div>
            </th>
            <th className="h-1 p-2 hidden md:table-cell">Repository</th>
            <th className="h-1 p-2 hidden md:table-cell">Activity</th>
          </tr>

          <tr className="md:hidden">
            <th className="h-1 p-2">Repository</th>
            <th className="h-1 p-2">Activity</th>
          </tr>

          {sortReposByCommits(repos).map((repo) => (
            <tr key={repo.name}>
              <td className="w-1/4">
                <a href={repo.url} target="_blank" rel="external noreferrer">
                  {org}/{repo.name}{" "}
                </a>
                <a
                  href={`https://github.com/${org}/${repo.name}/commits?author=${username}`}
                  target="_blank"
                  rel="external noreferrer"
                >
                  <small className="text-black dark:text-white opacity-50">
                    ({countCommits(repo.commits) + repo.comments.length}
                    &nbsp;contributions)
                  </small>
                </a>
              </td>

              <td className="!p-0">
                <CommitsTable commits={repo.commits} />
                <CommentsTable comments={repo.comments} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CommitsTable({ commits }: { commits: RecordValue<Repos>["commits"] }) {
  const commitsToShow = 5;
  const [showAll, setShowAll] = useState(false);

  const visiblecommits = showAll ? commits : commits.slice(0, commitsToShow);

  return (
    <table className="table !border-0 table-fixed">
      <colgroup>
        <col className="w-[110px]" />
        <col className="w-full" />
      </colgroup>

      <thead>
        <tr>
          <th colSpan={2} className="!border-t-0">
            Commits{" "}
            <small className="dark:text-white opacity-50">
              ({countCommits(commits)})
            </small>
          </th>
        </tr>
      </thead>

      <tbody>
        {visiblecommits.map((commit) => (
          <tr key={commit.occurredAt}>
            <td className="w-0">
              <span className="text-gray-700 dark:text-gray-300">
                {new Date(commit.occurredAt).toLocaleDateString()}
              </span>
            </td>
            <td>
              <a href={commit.url} target="_blank" rel="external noreferrer">
                {commit.commitCount} commit
                {commit.commitCount === 1 ? "" : "s"}
              </a>
            </td>
          </tr>
        ))}

        {commits.length === 0 && (
          <tr>
            <td colSpan={2} className="text-center">
              <em className="opacity-50">No commits</em>
            </td>
          </tr>
        )}

        {commits.length > commitsToShow && (
          <tr>
            <td colSpan={3} className="!p-0 text-center">
              <button
                className="flex items-center justify-center transition w-full p-3 font-bold uppercase text-xs hover:text-blue-500 dark:hover:text-blue-300 gap-1"
                onClick={() => setShowAll((s) => !s)}
              >
                {showAll ? <GoChevronUp /> : <GoChevronDown />}
                {showAll
                  ? "Show fewer"
                  : `Show ${commits.length - commitsToShow} more rows`}
              </button>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

function CommentsTable({
  comments,
}: {
  comments: RecordValue<Repos>["comments"];
}) {
  const commentsToShow = 3;
  const [showAll, setShowAll] = useState(false);

  const visibleComments = showAll
    ? comments
    : comments.slice(0, commentsToShow);

  return (
    <table className="table !border-0 table-fixed">
      <colgroup>
        <col className="w-[110px]" />
        <col className="w-1/3" />
        <col />
      </colgroup>

      <thead>
        <tr>
          <th colSpan={3}>
            Issue Comments{" "}
            <small className="dark:text-white opacity-50">
              ({comments.length})
            </small>
          </th>
        </tr>
      </thead>

      <tbody>
        {visibleComments.map((comment) => (
          <CommentRow key={comment.id} comment={comment} />
        ))}

        {comments.length === 0 && (
          <tr>
            <td colSpan={3} className="text-center">
              <em className="opacity-50">No comments</em>
            </td>
          </tr>
        )}

        {comments.length > commentsToShow && (
          <tr>
            <td colSpan={3} className="!p-0 text-center">
              <button
                className="flex items-center justify-center transition w-full p-3 font-bold uppercase text-xs hover:text-blue-500 dark:hover:text-blue-300 gap-1"
                onClick={() => setShowAll((s) => !s)}
              >
                {showAll ? <GoChevronUp /> : <GoChevronDown />}
                {showAll
                  ? "Show fewer"
                  : `Show ${comments.length - commentsToShow} more rows`}
              </button>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

function CommentRow({
  comment,
}: {
  comment: ArrayValue<RecordValue<Repos>["comments"]>;
}) {
  const shortCommentSize = 84;
  const hasOverflow = comment.bodyText.length > shortCommentSize;
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <tr key={comment.id} className="group">
      <td className="w-0">
        <span className="text-gray-700 dark:text-gray-300">
          {new Date(comment.createdAt).toLocaleDateString()}
        </span>
      </td>

      <td className="w-1/2">
        <a href={comment.url} target="_blank" rel="external noreferrer">
          {comment.issue.title}
        </a>
      </td>

      <td className="w-1/2 !p-0 h-1">
        {hasOverflow && !isExpanded && (
          <button
            className="flex w-full transition px-4 py-2 h-full grow text-left group"
            onClick={() => setIsExpanded(true)}
            title="Expand full comment"
          >
            <span className="block text-xs opacity-70 break-words overflow-hidden group-hover:opacity-100 mr-2">
              {`${comment.bodyText.slice(0, shortCommentSize)}...`}
            </span>

            <span className="transition shrink-0 opacity-0 group-hover:opacity-100 rounded-sm p-1 bg-gray-200 hover:text-blue-800 hover:!bg-blue-300 dark:text-white dark:bg-gray-800 dark:hover:!bg-blue-500 dark:hover:text-white self-center">
              <GoChevronDown />
            </span>
          </button>
        )}

        {hasOverflow && isExpanded && (
          <div className="flex w-full transition px-4 py-2 h-full grow text-left group">
            <p
              className="text-xs opacity-70 break-words group-hover:opacity-100 mr-2 prose dark:prose-invert overflow-scroll"
              dangerouslySetInnerHTML={{ __html: comment.bodyHTML }}
            />

            <button
              // className="block text-xs opacity-70 break-words overflow-hidden group-hover:opacity-100 shrink-0"
              className="transition shrink-0 opacity-0 group-hover:opacity-100 rounded-sm p-1 bg-gray-200 hover:text-blue-800 hover:!bg-blue-300 dark:text-white dark:bg-gray-800 dark:hover:!bg-blue-500 dark:hover:text-white self-center"
              onClick={() => setIsExpanded(false)}
              title="Collapse comment"
            >
              <GoChevronUp />
            </button>
          </div>
        )}

        {!hasOverflow && (
          <p
            className="px-4 py-2 text-xs opacity-70 break-words group-hover:opacity-100 prose dark:prose-invert overflow-scroll"
            dangerouslySetInnerHTML={{ __html: comment.bodyHTML }}
          />
        )}
      </td>
    </tr>
  );
}

function sortReposByCommits(repos: Repos) {
  return Object.values(repos).sort((a, b) => {
    return b.commits.length - a.commits.length;
  });
}

function countCommits(commits: { commitCount: number }[]) {
  return commits.reduce((acc, commit) => {
    return acc + commit.commitCount;
  }, 0);
}
export default Collaborator;
