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

export async function getReposWithCollaborators(
  client: Octokit,
  cursor: string | null = null
) {
  const result = await client.graphql<ListRepositoryCollaboratorsQuery>(
    print(ListRepositoryCollaborators),
    { org, cursor }
  );

  return result.organization as NonNullable<
    ListRepositoryCollaboratorsQuery["organization"]
  >;
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
