import type { NextApiRequest, NextApiResponse } from "next";
import { Octokit } from "octokit";
import type { GraphQlQueryResponseData } from "@octokit/graphql";

const org = process.env.NEXT_PUBLIC_ORG;
const githubToken = process.env.GITHUB_TOKEN;

if (!org) {
  throw new Error("ORG environment variable is not set");
}

if (!githubToken) {
  throw new Error("GITHUB_TOKEN environment variable is not set");
}

const queryRepositoriesCollaborators = `
  query ListRepositoryCollaborators($org: String!, $cursor: String) {
    organization(login: $org) {
      repositories(affiliations: COLLABORATOR, first: 100, after: $cursor) {
        pageInfo {
          endCursor
          startCursor
        }
        nodes {
          name
          url
          collaborators(affiliation: OUTSIDE) {
            nodes {
              name
              login
              url
              company
              avatarUrl
            }
          }
        }
      }
    }
  }
`;

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse<unknown>
) {
  const client = new Octokit({
    auth: process.env.GITHUB_TOKEN,
  });

  const reposMap = new Map();
  const collaboratorsMap = new Map();
  const collaboratorsReposMap = new Map<string, Set<string>>();

  for await (const repos of getReposIterator(client)) {
    for (const repo of repos) {
      if (repo.collaborators.nodes.length > 0 && !reposMap.has(repo.name)) {
        reposMap.set(repo.name, repo);
      }

      repo.collaborators.nodes.forEach((collaborator: { login: string }) => {
        if (!collaboratorsMap.has(collaborator.login)) {
          collaboratorsMap.set(collaborator.login, collaborator);
        }

        if (!collaboratorsReposMap.has(collaborator.login)) {
          collaboratorsReposMap.set(collaborator.login, new Set([repo.name]));
        } else {
          collaboratorsReposMap.get(collaborator.login)?.add(repo.name);
        }
      });
    }
  }

  // cache this response for 10 minutes
  res.setHeader("Cache-Control", "s-maxage=600");

  res.status(200).json({
    preparedOn: new Date().toISOString(),
    repos: Object.fromEntries(reposMap),
    collaborators: Object.fromEntries(collaboratorsMap),
    collaboratorsRepos: Object.fromEntries(
      Array.from(collaboratorsReposMap.entries()).map(([key, value]) => [
        key,
        Array.from(value),
      ])
    ),
  });
}

/**
 * Creates an async iterator that will yield all of the repos in the
 * organization with outside collaborators information included.
 *
 * @param {Octokit} client  client
 * @returns {AsyncIterator} an async iterator of repos
 */
function getReposIterator(client: Octokit) {
  return {
    [Symbol.asyncIterator]() {
      return {
        cursor: null,

        async next() {
          console.log("Querying page with cursor:", this.cursor);

          const data = await client.graphql<GraphQlQueryResponseData>(
            queryRepositoriesCollaborators,
            { org, cursor: this.cursor }
          );

          const { endCursor } = data.organization.repositories.pageInfo;

          if (
            endCursor === this.cursor ||
            data.organization.repositories.nodes.length === 0
          ) {
            return { done: true };
          } else {
            this.cursor = endCursor;
            return {
              done: false,
              value: data.organization.repositories.nodes,
            };
          }
        },
      };
    },
  };
}
