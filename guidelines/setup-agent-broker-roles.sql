-- SQL script to set up agent and broker roles in the staffrole table
-- Run this in your Supabase SQL Editor

-- Insert AGENT role if it doesn't exist
INSERT INTO public.staffrole (rolecode, rolename, roledescription, isactive)
VALUES ('AGENT', 'Agent', 'Real estate agent responsible for property sales and client relations', true)
ON CONFLICT (rolecode) DO NOTHING;

-- Insert BROKER role if it doesn't exist
INSERT INTO public.staffrole (rolecode, rolename, roledescription, isactive)
VALUES ('BROKER', 'Real Estate Broker', 'Licensed real estate broker with authority to manage transactions', true)
ON CONFLICT (rolecode) DO NOTHING;

-- Optional: Insert STAFF role if it doesn't exist
INSERT INTO public.staffrole (rolecode, rolename, roledescription, isactive)
VALUES ('STAFF', 'General Staff', 'General administrative staff member', true)
ON CONFLICT (rolecode) DO NOTHING;
