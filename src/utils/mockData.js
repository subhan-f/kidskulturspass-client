// Mock data for development and testing

// Mock unassigned events
export const mockUnassignedEvents = {
  events: [
    {
      id: '1',
      summary: 'Weihnachtskonzert in der Schule',
      location: 'Grundschule Musterstadt, Schulstraße 1',
      calendar: 'Weihnachtskalender',
      role: 'Weihnachtsmann, Musiker',
      start: {
        dateTime: new Date('2023-12-15T18:00:00').toISOString(),
      },
      htmlLink: 'https://calendar.google.com/event?id=123456'
    },
    {
      id: '2',
      summary: 'Klavierkonzert im Seniorenheim',
      location: 'Seniorenheim Sonnenschein, Parkweg 5',
      calendar: 'Klavierkalender',
      role: 'Pianist',
      start: {
        dateTime: new Date('2023-11-28T15:30:00').toISOString(),
      },
      htmlLink: 'https://calendar.google.com/event?id=234567'
    },
    {
      id: '3',
      summary: 'Nikolausfeier Kindergarten',
      location: 'Kindergarten Regenbogen, Spielstraße 12',
      calendar: 'Nikolauskalender',
      role: 'Nikolaus, Helfer',
      start: {
        dateTime: new Date('2023-12-06T10:00:00').toISOString(),
      },
      htmlLink: 'https://calendar.google.com/event?id=345678'
    },
    {
      id: '4',
      summary: 'Geigenvorführung in der Musikschule',
      location: 'Musikschule Harmonie, Klangweg 7',
      calendar: 'Geigenkalender',
      role: 'Geiger',
      start: {
        dateTime: new Date('2023-12-02T17:00:00').toISOString(),
      },
      htmlLink: 'https://calendar.google.com/event?id=456789'
    },
    {
      id: '5',
      summary: 'Laternenumzug',
      location: 'Stadtpark Musterstadt',
      calendar: 'Laternenumzugkalender',
      role: 'Musiker, Begleiter',
      start: {
        dateTime: new Date('2023-11-11T18:00:00').toISOString(),
      },
      htmlLink: 'https://calendar.google.com/event?id=567890'
    }
  ]
};

