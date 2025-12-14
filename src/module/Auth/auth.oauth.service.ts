import { OAuth2Client } from 'google-auth-library';
import AppleAuth from 'apple-signin-auth';
import config from '../../app/config';
import { User } from '../User/user.modal';
import { createToken } from './auth.utils';
import { JwtPayload } from 'jsonwebtoken';
import { AuthService } from './auth.service';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const verifyGoogleIdToken = async (idToken: string) => {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload) throw new Error('Invalid Google token');
  return payload as any;
};

export const verifyAppleIdentityToken = async (identityToken: string) => {
  const payload = await AppleAuth.verifyIdToken(identityToken, {
    audience: process.env.APPLE_CLIENT_ID,
    ignoreExpiration: false,
  });
  return payload as any;
};

const findOrCreateUserFromProvider = async ({
  provider,
  providerId,
  email,
  name,
}: {
  provider: 'google' | 'apple';
  providerId: string;
  email?: string;
  name?: string;
}) => {
  
  const providerField = provider === 'google' ? { googleId: providerId } : { appleId: providerId };
  let user = await User.findOne(providerField);

  if (!user && email) {
    user = await User.findOne({ email });
    if (user) {
      if (provider === 'google') user.googleId = providerId;
      else user.appleId = providerId;
      user.provider = provider;
      await user.save();
    }
  }

  if (!user) {
    // create new user
    const usernameBase = (name || email || 'user').split('@')[0];
    const username = await AuthService.generateUniqueUsername(usernameBase);
    user = await User.create({
      username,
      email,
      provider,
      googleId: provider === 'google' ? providerId : undefined,
      appleId: provider === 'apple' ? providerId : undefined,
    });
  }

  return user;
};

export const oauthLogin = async (provider: 'google' | 'apple', token: string, extras: any = {}) => {
  if (provider === 'google') {
    const payload = await verifyGoogleIdToken(token);
    const { sub: googleId, email, email_verified, name, picture } = payload;
    if (!email_verified) throw new Error('Google email is not verified');
    const user = await findOrCreateUserFromProvider({
      provider: 'google',
      providerId: googleId,
      email,
      name,
    });

    const jwtPayload = { userId: user._id!.toString(), email: user.email, role: user.role } as JwtPayload;
    const accessToken = createToken(jwtPayload as any, config.jwt_access_secret as string);
    const refreshToken = createToken(jwtPayload as any, config.jwt_refresh_secret as string);

    return { user, accessToken, refreshToken };
  } else {
    const payload = await verifyAppleIdentityToken(token);
    const { sub: appleId, email} = payload;
    const user = await findOrCreateUserFromProvider({
      provider: 'apple',
      providerId: appleId,
      email,
      name:'',
    });

    const jwtPayload = { userId: user._id!.toString(), email: user.email, role: user.role } as JwtPayload;
    const accessToken = createToken(jwtPayload as any, config.jwt_access_secret as string);
    const refreshToken = createToken(jwtPayload as any, config.jwt_refresh_secret as string);

    return { user, accessToken, refreshToken };
  }
};
