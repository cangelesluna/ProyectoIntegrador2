import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { User as UserType, UserRole } from '../types';
import { auth, db } from '../services/firebase';
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
  getIdTokenResult,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthContextValue {
  user: UserType | null;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  createUser: (
    email: string,
    password: string,
    role?: UserRole,
    name?: string,
    adminPassword?: string
  ) => Promise<UserType>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(false);
  const creatingUserRef = useRef(false);

  const normalizeRole = (role?: unknown): UserRole => (role === 'ADMIN' ? 'ADMIN' : 'OWNER');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      // try to read user profile from Firestore; if rules block access, handle error
      let roleFromToken: UserRole = 'OWNER';
      try {
        const tokenResult = await getIdTokenResult(fbUser, true);
        roleFromToken = normalizeRole(tokenResult.claims.role);

        const userRef = doc(db, 'users', fbUser.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const data = snap.data() as any;
          const resolvedRole = data.role === 'ADMIN' ? 'ADMIN' : normalizeRole(data.role);
          setUser({
            id: fbUser.uid,
            name: data.name ?? fbUser.displayName ?? '',
            email: fbUser.email ?? '',
            role: resolvedRole,
            createdAt: data.createdAt ?? '',
          });
        } else {
          if (!creatingUserRef.current) {
            // create minimal user doc for first-time sign-in only when we are not in the middle of admin-side user creation
            const newUser = {
              name: fbUser.displayName ?? '',
              email: fbUser.email ?? '',
              role: roleFromToken,
              createdAt: new Date().toISOString(),
            };
            await setDoc(userRef, newUser);
            setUser({
              id: fbUser.uid,
              name: newUser.name,
              email: newUser.email,
              role: newUser.role,
              createdAt: newUser.createdAt,
            });
          } else {
            setUser({
              id: fbUser.uid,
              name: fbUser.displayName ?? '',
              email: fbUser.email ?? '',
              role: roleFromToken,
              createdAt: '',
            });
          }
        }
      } catch (err) {
        // If Firestore rules prevent access, log and continue without blocking the UI.
        // Keep user minimal from auth profile so app can still render.
        console.error('Error reading/creating user doc:', err);
        setUser({
          id: fbUser.uid,
          name: fbUser.displayName ?? '',
          email: fbUser.email ?? '',
          role: roleFromToken,
          createdAt: '',
        });
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } finally {
      setLoading(false);
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    setUser(null);
  }, []);

  const sendPasswordReset = useCallback(async (email: string) => {
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
    } finally {
      setLoading(false);
    }
  }, []);

  const createUser = useCallback(
    async (email: string, password: string, role: UserRole = 'OWNER', name = '', adminPassword?: string): Promise<UserType> => {
      setLoading(true);
      creatingUserRef.current = true;
      const currentAdminEmail = auth.currentUser?.email;
      if (!currentAdminEmail || !adminPassword) {
        creatingUserRef.current = false;
        setLoading(false);
        throw new Error(
          'Para crear usuarios desde este panel necesitas reingresar tu contraseña de administrador.'
        );
      }

      try {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        const uid = credential.user.uid;

        const newUser: UserType = {
          id: uid,
          name,
          email,
          role,
          createdAt: new Date().toISOString(),
        };

        await firebaseSignOut(auth);
        await signInWithEmailAndPassword(auth, currentAdminEmail, adminPassword);
        await setDoc(doc(db, 'users', uid), {
          name,
          email,
          role,
          createdAt: newUser.createdAt,
        });

        return newUser;
      } catch (error) {
        console.error('Error creando usuario en Auth:', error);
        try {
          await firebaseSignOut(auth);
        } catch {
          // ignore
        }
        throw error;
      } finally {
        creatingUserRef.current = false;
        setLoading(false);
      }
    },
    []
  );

  const value = useMemo(
    () => ({ user, signIn, signInWithGoogle, signOut, sendPasswordReset, createUser, loading }),
    [user, signIn, signInWithGoogle, signOut, sendPasswordReset, createUser, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
}
