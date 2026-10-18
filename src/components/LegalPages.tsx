import React from 'react';
import { Link } from 'react-router-dom';
import { locale, t, useLang } from '../lib/i18n';

// Plain-language policies. Review with a lawyer before relying on them; update the date when they change.
// Each sentence goes through t(), so the French version says exactly the same thing (keep them in step).
const UPDATED = '2026-10-11';
const contact = () => (import.meta.env.VITE_CONTACT_EMAIL as string | undefined) || t('the support email shown in the app');
const updated = () => new Date(`${UPDATED}T12:00:00Z`).toLocaleDateString(locale(), { year: 'numeric', month: 'long', day: 'numeric' });

const Page: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  useLang();
  return (
  <main className="max-w-3xl mx-auto px-4 py-10 text-gray-800 leading-relaxed">
    <a href="/" className="text-sm text-genesis-700 hover:underline">← Genesis Heritage</a>
    <h1 className="text-3xl font-bold mt-4">{title}</h1>
    <p className="text-sm text-gray-500 mb-6">{t('Last updated {date}', { date: updated() })}</p>
    <div className="space-y-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-8 [&_ul]:list-disc [&_ul]:pl-6">{children}</div>
  </main>
  );
};

export const PrivacyPolicy: React.FC = () => {
  useLang();
  return (
  <Page title={t('Privacy Policy')}>
    <p>{t('Genesis Heritage helps you keep your family history. Your family’s information is personal, so we keep this simple:')} <strong>{t('it is yours, we keep it private, and we never sell it.')}</strong></p>

    <h2>{t('What we collect')}</h2>
    <ul>
      <li>{t('Your account details: email address and, if you add it, your name.')}</li>
      <li>{t('What you choose to save: family tree, stories, recipes, photos, recordings, records you bookmark, and messages to the AI helper.')}</li>
      <li>{t('If you upload a DNA results file, only the summary insights shown to you are saved.')}</li>
      <li>{t('Payment status (plan, dates and a reference code). Card and bank details are handled by PayPal or your bank, never stored by us.')}</li>
      <li>{t('Basic technical logs needed to keep the service secure and working.')}</li>
    </ul>

    <h2>{t('How we use it')}</h2>
    <ul>
      <li>{t('To run the features you use, such as showing your tree, searching records and writing your storybook.')}</li>
      <li>{t('To provide the AI helper. Your question, and any family details needed to answer it, are sent to an AI provider to produce the answer. Each AI provider handles that content under its own terms, and some free AI services may use it to improve their products, so please avoid putting sensitive details about living people into AI requests.')}</li>
      <li>{t('To process payments and give you access to your plan.')}</li>
      <li>{t('To contact you about your account. We do not send marketing email without your consent.')}</li>
    </ul>

    <h2>{t('Who we share it with')}</h2>
    <p>{t('We never sell or rent your information, and never share it with advertisers, insurers, employers or data brokers. We only share it:')}</p>
    <ul>
      <li>{t('With relatives you invite through "Share with family", and only what that feature shows them.')}</li>
      <li>{t('With service providers who run parts of the service for us: Supabase (database and file storage), our website host, AI providers (such as Google Gemini and Groq) and PayPal. They may only use it to provide their service.')}</li>
      <li>{t('If the law requires it.')}</li>
    </ul>

    <h2>{t('Living relatives')}</h2>
    <p>{t('Please only add information about living relatives that you have a right to share, and respect their wishes if they ask you to remove it.')}</p>

    <h2>{t('Your choices and rights')}</h2>
    <ul>
      <li><strong>{t('Download:')}</strong> {t('My account → Your data & privacy → Download everything (one .zip with your data, your tree as a GEDCOM file, and all your photos and recordings).')}</li>
      <li><strong>{t('Delete:')}</strong> {t('My account → Your data & privacy → Delete my account permanently removes your account and everything in it.')}</li>
      <li><strong>{t('Correct:')}</strong> {t('you can edit anything you have saved at any time.')}</li>
      <li>{t('You can ask us about the information we hold about you, as provided by Canadian privacy law (PIPEDA) and other laws that apply to you.')}</li>
    </ul>

    <h2>{t('Security and storage')}</h2>
    <p>{t('Your data is stored with Supabase and protected by access rules so only you (and relatives you invite) can see it. Photos and recordings are kept in private storage and shown through short-lived links. Data may be stored or processed outside Canada by the providers above.')}</p>

    <h2>{t('Children')}</h2>
    <p>{t('Accounts are for people 16 and older. Parents and guardians may add children to a family tree.')}</p>

    <h2>{t('Contact')}</h2>
    <p>{t('Questions or requests: contact us at {contact}. If we change this policy in an important way, we will tell you in the app first.', { contact: contact() })}</p>
    <p><Link to="/terms" className="text-genesis-700 hover:underline">{t('Terms of Service')}</Link></p>
  </Page>
  );
};

