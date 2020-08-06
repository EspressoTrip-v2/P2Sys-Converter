# MODULES
import pandas as pd
import numpy as np
import json
import sys
import time

# IMPORT CUSTOM MODEULES #
# ////////////////////// #
import reform

# READ IN JSON FILE FROM ARGV #
# /////////////////////////// #
json_pricelist = dict(json.loads(sys.argv[1:][0]))
# GET CUSTOMER NUMBER FROM FILE
name = list(json_pricelist.keys())[0]

# EXTRACT INDEX NUMBERS REMOVE LAST THREE ENTRIES
idx = list(json_pricelist[name].keys())[:-2]
# print({'index': idx})
# EXTRACT COLUMNS
columns = json_pricelist[name]['columns']
running_cols = ['UNT_RUNNING', 'TR_RUNNING']

# EXTRACT VALUES
values = list(json_pricelist[name].values())[:-2]
# print({'values': values})

# PERCENTAGE STDOUT
# print(10)

# BUID THE DATAFRAME #
# ////////////////// #

df = pd.DataFrame(values, index=idx, columns=columns)
df[running_cols[0]] = 0
df[running_cols[1]] = 0

# SIMPLIFY SIZING COLUMN TO MATCH ITEMS ON SYSTEM TEMPLATE
df['DIMENSIONS'] = df['DIMENSIONS'].str.lower().str.replace('\s',
                                                            '').str.split('x')

size = {'38': '038', '50': '050', '76': '076'}

# CONVERT STRIDESCRIPTIONS TO MATCH SIZES #
# /////////////////////////////////////// #


def fuction_zero(col):
    for i in range(len(col)):

        try:
            col[i] = size[col[i]]
        except:
            pass
    return col


df["DIMENSIONS"] = df["DIMENSIONS"].apply(fuction_zero)

# SPLIT NUMBER FOR RFACTOR CALCULATION AND REJOIN DIMENSIONS TO MATCH SYSTEM #
# ////////////////////////////////////////////////////////////////////////// #

df['R_FACTOR'] = df['DIMENSIONS']
df['DIMENSIONS'] = df['DIMENSIONS'].str.join(' x ')

# FUNCTION TO CALCULATE RUNNING METER #
# /////////////////////////////////// #

# PERCENTAGE STDOUT
# print(20)


def factor(col):
    for i in range(len(col)):
        col[i] = float(col[i])
    col = (col[0] * 1 / 1000) * (col[1] * 1 / 1000)
    return col


# REMOVE TEXT FROM BUNDLE SIZE COLUMN AND MAKE INTEGER #
# //////////////////////////////////////////////////// #

df['BUNDLE SIZE'] = df['BUNDLE SIZE'].str.replace('\s', '').str.replace(
    '[A-Z]', '').astype(int)
df['R_FACTOR'] = df['R_FACTOR'].apply(factor)

# ADD ODD EVEN COLUMN TO SHOW WHICH ITEMS NEED SEPERATION ODDS AND EVENS #
# ///////////////////////////////////////////////////////////////////////#
df['ODD_EVEN'] = ''

# PERCENTAGE STDOUT
# print(30)


# ODD EVEN TAG FUNCTION TO #
#//////////////////////////#
def odd(col):
    l = col['LENGTH'].lower().split(' ')
    for i in l:
        if i == 'odd':
            col['ODD_EVEN'] = i
        elif i == 'even':
            col['ODD_EVEN'] = i
    return col


df = df.apply(odd, axis=1)


# LENGTH CONVERSION FUNCTION
def length(col):
    for i in range(len(col)):
        col[i] = col[i].lstrip('.')
        col[i] = int(float(col[i]) * 1000)
    col = sorted(col)
    return col


# PERCENTAGE STDOUT
# print(40)

# CLEAN THE LENGTH COLUMN OF ALL LETTERS AND DASHES
df['LENGTH'] = df['LENGTH'].str.replace('[a-zA-Z\(\)\-]', ' ').str.split()
df['LENGTH'] = df['LENGTH'].apply(length)


# REMOVE THE DUPLICATE LENGHTS WHERE THERE ARE EXCLUSIONS AND INCLUSIONS #
# ////////////////////////////////////////////////////////////////////// #
def remove_dup():
    for c in range(df['LENGTH'].shape[0]):
        try:
            for item in df['LENGTH'][c - 1]:
                for s in df['LENGTH'][c]:
                    if s == item:
                        df['LENGTH'][c].remove(item)

        except:
            pass


remove_dup()

