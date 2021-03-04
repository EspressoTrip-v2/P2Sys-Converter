# MODULES
import json
import os
import platform
import sys
import warnings
from datetime import datetime

import numpy as np
import pandas as pd

time = str(datetime.now())[:10]

pd.set_option("display.max_columns", None)
pd.set_option("display.max_rows", None)
warnings.filterwarnings(
    "ignore", "A value is trying to be set on a copy of a slice from a DataFrame"
)

# IMPORT CUSTOM MODULES #
# ////////////////////// #
import reform
import s5_ordersheet
import system_template

# GET WORKING DIRECTORY #
# ///////////////////// #
workdir = os.getcwd()

# READ IN JSON FILE FROM ARGV #
# /////////////////////////// #
json_pricelist = dict(json.loads(sys.argv[1:][0]))["price-list"]

# ASSIGN THE FLAGS FOR CORRECT PYTHON CONVERSION
schedule_flag = sys.argv[1:][2]
schedule_date = sys.argv[1:][3]
python_schedule_date = 0

# CONVERT JAVASCRIPT STRING TO A USABLE PYTHON DATE
if schedule_date != "null":
    dateString = schedule_date.split("/")
    python_schedule_date = datetime(int(dateString[1]), int(dateString[0]), 1).strftime(
        "%d-%m-%Y"
    )

# print(sys.argv[1:])
# GET CUSTOMER NUMBER FROM FILE
customer_number = json_pricelist["customerNumber"]
# GET PRICELIST NUMBER
pricelist_number = json_pricelist["priceListNumber"]

# EXTRACT INDEX NUMBERS REMOVE LAST SIX ENTRIES
idx = list(json_pricelist.keys())[:-6]

# EXTRACT COLUMNS
columns = json_pricelist["COLUMNS"]

running_cols = ["UNT_RUNNING", "TR_RUNNING"]

# EXTRACT VALUES
values = list(json_pricelist.values())[:-6]

# BUILD THE DATAFRAME #
# ////////////////// #

df = pd.DataFrame(values, index=idx, columns=columns)
df[running_cols[0]] = 0
df[running_cols[1]] = 0

# print(df.iloc[-4:, :])

# SIMPLIFY SIZING COLUMN TO MATCH ITEMS ON SYSTEM TEMPLATE
df["DIMENSIONS"] = (
    df["DIMENSIONS"].copy().str.lower().str.replace("\s", "", regex=True).str.split("x")
)

size = {"38": "038", "50": "050", "76": "076"}

# CONVERT STRIDESCRIPTIONS TO MATCH SIZES #
# /////////////////////////////////////// #


def function_zero(col):
    for i in range(len(col)):

        try:
            col[i] = size[col[i]]
        except:
            pass
    return col


df["DIMENSIONS"] = df["DIMENSIONS"].apply(function_zero)

# SPLIT NUMBER FOR RFACTOR CALCULATION AND REJOIN DIMENSIONS TO MATCH SYSTEM #
# ////////////////////////////////////////////////////////////////////////// #

df["R_FACTOR"] = df["DIMENSIONS"]
df["DIMENSIONS"] = df["DIMENSIONS"].str.join(" x ")

# FUNCTION TO CALCULATE RUNNING METER #
# /////////////////////////////////// #
def factor(col):
    for i in range(len(col)):
        col[i] = float(col[i])
    col = (col[0] * 1 / 1000) * (col[1] * 1 / 1000)
    return col


# REMOVE TEXT FROM BUNDLE SIZE COLUMN AND MAKE INTEGER #
# //////////////////////////////////////////////////// #

df["BUNDLE SIZE"] = (
    df["BUNDLE SIZE"]
    .copy()
    .str.replace("\s", "", regex=True)
    .str.replace("[A-Z]", "", regex=True)
    .astype(int)
)
df["R_FACTOR"] = df["R_FACTOR"].apply(factor)

# ADD ODD EVEN COLUMN TO SHOW WHICH ITEMS NEED SEPERATION ODDS AND EVENS #
# ///////////////////////////////////////////////////////////////////////#
df["ODD_EVEN"] = ""

