import React from "react";

export function Code({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-green-600 dark:text-green-500 border border-gray-200 dark:border-gray-800 rounded bg-gray-100 dark:bg-gray-900 p-[2px]">
      {children}
    </span>
  );
}
