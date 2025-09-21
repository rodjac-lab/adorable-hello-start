import { ReactNode } from 'react';
import { Helmet } from '@/components/seo/Helmet';
import { cn } from '@/lib/utils';

type PageLayoutProps = {
  children: ReactNode;
  title?: string;
  description?: string;
  image?: string;
  canonical?: string;
  className?: string;
  skipTargetId?: string;
};

const SITE_NAME = 'Carnet de voyage en Jordanie';
const DEFAULT_DESCRIPTION =
  'Carnet de voyage interactif dédié à la Jordanie : itinéraires, journal quotidien, bonnes adresses et carte immersive.';

export const PageLayout = ({
  children,
  title,
  description,
  image,
  canonical,
  className,
  skipTargetId = 'main-content',
}: PageLayoutProps) => {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const metaDescription = description ?? DEFAULT_DESCRIPTION;

  return (
    <>
      <Helmet title={fullTitle} description={metaDescription} image={image} canonical={canonical} lang="fr" />
      <a
        href={`#${skipTargetId}`}
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Passer au contenu principal
      </a>
      <div className={cn('min-h-screen bg-background text-foreground', className)}>{children}</div>
    </>
  );
};

export default PageLayout;
