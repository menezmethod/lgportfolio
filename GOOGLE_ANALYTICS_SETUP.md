# Google Tag Manager Setup Guide

This guide explains how to set up Google Tag Manager (GTM) for your React portfolio using best practices.

## Prerequisites

1. A Google Tag Manager account
2. Your GTM Container ID (format: GTM-XXXXXXXX)

## Setup Instructions

### 1. Create Google Tag Manager Container

1. Go to [Google Tag Manager](https://tagmanager.google.com/)
2. Create a new GTM container for your portfolio
3. Note your Container ID (starts with "GTM-")

### 2. Environment Configuration

1. Create a `.env` file in your project root:
```bash
REACT_APP_GA_MEASUREMENT_ID=GTM-TWTCVMJ
```

2. Replace `GTM-TWTCVMJ` with your actual Container ID if different

### 3. Implementation Details

The Google Tag Manager implementation includes:

#### Core Features
- **Automatic page view tracking** on app initialization
- **Custom event tracking** for user interactions
- **External link tracking** for social media clicks
- **Contact form tracking** for email interactions
- **GTM dataLayer integration** for flexible tracking

#### Tracking Functions Available

```javascript
// Track page views
trackPageView('/about');

// Track custom events
trackEvent('User Interaction', 'button_click', 'contact_button');

// Track contact interactions
trackContactInteraction('email_click');

// Track external links
trackExternalLink('https://github.com/user', 'GitHub');

// Track section views
trackSectionView('about');

// Track downloads
trackDownload('/resume.pdf', 'Resume Download');
```

#### GTM dataLayer Events
All events are pushed to the GTM dataLayer for flexible configuration:
- `page_view` - Page view events
- `custom_event` - Custom user interactions
- `contact_interaction` - Contact form events
- `external_link` - Outbound link clicks

### 4. Privacy and Compliance

#### GDPR Compliance
- Analytics only runs when a valid GTM Container ID is provided
- No personal data is collected
- Users can opt-out via browser settings

#### Best Practices Implemented
- Environment-based configuration
- GTM script loading in HTML head
- Error handling for missing GTM ID
- Clean separation of concerns

### 5. Testing

#### Development Testing
1. Open browser developer tools
2. Check the Console tab for GTM debug messages
3. Verify events are being pushed to dataLayer

#### Production Verification
1. Deploy your site
2. Visit your Google Tag Manager dashboard
3. Check Real-Time reports for incoming data

### 6. Customization

#### Adding More Tracking
To add tracking to new components:

```javascript
import { trackEvent } from '../utils/analytics';

// In your component
<button onClick={() => trackEvent('Portfolio', 'project_view', 'project_name')}>
  View Project
</button>
```

#### Tracking Custom Dimensions
For more advanced tracking, modify the analytics utility:

```javascript
// In src/utils/analytics.js
export const trackCustomDimension = (dimension, value) => {
  ReactGA.set({
    [dimension]: value
  });
};
```

### 7. Troubleshooting

#### Common Issues

1. **No data appearing in GTM**
   - Verify your Container ID is correct
   - Check that the `.env` file is in the project root
   - Ensure the environment variable starts with `REACT_APP_`

2. **Events not tracking**
   - Check browser console for errors
   - Verify GTM is loaded properly
   - Ensure tracking functions are called correctly

3. **Development vs Production**
   - GTM script is loaded in both environments
   - Check dataLayer in browser console for events

### 8. Security Notes

- Never commit your actual GTM Container ID to version control
- Use environment variables for configuration
- The `.env` file should be in your `.gitignore`

## Files Modified

- `src/utils/analytics.js` - Analytics utility functions
- `src/App.js` - GTM initialization and social link tracking
- `src/components/Contact.js` - Contact form tracking
- `public/index.html` - GTM script tags
- `env.example` - Environment variables template

## Next Steps

1. Create your GTM container
2. Add your Container ID to `.env` (if different from GTM-TWTCVMJ)
3. Test the implementation
4. Deploy and verify data collection 