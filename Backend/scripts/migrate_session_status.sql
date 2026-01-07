-- Migration script to add new session status values
-- Run this in your PostgreSQL database

-- Add 'pending' value to sessionstatus enum
ALTER TYPE sessionstatus ADD VALUE IF NOT EXISTS 'pending' BEFORE 'scheduled';

-- Add 'rejected' value to sessionstatus enum  
ALTER TYPE sessionstatus ADD VALUE IF NOT EXISTS 'rejected' AFTER 'cancelled';

-- Add credits_amount column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sessions' AND column_name='credits_amount') THEN
        ALTER TABLE sessions ADD COLUMN credits_amount INTEGER NOT NULL DEFAULT 0;
    END IF;
END $$;

-- Verify the enum values
SELECT enum_range(NULL::sessionstatus);

-- Done!
SELECT 'Migration complete!' as status;