export const TermsOfService: React.FC = () => {
  useLang();
  return (
  <Page title={t('Terms of Service')}>
    <p>{t('By creating an account or using Genesis Heritage you agree to these terms.')}</p>

    <h2>{t('Your account')}</h2>
    <p>{t('You must be 16 or older. Keep your password private; you are responsible for activity on your account.')}</p>

    <h2>{t('Your content')}</h2>
    <p>{t('You own everything you add. You give us permission only to store, process and display it to run the service for you and the relatives you share with. You can download or delete it at any time. Only upload content you have the right to share.')}</p>

    <h2>{t('Acceptable use')}</h2>
    <ul>
      <li>{t('No scraping, crawling, bulk downloading or automated access to the service, and no copying, reverse engineering or reproducing of the app, its design, features or content, except your own data through the download tools we provide.')}</li>
      <li>{t('No unlawful, hateful or harassing content, and no content that invades someone’s privacy.')}</li>
      <li>{t('No attempts to access other people’s accounts or data, or to disrupt the service.')}</li>
      <li>{t('Voice features may only be used with the clear permission of the person whose voice it is.')}</li>
    </ul>

    <h2>{t('Our intellectual property')}</h2>
    <p>{t('The Genesis Heritage name, logo, software, design, text and AI features are owned by Genesis Heritage and protected by copyright and other laws. These terms give you a personal right to use the service, not ownership of it.')}</p>

    <h2>{t('Plans and payments')}</h2>
    <ul>
      <li>{t('The free plan includes core features with daily limits. Pro unlocks higher limits and premium features.')}</li>
      <li>{t('Prices are shown on the Plans & billing page in Canadian dollars. PayPal subscriptions renew automatically until cancelled; you can cancel any time on that page and keep Pro until the end of the period you paid for.')}</li>
      <li>{t('e-Transfer and payment-link purchases cover the period bought and do not renew automatically.')}</li>
      <li>{t('If something went wrong with a payment, contact us within 30 days and we will make it right.')}</li>
    </ul>

    <h2>{t('Research results and AI')}</h2>
    <p>{t('Historical records come from third-party archives and may contain errors. AI-written text (such as storybooks) is based on what you saved but can still make mistakes. Please check important facts.')}</p>

    <h2>{t('Availability and changes')}</h2>
    <p>{t('We work to keep the service available but cannot promise it will never be interrupted. We may update features and these terms; we will tell you about important changes in the app. If you stop agreeing, you can download your data and close your account.')}</p>

    <h2>{t('Liability')}</h2>
    <p>{t('To the extent the law allows, the service is provided "as is", and our total liability to you is limited to the amount you paid us in the 12 months before the claim.')}</p>

    <h2>{t('Law')}</h2>
    <p>{t('These terms are governed by the laws of the province of Canada where the operator is based and the federal laws of Canada that apply there.')}</p>

    <h2>{t('Contact')}</h2>
    <p>{t('Contact us at {contact}.', { contact: contact() })}</p>
    <p><Link to="/privacy" className="text-genesis-700 hover:underline">{t('Privacy Policy')}</Link></p>
  </Page>
  );
};
