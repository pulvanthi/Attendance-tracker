import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import AttendanceApp from './AttendanceApp';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AttendanceApp />
  </StrictMode>
);