# PERCENTAGE STDOUT
# print(50)


# CREATE THE RANGE OF SIZES IN LENGTH COLUMN
def dim(col):
    l = list(np.arange(col[0], col[1] + 300, 300))
    for i in col[2:]:
        l.append(i)
    return sorted(l)


df['LENGTH'] = df['LENGTH'].apply(dim)


# FUNCTION TO INCLUDE CORRECT LENGHTS FOR ODD EVEN #
# //////////////////////////////////////////////// #
def odd_even(col):

    # CREATE ODD/EVEN DICTIONARY FOR CORRECT SIZES
    odd_even_dic = {
        'odd': [2700, 3300, 3900, 4500, 5100, 5700],
        'even': [3000, 3600, 4200, 4800, 5400]
    }
    if col['ODD_EVEN'] == 'odd':
        col['LENGTH'] = odd_even_dic['odd']
    elif col['ODD_EVEN'] == 'even':
        col['LENGTH'] = odd_even_dic['even']
    return col


df = df.apply(odd_even, axis=1)

# PERCENTAGE STDOUT
# print(60)


# REMOVE THE EXCLUDED AND ADD INCLUDED LENGTHS #
# //////////////////////////////////////////// #
# TODO: THIS CODE NEEDS TO BE ADJUSTED FOR ANY LENGTH INCLUSION EXCLUSION IN THE FUTURE
def excl_incl():
    for n in range(len(df['LENGTH'])):
        try:
            for item in df['LENGTH'][n - 1]:
                if item in df['LENGTH'][n]:
                    df['LENGTH'][n].remove(item)
        except:
            pass


excl_incl()

# print(70)


# FUNCTION TO MATCH SYSTEM CODES TO THE DESCRIPTIONS IN DATAFRAME #
# /////////////////////////////////////////////////////////////// #
def s5_product(col):

    # //////////////////////////////////////////////////// #
    # READ IN OTHER JSON FILES REQUIRED FOR THE CONVERSION #
    # //////////////////////////////////////////////////// #

    ########################################################
    # TODO: THIS WILL BE A HIDDEN FEATURE REQUIRING AN     #
    # ADMINISTRATIVE CODE TO CONVERT THE ACCPAC EXCEL FILE #
    # TO USABLE JSON IN THE FUTURE DEVELOPEMENT OF THE APP #
    ########################################################
    with open('./data/templates/s5_all_products.json', 'r') as json_file:
        s5_json = json.load(json_file)

    T_json = s5_json['s5_all_products']['s5_treated']
    U_json = s5_json['s5_all_products']['s5_untreated']

    # CONSTRUCT DATAFRAMES
    columns = s5_json['columns']

    T_idx = list(T_json.keys())
    T_data = list(T_json.values())

    U_idx = list(U_json.keys())
    U_data = list(U_json.values())

    T = pd.DataFrame(T_data, index=T_idx, columns=columns)
    U = pd.DataFrame(U_data, index=U_idx, columns=columns)

    p_list_t = []
    p_list_u = []

    # PERCENTAGE STDOUT

    for length in col['LENGTH']:

        if length == 900:

            s = f'{col["DIMENSIONS"]} x 0{length}'
            try:
                p_list_t.append(T[T['DESC'].str.contains(f'(PINE: {s})')]
                                ['ITEMNO'].values[0])

            except:
                pass

            try:
                p_list_u.append(U[U['DESC'].str.contains(f'(PINE: {s})')]
                                ['ITEMNO'].values[0])

            except:
                pass

        else:
            s = f'{col["DIMENSIONS"]} x {length}'
            try:
                p_list_t.append(T[T['DESC'].str.contains(f'(PINE: {s})')]
                                ['ITEMNO'].values[0])
            except:
                pass

            try:
                p_list_u.append(U[U['DESC'].str.contains(f'(PINE: {s})')]
                                ['ITEMNO'].values[0])
            except:
                pass

        col['IC_UNTREATED'] = p_list_u
        col['IC_TREATED'] = p_list_t

        # PERCENTAGE STDOUT

    return col


# print(80)

# CREATE ITEM CODES COLUMNS
df['IC_UNTREATED'] = ''
df['IC_TREATED'] = ''

# PERCENTAGE STDOUT
# print(90)
df = df.apply(s5_product, axis=1)
df.reset_index(inplace=True, drop=True)

# PASS TO REFORM FUNCTION
pricelist = json_pricelist[name]['pricelist']

# reform.reformat_fn(pricelist, name, df)
