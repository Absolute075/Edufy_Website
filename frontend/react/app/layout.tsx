import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import './globals.css';
import { SessionExpiredProvider } from './SessionExpiredProvider';
import { UserProfileProvider } from './UserProfileProvider';

export const metadata: Metadata = {
  metadataBase: new URL('https://edufyuzbekistan.com'),
  title: {
    default: 'Edufy Uzbekistan - Exam Prep Platform',
    template: '%s - Edufy Uzbekistan',
  },
  description: 'Edufy Uzbekistan - exam preparation platform with practice tests, analytics, and learning resources.',
  openGraph: {
    type: 'website',
    url: 'https://edufyuzbekistan.com/',
    siteName: 'Edufy Uzbekistan',
    title: 'Edufy Uzbekistan - Exam Prep Platform',
    description: 'Exam preparation platform with practice tests, analytics, and learning resources.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Edufy Uzbekistan - Exam Prep Platform',
    description: 'Exam preparation platform with practice tests, analytics, and learning resources.',
  },
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const host = ((await headers()).get('host') ?? '').toLowerCase();
  const hostname = host.split(':')[0];
  const isAdminSubdomain = hostname === 'admin.edufyuzbekistan.com';

  return (
    <html lang="en" className="dark">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600&family=Playfair+Display:wght@400;600&family=Archivo+Black&family=Bebas+Neue&family=Cormorant+Garamond:ital,wght@0,300..700;1,300..700&family=Cormorant:ital,wght@0,300..700;1,300..700&family=PT+Serif:ital,wght@0,400;0,700;1,400;1,700&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="https://unpkg.com/aos@2.3.1/dist/aos.css" />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
        <link
          rel="icon"
          href="https://resources.edufyuzbekistan.com/storage/images/favicon.png"
          type="image/png"
        />
      </head>
      <body>
        <SessionExpiredProvider>
          <UserProfileProvider>
            <div className="orientation-allowed-content">{children}</div>
            {isAdminSubdomain ? null : (
              <div className="orientation-lock-overlay">
                <div className="orientation-lock-box">
                  <p className="orientation-lock-title">Hi there!</p>
                  <p className="orientation-lock-subtitle">
                    Mobile adaptation is still in development, so please try using a PC for a better experience.
                    <br />
                    We sincerely apologize for the inconvenience!
                  </p>
                </div>
              </div>
            )}
          </UserProfileProvider>
        </SessionExpiredProvider>
      </body>
    </html>
  );
}
