import "../styles/globals.css";
import type { AppProps } from "next/app";
import basicAuthMiddleware from "nextjs-basic-auth-middleware";
import { NextPageContext } from "next";

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

MyApp.getInitialProps = async ({ ctx }: { ctx: NextPageContext }) => {
  if (!process.env.BASIC_AUTH_CREDENTIALS) {
    throw new Error("BASIC_AUTH_CREDENTIALS environment variable is not set");
  }

  if (ctx.req && ctx.res) {
    await basicAuthMiddleware(ctx.req, ctx.res);
  }

  return {};
};

export default MyApp;
