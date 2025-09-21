const request = require('supertest');
const PredictionServer = require('../../src/server');

describe('Legacy API Endpoints', () => {
  let app;
  let server;

  beforeAll(async () => {
    server = new PredictionServer();
    await server.connectDatabase();
    app = server.app;
  });

  afterAll(async () => {
    await server.shutdown();
  });

  describe('Health Check', () => {
    test('GET / should return alive message', async () => {
      const response = await request(app)
        .get('/prediction/')
        .expect(200);
      
      expect(response.text).toBe('I am alive!');
    });
  });

  describe('Prediction Lifecycle', () => {
    test('Should open, add, list, close, and resolve predictions', async () => {
      const channel = 'testchannel';
      
      // 1. Open prediction
      const openResponse = await request(app)
        .get(`/prediction/${channel}/open`)
        .expect(200);
      
      expect(openResponse.text).toContain('opened');
      
      // 2. Add prediction
      const addResponse = await request(app)
        .get(`/prediction/${channel}/add`)
        .query({
          username: 'testuser',
          prediction: '13-10'
        })
        .expect(200);
      
      expect(addResponse.text).toContain('added successfully');
      
      // 3. List predictions
      const listResponse = await request(app)
        .get(`/prediction/${channel}/list`)
        .expect(200);
      
      expect(listResponse.text).toContain('testuser: 13-10');
      
      // 4. Try to add duplicate prediction
      const duplicateResponse = await request(app)
        .get(`/prediction/${channel}/add`)
        .query({
          username: 'testuser',
          prediction: '13-11'
        })
        .expect(200);
      
      expect(duplicateResponse.text).toContain('already submitted');
      
      // 5. Close prediction
      const closeResponse = await request(app)
        .get(`/prediction/${channel}/close`)
        .expect(200);
      
      expect(closeResponse.text).toContain('closed');
      
      // 6. Resolve with result
      const resultResponse = await request(app)
        .get(`/prediction/${channel}/result`)
        .query({
          result: '13-10'
        })
        .expect(200);
      
      expect(resultResponse.text).toContain('Winners: testuser');
    });

    test('Should validate prediction format', async () => {
      const channel = 'testchannel2';
      
      // Open prediction first
      await request(app)
        .get(`/prediction/${channel}/open`)
        .expect(200);
      
      // Test invalid formats
      const invalidFormats = ['13', '13-14', '14-10', 'abc-def', '13-'];
      
      for (const invalidFormat of invalidFormats) {
        const response = await request(app)
          .get(`/prediction/${channel}/add`)
          .query({
            username: 'testuser',
            prediction: invalidFormat
          })
          .expect(200);
        
        expect(response.text).toContain('invalid');
      }
    });

    test('Should handle admin operations', async () => {
      const channel = 'adminchannel';
      
      // Add admin
      const addAdminResponse = await request(app)
        .get(`/prediction/${channel}/admin/addAdmin`)
        .query({
          username: 'testadmin'
        })
        .expect(200);
      
      expect(addAdminResponse.text).toContain('added successfully');
      
      // List admins
      const listAdminsResponse = await request(app)
        .get(`/prediction/${channel}/admin/list`)
        .expect(200);
      
      expect(listAdminsResponse.text).toContain('testadmin');
      
      // Remove admin
      const removeAdminResponse = await request(app)
        .get(`/prediction/${channel}/admin/removeAdmin`)
        .query({
          username: 'testadmin'
        })
        .expect(200);
      
      expect(removeAdminResponse.text).toContain('removed successfully');
    });
  });

  describe('Error Handling', () => {
    test('Should handle missing parameters', async () => {
      const response = await request(app)
        .get('/prediction/testchannel/add')
        .expect(200);
      
      expect(response.text).toContain('Please provide');
    });

    test('Should handle closed predictions', async () => {
      const channel = 'closedchannel';
      
      // Try to add without opening
      const response = await request(app)
        .get(`/prediction/${channel}/add`)
        .query({
          username: 'testuser',
          prediction: '13-10'
        })
        .expect(200);
      
      expect(response.text).toContain('No active prediction');
    });
  });
});