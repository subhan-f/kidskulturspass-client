import { useState, useEffect } from 'react';

/**
 * Custom hook to handle responsive media queries
 * @param {string} query - CSS media query string
 * @returns {boolean} - Whether the media query matches
 */
function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    
    // Set initial value
    setMatches(mediaQuery.matches);
    
    // Create event listener
    const handleChange = (event) => {
      setMatches(event.matches);
    };
    
    // Modern API (addEventListener)
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } 
    // Legacy API (addListener/removeListener)
    else {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [query]);
  
  return matches;
}

export default useMediaQuery;
