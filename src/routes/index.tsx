import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fleet Quality Hub — prototype" },
      { name: "description", content: "Alyson QA Agent — fleet quality hub prototype." },
      { property: "og:title", content: "Fleet Quality Hub — prototype" },
      { property: "og:description", content: "Alyson QA Agent — fleet quality hub prototype." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <iframe
      src="/prototype.html"
      title="Fleet Quality Hub prototype"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        border: 0,
      }}
    />
  );
}