# ODD EVEN TAG FUNCTION TO #
# //////////////////////////#
def odd(col):
    l = col["LENGTH"].lower().split(" ")
    for i in l:
        if i == "odd":
            col["ODD_EVEN"] = i
        elif i == "even":
            col["ODD_EVEN"] = i
    return col


df = df.apply(odd, axis=1)


# LENGTH CONVERSION FUNCTION
def length(col):
    for i in range(len(col)):
        col[i] = col[i].lstrip(".")
        col[i] = int(float(col[i]) * 1000)
    col = col
    return col


# CREATE A DICTIONARY OF INCL AND ECL INDEX VALUES
inc_excl = {}
for ind, row in df["LENGTH"].items():
    if "EXCL" in row:
        inc_excl[ind] = 0

    if "AND" in row:
        inc_excl[ind] = 1

    else:
        inc_excl[ind] = "none"

# CLEAN THE LENGTH COLUMN OF ALL LETTERS AND DASHES
df["LENGTH"] = (
    df["LENGTH"].copy().str.replace("[a-zA-Z\(\)\-]", " ", regex=True).str.split()
)
df["LENGTH"] = df["LENGTH"].apply(length)

# REMOVE THE DUPLICATE LENGTHS WHERE THERE ARE EXCLUSIONS AND INCLUSIONS #
# ////////////////////////////////////////////////////////////////////// #

# EXCLUDE SIZES DICT
excl_sizes = {}


def remove_dup():
    for c in range(0, df["LENGTH"].shape[0], 3):
        try:
            if inc_excl[str(c)] == 1:
                if len(df["LENGTH"][c]) == 3:
                    excl_sizes[c + 1] = df["LENGTH"][c][-1]
                    df["LENGTH"][c + 1].remove(df["LENGTH"][c][-1])
                elif len(df["LENGTH"][c]) == 4:
                    excl_sizes[c + 1] = df["LENGTH"][c][-2:]
                    for i in df["LENGTH"][c][-2:]:
                        df["LENGTH"][c + 1].remove(i)
        except:
            pass


remove_dup()


# CREATE THE RANGE OF SIZES IN LENGTH COLUMN
def dim(col):
    l = list(np.arange(col[0], col[1] + 300, 300))
    for i in col[2:]:
        if i in l:
            pass
        else:
            l.append(i)
    return sorted(l)


df["LENGTH"] = df["LENGTH"].apply(dim)


# FUNCTION TO INCLUDE CORRECT LENGTHS FOR ODD EVEN #
# //////////////////////////////////////////////// #
def odd_even(col):

    # CREATE ODD/EVEN DICTIONARY FOR CORRECT SIZES
    odd_even_dic = {
        "odd": [2700, 3300, 3900, 4500, 5100, 5700],
        "even": [3000, 3600, 4200, 4800, 5400],
    }
    if col["ODD_EVEN"] == "odd":
        col["LENGTH"] = odd_even_dic["odd"]
    elif col["ODD_EVEN"] == "even":
        col["LENGTH"] = odd_even_dic["even"]
    return col


df = df.apply(odd_even, axis=1)


# REMOVE THE EXCLUDED AND ADD INCLUDED LENGTHS #
# //////////////////////////////////////////// #
def excl_incl():
    for k, v in excl_sizes.items():
        l = df["LENGTH"][int(k)]
        if isinstance(v, list):
            for i in v:
                l.remove(i)
            df["LENGTH"][int(k)] = l
        else:
            l.remove(v)
            df["LENGTH"][int(k)] = l


excl_incl()

