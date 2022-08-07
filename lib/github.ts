import { Octokit } from "octokit";
import { org, githubToken } from "lib/env.server";
import { print } from "graphql";
import ListRepositoryCollaborators from "lib/graphql/list-repository-collaborators.graphql";
import GetUserProfileWithContributions from "lib/graphql/get-user-profile-with-contributions.graphql";
import {
  ListRepositoryCollaboratorsQuery,
  GetUserProfileWithContributionsQuery,
  GetUserProfileWithContributionsQueryVariables,
} from "generated/graphql";

export const client = new Octokit({
  auth: githubToken,
});

/**
 * Creates an async iterator that will yield all of the repos in the
 * organization with outside collaborators information included.
 *
 * @param {Octokit} client the octokit client instance
 * @returns {AsyncIterator} an async iterator of repos
 */
export function getReposIterator(client: Octokit) {
  return {
    [Symbol.asyncIterator]() {
      return {
        cursor: null as string | null,

        async next() {
          console.log("Querying page with cursor:", this.cursor);

          const data = await client.graphql<ListRepositoryCollaboratorsQuery>(
            print(ListRepositoryCollaborators),
            { org, cursor: this.cursor }
          );

          const endCursor =
            data.organization?.repositories.pageInfo.endCursor || null;

          if (
            endCursor === this.cursor ||
            data.organization?.repositories.nodes?.length === 0
          ) {
            return {
              done: true,
              value: { orgId: data.organization?.id, repos: [] },
            };
          } else {
            this.cursor = endCursor;
            return {
              done: false,
              value: {
                orgId: data.organization?.id,
                repos: data.organization?.repositories.nodes || [],
              },
            };
          }
        },
      };
    },
  };
}

export async function getReposWithCollaborators(client: Octokit) {
  let id: string | undefined;
  const result = [];

  for await (const { orgId, repos } of getReposIterator(client)) {
    id = orgId;

    for (const repo of repos || []) {
      if (!repo || !repo.collaborators?.nodes) {
        continue;
      }

      result.push(repo);
    }
  }

  return {
    orgId: id,
    repos: result,
  };
}

export async function getCollaboratorDetails(
  client: Octokit,
  variables: GetUserProfileWithContributionsQueryVariables
) {
  const result = await client.graphql<GetUserProfileWithContributionsQuery>(
    print(GetUserProfileWithContributions),
    { orgId: variables.orgId, login: variables.login }
  );

  return result.user;
}
