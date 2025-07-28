import csv
import pandas as pd

df = pd.read_csv('blinkit_retail.csv')
df = df.drop('Tag', axis=1)

csv_file_path = 'blinkit_retail.csv'
data_list = []
with open(csv_file_path, 'r', newline='') as file:
    csv_reader = csv.reader(file)
    for row in csv_reader:
        data_list.append(row)

# Now, data_list contains each row of the CSV as a sub-list
for row in data_list:
    print(row)
    