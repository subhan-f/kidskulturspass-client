import React from 'react';
import { render, screen } from '@testing-library/react';
import Footer from '../Footer';

describe('Footer Component', () => {
  test('renders copyright notice with current year', () => {
    render(<Footer />);
    
    // Get current year for comparison
    const currentYear = new Date().getFullYear();
    
    expect(screen.getByText(new RegExp(`© ${currentYear}`, 'i'))).toBeInTheDocument();
    expect(screen.getByText(/KidsKulturSpaß/i)).toBeInTheDocument();
  });
  
  test('renders version information if provided', () => {
    process.env.REACT_APP_VERSION = '1.2.3';
    render(<Footer />);
    
    expect(screen.getByText(/Version: 1.2.3/i)).toBeInTheDocument();
    
    // Clean up
    delete process.env.REACT_APP_VERSION;
  });
  
  test('does not show version when not provided', () => {
    // Ensure version is not set
    delete process.env.REACT_APP_VERSION;
    render(<Footer />);
    
    const versionElement = screen.queryByText(/Version:/i);
    expect(versionElement).not.toBeInTheDocument();
  });
});
