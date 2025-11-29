import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Edufy',
  description: 'Edufy learning platform',
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
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
          rel="icon"
          href="https://resources.edufyuzbekistan.com/templates/images/favicon.png"
          type="image/png"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
