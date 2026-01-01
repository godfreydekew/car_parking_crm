#!/usr/bin/env python3
"""
Standalone script to import CSV booking data into the database.

Usage:
    # From backend directory:
    python -m app.csv.import_csv app/csv/test.csv
    
    # Or with absolute path:
    python -m app.csv.import_csv /path/to/file.csv
"""
import sys
from pathlib import Path

# Add backend directory to path to allow imports
backend_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_dir))

from app.services.csv_importer import CSVImporter
from app.db import SessionLocal, create_tables


def main():
    """Main entry point for CSV import script"""
    if len(sys.argv) < 2:
        print("Usage: python -m app.csv.import_csv <path_to_csv_file>")
        print("\nExample:")
        print("  python -m app.csv.import_csv app/csv/test.csv")
        sys.exit(1)
    
    csv_path = Path(sys.argv[1])
    
    # If relative path, try relative to backend directory first
    if not csv_path.is_absolute() and not csv_path.exists():
        # Try relative to backend directory
        backend_dir = Path(__file__).parent.parent.parent
        csv_path = backend_dir / csv_path
    
    if not csv_path.exists():
        print(f"Error: CSV file not found: {csv_path}")
        sys.exit(1)
    
    if not csv_path.is_file():
        print(f"Error: Path is not a file: {csv_path}")
        sys.exit(1)
    
    print(f"Importing CSV file: {csv_path}")
    print("-" * 60)
    
    # Ensure tables exist
    create_tables()
    
    # Create database session
    db = SessionLocal()
    
    try:
        # Create importer and import
        importer = CSVImporter(db)
        stats = importer.import_from_file(csv_path, source="csv_import_script")
        
        # Print results
        print(f"\nImport completed!")
        print(f"Total rows processed: {stats['total_rows']}")
        print(f"Successful imports: {stats['successful']}")
        print(f"Failed imports: {stats['failed']}")
        print(f"Skipped rows: {stats['skipped']}")
        
        if stats['errors']:
            print(f"\nErrors encountered ({len(stats['errors'])}):")
            for error in stats['errors'][:10]:  # Show first 10 errors
                print(f"  Row {error['row']}: {error['error']}")
            if len(stats['errors']) > 10:
                print(f"  ... and {len(stats['errors']) - 10} more errors")
        
        print("\n" + "-" * 60)
        print("Import finished successfully!")
        
    except Exception as e:
        print(f"\nError during import: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()

