import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/layout/Footer';

const sections = [
  {
    number: '01',
    title: 'Information We Collect',
    content: [
      'When you create an account, we collect your email address and display name through Firebase Authentication. If you sign in with Google, we receive your Google profile name and avatar.',
      'Your anime list data — including saved titles, watch status, ratings, and episode progress — is stored either in your browser\'s localStorage (for guest users) or in our database (for authenticated users).',
      'We use localStorage to persist your preferences, privacy settings, and cached anime data for offline functionality. No tracking cookies are used.',
    ],
  },
  {
    number: '02',
    title: 'How We Use Information',
    content: [
      'Your data is used exclusively to power your personal experience: maintaining your anime list, generating AI recommendations based on your preferences, and syncing your data across devices when signed in.',
      'We do not sell, rent, or share your personal data with third parties for marketing purposes. Period.',
      'AI search queries are sent to Google Gemini to generate anime recommendations. These queries do not include your personal information — only the search text you type.',
    ],
  },
  {
    number: '03',
    title: 'Third-Party Services',
    content: [
      'Firebase Authentication — handles sign-in, sign-up, and session management. Governed by Google\'s privacy policy.',
      'Google Gemini API — processes natural language search queries to generate anime recommendations. Query text is sent to Google\'s servers.',
      'Jikan API and AniList API — provide anime metadata (titles, descriptions, scores, etc.). These are public APIs; no user data is sent to them.',
      'Kitsu CDN — serves anime poster images. No user data is transmitted.',
    ],
  },
  {
    number: '04',
    title: 'Data Storage',
    content: [
      'Guest users: all data is stored in your browser\'s localStorage. Clearing browser data will remove it permanently.',
      'Authenticated users: your anime list and tier lists are stored in our PostgreSQL database. This data is associated with your Firebase user ID.',
      'We do not store search queries, browsing history, or analytics data.',
    ],
  },
  {
    number: '05',
    title: 'Your Rights',
    content: [
      'You can delete your account at any time from your Profile page. This removes all associated data from our database.',
      'You can export your anime list data from the My List page.',
      'Privacy controls are available in your Profile settings, allowing you to control visibility of your lists and activity.',
      'Guest users can clear all local data by clearing their browser storage.',
    ],
  },
  {
    number: '06',
    title: 'Contact',
    content: [
      'For privacy concerns, questions, or data deletion requests, please open an issue on our GitHub repository.',
    ],
    link: {
      text: 'Open a GitHub Issue',
      url: 'https://github.com/ABCDullahh/AInime-v2/issues',
    },
  },
];

export default function Privacy() {
  return (
    <div className="min-h-screen bg-[#0c1324] text-[#dce1fb]">
      <Header />

      {/* Hero */}
      <section className="pt-40 pb-20 px-6 md:px-[3.5rem] max-w-4xl mx-auto">
        <p className="text-label text-slate-500 mb-6">LAST UPDATED: MARCH 2026</p>
        <h1 className="text-display mb-6">
          PRIVACY{' '}
          <span className="italic font-light text-slate-400">Policy</span>
        </h1>
        <p className="text-lg text-slate-400 font-light max-w-2xl leading-relaxed">
          We believe in transparency. Here is exactly what we collect, why, and how you stay in control.
        </p>
      </section>

      {/* Sections */}
      <section className="pb-20 px-6 md:px-[3.5rem] max-w-4xl mx-auto">
        {sections.map((section, idx) => (
          <div
            key={section.number}
            className="py-12"
            style={{
              borderTop: idx > 0 ? '1px solid rgba(88, 66, 55, 0.15)' : 'none',
            }}
          >
            <p className="text-label text-[#f97316] mb-3">{section.number}</p>
            <h2 className="text-2xl font-bold tracking-tight mb-8">{section.title}</h2>
            <div className="space-y-4">
              {section.content.map((paragraph, pIdx) => (
                <p key={pIdx} className="text-body-editorial leading-relaxed">
                  {paragraph}
                </p>
              ))}
              {section.link && (
                <a
                  href={section.link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-4 text-sm text-[#f97316] hover:underline font-medium"
                >
                  {section.link.text} &rarr;
                </a>
              )}
            </div>
          </div>
        ))}
      </section>

      {/* Back link */}
      <section className="py-16 px-6 md:px-[3.5rem] max-w-4xl mx-auto text-center">
        <Link
          to="/"
          className="text-sm text-slate-500 hover:text-[#f97316] transition-colors tracking-wide uppercase"
        >
          Back to Discover
        </Link>
      </section>

      <Footer />
    </div>
  );
}
