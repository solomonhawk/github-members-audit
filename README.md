# GitHub Organization Member Audit

A super basic app to summarize outside contributors and their repo access for a GitHub organization.

**NOTE**: When deployed on a hobby Vercel plan, you might encounter periodic 504 timeouts on the lambda due to the 10 second timeout. A pro plan or higher shouldn't encounter these issues due to the 60 second timeout.

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

1. Install dependencies

    ```bash
    $ npm install
    # or
    $ yarn install
    ```

3. Set up environment variables

    ```bash
    $ cp .env{.example,}
    ```

4. Run the development server:

    ```bash
    $ npm run dev
    # or
    $ yarn dev
    ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment

This application requires:

1. `GITHUB_TOKEN`: A [personal GitHub access token](https://github.com/settings/tokens) with the proper scopes (all `repo`, and `read:org`) associated with the organization you want to query against
2. `NEXT_PUBLIC_ORG`: The name of the organization
3. `BASIC_AUTH_CREDENTIALS`: HTTP Basic auth credentials formatted like `username:password`

Be sure to set each of these within your Vercel deployment as well.

## GraphQL TypeScript Integration

A similar process to [this blog post](https://benlimmer.com/2020/05/16/adding-typescript-types-github-graphql-api/) is used to generate types for application-specific queries that utilize the GitHub Octokit types (which come from `@ocktokit/graphql-schema`). [`next-plugin-graphql`](https://github.com/lfades/next-plugin-graphql) enables importing `.graphql` files (by adding the `graphql-tag/loader` webpack loader).

**NOTE**: After adding or editing a `.graphql` file in the project you need to run `npm run codegen` to get updated TypeScript types.

Also, the Octokit client expects string queries, not the tagged ASTs that `graphql-tag/loader` produces so we have to `print` them back to strings, awkwardly, before passing them to the SDK.

There's surely a better way, but this works for now.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
