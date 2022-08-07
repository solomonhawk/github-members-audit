import React from "react";

export function Code({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-red-600 dark:text-red-400 border border-gray-300 dark:border-gray-700 rounded-sm bg-gray-200 dark:bg-gray-900">
      {children}
    </span>
  );
}
