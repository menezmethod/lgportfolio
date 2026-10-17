"use client";

import Script from "next/script";
import { useSyncExternalStore } from "react";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

/** Loads Google Analytics only when an ID is configured and the browser has not asked not to be tracked. */
const noop = () => () => {};

function trackingAllowed(): boolean {
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean; msDoNotTrack?: string };
  const w = window as Window & { doNotTrack?: string };
  const dnt = nav.doNotTrack === "1" || nav.msDoNotTrack === "1" || w.doNotTrack === "1";
  return !dnt && nav.globalPrivacyControl !== true;
}

export default function GoogleAnalytics() {
  const allowed = useSyncExternalStore(noop, trackingAllowed, () => false);

  if (!GA_ID || !allowed) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
    </>
  );
}
