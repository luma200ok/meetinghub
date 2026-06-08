export const ENDPOINTS = {
  // Auth
  AUTH_SIGNUP:       '/api/auth/signup',
  AUTH_LOGIN:        '/api/auth/login',
  AUTH_INVITE:       '/api/auth/invite',

  // 기업 & 조직 (김관영)
  COMPANIES:         '/api/companies',
  DEPARTMENTS:       '/api/departments',
  POSITIONS:         '/api/positions',
  MEMBERS:           '/api/members',

  // 회의실 & 예약 (김승현)
  MEETING_ROOMS:     '/api/meeting-rooms',
  RESERVATIONS:      '/api/reservations',
  ATTENDEES:         '/api/attendees',

  // 회의록 (허남)
  MINUTES:           '/api/minutes',

  // AI (이은석)
  AI_ANALYZE:        '/api/ai/analyze',
  AI_ACTION_ITEMS:   '/api/ai/action-items',

  // 업무 & 대시보드 (정재봉)
  TASKS:             '/api/tasks',
  DASHBOARD:         '/api/dashboard',
  SEARCH:            '/api/search',

  // 알림 (송유미)
  NOTIFICATIONS:     '/api/notifications',
} as const;
