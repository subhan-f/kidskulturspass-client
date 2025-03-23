import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Navbar from '../Navbar';

// Mock axios for logout functionality
jest.mock('axios', () => ({
  post: jest.fn().mockResolvedValue({ data: { status: 'success' } })
}));

describe('Navbar Component', () => {
  const mockSetAuth = jest.fn();
  const mockOnRefresh = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  const renderWithRouter = (ui) => {
    return render(
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    );
  };
  
  test('renders brand name', () => {
    renderWithRouter(<Navbar setAuth={mockSetAuth} onRefresh={mockOnRefresh} />);
    
    expect(screen.getByText(/KidsKulturSpaß/i)).toBeInTheDocument();
  });
  
  test('renders navigation links', () => {
    renderWithRouter(<Navbar setAuth={mockSetAuth} onRefresh={mockOnRefresh} />);
    
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Künstler/i)).toBeInTheDocument();
    expect(screen.getByText(/Verlauf/i)).toBeInTheDocument();
  });
  
  test('calls onRefresh when refresh button is clicked', () => {
    renderWithRouter(<Navbar setAuth={mockSetAuth} onRefresh={mockOnRefresh} />);
    
    const refreshButton = screen.getByRole('button', { name: /Aktualisieren/i });
    fireEvent.click(refreshButton);
    
    expect(mockOnRefresh).toHaveBeenCalled();
  });
  
  test('calls logout and setAuth when logout button is clicked', async () => {
    const axios = require('axios');
    renderWithRouter(<Navbar setAuth={mockSetAuth} onRefresh={mockOnRefresh} />);
    
    const logoutButton = screen.getByRole('button', { name: /Abmelden/i });
    fireEvent.click(logoutButton);
    
    // Wait for async logout function to complete
    await new Promise(resolve => setTimeout(resolve, 0));
    
    expect(axios.post).toHaveBeenCalledWith('/auth/logout');
    expect(mockSetAuth).toHaveBeenCalledWith(false);
  });
});
