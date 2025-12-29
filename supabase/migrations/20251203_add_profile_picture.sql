-- Add profile_picture column to users table
ALTER TABLE public.users
ADD COLUMN profile_picture text NULL;
