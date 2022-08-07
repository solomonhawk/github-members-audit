import { client, getCollaboratorDetails } from "lib/github";
import type { NextApiRequest, NextApiResponse } from "next";
import basicAuthMiddleware from "nextjs-basic-auth-middleware";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<unknown>
) {
  await basicAuthMiddleware(req, res);

  const { orgId, username } = req.query;

  if (
    !orgId ||
    !username ||
    typeof orgId !== "string" ||
    typeof username !== "string"
  ) {
    res.status(400).json({ message: "Missing or invalid orgId or username" });
    return;
  }

  try {
    res.status(200).json({
      user: await getCollaboratorDetails(client, { orgId, login: username }),
    });
  } catch (e) {
    res.status(500).json({ message: (e as Error).message });
  }
}
