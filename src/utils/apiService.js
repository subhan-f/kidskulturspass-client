import api, { authApi } from './api';

// Artist-related API calls
export const artistService = {
  getArtists:async  () => await api.get('/'),
  getCalendars: () => api.get('/calendars'),
  getRoleOptions: () => api.get('/roleOptions'),
  addArtist: (artist, calendar) => api.post('/artist', { ...artist, calendar }),
  deleteArtist: (calendar, email) => api.delete('/artist', { data: { calendar, email } })
};

// Events-related API calls
export const eventService = {
  getUnassignedEvents: (options = {}) => {
    const { loading, refresh, longTimeout } = options;
    return api.get('/unassignedEvents', { 
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

export const authService = authApi;

export default { artistService, eventService, authService };
