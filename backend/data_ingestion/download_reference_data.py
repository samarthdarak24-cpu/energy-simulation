import urllib.request
import hashlib
from pathlib import Path
import pandas as pd

RAW_DIR = Path("gridheal_synthetic_data/data/raw_reference")
RAW_DIR.mkdir(parents=True, exist_ok=True)

DOWNLOADS = [
    {
        "name": "bath_microgrid_full.csv",
        "url": "https://researchdata.bath.ac.uk/1287/1/Hyrbid%20Microgrid%20Data.csv",
        "source": "University of Bath (researchdata.bath.ac.uk/1287/)",
        "license": "CC-BY 4.0 (Bath Research Data Policy)"
    },
    {
        "name": "opencem_measurements_2025_07_a.csv",
        "url": "https://raw.githubusercontent.com/OpenCEM-platform/opencem-dataset/main/data/measurements/2025-07-a.csv",
        "source": "OpenCEM Microgrid Platform (OpenCEM-platform/opencem-dataset)",
        "license": "MIT License"
    },
    {
        "name": "gpvs_lim_solar_data.csv",
        "url": "https://raw.githubusercontent.com/yasinahmadpoor/FaultDiagnosis/main/PanelFaultDiagnosis/PreProcessed%20Data/Lim_solar_data.csv",
        "source": "GPVS Fault Diagnosis (yasinahmadpoor/FaultDiagnosis)",
        "license": "Open Academic Research / GitHub Open Source"
    }
]

def sha256_file(filepath: Path) -> str:
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(8192):
            h.update(chunk)
    return h.hexdigest()

def download_and_verify():
    manifest = []
    for item in DOWNLOADS:
        target = RAW_DIR / item["name"]
        print(f"Downloading {item['name']} from {item['url']}...")
        req = urllib.request.Request(item["url"], headers={'User-Agent': 'Mozilla/5.0'})
        try:
            with urllib.request.urlopen(req, timeout=30) as resp, open(target, "wb") as out_file:
                total_bytes = 0
                while chunk := resp.read(16384):
                    out_file.write(chunk)
                    total_bytes += len(chunk)
            
            file_hash = sha256_file(target)
            df = pd.read_csv(target)
            print(f"  -> Success: {item['name']} ({total_bytes} bytes, {len(df)} rows, {len(df.columns)} cols)")
            print(f"  -> SHA256: {file_hash}")
            manifest.append({
                "file_name": item["name"],
                "source_url": item["url"],
                "source": item["source"],
                "license": item["license"],
                "sha256": file_hash,
                "bytes": total_bytes,
                "rows": len(df),
                "columns": list(df.columns)
            })
        except Exception as e:
            print(f"  -> Failed to download {item['name']}: {e}")

    return manifest

if __name__ == "__main__":
    download_and_verify()
