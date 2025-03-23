import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import SystemStatus from '../SystemStatus';

jest.mock('axios');

describe('SystemStatus Component', () => {
  const mockSystemInfo = {
    version: '1.0.0',
    node: 'v16.14.0',
    platform: 'linux',
    arch: 'x64',
    memory: {
      total: '16 GB',
      free: '8 GB',
      usage: '50%'
    },
    cpu: {
      model: 'Intel Core i7',
      cores: 8,
      loadAvg: [1.5, 1.2, 1.0]
    },
    uptime: '2d 5h 30m 15s',
    env: 'production'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading state initially', () => {
    axios.get.mockImplementation(() => new Promise(() => {})); // Never resolves
    render(<SystemStatus />);
    expect(screen.getByText(/loading system information/i)).toBeInTheDocument();
  });

  test('renders system information when data is loaded', async () => {
    axios.get.mockResolvedValue({ data: mockSystemInfo });
    render(<SystemStatus />);
    
    await waitFor(() => {
      expect(screen.getByText('System Status')).toBeInTheDocument();
    });
    
    expect(screen.getByText(/version:/i)).toHaveTextContent('Version: 1.0.0');
    expect(screen.getByText(/environment:/i)).toHaveTextContent('Environment: production');
    expect(screen.getByText(/node.js:/i)).toHaveTextContent('Node.js: v16.14.0');
    expect(screen.getByText(/cpu cores:/i)).toHaveTextContent('CPU Cores: 8');
    expect(screen.getByText(/memory usage:/i)).toHaveTextContent('Memory Usage: 50%');
  });

  test('renders error state when request fails', async () => {
    axios.get.mockRejectedValue(new Error('API error'));
    render(<SystemStatus />);
    
    await waitFor(() => {
      expect(screen.getByText(/failed to load system information/i)).toBeInTheDocument();
    });
  });
});
