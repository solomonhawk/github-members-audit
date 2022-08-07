import React from "react";
import { GoSync } from "react-icons/go";

export function LoadingView({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-center my-10">
      <p className="flex flex-col sm:flex-row text-center sm:text-left items-center gap-2 font-semibold rounded border border-gray-200 dark:border-gray-700 px-4 py-3 sm:leading-none">
        <GoSync className="animate-spin inline-block" /> {children}
      </p>
    </div>
  );
}
