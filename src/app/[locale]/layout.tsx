// src/app/[locale]/layout.tsx
'use client';
import { StoreProvider } from '../StoreProvider';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
// I18nProviderClient is no longer needed
import type { ReactNode } from 'react';
import { Toaster } from '@/components/ui/toaster';
import HtmlAttributesUpdater from './HtmlAttributesUpdater';

export default function LocaleLayout({ children }: Readonly<{ children: ReactNode }>) {
  const locale = 'fr'; // Locale fixe
  const htmlDir = 'ltr'; 
  const bodyFontClass = 'font-inter'; 

  return (
    <>
      <HtmlAttributesUpdater lang={locale} dir={htmlDir} bodyClassName={bodyFontClass} />
      
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <StoreProvider>
          {children}
          <Toaster />
        </StoreProvider>
      </ThemeProvider>
    </>
  );
}
