import urllib.request
import json
import re

def inspect_details():
    print("=== OPENCEM DATA/MEASUREMENTS ===")
    try:
        url = 'https://api.github.com/repos/OpenCEM-platform/opencem-dataset/contents/data/measurements'
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            items = json.loads(resp.read().decode())
            for it in items:
                print(f"  {it['name']} ({it.get('size', 0)} bytes, dl: {it.get('download_url')})")
    except Exception as e:
        print("OpenCEM measurements error:", e)

    print("\n=== GPVS PREPROCESSED DATA ===")
    try:
        url = 'https://api.github.com/repos/yasinahmadpoor/FaultDiagnosis/contents/PanelFaultDiagnosis/PreProcessed%20Data'
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            items = json.loads(resp.read().decode())
            for it in items:
                print(f"  {it['name']} ({it.get('size', 0)} bytes, dl: {it.get('download_url')})")
    except Exception as e:
        print("GPVS preprocessed error:", e)

    print("\n=== BATH CSV CHECK ===")
    try:
        url = 'https://researchdata.bath.ac.uk/1287/1/Hyrbid%20Microgrid%20Data.csv'
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            content_sample = resp.read(2048).decode('utf-8', errors='ignore')
            print("Bath content length header:", resp.headers.get('Content-Length'))
            print("Bath first lines:")
            print("\n".join(content_sample.splitlines()[:5]))
    except Exception as e:
        print("Bath check error:", e)

if __name__ == "__main__":
    inspect_details()
