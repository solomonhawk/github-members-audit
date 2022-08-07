import { org } from "lib/env.client";
import Link from "next/link";
import React from "react";
import { DiGithubBadge } from "react-icons/di";

export function Header({ title }: { title: React.ReactNode }) {
  return (
    <header className="container mx-auto px-8 flex flex-col md:flex-row md:items-center justify-between my-4">
      <Link href="/">
        <a className="hover:no-underline">
          <h1 className="text-xl viget-logo text-gray-900 dark:text-white">
            {title}
          </h1>
        </a>
      </Link>

      <a
        className="my-4 md:my-0 whitespace-nowrap flex gap-1 items-center"
        href={`https://github.com/orgs/${org}/outside-collaborators`}
        rel="external noreferrer"
        target="_blank"
      >
        <DiGithubBadge className="w-5 h-5 shrink-0" />
        View All Outside Collaborators ⧉
      </a>
    </header>
  );
}
