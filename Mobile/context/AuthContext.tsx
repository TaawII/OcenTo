import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

interface AuthProps {
    authState?: { token: string | null; authenticated: boolean | null };
    onRegister?: (username: string, password: string) => Promise<any>;
    onLogin?: (username: string, password: string) => Promise<any>;
    onLogout?: () => Promise<any>;
}
const TOKEN_KEY = 'my-jwt';
export const API_URL = "http://192.168.137.1:8000/api/events"
const AuthContext = createContext<AuthProps>({});

export const useAuth = () => {
    return useContext(AuthContext)
}

export const AuthProvider = ({ children }: any) => {
    const [authState, setAuthState] = useState<{
        token: string | null;
        authenticated: boolean | null;
    }>({
        token: null,
        authenticated: null
    });

    useEffect(() => {
        const loadToken = async () => {
            const token = await SecureStore.getItemAsync(TOKEN_KEY);

            if (token) {
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                setAuthState({
                    token: token,
                    authenticated: true
                });
            } else {
                axios.defaults.headers.common['Authorization'] = null;
                setAuthState({
                    token: null,
                    authenticated: false
                });
            }
        }
        loadToken();
    }, [])

    const register = async (username: string, password: string) => {
        try {
            axios.defaults.headers.common['Authorization'] = null;
            await axios.post(`${API_URL}/register`, { username, password },
                {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 8000,
                }
            );
            return {error: false}
        } catch (e: any) {
            const errorMsg = (e as any).response?.data?.error || 'Wystąpił nieoczekiwany błąd.\nSpróbuj ponownie za chwilę.';
            return { error: true, msg: errorMsg };
        }
    };

    const login = async (username: string, password: string) => {
        try {
            axios.defaults.headers.common['Authorization'] = null;
            const result = await axios.post(`${API_URL}/login`, { username, password }, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 8000,
            });

            setAuthState({
                token: result.data.token,
                authenticated: true
            });

            axios.defaults.headers.common['Authorization'] = `Bearer ${result.data.token}`;

            await SecureStore.setItemAsync(TOKEN_KEY, result.data.token);

            return {error: false};
        } catch (e: any) {
            const errorMsg = (e as any).response?.data?.error || 'Wystąpił nieoczekiwany błąd.\nSpróbuj ponownie za chwilę.';
            return { error: true, msg: errorMsg };
        }
    };

    const logout = async () => {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        axios.defaults.headers.common['Authorization'] = null;

        setAuthState({
            token: null,
            authenticated: false
        });
    }

    const value = {
        onRegister: register,
        onLogin: login,
        onLogout: logout,
        authState
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}