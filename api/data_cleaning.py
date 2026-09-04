import pandas as pd
import numpy as np
import os

# 1. Dynamically get the path to the api folder
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(BASE_DIR, "data_with_coordinates.csv")

# 2. Load your dataset using the exact path
df = pd.read_csv(CSV_PATH)

# 3. Fix the "Above 200k" bucket
df.loc[(df['price_from'] == 200000) & (df['price_till'].isna()), 'price_till'] = 500000

# 4. Fix the "Below 50k" budget bucket
df.loc[(df['price_from'] == 0) & (df['price_till'] == 50000), 'price_from'] = 25000

# 5. Fix any rogue "Under 100k" entries starting at 0
df.loc[(df['price_from'] == 0) & (df['price_till'] == 100000), 'price_from'] = 50000

# 6. Save the perfectly filled data back to the same file
df.to_csv(CSV_PATH, index=False)
print("All 0s and nulls have been successfully filled!")