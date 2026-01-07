"""
Run the session status migration against the database.
This adds 'pending' and 'rejected' values to the sessionstatus enum.
"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from config import get_settings

settings = get_settings()

def run_migration():
    # Use isolation_level="AUTOCOMMIT" for enum modifications
    engine = create_engine(settings.DATABASE_URL, isolation_level="AUTOCOMMIT")
    
    with engine.connect() as conn:
        # Check current enum values
        print("Current sessionstatus enum values:")
        result = conn.execute(text("SELECT enum_range(NULL::sessionstatus)"))
        current_values = result.fetchone()[0]
        print(f"  {current_values}")
        
        # Add 'pending' if not exists
        if 'pending' not in current_values:
            print("\nAdding 'pending' to sessionstatus enum...")
            try:
                conn.execute(text("ALTER TYPE sessionstatus ADD VALUE 'pending' BEFORE 'scheduled'"))
                print("  ✓ Added 'pending'")
            except Exception as e:
                print(f"  Note: {e}")
        else:
            print("\n  'pending' already exists")
        
        # Add 'rejected' if not exists
        if 'rejected' not in current_values:
            print("\nAdding 'rejected' to sessionstatus enum...")
            try:
                conn.execute(text("ALTER TYPE sessionstatus ADD VALUE 'rejected' AFTER 'cancelled'"))
                print("  ✓ Added 'rejected'")
            except Exception as e:
                print(f"  Note: {e}")
        else:
            print("  'rejected' already exists")
        
        # Add credits_amount column if not exists
        print("\nChecking credits_amount column...")
        result = conn.execute(text("""
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name='sessions' AND column_name='credits_amount'
            )
        """))
        has_column = result.fetchone()[0]
        
        if not has_column:
            print("  Adding credits_amount column...")
            conn.execute(text("ALTER TABLE sessions ADD COLUMN credits_amount INTEGER NOT NULL DEFAULT 0"))
            print("  ✓ Added credits_amount column")
        else:
            print("  ✓ credits_amount column already exists")
        
        # Verify final state
        print("\n" + "="*50)
        print("Final sessionstatus enum values:")
        result = conn.execute(text("SELECT enum_range(NULL::sessionstatus)"))
        print(f"  {result.fetchone()[0]}")
        print("\n✓ Migration complete!")

if __name__ == "__main__":
    run_migration()
