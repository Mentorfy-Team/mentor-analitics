import { NextApiResponse } from 'next';
import {
  ok,
  unauthorized,
  badRequest,
  checkPassword,
  createSecureToken,
  methodNotAllowed,
} from 'next-basics/dist/esm';
import redis from '@umami/redis-client';
import { getUser } from 'queries';
import { setAuthKey } from 'lib/auth';

export interface LoginRequestBody {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: any;
}

export default async (req: any, res: NextApiResponse<LoginResponse>) => {
  if (req.method === 'POST') {
    const { username, password } = req.body;

    if (!username || !password) {
      return badRequest(res);
    }

    const user = await getUser({ username }, { includePassword: true });

    if (user && checkPassword(password, user.password)) {
      if (redis.enabled) {
        const token = await setAuthKey(user);

        return ok(res, { token, user });
      }

      const token = createSecureToken({ userId: user.id }, '2fe5f26456cdc87007e7adf0ae7da3ad');

      return ok(res, {
        token,
        user: { id: user.id, username: user.username, createdAt: user.createdAt },
      });
    }

    return unauthorized(res, 'message.incorrect-username-password');
  }

  return methodNotAllowed(res);
};
