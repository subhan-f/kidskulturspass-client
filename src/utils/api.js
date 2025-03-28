import axios from 'axios';
import { 
  mockUnassignedEvents, 
  mockHistoryData, 
  mockArtists, 
  mockCalendars, 
  mockRoleOptions 
} from './mockData';
// import apiService from './apiService';

// Create a simulated delay to mimic network requests
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Simulate API with mock data
const mockApi = {
  // Mock the events endpoint
  getUnassignedEvents: async (options = {}) => {
    await delay(800); // Simulate network delay
    
    if (options.loading) {
      // Simulate the "loading" status on first request
      await delay(1000);
    }
    
    return { data: mockUnassignedEvents };
  },
  
  // Mock the history endpoint
  getHistory: async () => {
    await delay(1000);
    return { data: mockHistoryData };
  },
  
  // Mock the artists endpoint
  getArtists: async () => {
    await delay(800);
    return { data: mockArtists };
  },
  
  // Mock calendar options
  getCalendars: async () => {
    await delay(400);
    return { data: mockCalendars };
  },
  
  // Mock role options
  getRoleOptions: async () => {
    await delay(400);
    return { data: mockRoleOptions };
  },
  
  // Mock adding an artist
  addArtist: async (artist) => {
    await delay(800);
    return { 
      data: { 
        status: 'success', 
        message: 'Artist added successfully',
        artist: { id: Math.random().toString(36).substr(2, 9), ...artist }
      } 
    };
  },
  
  // Mock deleting an artist
  deleteArtist: async ({ calendar, email }) => {
    await delay(800);
    return { 
      data: { 
        status: 'success', 
        message: 'Artist deleted successfully' 
      } 
    };
  },
  
  // Mock recording history
  recordHistory: async () => {
    await delay(800);
    return { 
      data: { 
        success: true, 
        message: 'History recorded successfully' 
      } 
    };
  }
};
 const artistService = {
  getArtists:async  () => await api.get('/'),
  getCalendars: () => api.get('/calendars'),
  getRoleOptions: () => api.get('/roleOptions'),
  addArtist: (artist, calendar) => api.post('/artist', { ...artist, calendar }),
  deleteArtist: (calendar, email) => api.delete('/artist', { data: { calendar, email } })
};
// Keep the original axios instance for reference
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Export a mock version of the auth API that automatically "authenticates"
export const authApi = {
  login: async () => {
    await delay(800);
    return { data: { status: 'success', user: { name: 'Demo User' } } };
  },
  check: async () => {
    await delay(300);
    return { data: { authenticated: true } };
  },
  logout: async () => {
    await delay(300);
    return { data: { status: 'success' } };
  }
};

// Override the default export to use our mock API
export default {
  get: async (url, config) => {
    console.log(`Mock API GET request to: ${url}`);
    
    if (url.includes('/unassignedEvents')) {
      return mockApi.getUnassignedEvents(config?.params);
    }
    
    if (url.includes('/unassignedEventsHistory')) {
      return mockApi.getHistory();
    }
    
    if (url === '/artists') {
      // return mockApi.getArtists();
      
      const data=await artistService.getArtists()
      console.log(data)
      return data.data

    }
    
    if (url === '/calendars') {
      return mockApi.getCalendars();
    }
    
    if (url === '/roleOptions') {
      return mockApi.getRoleOptions();
    }
    
    console.warn(`Unhandled mock GET request to: ${url}`);
    return { data: {} };
  },
  
  post: async (url, data) => {
    console.log(`Mock API POST request to: ${url}`, data);
    
    if (url === '/artist') {
      return mockApi.addArtist(data);
    }
    
    if (url.includes('/unassignedEventsHistory/record')) {
      return mockApi.recordHistory();
    }
    
    console.warn(`Unhandled mock POST request to: ${url}`);
    return { data: {} };
  },
  
  delete: async (url, config) => {
    console.log(`Mock API DELETE request to: ${url}`, config?.data);
    
    if (url === '/artist') {
      return mockApi.deleteArtist(config.data);
    }
    
    console.warn(`Unhandled mock DELETE request to: ${url}`);
    return { data: {} };
  }
};
