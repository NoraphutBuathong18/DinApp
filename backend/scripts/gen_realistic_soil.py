import csv
import random
from datetime import datetime, timedelta

def generate_realistic_soil():
    filename = "C:/Users/norap/Desktop/Practical/realistic_soil_data_with_date.csv"
    cols = ["Date_Sampled", "N", "P", "K", "temperature", "humidity", "ph", "rainfall"]
    
    print("Generating realistic_soil_data_with_date.csv...")
    with open(filename, mode='w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(cols)
        
        # Base date: 6 months ago
        base_date = datetime.now() - timedelta(days=180)
        
        # Generate 60 rows 
        # Sort them by date incrementally so it realistically mimics a log
        dates = sorted([base_date + timedelta(days=random.randint(1, 180), hours=random.randint(8,17)) for _ in range(60)])
        
        for sample_date in dates:
            date_str = sample_date.strftime("%Y-%m-%d %H:%M:%S")
            
            # Make the soil data a mix of good and somewhat degraded (to give AI something to talk about)
            if random.random() > 0.4: # 60% chance of optimal soil
                n = round(random.uniform(40, 90), 1)
                p = round(random.uniform(30, 60), 1)
                k = round(random.uniform(30, 60), 1)
                ph = round(random.uniform(6.0, 7.2), 2)
            else: # 40% chance of poor/acidic soil
                n = round(random.uniform(10, 30), 1)
                p = round(random.uniform(10, 20), 1)
                k = round(random.uniform(10, 20), 1)
                ph = round(random.uniform(4.5, 5.5), 2)
                
            temp = round(random.uniform(25, 35), 2)
            hum = round(random.uniform(50, 85), 2)
            rain = round(random.uniform(20, 150), 2)
            
            writer.writerow([date_str, n, p, k, temp, hum, ph, rain])

if __name__ == "__main__":
    generate_realistic_soil()
    print("Successfully created realistic_soil_data_with_date.csv")
