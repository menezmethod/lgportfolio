// Google Tag Manager implementation - no direct ReactGA import needed

// Initialize Google Analytics
export const initGA = () => {
  // Use GTM ID for Google Tag Manager
  const GTM_ID = process.env.REACT_APP_GA_MEASUREMENT_ID || 'GTM-TWTCVMJ';
  
  // GTM is loaded via script tag, so we just need to track the initial pageview
  console.log('Google Tag Manager initialized with ID:', GTM_ID);
  
  // Track initial pageview through GTM dataLayer
  if (window.dataLayer) {
    window.dataLayer.push({
      event: 'page_view',
      page_title: document.title,
      page_location: window.location.href,
      page_path: window.location.pathname
    });
  }
};

// Track page views
export const trackPageView = (page) => {
  if (window.dataLayer) {
    window.dataLayer.push({
      event: 'page_view',
      page_path: page
    });
  }
};

// Track custom events
export const trackEvent = (category, action, label = null, value = null) => {
  if (window.dataLayer) {
    window.dataLayer.push({
      event: 'custom_event',
      event_category: category,
      event_action: action,
      event_label: label,
      event_value: value
    });
  }
};

// Track user interactions
export const trackUserInteraction = (element, action) => {
  trackEvent('User Interaction', action, element);
};

// Track contact form interactions
export const trackContactInteraction = (action) => {
  trackEvent('Contact', action);
};

// Track portfolio section views
export const trackSectionView = (section) => {
  trackEvent('Portfolio Section', 'view', section);
};

// Track external link clicks
export const trackExternalLink = (url, label) => {
  trackEvent('External Link', 'click', label, null);
};

// Track download events (for resume, etc.)
export const trackDownload = (file, label) => {
  trackEvent('Download', 'click', label, null);
}; 