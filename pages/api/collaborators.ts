import type { NextApiRequest, NextApiResponse } from "next";

import basicAuthMiddleware from "nextjs-basic-auth-middleware";
import { client, getReposWithCollaborators } from "lib/github";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<unknown>
) {
  await basicAuthMiddleware(req, res);

  const cursor = req.query.cursor as string | undefined;

  try {
    console.log(
      new Date().toLocaleTimeString(),
      "querying page with cursor:",
      cursor
    );

    const { id, repositories } = await getReposWithCollaborators(
      client,
      cursor
    );

    res.status(200).json({
      orgId: id,
      preparedOn: new Date().toISOString(),
      repositories,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: (e as Error).message });
  }
}
