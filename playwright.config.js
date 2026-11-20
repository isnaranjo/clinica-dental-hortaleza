export default {
  testDir: './.playwright-mcp',
  use: {
    headless: true,
    viewport: { width: 1280, height: 900 },
    ignoreHTTPSErrors: true,
  },
  reporter: 'list',
};