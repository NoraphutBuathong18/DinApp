import csv
import random
from datetime import datetime, timedelta

def generate_yearly_soil():
    filename = "C:/Users/norap/Desktop/Practical/yearly_soil_data.csv"
    cols = ["Date_Sampled", "N", "P", "K", "temperature", "humidity", "ph", "rainfall"]
    
    print("Generating yearly_soil_data.csv (365 days)...")
    with open(filename, mode='w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(cols)
        
        # Start from Jan 1st of the previous year
        start_date = datetime(2025, 1, 1)
        
        for i in range(365):
            current_date = start_date + timedelta(days=i)
            date_str = current_date.strftime("%Y-%m-%d %H:%M:%S")
            
            # Seasonal variations (simple logic)
            # Higher rain/humidity in middle of year
            month = current_date.month
            is_rainy = 5 <= month <= 10
            
            n = round(random.uniform(20, 100), 1)
            p = round(random.uniform(15, 70), 1)
            k = round(random.uniform(15, 70), 1)
            ph = round(random.uniform(5.5, 7.5), 2)
            
            temp = round(random.uniform(28, 38) if not is_rainy else random.uniform(24, 30), 2)
            hum = round(random.uniform(40, 60) if not is_rainy else random.uniform(70, 90), 2)
            rain = round(random.uniform(0, 10) if not is_rainy else random.uniform(20, 200), 2)
            
            writer.writerow([date_str, n, p, k, temp, hum, ph, rain])

if __name__ == "__main__":
    generate_yearly_soil()
    print("Successfully created yearly_soil_data.csv with 365 records.")
