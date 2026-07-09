import { AuthController } from './controllers/AuthController.js';

// Entry point for index.html
document.addEventListener('DOMContentLoaded', () => {
  new AuthController().init();
});
