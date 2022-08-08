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

export async function fetchCollaborators(): Promise<CollaboratorsData> {
  const reposMap = new Map();
  const collaboratorsMap = new Map();
  const collaboratorsReposMap = new Map<string, Set<string>>();

  const { orgId, preparedOn, repos } = await iterateCollaborators();

  for (const repo of repos) {
    if (!repo || !repo.collaborators?.nodes) {
      continue;
    }

    if (repo.collaborators.nodes.length > 0 && !reposMap.has(repo.name)) {
      reposMap.set(repo.name, repo);
    }

    for (const collaborator of repo.collaborators?.nodes || []) {
      if (!collaborator) {
        continue;
      }

      if (!collaboratorsMap.has(collaborator.login)) {
        collaboratorsMap.set(collaborator.login, collaborator);
      }

      if (!collaboratorsReposMap.has(collaborator.login)) {
        collaboratorsReposMap.set(collaborator.login, new Set([repo.name]));
      } else {
        collaboratorsReposMap.get(collaborator.login)?.add(repo.name);
      }
    }
  }

  return {
    orgId,
    preparedOn,
    repos: Object.fromEntries(reposMap),
    collaborators: Object.fromEntries(collaboratorsMap),
    collaboratorsRepos: Object.fromEntries(
      Array.from(collaboratorsReposMap.entries()).map(([key, value]) => [
        key,
        Array.from(value),
      ])
    ),
  };
}

async function iterateCollaborators() {
  let id: string | undefined;
  let date: string | undefined;
  const result = [];

  for await (const { orgId, preparedOn, repos } of getReposIterator()) {
    id = orgId;
    date = preparedOn;

    for (const repo of repos || []) {
      if (!repo || !repo.collaborators?.nodes) {
        continue;
      }

      result.push(repo);
    }
  }

  return {
    orgId: id as string,
    preparedOn: date as string,
    repos: result,
  };
}

/**
 * Creates an async iterator that will yield all of the repos in the
 * organization with outside collaborators information included.
 *
 * @returns {AsyncIterator} an async iterator of repos
 */
export function getReposIterator() {
  return {
    [Symbol.asyncIterator]() {
      return {
        cursor: null as string | null,

        async next() {
          const response = await fetch(
            `/api/collaborators${this.cursor ? `?cursor=${this.cursor}` : ""}`
          );

          if (!response.ok || response.status !== 200) {
            if (response.status === 504) {
              throw new Error(
                "Error fetching memberships, the request timed out!"
              );
            } else {
              throw new Error(
                "Sorry, something went wrong fetching memberships."
              );
            }
          }

          const data = await response.json();

          const endCursor = data.repositories.pageInfo.endCursor || null;

          const value = {
            orgId: data.orgId,
            preparedOn: data.preparedOn,
            repos: data.repositories.nodes,
          };

          if (
            endCursor === this.cursor ||
            data.repositories.nodes?.length === 0
          ) {
            return { done: true, value };
          } else {
            this.cursor = endCursor;
            return { done: false, value };
          }
        },
      };
    },
  };
}
