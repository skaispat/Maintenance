import { supabase } from '../lib/supabase';

export interface User {
    id: number;
    employeeName: string;
    department: string;
    phoneNumber: string;
    employeeCode: string;
    username: string;
    password?: string; // Optional for display, required for creation/update if changing
    pageAccess: 'Admin' | 'User' | 'Viewer';
    allowedPages?: string[];
    isActive: boolean;
    profilePicture?: string;
}

export const fetchUsers = async (): Promise<User[]> => {
    try {
        if (!supabase) throw new Error('Supabase client not initialized');
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return data.map((user: any) => ({
            id: user.id,
            employeeName: user.employee_name,
            department: user.department,
            phoneNumber: user.phone_number,
            employeeCode: user.employee_code,
            username: user.username,
            // We generally don't want to expose the password on the frontend if possible, 
            // but for this simple implementation where we might need to edit it, we'll keep it or handle it carefully.
            // For security, usually we don't return passwords. 
            // But the mock implementation had it. Let's assume we might need it or just ignore it for display.
            // The form handles password updates separately.
            pageAccess: user.page_access,
            allowedPages: user.allowed_pages && user.allowed_pages.length > 0 ? user.allowed_pages : ['Dashboard'],
            isActive: user.is_active ?? true, // Default to true if column missing or null
            profilePicture: user.profile_picture,
        }));
    } catch (error) {
        console.error('Error fetching users:', error);
        return [];
    }
};

export const createUser = async (userData: Omit<User, 'id' | 'isActive'>) => {
    try {
        if (!supabase) throw new Error('Supabase client not initialized');
        const dbData = {
            employee_name: userData.employeeName,
            department: userData.department,
            phone_number: userData.phoneNumber,
            employee_code: userData.employeeCode,
            username: userData.username,
            password: userData.password, // In a real app, hash this!
            page_access: userData.pageAccess,
            allowed_pages: userData.allowedPages || [],
            is_active: true, // Default to active
            profile_picture: userData.profilePicture,
        };

        const { data, error } = await supabase
            .from('users')
            .insert([dbData])
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.id,
            employeeName: data.employee_name,
            department: data.department,
            phoneNumber: data.phone_number,
            employeeCode: data.employee_code,
            username: data.username,
            pageAccess: data.page_access,
            allowedPages: data.allowed_pages || [],
            isActive: data.is_active,
            profilePicture: data.profile_picture,
        };
    } catch (error) {
        console.error('Error creating user:', error);
        throw error;
    }
};

export const updateUser = async (id: number, userData: Partial<User>) => {
    try {
        if (!supabase) throw new Error('Supabase client not initialized');
        const dbData: any = {
            employee_name: userData.employeeName,
            department: userData.department,
            phone_number: userData.phoneNumber,
            // employee_code is uneditable, so we don't update it
            username: userData.username,
            page_access: userData.pageAccess,
            allowed_pages: userData.allowedPages,
        };

        if (userData.profilePicture !== undefined) {
            dbData.profile_picture = userData.profilePicture;
        }

        // Only update password if provided and not empty
        if (userData.password) {
            dbData.password = userData.password;
        }

        if (userData.isActive !== undefined) {
            dbData.is_active = userData.isActive;
        }

        const { data, error } = await supabase
            .from('users')
            .update(dbData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.id,
            employeeName: data.employee_name,
            department: data.department,
            phoneNumber: data.phone_number,
            employeeCode: data.employee_code,
            username: data.username,
            pageAccess: data.page_access,
            allowedPages: data.allowed_pages || [],
            isActive: data.is_active,
            profilePicture: data.profile_picture,
        };
    } catch (error) {
        console.error('Error updating user:', error);
        throw error;
    }
};

export const toggleUserStatus = async (id: number, currentStatus: boolean) => {
    try {
        if (!supabase) throw new Error('Supabase client not initialized');
        const { data, error } = await supabase
            .from('users')
            .update({ is_active: !currentStatus })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.id,
            isActive: data.is_active,
        };
    } catch (error) {
        console.error('Error toggling user status:', error);
        throw error;
    }
};

export const deleteUser = async (id: number) => {
    try {
        if (!supabase) throw new Error('Supabase client not initialized');
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deleting user:', error);
        throw error;
    }
};

export const loginUser = async (username: string, password: string): Promise<User | null> => {
    try {
        if (!supabase) throw new Error('Supabase client not initialized');
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .eq('password', password) // In production, use hashing!
            .single();

        if (error || !data) {
            return null;
        }

        if (!data.is_active) {
            throw new Error('User is disabled');
        }

        return {
            id: data.id,
            employeeName: data.employee_name,
            department: data.department,
            phoneNumber: data.phone_number,
            employeeCode: data.employee_code,
            username: data.username,
            pageAccess: data.page_access,
            allowedPages: data.allowed_pages && data.allowed_pages.length > 0 ? data.allowed_pages : ['Dashboard'],
            isActive: data.is_active,
            profilePicture: data.profile_picture,
        };
    } catch (error) {
        console.error('Error logging in:', error);
        return null;
    }
};

export const uploadProfilePicture = async (file: File): Promise<string> => {
    try {
        if (!supabase) throw new Error('Supabase client not initialized');

        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `profile-pictures/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('images-pdf')
            .upload(filePath, file);

        if (uploadError) {
            throw uploadError;
        }

        const { data } = supabase.storage
            .from('images-pdf')
            .getPublicUrl(filePath);

        return data.publicUrl;
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        throw error;
    }
};

export const getUserById = async (id: number): Promise<User | null> => {
    try {
        if (!supabase) throw new Error('Supabase client not initialized');
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) {
            return null;
        }

        return {
            id: data.id,
            employeeName: data.employee_name,
            department: data.department,
            phoneNumber: data.phone_number,
            employeeCode: data.employee_code,
            username: data.username,
            pageAccess: data.page_access,
            allowedPages: data.allowed_pages && data.allowed_pages.length > 0 ? data.allowed_pages : ['Dashboard'],
            isActive: data.is_active,
            profilePicture: data.profile_picture,
        };
    } catch (error) {
        console.error('Error fetching user by ID:', error);
        return null;
    }
};
