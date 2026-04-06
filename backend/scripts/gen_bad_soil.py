import csv
import random
import os

def generate_bad_soil():
    # Save to the root of the project
    filename1 = "C:/Users/norap/Desktop/Practical/bad_soil_data.csv"
    # An even worse one
    filename2 = "C:/Users/norap/Desktop/Practical/extreme_bad_soil_data.csv"
    
    # Columns expected by DinApp
    cols = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]
    
    print("Generating bad_soil_data.csv (mixed poor conditions)...")
    with open(filename1, mode='w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(cols)
        
        # Generate 50 rows of "Poor" soil (Health score < 2 based on your soil_model.py rules)
        # Optimal ranges are N: 20-120, P: 10-80, K: 10-80, pH: 5.5-7.5
        for _ in range(50):
            # Pick max 1 element to be "good" (so score is 0 or 1 -> Poor)
            good_feature = random.choice(["N", "P", "K", "ph", "none"])
            
            # N
            if good_feature == "N":
                n = round(random.uniform(20, 120), 1)
            else:
                n = round(random.choice([random.uniform(0, 15), random.uniform(130, 200)]), 1)
                
            # P
            if good_feature == "P":
                p = round(random.uniform(10, 80), 1)
            else:
                p = round(random.choice([random.uniform(0, 7), random.uniform(90, 150)]), 1)
                
            # K
            if good_feature == "K":
                k = round(random.uniform(10, 80), 1)
            else:
                k = round(random.choice([random.uniform(0, 7), random.uniform(90, 150)]), 1)
                
            # pH
            if good_feature == "ph":
                ph = round(random.uniform(5.5, 7.5), 2)
            else:
                ph = round(random.choice([random.uniform(3.0, 5.0), random.uniform(8.0, 10.0)]), 2)
                
            # Other parameters
            temp = round(random.uniform(20, 35), 2)
            hum = round(random.uniform(40, 85), 2)
            rain = round(random.uniform(50, 200), 2)
            
            writer.writerow([n, p, k, temp, hum, ph, rain])
            
    print("Generating extreme_bad_soil_data.csv (completely depleted soil)...")
    with open(filename2, mode='w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(cols)
        
        # Generate 30 rows of extremely deleted soil (score 0, highly acidic, no nutrients)
        for _ in range(30):
            n = round(random.uniform(0, 5), 1) # Severely lacking Nitrogen
            p = round(random.uniform(0, 5), 1) # Severely lacking Phosphorus 
            k = round(random.uniform(0, 5), 1) # Severely lacking Potassium
            ph = round(random.uniform(2.5, 4.5), 2) # Highly acidic
            temp = round(random.uniform(25, 35), 2)
            hum = round(random.uniform(20, 40), 2) # Very dry
            rain = round(random.uniform(0, 30), 2) # Drought
            
            writer.writerow([n, p, k, temp, hum, ph, rain])
            
if __name__ == "__main__":
    generate_bad_soil()
    print("Done! Files saved to Desktop/Practical/")
