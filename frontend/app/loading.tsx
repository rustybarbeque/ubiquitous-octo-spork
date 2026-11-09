import { Spin } from "antd";

/** Shown while a page's server-side data (e.g. the catalog) is loading. */
export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <Spin size="large" />
    </div>
  );
}
