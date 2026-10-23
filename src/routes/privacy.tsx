import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal-page";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Placement Portal" },
      {
        name: "description",
        content: "How the placement portal collects, uses and protects student and staff data.",
      },
      { property: "og:title", content: "Privacy Policy — Placement Portal" },
      { property: "og:description", content: "How the placement portal handles personal data." },
    ],
  }),
  component: () => (
    <LegalPage title="Privacy Policy" updated="October 2026">
      <h2>What we collect</h2>
      <ul>
        <li>
          Account details: name, email address and password (stored securely by our authentication
          provider).
        </li>
        <li>Optional academic details you choose to add, such as branch and graduation year.</li>
        <li>Basic technical logs needed to keep the service secure.</li>
      </ul>
      <h2>How we use it</h2>
      <p>
        Data is used only to provide access to placement information and to let placement office
        staff manage the portal. We do not sell personal data or use it for advertising.
      </p>
      <h2>Who can see it</h2>
      <p>
        Your profile is visible to you and to authorised Training & Placement Office administrators.
      </p>
      <h2>Retention and deletion</h2>
      <p>
        Accounts are kept while you are enrolled. You may request deletion of your account by
        contacting the placement office.
      </p>
      <h2>Contact</h2>
      <p>
        Questions about this policy should be sent to your institution's Training & Placement
        Office.
      </p>
    </LegalPage>
  ),
});
