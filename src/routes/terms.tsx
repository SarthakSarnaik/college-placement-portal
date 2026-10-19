import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal-page";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms and Conditions — Placement Portal" },
      { name: "description", content: "Terms governing use of the college placement information portal." },
      { property: "og:title", content: "Terms and Conditions — Placement Portal" },
      { property: "og:description", content: "Rules for using the placement portal." },
    ],
  }),
  component: () => (
    <LegalPage title="Terms and Conditions" updated="October 2026">
      <h2>Purpose</h2>
      <p>The portal provides preparation information about campus recruiters. It is not an official offer, guarantee of eligibility, or substitute for notices issued by the Training & Placement Office or the recruiting company.</p>
      <h2>Accuracy of information</h2>
      <p>Entries labelled “Demo” are sample data and are not real. Entries without a “Verified” label have not been confirmed. Always check final eligibility criteria in the official drive notice.</p>
      <h2>Acceptable use</h2>
      <ul><li>Do not share your account or attempt to access administrator features without authorisation.</li><li>Do not copy or redistribute interview questions in bulk outside the institution.</li><li>Do not submit false information about companies or interviews.</li></ul>
      <h2>Accounts</h2>
      <p>The placement office may suspend accounts that breach these terms.</p>
      <h2>Changes</h2>
      <p>These terms may be updated; continued use after changes means you accept the revised terms.</p>
    </LegalPage>
  ),
});
