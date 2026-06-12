import { useState, useEffect } from 'react';
import {
  signIn as amplifySignIn,
  signUp as amplifySignUp,
  signOut as amplifySignOut,
  confirmSignUp as amplifyConfirmSignUp,
  getCurrentUser,
  fetchAuthSession,
} from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';

export interface AuthUser {
  userId: string;
  username: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();

    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      switch (payload.event) {
        case 'signedIn':
          loadUser();
          break;
        case 'signedOut':
          setUser(null);
          break;
      }
    });

    return unsubscribe;
  }, []);

  async function loadUser() {
    try {
      const currentUser = await getCurrentUser();
      setUser({ userId: currentUser.userId, username: currentUser.username });
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email: string, password: string): Promise<void> {
    const result = await amplifySignIn({ username: email, password });
    if (result.nextStep.signInStep !== 'DONE') {
      throw new Error(`Sign-in requires additional step: ${result.nextStep.signInStep}`);
    }
    await loadUser();
  }

  async function signUp(email: string, password: string): Promise<{ needsConfirmation: boolean }> {
    const result = await amplifySignUp({ username: email, password, options: { userAttributes: { email } } });
    return { needsConfirmation: result.nextStep.signUpStep === 'CONFIRM_SIGN_UP' };
  }

  async function confirmSignUp(email: string, code: string): Promise<void> {
    await amplifyConfirmSignUp({ username: email, confirmationCode: code });
  }

  async function signOut(): Promise<void> {
    await amplifySignOut();
  }

  return { user, loading, signIn, signUp, confirmSignUp, signOut };
}

// Utility used by the API client to get the current ID token.
// API Gateway Cognito Authorizers validate the ID token, not the access token.
export async function getAccessToken(): Promise<string> {
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();
  if (!token) throw new Error('Not authenticated');
  return token;
}
