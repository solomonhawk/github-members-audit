const org = process.env.NEXT_PUBLIC_ORG as string;

if (!org) {
  throw new Error("ORG environment variable is not set");
}

export { org };
