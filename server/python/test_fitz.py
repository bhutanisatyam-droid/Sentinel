
import sys
try:
    import fitz
    print("PyMuPDF Imported Successfully")
    print(f"Version: {fitz.__doc__}")
except ImportError as e:
    print(f"Import Error: {e}")
    sys.exit(1)
except Exception as e:
    print(f"Other Error: {e}")
    sys.exit(1)
