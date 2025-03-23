import React, { useState } from 'react';
import { toast } from 'react-toastify';
import DashboardLoader from '../components/DashboardLoader';

/**
 * Custom hook for handling API calls with loading states
 */
export const useApiCall = (initialState = null) => {
  const [data, setData] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const callApi = async (apiFunction, options = {}) => {
    const { 
      onSuccess, 
      onError, 
      successMessage, 
      errorMessage,
      showSuccessToast = true,
      showErrorToast = true,
      ...apiOptions 
    } = options;

    setLoading(true);
    setError(null);

    try {
      const response = await apiFunction(apiOptions);
      setData(response.data);
      
      if (successMessage && showSuccessToast) {
        toast.success(successMessage);
      }
      
      if (onSuccess) {
        onSuccess(response.data);
      }
      
      return response.data;
    } catch (err) {
      console.error('API Call Error:', err);
      
      const message = errorMessage || err.response?.data?.message || err.message || 'Ein Fehler ist aufgetreten';
      setError(message);
      
      if (showErrorToast) {
        toast.error(message);
      }
      
      if (onError) {
        onError(err);
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Helper component for rendering loading state
  const LoadingComponent = ({ message = "Wird geladen..." }) => {
    if (loading) {
      return <DashboardLoader message={message} />;
    }
    return null;
  };

  return {
    data,
    loading,
    error,
    setData,
    setError,
    callApi,
    LoadingComponent
  };
};

/**
 * Higher-Order Component for wrapping components with loading state
 */
export const withLoadingState = (WrappedComponent, loadingMessage = "Wird geladen...") => {
  return (props) => {
    const { loading, ...restProps } = props;
    
    if (loading) {
      return <DashboardLoader message={loadingMessage} />;
    }
    
    return <WrappedComponent {...restProps} />;
  };
};
