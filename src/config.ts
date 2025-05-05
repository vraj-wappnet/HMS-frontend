// API configuration
export const API_URL = 'http://localhost:3000/'

// Authentication configuration
export const JWT_TOKEN_NAME = 'token';
export const JWT_EXPIRY_DAYS = 7;

// App configuration
export const APP_NAME = 'Healthcare Platform';
export const SUPPORT_EMAIL = 'support@healthcareplatform.com';

// IoT data configuration
export const DATA_UPDATE_INTERVAL = 5000; // 5 seconds
export const ABNORMAL_THRESHOLDS = {
  heartRate: { low: 60, high: 100 }, // bpm
  bloodPressureSystolic: { low: 90, high: 140 }, // mmHg
  bloodPressureDiastolic: { low: 60, high: 90 }, // mmHg
  bloodOxygen: { low: 95, high: 100 }, // percentage
  temperature: { low: 36.1, high: 37.2 }, // Celsius
};