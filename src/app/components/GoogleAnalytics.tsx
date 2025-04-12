'use client';

import React from 'react';
import Script from 'next/script';

export default function GoogleAnalytics() {
  return (
    <React.Fragment>
      <Script src="https://www.googletagmanager.com/gtag/js?id=G-L0FHTB5RRW" />
      <Script id="google-analytics">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-L0FHTB5RRW');
        `}
      </Script>
    </React.Fragment>
  );
} 