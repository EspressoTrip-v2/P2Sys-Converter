# MODULES
import pandas as pd
import numpy as np
import json

#  IMPORT MASTER JSON AND CHANGE TO DF #
with open('./data/templates/masterPricelistTemplate.json', 'r') as jsonfile:
    master_json = json.load(jsonfile)
# COLUMNS/INDEX/DATA
columns = master_json['columns']
index = list(master_json['data'].keys())
data = master_json['data'].values()

# CREATE MASTER PRICELIST DF
master_price = pd.DataFrame(data, columns=columns, index=index)


# REFORMAT THE LAYMAN PRICELIST FUNCTION #
##########################################
def reformat_fn(pricelist, name, df):
    # DICTIONARY TO SEPERATE PRODUCT NUMBERS
    D = {}
    for i, d in df.iterrows():
        D[str(i) + 'U'] = (d['IC_UNTREATED'], d['PRICE UNTREATED'],
                           d['R_FACTOR'], d['BUNDLE SIZE'])
        D[str(i) + 'T'] = (d['IC_TREATED'], d['PRICE TREATED'], d['R_FACTOR'],
                           d['BUNDLE SIZE'])

    customer_master = master_price.copy()
    customer_master['PRICE R/METER UNTREATED'] = 0
    customer_master['PRICE R/METER UNTREATED'] = 0
    customer_master['BUNDLE SIZE'] = 'NA'
    customer_master['PRICE TREATED'] = 0
    customer_master['PRICE UNTREATED'] = 0
    customer_master['CURRENCY'] = 'ZAR'
    customer_master['PRICELIST'] = pricelist

    for k, v in D.items():  #TODO: Start here
        print(v)
        if k.endswith('U'):

            # untreated items
            customer_master.loc[v[0], ['unitprice']] = v[1]
            customer_master.loc[v[0], ['price r/meter untreated']] = round(
                v[1] * v[2], 2)
            customer_master.loc[v[0], ['price m3 untreated']] = v[1]
            customer_master.loc[v[0], ['bundle size']] = v[3]

        elif k.endswith('T'):

            # Treated items
            customer_master.loc[v[0], ['unitprice']] = v[1]
            customer_master.loc[v[0], ['price r/meter treated']] = round(
                v[1] * v[2], 2)
            customer_master.loc[v[0], ['price m3 treated']] = v[1]
            customer_master.loc[v[0], ['bundle size']] = v[3]

    customer_master['unitprice'].replace(1, 0, inplace=True)
    return customer_master
