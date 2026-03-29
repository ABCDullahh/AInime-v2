import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/layout/Footer';

const sections = [
  {
    number: '01',
    title: 'Acceptance of Terms',
    content: [
      'By accessing or using AInime ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.',
      'We may update these terms from time to time. Continued use of the Service after changes constitutes acceptance of the revised terms.',
    ],
  },
  {
    number: '02',
    title: 'Description of Service',
    content: [
      'AInime is an anime discovery platform that provides AI-powered search, personalized recommendations, anime list management, tier list creation, and seasonal broadcast calendars.',
      'The Service aggregates anime data from third-party APIs (Jikan, AniList, Kitsu) and uses Google Gemini for natural language search capabilities.',
      'AInime is provided free of charge as an open source project under the MIT License.',
    ],
  },
  {
    number: '03',
    title: 'User Accounts',
    content: [
      'Account creation is handled through Firebase Authentication. You may sign up with email/password or via Google Sign-In.',
      'You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account.',
      'You must provide accurate information when creating an account. We reserve the right to suspend accounts that violate these terms.',
    ],
  },
  {
    number: '04',
    title: 'Content',
    content: [
      'All anime metadata, descriptions, images, and related content displayed on AInime is sourced from third-party APIs (Jikan/MyAnimeList, AniList, Kitsu). AInime does not claim ownership of this content.',
      'User-generated content — including list entries, ratings, notes, and tier lists — remains the property of the respective users.',
      'AI-generated search results and recommendations are provided as-is and should not be considered definitive or exhaustive.',
    ],
  },
  {
    number: '05',
    title: 'Acceptable Use',
    content: [
      'You agree not to scrape, crawl, or use automated tools to extract data from the Service at scale.',
      'You agree not to abuse API rate limits, whether directly or through the Service\'s proxy endpoints.',
      'You agree not to use the Service for any unlawful purpose or in violation of any applicable laws.',
      'You agree not to attempt to gain unauthorized access to other users\' accounts or data.',
      'You agree not to interfere with or disrupt the Service or its infrastructure.',
    ],
  },
  {
    number: '06',
    title: 'Intellectual Property',
    content: [
      'The AInime source code is released under the MIT License. You are free to use, modify, and distribute the code in accordance with that license.',
      'The AInime name, logo, and brand identity are the property of the project maintainers.',
      'Third-party trademarks, service marks, and logos are the property of their respective owners.',
    ],
  },
  {
    number: '07',
    title: 'Limitation of Liability',
    content: [
      'AInime is provided "as is" without warranties of any kind, whether express or implied.',
      'We do not guarantee the accuracy, completeness, or availability of anime data sourced from third-party APIs.',
      'In no event shall the AInime project or its contributors be liable for any indirect, incidental, special, or consequential damages arising from use of the Service.',
      'We are not responsible for any data loss resulting from browser storage limitations, account deletion, or third-party service disruptions.',
    ],
  },
  {
    number: '08',
    title: 'Changes to Terms',
    content: [
      'We reserve the right to modify these Terms of Service at any time. Changes will be reflected by updating the "Last Updated" date at the top of this page.',
      'For significant changes, we will make reasonable efforts to notify users through the Service.',
      'Your continued use of AInime after changes to these terms constitutes acceptance of the modified terms.',
    ],
  },
];

export default function Terms() {
  return (
    <div className="min-h-screen bg-[#0c1324] text-[#dce1fb]">
      <Header />

      {/* Hero */}
      <section className="pt-40 pb-20 px-6 md:px-[3.5rem] max-w-4xl mx-auto">
        <p className="text-label text-slate-500 mb-6">LAST UPDATED: MARCH 2026</p>
        <h1 className="text-display mb-6">
          TERMS{' '}
          <span className="italic font-light text-slate-400">of Service</span>
        </h1>
        <p className="text-lg text-slate-400 font-light max-w-2xl leading-relaxed">
          The ground rules for using AInime. Plain language, no legalese walls.
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
