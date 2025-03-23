import React from 'react';
import { render, screen } from '@testing-library/react';
import DashboardLayout from '../DashboardLayout';

// Mock child components
jest.mock('../Navbar', () => () => <div data-testid="navbar">Navbar</div>);
jest.mock('../Footer', () => () => <div data-testid="footer">Footer</div>);
jest.mock('../NetworkStatusIndicator', () => () => <div data-testid="network-status">Network Status</div>);

describe('DashboardLayout Component', () => {
  const mockSetAuth = jest.fn();
  const mockOnRefresh = jest.fn();
  
  test('renders with required props and children', () => {
    render(
      <DashboardLayout setAuth={mockSetAuth} onRefresh={mockOnRefresh}>
        <div data-testid="child-content">Child Content</div>
      </DashboardLayout>
    );
    
    // Check if all components are rendered
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
    expect(screen.getByTestId('network-status')).toBeInTheDocument();
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('Child Content')).toBeInTheDocument();
  });

  test('renders with custom container class', () => {
    render(
      <DashboardLayout 
        setAuth={mockSetAuth} 
        onRefresh={mockOnRefresh}
        containerClass="custom-container"
      >
        Child Content
      </DashboardLayout>
    );
    
    const contentWrapper = screen.getByText('Child Content').closest('.content-wrapper');
    expect(contentWrapper).toHaveClass('custom-container');
  });

  test('renders page title when provided', () => {
    const pageTitle = 'Test Dashboard';
    
    render(
      <DashboardLayout 
        setAuth={mockSetAuth} 
        onRefresh={mockOnRefresh}
        pageTitle={pageTitle}
      >
        Child Content
      </DashboardLayout>
    );
    
    expect(screen.getByRole('heading')).toBeInTheDocument();
    expect(screen.getByText(pageTitle)).toBeInTheDocument();
  });

  test('does not render page title when not provided', () => {
    render(
      <DashboardLayout setAuth={mockSetAuth} onRefresh={mockOnRefresh}>
        Child Content
      </DashboardLayout>
    );
    
    const headings = screen.queryByRole('heading');
    expect(headings).not.toBeInTheDocument();
  });
});
