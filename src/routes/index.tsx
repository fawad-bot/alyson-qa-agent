import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Alyson QA Agent" },
      {
        name: "description",
        content:
          "AI-assisted QA workspace. Run end-to-end QA against any web app, preview URL, repository, or API target. Findings, evidence, and publish readiness in one place.",
      },
      { property: "og:title", content: "Alyson QA Agent" },
      {
        property: "og:description",
        content:
          "AI-assisted QA workspace. Findings, evidence, and publish readiness in one place.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <iframe
      src="/prototype.html"
      title="Alyson QA Agent"
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
