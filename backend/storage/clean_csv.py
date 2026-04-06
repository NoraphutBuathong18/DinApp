import csv
import os

target_files = [
    r"c:\Users\norap\Desktop\Practical\backend\storage\Crop_Recommendation copy.csv",
    r"c:\Users\norap\Desktop\Practical\backend\storage\data_core copy.csv"
]

header_map = {
    'Nitrogen': 'N',
    'Phosphorus': 'P',
    'Phosphorous': 'P',
    'Potassium': 'K',
    'Temperature': 'temperature',
    'Temparature': 'temperature',
    'Humidity': 'humidity',
    'pH_Value': 'ph',
    'Rainfall': 'rainfall',
    'Crop': 'label',
    'Crop Type': 'label'
}

for file_path in target_files:
    if not os.path.exists(file_path):
        continue
        
    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)

    if not fieldnames:
        continue
        
    new_fieldnames = [header_map.get(f.strip(), f.strip()) for f in fieldnames]

    # Clean rows 
    for row in rows:
        for k, v in row.items():
            if v is not None:
                v = v.strip()
                # Try rounding
                try:
                    if '.' in v:
                        val = float(v)
                        row[k] = f"{val:.2f}"
                    else:
                        row[k] = v
                except ValueError:
                    row[k] = v

    with open(file_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(new_fieldnames)
        for row in rows:
            writer.writerow([row.get(k, '') for k in fieldnames])
            
    print(f"Successfully cleaned: {os.path.basename(file_path)}")
