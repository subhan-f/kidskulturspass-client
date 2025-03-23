// Simple analytics tracking module - can be expanded to use Google Analytics or custom tracker

// Initialize analytics
export const initAnalytics = () => {
  // This runs asynchronously and doesn't block rendering
  setTimeout(() => {
    console.log('Analytics initialized');
    // Track page view
    trackPageView(window.location.pathname);
  }, 0);
};

// Track page views
export const trackPageView = (path) => {
  try {
    // Don't track in development
    if (import.meta.env.DEV) return;
    
    const cleanPath = path.replace(/\/+$/, '') || '/';
    console.log(`Analytics: Page view - ${cleanPath}`);
    
    // Here you would integrate with your analytics service
    // Example with Google Analytics:
    // window.gtag('config', 'GA-ID', { page_path: cleanPath });
  } catch (error) {
    console.error('Analytics error:', error);
  }
};

// Track events
export const trackEvent = (category, action, label = null, value = null) => {
  try {
    // Don't track in development
    if (import.meta.env.DEV) return;
    
    console.log(`Analytics: Event - ${category} / ${action} / ${label} / ${value}`);
    
    // Here you would integrate with your analytics service
    // Example with Google Analytics:
    // window.gtag('event', action, {
    //   event_category: category,
    //   event_label: label,
    //   value: value
    // });
  } catch (error) {
    console.error('Analytics error:', error);
  }
};

export default {
  initAnalytics,
  trackPageView,
  trackEvent
};
