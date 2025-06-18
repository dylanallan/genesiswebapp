import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  keywords?: string[];
}

export function SEO({
  title = 'Genesis Heritage - Automate your business and unlock your roots',
  description = 'Genesis Heritage helps businesses automate their operations and discover their roots through advanced AI technology.',
  image = '/images/og-image.jpg',
  url = typeof window !== 'undefined' ? window.location.href : '',
  type = 'website',
  keywords = ['business automation', 'AI', 'heritage', 'roots', 'technology'],
}: SEOProps) {
  const siteTitle = 'Genesis Heritage';
  const fullTitle = title === siteTitle ? title : `${title} | ${siteTitle}`;

  return (
    <Helmet>
      {/* Basic meta tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Additional meta tags */}
      <meta name="robots" content="index, follow" />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />
      <meta name="author" content="Genesis Heritage" />

      {/* Canonical URL */}
      <link rel="canonical" href={url} />

      {/* JSON-LD structured data */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: siteTitle,
          url: url,
          logo: image,
          description: description,
          sameAs: [
            'https://twitter.com/genesisheritage',
            'https://linkedin.com/company/genesisheritage',
            'https://facebook.com/genesisheritage',
          ],
        })}
      </script>
    </Helmet>
  );
} 