import React from 'react';
import { Link } from 'react-router-dom';

// Plain-language policies. Review with a lawyer before relying on them; update the date when they change.
const UPDATED = 'October 11, 2026';
const CONTACT = (import.meta.env.VITE_CONTACT_EMAIL as string | undefined) || 'the support email shown in the app';

const Page: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <main className="max-w-3xl mx-auto px-4 py-10 text-gray-800 leading-relaxed">
    <a href="/" className="text-sm text-blue-700 hover:underline">← Genesis Heritage</a>
    <h1 className="text-3xl font-bold mt-4">{title}</h1>
    <p className="text-sm text-gray-500 mb-6">Last updated {UPDATED}</p>
    <div className="space-y-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-8 [&_ul]:list-disc [&_ul]:pl-6">{children}</div>
  </main>
);

export const PrivacyPolicy: React.FC = () => (
  <Page title="Privacy Policy">
    <p>Genesis Heritage helps you keep your family history. Your family's information is personal, so we keep this simple: <strong>it is yours, we keep it private, and we never sell it.</strong></p>

    <h2>What we collect</h2>
    <ul>
      <li>Your account details: email address and, if you add it, your name.</li>
      <li>What you choose to save: family tree, stories, recipes, photos, recordings, records you bookmark, and messages to the AI helper.</li>
      <li>If you upload a DNA results file, only the summary insights shown to you are saved.</li>
      <li>Payment status (plan, dates and a reference code). Card and bank details are handled by PayPal or your bank, never stored by us.</li>
      <li>Basic technical logs needed to keep the service secure and working.</li>
    </ul>

    <h2>How we use it</h2>
    <ul>
      <li>To run the features you use, such as showing your tree, searching records and writing your storybook.</li>
      <li>To provide the AI helper. Your question, and any family details needed to answer it, are sent to an AI provider to produce the answer. Each AI provider handles that content under its own terms, and some free AI services may use it to improve their products, so please avoid putting sensitive details about living people into AI requests.</li>
      <li>To process payments and give you access to your plan.</li>
      <li>To contact you about your account. We do not send marketing email without your consent.</li>
    </ul>

    <h2>Who we share it with</h2>
    <p>We never sell or rent your information, and never share it with advertisers, insurers, employers or data brokers. We only share it:</p>
    <ul>
      <li>With relatives you invite through "Share with family", and only what that feature shows them.</li>
      <li>With service providers who run parts of the service for us: Supabase (database and file storage), our website host, AI providers (such as Google Gemini and Groq) and PayPal. They may only use it to provide their service.</li>
      <li>If the law requires it.</li>
    </ul>

    <h2>Living relatives</h2>
    <p>Please only add information about living relatives that you have a right to share, and respect their wishes if they ask you to remove it.</p>

    <h2>Your choices and rights</h2>
    <ul>
      <li><strong>Download:</strong> Account → Your data &amp; privacy → Download all my data, or download your tree as a GEDCOM file.</li>
      <li><strong>Delete:</strong> Account → Your data &amp; privacy → Delete my account permanently removes your account and everything in it.</li>
      <li><strong>Correct:</strong> you can edit anything you have saved at any time.</li>
      <li>You can ask us about the information we hold about you, as provided by Canadian privacy law (PIPEDA) and other laws that apply to you.</li>
    </ul>

    <h2>Security and storage</h2>
    <p>Your data is stored with Supabase and protected by access rules so only you (and relatives you invite) can see it. Photos and recordings are kept in private storage and shown through short-lived links. Data may be stored or processed outside Canada by the providers above.</p>

    <h2>Children</h2>
    <p>Accounts are for people 16 and older. Parents and guardians may add children to a family tree.</p>

    <h2>Contact</h2>
    <p>Questions or requests: contact us at {CONTACT}. If we change this policy in an important way, we will tell you in the app first.</p>
    <p><Link to="/terms" className="text-blue-700 hover:underline">Terms of Service</Link></p>
  </Page>
);

export const TermsOfService: React.FC = () => (
  <Page title="Terms of Service">
    <p>By creating an account or using Genesis Heritage you agree to these terms.</p>

    <h2>Your account</h2>
    <p>You must be 16 or older. Keep your password private; you are responsible for activity on your account.</p>

    <h2>Your content</h2>
    <p>You own everything you add. You give us permission only to store, process and display it to run the service for you and the relatives you share with. You can download or delete it at any time. Only upload content you have the right to share.</p>

    <h2>Acceptable use</h2>
    <ul>
      <li>No scraping, crawling, bulk downloading or automated access to the service, and no copying, reverse engineering or reproducing of the app, its design, features or content, except your own data through the download tools we provide.</li>
      <li>No unlawful, hateful or harassing content, and no content that invades someone's privacy.</li>
      <li>No attempts to access other people's accounts or data, or to disrupt the service.</li>
      <li>Voice features may only be used with the clear permission of the person whose voice it is.</li>
    </ul>

    <h2>Our intellectual property</h2>
    <p>The Genesis Heritage name, logo, software, design, text and AI features are owned by Genesis Heritage and protected by copyright and other laws. These terms give you a personal right to use the service, not ownership of it.</p>

    <h2>Plans and payments</h2>
    <ul>
      <li>The free plan includes core features with daily limits. Pro unlocks higher limits and premium features.</li>
      <li>Prices are shown on the Plans &amp; billing page in Canadian dollars. PayPal subscriptions renew automatically until cancelled; you can cancel any time on that page and keep Pro until the end of the period you paid for.</li>
      <li>e-Transfer and payment-link purchases cover the period bought and do not renew automatically.</li>
      <li>If something went wrong with a payment, contact us within 30 days and we will make it right.</li>
    </ul>

    <h2>Research results and AI</h2>
    <p>Historical records come from third-party archives and may contain errors. AI-written text (such as storybooks) is based on what you saved but can still make mistakes. Please check important facts.</p>

    <h2>Availability and changes</h2>
    <p>We work to keep the service available but cannot promise it will never be interrupted. We may update features and these terms; we will tell you about important changes in the app. If you stop agreeing, you can download your data and close your account.</p>

    <h2>Liability</h2>
    <p>To the extent the law allows, the service is provided "as is", and our total liability to you is limited to the amount you paid us in the 12 months before the claim.</p>

    <h2>Law</h2>
    <p>These terms are governed by the laws of the province of Canada where the operator is based and the federal laws of Canada that apply there.</p>

    <h2>Contact</h2>
    <p>Contact us at {CONTACT}.</p>
    <p><Link to="/privacy" className="text-blue-700 hover:underline">Privacy Policy</Link></p>
  </Page>
);
