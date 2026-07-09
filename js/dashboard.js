import { DashboardController } from './controllers/DashboardController.js';

// Entry point for dashboard.html
document.addEventListener('DOMContentLoaded', () => {
  new DashboardController().init();
});
