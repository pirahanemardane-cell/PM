'use client';

import { SeoAnalysisPanel, emptySeoValue } from './seo-analysis-panel';
import { useParams, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function SeoPanelConnection() {
  const params = useParams();
  const searchParams = useSearchParams();
  const type = params.type as string;

  const [value, setValue] = useState<any>(emptySeoValue());

  useEffect(() => {
    setValue(emptySeoValue({
      metaTitle: 'عنوان پیش‌فرض',
      metaDescription: 'توضیح متا پیش‌فرض',
      focusKeyphrases: [],
      robotsIndex: type !== 'tag' && type !== 'blog-tag',
    }));
  }, [type]);

  return (
    <SeoAnalysisPanel
      pageName={searchParams.get('title') || 'عنوان صفحه'}
      slug={params.slug as string || searchParams.get('slug') || ''}
      shortDescription={searchParams.get('description') || ''}
      body={searchParams.get('body') || ''}
      imageUrl={searchParams.get('image') || ''}
      siteName="پیراهن مردانه"
      siteUrl="https://pirahanmardane.ir"
      forceNoindex={value.robotsIndex === false}
      value={value}
      onChange={setValue}
    />
  );
}
