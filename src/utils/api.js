import axios from 'axios';
import { 
  mockUnassignedEvents, 
  mockHistoryData, 
  mockArtists, 
  mockCalendars, 
  mockRoleOptions 
} from './mockData';
import { DatabaseCheck } from 'react-bootstrap-icons';
// import apiService from './apiService';

// Create a simulated delay to mimic network requests
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const getEmails = async ()=> {
  const data =await axios.get('https://email-server.kidskulturspass.de/api/v1/email');
  return data
}
export const getEmailById = async (id)=> {
  console.log('Fetching email with ID:', id);
  const data =await axios.get('https://email-server.kidskulturspass.de/api/v1/email/'+id);
  console.log(data);
  return data
}
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
  getArtists:async  () => await apiArtist.get('/'),
  getCalendars: () => apiArtist.get('/calendars'),
  getRoleOptions: () => apiArtist.get('/roleOptions'),
  addArtist:async (data) => await apiArtistCreate.post('/',  data ),
  updateArtist: async (data) => await apiArtist.put('/',  data ),
 
// await apiArtistCreateCloud.post('/',  {Calendar:data.calendar,Name:data.name,Role:data.role,email:data.email} )
  deleteArtist: async (data) =>
  await apiArtistDelete.delete('/', {
    data: data, // 👈 This becomes the request body
    headers: { 'Content-Type': 'application/json' },
  })

};

 const eventService = {
  getUnassignedEvents: async (options = {}) => {
    const { loading, refresh, longTimeout } = options;
    return await  apiUnassignedEvents.get('/', { 
      params: {
        loading: loading ? true : undefined,
        refresh: refresh ? true : undefined,
        longTimeout: longTimeout ? true : undefined
      }
    });
  },
  getEventHistory: (days) => api.get('/unassignedEventsHistory', {
    params: { days, analysis: true }
  }),
  recordCurrentEvents: () => api.post('/unassignedEventsHistory/record')
};
// Keep the original axios instance for reference
const apiArtist = axios.create({
  baseURL: import.meta.env.VITE_API_ARTIST_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});
const apiArtistCreate = axios.create({
  baseURL: import.meta.env.VITE_API_ARTISTCREATE_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});
const apiArtistCreateCloud = axios.create({
  baseURL: import.meta.env.VITE_API_ARTISTCREATECLOUD_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});
const apiArtistDelete = axios.create({
  baseURL: import.meta.env.VITE_API_ARTISTDELETE_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});
const apiUnassignedEvents = axios.create({
  baseURL: import.meta.env.VITE_API_UNASSIGNED_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});


// Override the default export to use our mock API
export default {
  get: async (url, config) => {
    console.log(`Mock API GET request to: ${url}`);
    
    if (url.includes('/unassignedEvents')) {
      // return mockApi.getUnassignedEvents(config?.params);
      const data=await eventService.getUnassignedEvents();
      console.log(data.data)
      return data
    }
    
    if (url.includes('/unassignedEventsHistory')) {
      return mockApi.getHistory();
    }
    
    if (url === '/artists') {
      // return mockApi.getArtists();
      
      const data=await artistService.getArtists()
      console.log(data.data);
      return data

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
    
    if (url === '/artist') {
      return await artistService.addArtist(data);
    }
    
    if (url.includes('/unassignedEventsHistory/record')) {
      return mockApi.recordHistory();
    }
    
    console.warn(`Unhandled mock POST request to: ${url}`);
    return { data: {} };
  },
  put:async (url, data) =>{
    if (url === '/artist') {
      console.log('Updating artist with data:', data);
      return await artistService.updateArtist(data);
    }
    
  },
  delete: async (url, config) => {
    console.log(`Mock API DELETE request to: ${url}`, config?.data);
    
    if (url === '/artist') {
      // return mockApi.deleteArtist(config.data);
      console.log('Deleting artist with data:', config.data);
      return  await artistService.deleteArtist(config.data);
    }
    
    console.warn(`Unhandled mock DELETE request to: ${url}`);
    return { data: {} };
  }
};

const AUTH_API_BASE_URL = 'https://authentication-and-authorization-754826373806.europe-west1.run.app/api/v1';

const axiosAuth = axios.create({
  baseURL: AUTH_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Interceptor to automatically attach the token from localStorage
axiosAuth.interceptors.request.use(config => {
  const token = localStorage.getItem('jwt');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: async ({ username, password }) => {
    const res = await axiosAuth.post('/login', {
      email: username,
      password
    });
    // store the returned JWT
    localStorage.setItem('jwt', res.data.token);
    return res;
  },

  logout: async () => {
    localStorage.removeItem('jwt');
    // (optionally call a server-side logout endpoint here)
    return Promise.resolve();
  },

  getMe: async () => {
    return await axiosAuth.get('/me');
  },

  forgotPassword: async (data) => {
    return await axiosAuth.post('/forgotPassword', { email: data.email });
  },
 trackVisit: async (userId) => {
    try {
      const response = await axios.post(
        `https://artist-crud-function-754826373806.europe-west10.run.app/track-visit`,
        { userId }
      );
      return response.data;
    } catch (error) {
      console.error("Error tracking visit:", error.response?.data || error.message);
      throw error;
    }
  },
  resetPassword: (token, data) =>
    axiosAuth.patch(`/resetPassword/${token}`, data)
};