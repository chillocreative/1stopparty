import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const response = await axios.get('/api/user');
            setUser(response.data);
        } catch (error) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (credentials) => {
        await axios.get('/sanctum/csrf-cookie');
        await axios.post('/login', credentials);
        await checkAuth();
    };

    const logout = async () => {
        try {
            await axios.post('/logout');
            setUser(null);
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const updateUserProfile = async (data) => {
        const response = await axios.post('/api/profile/update', data, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        setUser(response.data.user);
        return response.data;
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            login,
            logout,
            updateUserProfile
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
