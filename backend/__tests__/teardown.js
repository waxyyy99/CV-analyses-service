// Global teardown - runs after all tests
module.exports = async () => {
  // Close main app pool if available
  try {
    const app = require('../index');
    if (app.pool) {
      await app.pool.end();
    }
  } catch (e) {
    // Ignore errors - pool might already be closed
  }
  
  // Give time for all connections to close gracefully
  await new Promise(resolve => setTimeout(resolve, 200));
};

