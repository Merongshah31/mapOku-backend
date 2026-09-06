jest.mock('../src/config/supabase', () => ({
  auth: {
    signInWithPassword: jest.fn(),
  },
}));

const supabase = require('../src/config/supabase');
const { login } = require('../src/controllers/users.controller');

const createResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
});

describe('UsersController.login', () => {
  beforeEach(() => jest.clearAllMocks());

  test('verifies the password and does not return session tokens', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: {
        user: { id: 'user-1', email: 'user@example.com' },
        session: { access_token: 'secret-access-token', refresh_token: 'secret-refresh-token' },
      },
      error: null,
    });
    const response = createResponse();

    await login({ body: { email: 'user@example.com', password: 'password' } }, response);

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'password',
    });
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({
      success: true,
      data: { user: { id: 'user-1', email: 'user@example.com' } },
    });
    expect(response.json.mock.calls[0][0]).not.toHaveProperty('data.access_token');
    expect(response.json.mock.calls[0][0]).not.toHaveProperty('data.refresh_token');
  });

  test('rejects missing credentials before calling Supabase', async () => {
    const response = createResponse();

    await login({ body: { email: 'user@example.com' } }, response);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
  });
});