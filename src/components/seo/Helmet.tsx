import { ReactNode, useEffect } from 'react';

type HelmetProps = {
  title?: string;
  description?: string;
  image?: string;
  canonical?: string;
  lang?: string;
  children?: ReactNode;
};

type MetaDefinition = {
  name?: string;
  property?: string;
  content: string;
};

const upsertMeta = ({ name, property, content }: MetaDefinition) => {
  if (!content) return;

  const selector = name ? `meta[name="${name}"]` : property ? `meta[property="${property}"]` : null;
  if (!selector) return;

  let element = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement('meta');
    if (name) element.setAttribute('name', name);
    if (property) element.setAttribute('property', property);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
};

const upsertLink = (rel: string, href: string) => {
  if (!href) return;
  let link = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', rel);
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
};

export const Helmet = ({ title, description, image, canonical, lang = 'fr', children }: HelmetProps) => {
  useEffect(() => {
    if (lang) {
      document.documentElement.setAttribute('lang', lang);
    }

    if (title) {
      document.title = title;
      upsertMeta({ name: 'og:title', content: title });
      upsertMeta({ name: 'twitter:title', content: title });
    }

    if (description) {
      upsertMeta({ name: 'description', content: description });
      upsertMeta({ property: 'og:description', content: description });
      upsertMeta({ name: 'twitter:description', content: description });
    }

    if (image) {
      upsertMeta({ property: 'og:image', content: image });
      upsertMeta({ name: 'twitter:image', content: image });
    }

    upsertMeta({ name: 'twitter:card', content: 'summary_large_image' });
    upsertMeta({ name: 'theme-color', content: '#0f172a' });

    if (canonical) {
      upsertLink('canonical', canonical);
    }
  }, [title, description, image, canonical, lang]);

  return <>{children}</>;
};

export default Helmet;
