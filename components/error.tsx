import { GoAlert } from "react-icons/go";

export function ErrorView({ error }: { error: string }) {
  return (
    <div className="rounded bg-red-600 text-white px-4 py-2 my-4 flex items-center gap-2">
      <GoAlert /> {error}
    </div>
  );
}
