import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';

/**
 * Simplified fetch hook with just core functionality
 */
export default function useFetch(url, options = {}) {
  const { initialData = null } = options;
  
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const fetchData = useCallback(async () => {
    setLoading(true);
    
    try {
      const response = await axios.get(url, { withCredentials: true });
      setData(response.data);
      setError(null);
      return { success: true, data: response.data };
    } catch (err) {
      console.error(`Error fetching ${url}:`, err);
      setError('Fehler beim Laden der Daten');
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  }, [url]);
  
  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  return { data, loading, error, fetchData };
}
