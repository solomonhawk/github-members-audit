import "../styles/globals.css";
import type { AppProps } from "next/app";
import basicAuthMiddleware from "nextjs-basic-auth-middleware";
import { NextPageContext } from "next";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary, FallbackProps } from "react-error-boundary";
import { GoStop } from "react-icons/go";

const queryClient = new QueryClient();

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary FallbackComponent={ErrorView}>
      <QueryClientProvider client={queryClient}>
        <Component {...pageProps} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

MyApp.getInitialProps = async ({ ctx }: { ctx: NextPageContext }) => {
  if (typeof window === undefined && !process.env.BASIC_AUTH_CREDENTIALS) {
    throw new Error("BASIC_AUTH_CREDENTIALS environment variable is not set");
  }

  if (ctx.req && ctx.res) {
    await basicAuthMiddleware(ctx.req, ctx.res);
  }

  return {};
};

function ErrorView({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center h-[100vh] p-4">
      <div className="flex flex-col items-center space-y-4 p-4 rounded-lg bg-gray-900 text-center max-w-md">
        <div className="text-red-500">
          <GoStop className="inline text-[4rem]" />
        </div>

        <h1 className="text-xl md:text-2xl font-bold leading-none !mt-2">
          It broke...
        </h1>

        <p className="rounded px-4 py-2 font-mono text-sm bg-black inline-block">
          {error.message}
        </p>

        <button
          className="block rounded-sm border border-gray-200 dark:border-gray-700 px-4 py-2 hover:no-underline hover:bg-gray-200 hover:text-gray-800 dark:hover:bg-gray-700 dark:hover:text-white text-sm font-bold uppercase"
          onClick={resetErrorBoundary}
        >
          Try Again
        </button>

        <hr className="w-full opacity-20" />

        <small className="block">
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          If the problem persists, try <a href="/">reloading the app</a>.
        </small>
      </div>
    </div>
  );
}

export default MyApp;
