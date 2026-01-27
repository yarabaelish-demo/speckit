const { verifyAuth } = require('#middleware/auth');
const { auth } = require('#config/firebaseAdmin');

// Mock firebase-admin
jest.mock('#config/firebaseAdmin', () => ({
  auth: {
    verifyIdToken: jest.fn(),
  },
}));

describe('Auth Middleware', () => {
  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    req = {
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should return 401 if no authorization header is present', async () => {
    await verifyAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized: No token provided' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if authorization header does not start with Bearer', async () => {
    req.headers.authorization = 'Basic token';
    await verifyAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized: No token provided' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next and set req.user if token is valid', async () => {
    req.headers.authorization = 'Bearer valid-token';
    const decodedToken = { uid: 'user123' };
    (auth.verifyIdToken as jest.Mock).mockResolvedValue(decodedToken);

    await verifyAuth(req, res, next);

    expect(auth.verifyIdToken).toHaveBeenCalledWith('valid-token', true);
    expect(req.user).toEqual(decodedToken);
    expect(next).toHaveBeenCalled();
  });

  it('should return 401 if token is invalid', async () => {
    req.headers.authorization = 'Bearer invalid-token';
    (auth.verifyIdToken as jest.Mock).mockRejectedValue(new Error('Invalid token'));

    await verifyAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized: Invalid token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if token is revoked', async () => {
    req.headers.authorization = 'Bearer revoked-token';
    const error: any = new Error('Token revoked');
    error.code = 'auth/id-token-revoked';
    (auth.verifyIdToken as jest.Mock).mockRejectedValue(error);

    await verifyAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized: Token revoked' });
    expect(next).not.toHaveBeenCalled();
  });
});
