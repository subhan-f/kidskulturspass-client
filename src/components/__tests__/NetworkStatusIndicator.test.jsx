import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import NetworkStatusIndicator from '../NetworkStatusIndicator';

describe('NetworkStatusIndicator Component', () => {
  // Store original navigator.onLine
  const originalOnLine = window.navigator.onLine;
  
  // Mock methods to trigger online/offline events
  const mockOnlineEvent = () => fireEvent(window, new Event('online'));
  const mockOfflineEvent = () => fireEvent(window, new Event('offline'));
  
  beforeEach(() => {
    // Clean up mocks
    jest.clearAllMocks();
    
    // Default to online state for tests
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    });
  });
  
  afterAll(() => {
    // Restore original navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: originalOnLine
    });
  });
  
  test('should not display notification when online', () => {
    render(<NetworkStatusIndicator />);
    
    const notification = screen.queryByText(/Verbindung unterbrochen/i);
    expect(notification).not.toBeInTheDocument();
  });
  
  test('should display offline notification when losing connection', () => {
    render(<NetworkStatusIndicator />);
    
    // Change to offline
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false
    });
    
    mockOfflineEvent();
    
    const notification = screen.getByText(/Verbindung unterbrochen/i);
    expect(notification).toBeInTheDocument();
  });
  
  test('should hide notification when connection is restored', () => {
    // Start with offline
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false
    });
    
    render(<NetworkStatusIndicator />);
    mockOfflineEvent();
    
    // Verify offline message is shown
    expect(screen.getByText(/Verbindung unterbrochen/i)).toBeInTheDocument();
    
    // Change to online
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    });
    
    mockOnlineEvent();
    
    // Check that message is gone
    const notification = screen.queryByText(/Verbindung unterbrochen/i);
    expect(notification).not.toBeInTheDocument();
  });
});
