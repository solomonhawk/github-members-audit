import React from "react";
import { GoSync } from "react-icons/go";

export function LoadingView({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center my-10">
      <div className="w-[100px] animate-rise relative">
        <div className="w-full h-0 pb-[90%] relative">
          <iframe
            src="https://giphy.com/embed/vrzRiGOgNNVvLkd2SG"
            width="100%"
            height="100%"
            frameBorder="0"
            className="absolute giphy-embed"
            allowFullScreen
          ></iframe>
        </div>
      </div>

      <p className="flex flex-col sm:flex-row text-center sm:text-left items-center gap-2 font-semibold rounded border border-gray-200 bg-white dark:border-gray-700 dark:bg-[#0d0d0d] px-4 py-3 sm:leading-none relative z-10">
        <GoSync className="animate-spin inline-block text-green-600 dark:text-green-400" />{" "}
        {children}
      </p>
    </div>
  );
}