# FUNCTION TO MATCH SYSTEM CODES TO THE DESCRIPTIONS IN DATAFRAME #
# /////////////////////////////////////////////////////////////// #
def s5_product(col):

    # //////////////////////////////////////////////////// #
    # READ IN OTHER JSON FILES REQUIRED FOR THE CONVERSION #
    # //////////////////////////////////////////////////// #
    with open(f"{workdir}/python/templates/s5_all_products.json", "r") as json_file:
        s5_json = json.load(json_file)

    T_json = s5_json["s5_all_products"]["s5_treated"]
    U_json = s5_json["s5_all_products"]["s5_untreated"]

    # CONSTRUCT DATAFRAMES
    columns = s5_json["columns"]

    T_idx = list(T_json.keys())
    T_data = list(T_json.values())

    U_idx = list(U_json.keys())
    U_data = list(U_json.values())

    T = pd.DataFrame(T_data, index=T_idx, columns=columns)
    U = pd.DataFrame(U_data, index=U_idx, columns=columns)

    p_list_t = []
    p_list_u = []

    for length in col["LENGTH"]:

        if length == 900:

            s = f'{col["DIMENSIONS"]} x 0{length}'
            try:
                p_list_t.append(
                    T[T["DESC"].str.contains(f"(PINE: {s})")]["ITEMNO"].values[0]
                )

            except:
                pass

            try:
                p_list_u.append(
                    U[U["DESC"].str.contains(f"(PINE: {s})")]["ITEMNO"].values[0]
                )

            except:
                pass

        else:
            s = f'{col["DIMENSIONS"]} x {length}'
            try:
                p_list_t.append(
                    T[T["DESC"].str.contains(f"(PINE: {s})")]["ITEMNO"].values[0]
                )
            except:
                pass

            try:
                p_list_u.append(
                    U[U["DESC"].str.contains(f"(PINE: {s})")]["ITEMNO"].values[0]
                )
            except:
                pass

        col["IC_UNTREATED"] = p_list_u
        col["IC_TREATED"] = p_list_t

        # PERCENTAGE STDOUT

    return col


# CREATE ITEM CODES COLUMNS
df["IC_UNTREATED"] = ""
df["IC_TREATED"] = ""

df = df.apply(s5_product, axis=1)
df.reset_index(inplace=True, drop=True)

# REPLACE THE SLASHES FOR CORRECT FORMAT
system_os = platform.platform(terse=True).split("-")[0]

# STRIP WHITESPACE FOR FILENAME
strip_number = customer_number.strip()

# CREATE THE FOLDER TO STORE ITEMS INSERT #
###########################################
# GET THE OS TYPE AND GET PATH TO DOCUMENTS AND CREATE FOLDER TO SAVE FILES #

# GLOBAL PATHS
server_filepath = ""
mydocuments_folder = ""
if schedule_flag == "false":
    mydocuments_folder = (
        f'{os.environ["HOMEPATH"]}/Documents/P2SYS-CONVERSIONS/{strip_number}/{time}/'
    )
    os.makedirs(mydocuments_folder, exist_ok=True)

    # GET THE SERVER FILE PATH FROM ARGV

    server_filepath = f"{sys.argv[1:][1]}/GENERATED_PRICE-LISTS/{strip_number}/{time}/"
    try:
        os.makedirs(server_filepath, exist_ok=True)
    except:
        pass
else:
    server_filepath = "none"
    mydocuments_folder = (
        f'{os.environ["HOMEPATH"]}/Documents/P2SYS-SCHEDULED/{strip_number}/{time}/'
    )
    os.makedirs(mydocuments_folder, exist_ok=True)

# print(mydocuments_folder)

# PASS TO SHEET CREATOR CODE #
##############################

# SEND FOR REFORM
reform_file = reform.reformat_layman(pricelist_number, customer_number, df)

# SEND TO S5
s5_ordersheet.create_s5_ordersheet(
    mydocuments_folder,
    reform_file["customer_number"],
    reform_file["customer_pricelist"],
    server_filepath,
    python_schedule_date,
)

if schedule_flag == "false":
    system_template.system_template_fn(
        mydocuments_folder,
        reform_file["customer_number"],
        reform_file["customer_pricelist"],
        server_filepath,
    )

# PASS FILE PATHS FOR EMAIL
path_arr = list(os.listdir(mydocuments_folder))
str_file = ""
for i in path_arr:
    if len(str_file) > 1:
        str_file += f",{mydocuments_folder}{i}"
    else:
        str_file = f"{mydocuments_folder}{i}"
print(str_file)

# PERCENTAGE STDOUT
print(100)
