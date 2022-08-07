import { org } from "lib/env.client";
import Link from "next/link";
import React from "react";
import { DiGithubBadge } from "react-icons/di";

export function Header({
  startAdornment,
  title,
}: {
  startAdornment?: React.ReactNode;
  title: React.ReactNode;
}) {
  return (
    <header className="container mx-auto px-4 md:px-8 flex flex-col md:flex-row md:items-center justify-between pt-4 mb-4">
      <div className="flex items-center">
        {startAdornment}

        <Link href="/">
          <a className="hover:no-underline">
            <h1 className="text-xl text-gray-900 dark:text-white">{title}</h1>
          </a>
        </Link>
      </div>

      <a
        className="my-4 md:my-0 whitespace-nowrap flex gap-1 items-center"
        href={`https://github.com/orgs/${org}/outside-collaborators`}
        rel="external noreferrer"
        target="_blank"
      >
        <DiGithubBadge className="w-5 h-5 shrink-0 text-gray-800 dark:text-gray-200" />
        View All Outside Collaborators ⧉
      </a>
    </header>
  );
}
