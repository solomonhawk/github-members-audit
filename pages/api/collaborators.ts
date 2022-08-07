import type { NextApiRequest, NextApiResponse } from "next";

import basicAuthMiddleware from "nextjs-basic-auth-middleware";
import { client, getReposWithCollaborators } from "lib/github";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<unknown>
) {
  await basicAuthMiddleware(req, res);

  const reposMap = new Map();
  const collaboratorsMap = new Map();
  const collaboratorsReposMap = new Map<string, Set<string>>();

  try {
    const { orgId, repos } = await getReposWithCollaborators(client);

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

    res.status(200).json({
      orgId,
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
  } catch (e) {
    res.status(500).json({ message: (e as Error).message });
  }
}