// Mock event history data
export const mockHistoryData = {
  history: [
    {
      date: new Date().toISOString().split('T')[0],
      count: 5,
      klavier_count: 1,
      geigen_count: 1,
      weihnachts_count: 1,
      nikolaus_count: 1,
      laternenumzug_count: 1,
      puppentheater_count: 0
    },
    {
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
      count: 8,
      klavier_count: 2,
      geigen_count: 2,
      weihnachts_count: 2,
      nikolaus_count: 1,
      laternenumzug_count: 1,
      puppentheater_count: 0
    },
    {
      date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0], // 2 days ago
      count: 10,
      klavier_count: 3,
      geigen_count: 2,
      weihnachts_count: 2,
      nikolaus_count: 2,
      laternenumzug_count: 1,
      puppentheater_count: 0
    },
    {
      date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0], // 3 days ago
      count: 15,
      klavier_count: 4,
      geigen_count: 3,
      weihnachts_count: 3,
      nikolaus_count: 3,
      laternenumzug_count: 2,
      puppentheater_count: 0
    },
    {
      date: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0], // 4 days ago
      count: 12,
      klavier_count: 3,
      geigen_count: 3,
      weihnachts_count: 3,
      nikolaus_count: 2,
      laternenumzug_count: 1,
      puppentheater_count: 0
    },
    {
      date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0], // 5 days ago
      count: 19,
      klavier_count: 6,
      geigen_count: 5,
      weihnachts_count: 4,
      nikolaus_count: 3,
      laternenumzug_count: 1,
      puppentheater_count: 0
    },
    {
      date: new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0], // 6 days ago
      count: 22,
      klavier_count: 8,
      geigen_count: 6,
      weihnachts_count: 5,
      nikolaus_count: 2,
      laternenumzug_count: 1,
      puppentheater_count: 0
    },
    {
      date: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0], // 7 days ago
      count: 25,
      klavier_count: 9,
      geigen_count: 7,
      weihnachts_count: 5,
      nikolaus_count: 3,
      laternenumzug_count: 1,
      puppentheater_count: 0
    },
    {
      date: new Date(Date.now() - 8 * 86400000).toISOString().split('T')[0], // 8 days ago
      count: 20,
      klavier_count: 7,
      geigen_count: 5,
      weihnachts_count: 4,
      nikolaus_count: 3,
      laternenumzug_count: 1,
      puppentheater_count: 0
    },
    {
      date: new Date(Date.now() - 9 * 86400000).toISOString().split('T')[0], // 9 days ago
      count: 18,
      klavier_count: 6,
      geigen_count: 4,
      weihnachts_count: 4,
      nikolaus_count: 3,
      laternenumzug_count: 1,
      puppentheater_count: 0
    },
    {
      date: new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0], // 10 days ago
      count: 16,
      klavier_count: 5,
      geigen_count: 4,
      weihnachts_count: 3,
      nikolaus_count: 3,
      laternenumzug_count: 1,
      puppentheater_count: 0
    },
    {
      date: new Date(Date.now() - 11 * 86400000).toISOString().split('T')[0], // 11 days ago
      count: 14,
      klavier_count: 5,
      geigen_count: 3,
      weihnachts_count: 3,
      nikolaus_count: 2,
      laternenumzug_count: 1,
      puppentheater_count: 0
    },
    {
      date: new Date(Date.now() - 12 * 86400000).toISOString().split('T')[0], // 12 days ago
      count: 12,
      klavier_count: 4,
      geigen_count: 3,
      weihnachts_count: 2,
      nikolaus_count: 2,
      laternenumzug_count: 1,
      puppentheater_count: 0
    },
    {
      date: new Date(Date.now() - 13 * 86400000).toISOString().split('T')[0], // 13 days ago
      count: 10,
      klavier_count: 3,
      geigen_count: 2,
      weihnachts_count: 2,
      nikolaus_count: 2,
      laternenumzug_count: 1,
      puppentheater_count: 0
    },
    {
      date: new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0], // 14 days ago
      count: 8,
      klavier_count: 3,
      geigen_count: 2,
      weihnachts_count: 1,
      nikolaus_count: 1,
      laternenumzug_count: 1,
      puppentheater_count: 0
    }
  ],
  // Add analysis data to support additional features
  analysis: {
    trend: "decreasing", // overall trend in the last 7 days
    peak_day: new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0],
    peak_count: 22,
    avg_resolution_time: "36 hours", // average time to resolve/assign events
    most_common_calendar: "Klavierkalender",
    most_needed_role: "Pianist",
    weekly_comparison: -8, // change from previous 7-day period
    avg_daily_new: 3, // average new unassigned events per day
    avg_daily_resolved: 5, // average resolved events per day
    days_with_increase: 2, // days with increasing unassigned events in last 7 days
    days_with_decrease: 5  // days with decreasing unassigned events in last 7 days
  }
};

// Mock artist data
export const mockArtists = [
  {
    id: '1',
    name: 'Hans Schmidt',
    email: 'hans.schmidt@example.com',
    role: 'Weihnachtsmann',
    calendar: 'Weihnachtskalender'
  },
  {
    id: '2',
    name: 'Maria Müller',
    email: 'maria.mueller@example.com',
    role: 'Pianist',
    calendar: 'Klavierkalender'
  },
  {
    id: '3',
    name: 'Klaus Weber',
    email: 'klaus.weber@example.com',
    role: 'Nikolaus',
    calendar: 'Nikolauskalender'
  },
  {
    id: '4',
    name: 'Anna Becker',
    email: 'anna.becker@example.com',
    role: 'Geiger',
    calendar: 'Geigenkalender'
  },
  {
    id: '5',
    name: 'Thomas Schulz',
    email: 'thomas.schulz@example.com',
    role: 'Musiker',
    calendar: 'Laternenumzugkalender'
  }
];

// Additional mock data
export const mockCalendars = [
  'Weihnachtskalender',
  'Klavierkalender',
  'Nikolauskalender',
  'Geigenkalender',
  'Laternenumzugkalender',
  'Puppentheaterkalender'
];

export const mockRoleOptions = [
  'Weihnachtsmann',
  'Pianist',
  'Nikolaus',
  'Geiger',
  'Musiker',
  'Helfer',
  'Begleiter'
];
