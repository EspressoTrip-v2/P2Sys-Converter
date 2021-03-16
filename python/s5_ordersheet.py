import collections as c
import os
import shutil
import warnings
from datetime import datetime

import numpy as np
import pandas as pd
import xlsxwriter

time = datetime.now().strftime("%d-%m-%Y")

workdir = os.getcwd()
order_sheet_notice_image = f"{workdir}/python/templates/notice.png"
order_sheet_official_image = f"{workdir}/python/templates/official.png"
order_sheet_notice_summary_image = f"{workdir}/python/templates/notice_summary.png"
order_sheet_official_summary_image = f"{workdir}/python/templates/official_summary.png"

warnings.filterwarnings("ignore", "This pattern has match server_filepaths")
warnings.filterwarnings("ignore", "divide by zero encountered in true_divide")
warnings.filterwarnings("ignore", "invalid value encountered in multiply")


def create_s5_ordersheet(
    directory,
    customer_number,
    customer_pricelist,
    server_path,
    schedule_date,
    multi_zip_path,
):

    # CREATE THE COLUMNS TO BE USED IN THE ORDERSHEET #
    ###################################################

    # TREATED
    columnsT = [
        "ITEM NUMBER",
        "DESCRIPTION",
        "BUNDLE \n SIZE",
        "M3 TREATED \n PRICE",
        "TREATED BUNDLE \n PRICE",
        "R/METER TREATED \n PRICE",
        "(BUNDLE) ORDER \n QUANTITY",
        "TOTAL \n AMOUNT",
    ]
    # UNTREATED
    columnsU = [
        "ITEM NUMBER",
        "DESCRIPTION",
        "BUNDLE \n SIZE",
        "M3 UNTREATED \n PRICE",
        "UNTREATED BUNDLE \n PRICE",
        "R/METER UNTREATED \n PRICE",
        "(BUNDLE) ORDER \n QUANTITY",
        "TOTAL \n AMOUNT",
    ]

    # REFERENCE ORDERED DICTIONARY OF TYPE: MIN POS: MAX POS: SHEET NAME: SUMMARY DESCRIPTION
    product_index = c.OrderedDict()
    product_index["038038U"] = [
        5,
        24,
        "untreated_38mm",
        "038 x 038",
        "UNTREATED",
    ]
    product_index["038038T"] = [5, 24, "treated_38mm", "038 x 038", "CCA TREATED"]
    product_index["blank1"] = []

    product_index["038050U"] = [
        26,
        39,
        "untreated_38mm",
        "038 x 050",
        "UNTREATED",
    ]
    product_index["038050T"] = [
        26,
        39,
        "treated_38mm",
        "038 x 050",
        "CCA TREATED",
    ]
    product_index["blank2"] = []

    product_index["038076U"] = [
        41,
        60,
        "untreated_38mm",
        "038 x 076",
        "UNTREATED",
    ]
    product_index["038076T"] = [
        41,
        60,
        "treated_38mm",
        "038 x 076",
        "CCA TREATED",
    ]
    product_index["blank3"] = []

    product_index["038114U"] = [
        62,
        81,
        "untreated_38mm",
        "038 x 114",
        "UNTREATED",
    ]
    product_index["038114T"] = [
        62,
        81,
        "treated_38mm",
        "038 x 114",
        "CCA TREATED",
    ]
    product_index["blank4"] = []

    product_index["038152U"] = [
        83,
        102,
        "untreated_38mm",
        "038 x 152",
        "UNTREATED",
    ]
    product_index["038152T"] = [
        83,
        102,
        "treated_38mm",
        "038 x 152",
        "CCA TREATED",
    ]
    product_index["blank5"] = []

    product_index["038228U"] = [
        104,
        123,
        "untreated_38mm",
        "038 x 228",
        "UNTREATED",
    ]
    product_index["038228T"] = [
        104,
        123,
        "treated_38mm",
        "038 x 228",
        "CCA TREATED",
    ]
    product_index["blank6"] = []

    product_index["050076U"] = [
        5,
        24,
        "untreated_50mm",
        "050 x 076",
        "UNTREATED",
    ]
    product_index["050076T"] = [5, 24, "treated_50mm", "050 x 076", "CCA TREATED"]
    product_index["blank7"] = []

    product_index["0500152U"] = [
        26,
        45,
        "untreated_50mm",
        "050 x 152",
        "UNTREATED",
    ]
    product_index["0500152T"] = [
        26,
        45,
        "treated_50mm",
        "050 x 152",
        "CCA TREATED",
    ]
    product_index["blank8"] = []

    product_index["050228U"] = [
        47,
        66,
        "untreated_50mm",
        "050 x 228",
        "UNTREATED",
    ]
    product_index["050228T"] = [
        47,
        66,
        "treated_50mm",
        "050 x 228",
        "CCA TREATED",
    ]

    product_index["blank9"] = []

    product_index["076228U"] = [
        5,
        24,
        "untreated_76mm",
        "076 x 228",
        "UNTREATED",
    ]
    product_index["076228T"] = [5, 24, "treated_76mm", "076 x 228", "CCA TREATED"]

    columns_summary = [
        "SIZE CATEGORY",
        "TREATMENT",
        "TOTAL BUNDLE",
        "TOTAL M3",
        "TOTAL PRICE",
    ]

    # CREATE SUMMARY DATAFRAME
    summary_dataframe = pd.DataFrame(
        index=np.arange(0, len(product_index)), columns=columns_summary
    )

    # LISTS TO BE ABLE TO INSERT BLANK LINES BETWEEN PRODUCT LINES #
    ################################################################
    desc_038 = [
        "(038 x 038)",
        "(038 x 050)",
        "(038 x 076)",
        "(038 x 114)",
        "(038 x 152)",
        "(038 x 228)",
    ]
    desc_050 = ["(050 x 076)", "(050 x 114)", "(050 x 152)", "(050 x 228)"]
    desc_076 = ["(076 x 114)", "(076 x 152)", "(076 x 228)"]
    nan_row = ["", "", "", "", np.nan, np.nan, np.nan, np.nan]
    # filter_row = ["", "", "", 0, np.nan, np.nan, np.nan, np.nan]

    # RESET THE INDEX
    customer_pricelist.reset_index(inplace=True)
    customer_pricelist.rename(columns={"index": "ITEMNO"}, inplace=True)

    # 'ITEMNO' ,'DESC', 'UNITPRICE', 'CONVERSION', 'R/METER UNTREATED','R/METER TREATED', 'BUNDLE SIZE', 'M3 TREATED', 'M3 UNTREATED', 'CURRENCY','PRICELIST'

    # SET ALL NUMERIC NAN TO 0 & COLUMNS TO INTEGER
    customer_pricelist["M3 TREATED"].fillna(0, inplace=True)
    customer_pricelist["M3 TREATED"] = customer_pricelist["M3 TREATED"].astype(int)
    customer_pricelist["M3 UNTREATED"].fillna(0, inplace=True)
    customer_pricelist["M3 UNTREATED"] = customer_pricelist["M3 UNTREATED"].astype(int)

    # CONVERT THE VALUES TO INTEGER/FLOATS
    customer_pricelist["UNITPRICE"] = customer_pricelist["UNITPRICE"].astype(int)

    # ADD THE BUNDLE PRICE CONVERSION
    customer_pricelist["BUNDLE PRICE"] = (
        customer_pricelist["UNITPRICE"].values
        * (1 / customer_pricelist["CONVERSION"].values)
    ).round(2)

    # customer_pricelist = customer_pricelist[~customer_pricelist['DESC'].str.
    #                                         contains('XXX')]

    # 038 PRODUCT LINE
    _038 = customer_pricelist[customer_pricelist["DESC"].str.contains("(PINE: 038)")]

    # TREATED
    _038T = _038[_038["ITEMNO"].str.endswith("T")].copy()
    _038T = _038T[
        [
            "ITEMNO",
            "DESC",
            "BUNDLE SIZE",
            "M3 TREATED",
            "BUNDLE PRICE",
            "R/METER TREATED",
        ]
    ]
    _038T["ORDER QTY M3"] = np.nan
    _038T["AMOUNT R"] = np.nan
    _038T = _038T[_038T["M3 TREATED"] >= 0]

    _038T.sort_values(by=["DESC"], inplace=True, axis=0)
    _038T["DESC"] = (
        _038T["DESC"]
        .str.replace("PINE: ", "")
        .str.replace("LONG SABS S5", "")
        .str.replace("SHORT SABS S5", "")
    )

    # BLANK INSERTION LOOP TO SEPARATE PRODUCTS
    for i in desc_038:
        _038T.reset_index(inplace=True, drop=True)
        idx = list(_038T[_038T["DESC"].str.contains(i)].index)
        if len(idx) < 1:
            continue
        else:
            df1 = _038T.iloc[: idx[-1] + 1, :].copy()
            df1.loc[idx[-1] + 1] = nan_row

            df2 = _038T.iloc[idx[-1] + 1 :, :].copy()
            _038T = pd.concat([df1, df2])

    # INSERT THE FILTER ROW IF ALL VALUES ARE ZERO
    _038T_hidden_rows = []
    for i in desc_038:
        idx = list(_038T[_038T["DESC"].str.contains(i)].index)
        if _038T.loc[idx, "M3 TREATED"].sum() == 0:
            try:
                if len(_038T_hidden_rows) == 0:
                    _038T_hidden_rows = np.array(idx) + 4
                    added_item = _038T_hidden_rows[-1] + 1
                    _038T_hidden_rows = np.append(_038T_hidden_rows, added_item)
                else:
                    _038T_hidden_rows = np.append(_038T_hidden_rows, np.array(idx) + 4)
                    added_item = _038T_hidden_rows[-1] + 1
                    _038T_hidden_rows = np.append(_038T_hidden_rows, added_item)
            except:
                pass

    # ADD THE TREATED COLUMN NAMES
    _038T.columns = columnsT

    # ROW LENGTH
    _038T_rownum = _038T.shape[0]

    # UNTREATED
    _038U = _038[~_038["ITEMNO"].str.endswith("T")].copy()
    _038U = _038U[_038U["DESC"].str.contains("SABS S5")]

    _038U = _038U[
        [
            "ITEMNO",
            "DESC",
            "BUNDLE SIZE",
            "M3 UNTREATED",
            "BUNDLE PRICE",
            "R/METER UNTREATED",
        ]
    ]
    _038U["ORDER QTY M3"] = np.nan
    _038U["AMOUNT R"] = np.nan
    _038U = _038U[_038U["M3 UNTREATED"] >= 0]
    _038U.sort_values(by=["DESC"], inplace=True, axis=0)

    _038U.sort_values(by=["DESC"], inplace=True, axis=0)
    _038U["DESC"] = (
        _038U["DESC"]
        .str.replace("PINE: ", "")
        .str.replace("LONG SABS S5", "")
        .str.replace("SHORT SABS S5", "")
    )

    # BLANK INSERTION LOOP TO SEPARATE PRODUCTS
    for i in desc_038:
        _038U.reset_index(inplace=True, drop=True)
        idx = list(_038U[_038U["DESC"].str.contains(i)].index)
        if len(idx) < 1:
            continue
        else:
            df1 = _038U.iloc[: idx[-1] + 1, :].copy()
            df1.loc[idx[-1] + 1] = nan_row

            df2 = _038U.iloc[idx[-1] + 1 :, :].copy()
            _038U = pd.concat([df1, df2])

    # INSERT THE FILTER ROW IF ALL VALUES ARE ZERO
    _038U_hidden_rows = []
    for i in desc_038:
        idx = list(_038U[_038U["DESC"].str.contains(i)].index)
        if _038U.loc[idx, "M3 UNTREATED"].sum() == 0:
            try:
                if len(_038U_hidden_rows) == 0:
                    _038U_hidden_rows = np.array(idx) + 4
                    added_item = _038U_hidden_rows[-1] + 1
                    _038U_hidden_rows = np.append(_038U_hidden_rows, added_item)
                else:
                    _038U_hidden_rows = np.append(_038U_hidden_rows, np.array(idx) + 4)
                    added_item = _038U_hidden_rows[-1] + 1
                    _038U_hidden_rows = np.append(_038U_hidden_rows, added_item)
            except:
                pass

    # ADD UNTREATED COLUMN NAMES
    _038U.columns = columnsU

    # ROW LENGTH
    _038U_rownum = _038U.shape[0]

    # 050 PRODUCT LINE
    _050 = customer_pricelist[customer_pricelist["DESC"].str.contains("(PINE: 050)")]

    # TREATED
    _050T = _050[_050["ITEMNO"].str.endswith("T")].copy()
    _050T = _050T[
        [
            "ITEMNO",
            "DESC",
            "BUNDLE SIZE",
            "M3 TREATED",
            "BUNDLE PRICE",
            "R/METER TREATED",
        ]
    ]
    _050T["ORDER QTY M3"] = np.nan
    _050T["AMOUNT R"] = np.nan
    _050T = _050T[_050T["M3 TREATED"] >= 0]
    _050T.sort_values(by=["DESC"], inplace=True, axis=0)

    _050T.sort_values(by=["DESC"], inplace=True, axis=0)
    _050T["DESC"] = (
        _050T["DESC"]
        .str.replace("PINE: ", "")
        .str.replace("LONG SABS S5", "")
        .str.replace("SHORT SABS S5", "")
    )

    # BLANK INSERTION LOOP TO SEPERATE PRODUCTS
    for i in desc_050:
        _050T.reset_index(inplace=True, drop=True)
        idx = list(_050T[_050T["DESC"].str.contains(i)].index)
        if len(idx) < 1:
            continue
        else:
            df1 = _050T.iloc[: idx[-1] + 1, :].copy()
            df1.loc[idx[-1] + 1] = nan_row

            df2 = _050T.iloc[idx[-1] + 1 :, :].copy()

            _050T = pd.concat([df1, df2])

    # INSERT THE FILTER ROW IF ALL VALUES ARE ZERO
    _050T_hidden_rows = []
    for i in desc_050:
        idx = list(_050T[_050T["DESC"].str.contains(i)].index)
        if _050T.loc[idx, "M3 TREATED"].sum() == 0:
            try:
                if len(_050T_hidden_rows) == 0:
                    _050T_hidden_rows = np.array(idx) + 4
                    added_item = _050T_hidden_rows[-1] + 1
                    _050T_hidden_rows = np.append(_050T_hidden_rows, added_item)
                else:
                    _050T_hidden_rows = np.append(_050T_hidden_rows, np.array(idx) + 4)
                    added_item = _050T_hidden_rows[-1] + 1
                    _050T_hidden_rows = np.append(_050T_hidden_rows, added_item)
            except:
                pass

    # ADD TREATED COLUMN NAMES
    _050T.columns = columnsT

    # ROW LENGTH
    _050T_rownum = _050T.shape[0]

    # UNTREATED
    _050U = _050[~_050["ITEMNO"].str.endswith("T")].copy()
    _050U = _050U[_050U["DESC"].str.contains("SABS S5")]

    _050U = _050U[
        [
            "ITEMNO",
            "DESC",
            "BUNDLE SIZE",
            "M3 UNTREATED",
            "BUNDLE PRICE",
            "R/METER UNTREATED",
        ]
    ]
    _050U["ORDER QTY M3"] = np.nan
    _050U["AMOUNT R"] = np.nan
    _050U = _050U[_050U["M3 UNTREATED"] >= 0]
    _050U.sort_values(by=["DESC"], inplace=True, axis=0)

    _050U.sort_values(by=["DESC"], inplace=True, axis=0)
    _050U["DESC"] = (
        _050U["DESC"]
        .str.replace("PINE: ", "")
        .str.replace("LONG SABS S5", "")
        .str.replace("SHORT SABS S5", "")
    )

    # BLANK INSERTION LOOP TO SEPARATE PRODUCTS
    for i in desc_050:
        _050U.reset_index(inplace=True, drop=True)
        idx = list(_050U[_050U["DESC"].str.contains(i)].index)
        if len(idx) < 1:
            continue
        else:

            df1 = _050U.iloc[: idx[-1] + 1, :].copy()
            df1.loc[idx[-1] + 1] = nan_row

            df2 = _050U.iloc[idx[-1] + 1 :, :].copy()
            _050U = pd.concat([df1, df2])

    # INSERT THE FILTER ROW IF ALL VALUES ARE ZERO
    _050U_hidden_rows = []
    for i in desc_050:
        idx = list(_050U[_050U["DESC"].str.contains(i)].index)
        if _050U.loc[idx, "M3 UNTREATED"].sum() == 0:
            try:
                if len(_050U_hidden_rows) == 0:
                    _050U_hidden_rows = np.array(idx) + 4
                    added_item = _050U_hidden_rows[-1] + 1
                    _050U_hidden_rows = np.append(_050U_hidden_rows, added_item)
                else:
                    _050U_hidden_rows = np.append(_050U_hidden_rows, np.array(idx) + 4)
                    added_item = _050U_hidden_rows[-1] + 1
                    _050U_hidden_rows = np.append(_050U_hidden_rows, added_item)
            except:
                pass

    # ADD UNTREATED COLUMN NAMES
    _050U.columns = columnsU

    # ROW LENGTH
    _050U_rownum = _050U.shape[0]

    # 076 PRODUCT LINE
    _076 = customer_pricelist[customer_pricelist["DESC"].str.contains("(PINE: 076)")]

    # TREATED
    _076T = _076[_076["ITEMNO"].str.endswith("T")].copy()
    _076T = _076T[
        [
            "ITEMNO",
            "DESC",
            "BUNDLE SIZE",
            "M3 TREATED",
            "BUNDLE PRICE",
            "R/METER TREATED",
        ]
    ]
    _076T["ORDER QTY M3"] = np.nan
    _076T["AMOUNT R"] = np.nan
    _076T = _076T[_076T["M3 TREATED"] >= 0]
    _076T.sort_values(by=["DESC"], inplace=True, axis=0)

    _076T.sort_values(by=["DESC"], inplace=True, axis=0)
    _076T["DESC"] = (
        _076T["DESC"]
        .str.replace("PINE: ", "")
        .str.replace("LONG SABS S5", "")
        .str.replace("SHORT SABS S5", "")
    )

    # BLANK INSERTION LOOP TO SEPARATE PRODUCTS
    for i in desc_076:
        _076T.reset_index(inplace=True, drop=True)
        idx = list(_076T[_076T["DESC"].str.contains(i)].index)
        if len(idx) < 1:
            continue
        else:

            df1 = _076T.iloc[: idx[-1] + 1, :].copy()
            df1.loc[idx[-1] + 1] = nan_row

            df2 = _076T.iloc[idx[-1] + 1 :, :].copy()

            _076T = pd.concat([df1, df2])

    # INSERT THE FILTER ROW IF ALL VALUES ARE ZERO
    _076T_hidden_rows = []
    for i in desc_076:
        idx = list(_076T[_076T["DESC"].str.contains(i)].index)
        if _076T.loc[idx, "M3 TREATED"].sum() == 0:
            try:
                if len(_076T_hidden_rows) == 0:
                    _076T_hidden_rows = np.array(idx) + 4
                    added_item = _076T_hidden_rows[-1] + 1
                    _076T_hidden_rows = np.append(_076T_hidden_rows, added_item)
                else:
                    _076T_hidden_rows = np.append(_076T_hidden_rows, np.array(idx) + 4)
                    added_item = _076T_hidden_rows[-1] + 1
                    _076T_hidden_rows = np.append(_076T_hidden_rows, added_item)
            except:
                pass

    # ADD TREATED COLUMN NAMES
    _076T.columns = columnsT

    # ROW LENGTH
    _076T_rownum = _076T.shape[0]

    # UNTREATED
    _076U = _076[~_076["ITEMNO"].str.endswith("T")].copy()
    _076U = _076U[_076U["DESC"].str.contains("SABS S5")]

    _076U = _076U[
        [
            "ITEMNO",
            "DESC",
            "BUNDLE SIZE",
            "M3 UNTREATED",
            "BUNDLE PRICE",
            "R/METER UNTREATED",
        ]
    ]
    _076U["ORDER QTY M3"] = np.nan
    _076U["AMOUNT R"] = np.nan
    _076U = _076U[_076U["M3 UNTREATED"] >= 0]
    _076U.sort_values(by=["DESC"], inplace=True, axis=0)

    _076U.sort_values(by=["DESC"], inplace=True, axis=0)
    _076U["DESC"] = (
        _076U["DESC"]
        .str.replace("PINE: ", "")
        .str.replace("LONG SABS S5", "")
        .str.replace("SHORT SABS S5", "")
    )

    # BLANK INSERTION LOOP TO SEPARATE PRODUCTS
    for i in desc_076:
        _076U.reset_index(inplace=True, drop=True)
        idx = list(_076U[_076U["DESC"].str.contains(i)].index)
        if len(idx) < 1:
            continue
        else:

            df1 = _076U.iloc[: idx[-1] + 1, :].copy()
            df1.loc[idx[-1] + 1] = nan_row

            df2 = _076U.iloc[idx[-1] + 1 :, :].copy()

            _076U = pd.concat([df1, df2])

    # INSERT THE FILTER ROW IF ALL VALUES ARE ZERO
    _076U_hidden_rows = []
    for i in desc_076:
        idx = list(_076U[_076U["DESC"].str.contains(i)].index)
        if _076U.loc[idx, "M3 UNTREATED"].sum() == 0:
            try:
                if len(_076U_hidden_rows) == 0:
                    _076U_hidden_rows = np.array(idx) + 4
                    added_item = _076U_hidden_rows[-1] + 1
                    _076U_hidden_rows = np.append(_076U_hidden_rows, added_item)
                else:
                    _076U_hidden_rows = np.append(_076U_hidden_rows, np.array(idx) + 4)
                    added_item = _076U_hidden_rows[-1] + 1
                    _076U_hidden_rows = np.append(_076U_hidden_rows, added_item)
            except:
                pass

    # ADD UNTREATED COLUMN NAMES
    _076U.columns = columnsU

    # ROW LENGTH
    _076U_rownum = _076U.shape[0]

    file_path_string = ""
    if schedule_date == 0:
        file_path_string = f"{directory}/S5_{customer_number.strip()}.xlsx"
    else:
        file_path_string = f"{directory}/S5_sample_{customer_number.strip()}.xlsx"

    # CREATE XLSX WRITER
    with pd.ExcelWriter(file_path_string, engine="xlsxwriter") as writer:

        # GET THE WRITER WORKBOOK
        workbook = writer.book

        # CONVERT THE DATAFRAME TO EXCEL
        _038T.to_excel(writer, sheet_name="treated_38mm", startrow=3, index=False)
        workbook.define_name("treated_38mm", "=treated_38mm!$A$1:$H$156")

        _038U.to_excel(writer, sheet_name="untreated_38mm", startrow=3, index=False)
        workbook.define_name("untreated_38mm", "=untreated_38mm!$A$1:$H$156")

        _050T.to_excel(writer, sheet_name="treated_50mm", startrow=3, index=False)
        workbook.define_name("treated_50mm", "=treated_50mm!$A$1:$H$156")

        _050U.to_excel(writer, sheet_name="untreated_50mm", startrow=3, index=False)
        workbook.define_name("untreated_50mm", "=untreated_50mm!$A$1:$H$156")

        _076T.to_excel(writer, sheet_name="treated_76mm", startrow=3, index=False)
        workbook.define_name("treated_76mm", "=treated_76mm!$A$1:$H$156")

        _076U.to_excel(writer, sheet_name="untreated_76mm", startrow=3, index=False)
        workbook.define_name("untreated_76mm", "=untreated_76mm!$A$1:$H$156")

        summary_dataframe.to_excel(
            writer, sheet_name="summary", startrow=3, index=False
        )
        workbook.define_name("summary", "=summary!$A$1:$E$156")

        # ASSIGN THE WORKSHEET NAMES
        worksheet1 = writer.sheets["summary"]
        worksheet2 = writer.sheets["treated_38mm"]
        worksheet3 = writer.sheets["untreated_38mm"]
        worksheet4 = writer.sheets["treated_50mm"]
        worksheet5 = writer.sheets["untreated_50mm"]
        worksheet6 = writer.sheets["treated_76mm"]
        worksheet7 = writer.sheets["untreated_76mm"]

        # HEADER FORMAT
        header_format = workbook.add_format()
        header_format.set_align("center")
        header_format.set_align("vcenter")
        header_format.set_bold()
        header_format.set_text_wrap()
        header_format.set_bottom()
        header_format.set_top()

        # COLUMN ATTRIBUTES AND FORMATTING
        column_format1 = workbook.add_format()
        column_format1.set_align("center")
        column_format1.set_align("vcenter")

        column_format2 = workbook.add_format()
        column_format2.set_align("center")
        column_format2.set_align("vcenter")
        column_format2.set_text_wrap()
        column_format2.set_num_format('_(###0.00_);_(\(###0.00\);_(" "??_);_(@_)')

        column_format3 = workbook.add_format()
        column_format3.set_align("center")
        column_format3.set_align("vcenter")
        column_format3.set_text_wrap()
        column_format3.set_num_format("_(###0.00_);_(\(###0.00\)")

        # FORMULA FORMAT
        formula_format = workbook.add_format()
        # formula_format.set_hidden()
        formula_format.set_align("center")
        formula_format.set_align("vcenter")
        formula_format.set_num_format('_(###0.00_);_(\(###0.00\);_(" "??_);_(@_)')

        # TOTAL FORMAT
        total_format = workbook.add_format()
        total_format.set_align("center")
        total_format.set_align("vcenter")
        total_format.set_hidden()
        total_format.set_bottom(6)
        total_format.set_right()
        total_format.set_left()
        total_format.set_top(6)
        total_format.set_bold()
        total_format.set_num_format('_(###0.00_);_(\(###0.00\);_(" "??_);_(@_)')

        # COLOR FORMAT UNLOCKED
        color_format_unlocked = workbook.add_format()
        color_format_unlocked.set_bg_color("#0f61b0")
        color_format_unlocked.set_font_color("white")
        color_format_unlocked.set_bold()
        # color_format_unlocked.set_border()
        color_format_unlocked.set_locked(False)
        color_format_unlocked.set_align("center")
        color_format_unlocked.set_align("vcenter")
        color_format_unlocked.set_num_format('_(###0_);_(\(###0\);_(" "??_);_(@_)')

        # COLOR FORMAT LOCKED
        color_format_locked = workbook.add_format()
        color_format_locked.set_bg_color("#0f61b0")
        color_format_locked.set_font_color("white")
        color_format_locked.set_hidden()
        color_format_locked.set_bold()
        # color_format_locked.set_border()
        color_format_locked.set_align("center")
        color_format_locked.set_align("vcenter")

        # ORDER NUMBER FORMAT AND ALIGN
        order_format = workbook.add_format()
        order_format.set_bg_color("#0f61b0")
        order_format.set_font_color("white")
        order_format.set_bold()
        # order_format.set_border()
        order_format.set_locked(True)
        order_format.set_align("right")
        order_format.set_align("vcenter")

        # SET FORMATTING FOR THE MERGED CELLS AC WHITCHER
        merge_formatA = workbook.add_format(
            {
                "font_name": "Monotype Corsiva",
                "align": "center",
                "valign": "vcenter",
                "bg_color": "white",
            }
        )
        # SET FORMATTING FOR THE MERGED CELLS ESTABLISHED 1902
        merge_formatB = workbook.add_format(
            {
                "bold": 0.5,
                "font_name": "Times New Roman",
                "align": "center",
                "valign": "vcenter",
                "bg_color": "white",
            }
        )

        # SET THE FORMATTING FOR THE FOOTER S7 ADDITION
        merge_formatC = workbook.add_format(
            {
                "bold": 0.5,
                "font_name": "Calibri",
                "align": "center",
                "valign": "vcenter",
                "font_size": 11,
                "bg_color": "#0f61b0",
                "color": "white",
            }
        )

        unlocked = workbook.add_format(
            {"align": "center", "valign": "vcenter", "locked": False}
        )

        # WORKSHEET 1
        worksheet1.set_column(0, 0, 25, column_format2)
        worksheet1.set_column(1, 3, 20, column_format2)
        worksheet1.set_column(4, 4, 25, column_format2)

        # ADD FORMULA TO CALCULATE BUNDLE SIZE AND TOTAL PRICE
        row_countA = 4
        for k, v in product_index.items():
            if k.startswith("blank"):
                row_countA += 1
                continue
            else:
                b_str = ""
                p_str = ""
                m3_str = ""
                for i in np.arange(v[0], v[1] + 1):
                    if i == v[0]:
                        b_str += f"{v[2]}!G{i}"
                        p_str += f"{v[2]}!H{i}"
                        m3_str += f"{v[2]}!I{i}"

                    else:
                        b_str += f" + {v[2]}!G{i}"
                        p_str += f" + {v[2]}!H{i}"
                        m3_str += f" + {v[2]}!I{i}"

            # SIZE COLUMN ENTRY
            worksheet1.write_string(row_countA, 0, v[3])

            # TOTAL PRICE ENTRY
            worksheet1.write_string(row_countA, 1, v[4], unlocked)

            worksheet1.write_formula(row_countA, 2, f"={b_str}", formula_format)
            worksheet1.write_formula(row_countA, 4, f"={p_str}", formula_format)
            worksheet1.write_formula(row_countA, 3, f"={m3_str}", formula_format)
            row_countA += 1

        # ADD ENTRIES TO SUMMARY SHEET
        worksheet1.write_string("A34", " ", color_format_unlocked)
        worksheet1.write_string(row_countA, 1, "TOTALS", color_format_locked)
        # TOTAL PRICE
        worksheet1.write_formula(row_countA, 4, f"=SUM(E5:E{row_countA})", total_format)
        # TOTAL M3
        worksheet1.write_formula(row_countA, 3, f"=SUM(D5:D{row_countA})", total_format)
        # TOTAL BUNDLE
        worksheet1.write_formula(row_countA, 2, f"=SUM(C5:C{row_countA})", total_format)

        # WORKSHEET 2
        worksheet2.set_column(0, 2, 20, column_format1)
        worksheet2.set_column(3, 5, 20, column_format3)
        worksheet2.set_column(6, 7, 20, column_format2)

        # ADD FORMULA TO ROWS
        r = np.arange(5, _038T_rownum + 4)
        for i in r:

            m3_formula = f"=IFERROR(H{i}/D{i}, 0)"
            worksheet2.write_formula(f"I{i}:I{i}", m3_formula, formula_format)

            formula = f"=SUM(E{i}:E{i}*G{i}:G{i})"
            worksheet2.write_formula(f"H{i}:H{i}", formula, formula_format)

        # WORKSHEET 3
        worksheet3.set_column(0, 2, 20, column_format1)
        worksheet3.set_column(3, 5, 20, column_format3)
        worksheet3.set_column(6, 7, 20, column_format2)

        # ADD FORMULA TO ROWS
        r = np.arange(5, _038U_rownum + 4)
        for i in r:

            m3_formula = f"=IFERROR(H{i}/D{i}, 0)"
            worksheet3.write_formula(f"I{i}:I{i}", m3_formula, formula_format)

            formula = f"=SUM(E{i}:E{i}*G{i}:G{i})"
            worksheet3.write_formula(f"H{i}:H{i}", formula, formula_format)

        # WORKSHEET 4
        worksheet4.set_column(0, 2, 20, column_format1)
        worksheet4.set_column(3, 5, 20, column_format3)
        worksheet4.set_column(6, 7, 20, column_format2)

        # ADD FORMULA TO ROWS
        r = np.arange(5, _050T_rownum + 4)
        for i in r:

            m3_formula = f"=IFERROR(H{i}/D{i}, 0)"
            worksheet4.write_formula(f"I{i}:I{i}", m3_formula, formula_format)

            formula = f"=SUM(E{i}:E{i}*G{i}:G{i})"
            worksheet4.write_formula(f"H{i}:H{i}", formula, formula_format)

        # WORKSHEET 5
        worksheet5.set_column(0, 2, 20, column_format1)
        worksheet5.set_column(3, 5, 20, column_format3)
        worksheet5.set_column(6, 7, 20, column_format2)

        # ADD FORMULA TO ROWS
        r = np.arange(5, _050U_rownum + 4)
        for i in r:
            m3_formula = f"=IFERROR(H{i}/D{i}, 0)"
            worksheet5.write_formula(f"I{i}:I{i}", m3_formula, formula_format)

            formula = f"=SUM(E{i}:E{i}*G{i}:G{i})"
            worksheet5.write_formula(f"H{i}:H{i}", formula, formula_format)

        # WORKSHEET 6
        worksheet6.set_column(0, 2, 20, column_format1)
        worksheet6.set_column(3, 5, 20, column_format3)
        worksheet6.set_column(6, 7, 20, column_format2)

        # ADD FORMULA TO ROWS
        r = np.arange(5, _076T_rownum + 4)
        for i in r:
            m3_formula = f"=IFERROR(H{i}/D{i}, 0)"
            worksheet6.write_formula(f"I{i}:I{i}", m3_formula, formula_format)

            formula = f"=SUM(E{i}:E{i}*G{i}:G{i})"
            worksheet6.write_formula(f"H{i}:H{i}", formula, formula_format)

        # WORKSHEET 7
        worksheet7.set_column(0, 2, 20, column_format1)
        worksheet7.set_column(3, 5, 20, column_format3)
        worksheet7.set_column(6, 7, 20, column_format2)

        # ADD FORMULA TO ROWS
        r = np.arange(5, _076U_rownum + 4)
        for i in r:
            m3_formula = f"=IFERROR(H{i}/D{i}, 0)"
            worksheet7.write_formula(f"I{i}:I{i}", m3_formula, formula_format)

            formula = f"=SUM(E{i}:E{i}*G{i}:G{i})"
            worksheet7.write_formula(f"H{i}:H{i}", formula, formula_format)

        # MERGE CELLS AND ENTER WRITING
        worksheet1.merge_range("A1:E2", "", merge_formatA)
        worksheet2.merge_range("C1:H2", "", merge_formatA)
        worksheet3.merge_range("C1:H2", "", merge_formatA)
        worksheet4.merge_range("C1:H2", "", merge_formatA)
        worksheet5.merge_range("C1:H2", "", merge_formatA)
        worksheet6.merge_range("C1:H2", "", merge_formatA)
        worksheet7.merge_range("C1:H2", "", merge_formatA)

        if schedule_date == 0:
            worksheet1.insert_image(
                "A1",
                order_sheet_official_summary_image,
                {"object_position": 3},
            )
            worksheet2.insert_image(
                "C1", order_sheet_official_image, {"object_position": 3}
            )
            worksheet3.insert_image(
                "C1", order_sheet_official_image, {"object_position": 3}
            )
            worksheet4.insert_image(
                "C1", order_sheet_official_image, {"object_position": 3}
            )
            worksheet5.insert_image(
                "C1", order_sheet_official_image, {"object_position": 3}
            )
            worksheet6.insert_image(
                "C1", order_sheet_official_image, {"object_position": 3}
            )
            worksheet7.insert_image(
                "C1", order_sheet_official_image, {"object_position": 3}
            )
        else:
            worksheet1.insert_image(
                "A1",
                order_sheet_notice_summary_image,
                {"object_position": 3},
            )
            worksheet2.insert_image(
                "C1", order_sheet_notice_image, {"object_position": 3}
            )
            worksheet3.insert_image(
                "C1", order_sheet_notice_image, {"object_position": 3}
            )
            worksheet4.insert_image(
                "C1", order_sheet_notice_image, {"object_position": 3}
            )
            worksheet5.insert_image(
                "C1", order_sheet_notice_image, {"object_position": 3}
            )
            worksheet6.insert_image(
                "C1", order_sheet_notice_image, {"object_position": 3}
            )
            worksheet7.insert_image(
                "C1", order_sheet_notice_image, {"object_position": 3}
            )

        worksheet2.merge_range("A1:B1", " ", merge_formatA)
        worksheet3.merge_range("A1:B1", " ", merge_formatA)
        worksheet4.merge_range("A1:B1", " ", merge_formatA)
        worksheet5.merge_range("A1:B1", " ", merge_formatA)
        worksheet6.merge_range("A1:B1", " ", merge_formatA)
        worksheet7.merge_range("A1:B1", " ", merge_formatA)

        worksheet2.merge_range("C3:F3", "", color_format_locked)
        worksheet3.merge_range("C3:F3", "", color_format_locked)
        worksheet4.merge_range("C3:F3", "", color_format_locked)
        worksheet5.merge_range("C3:F3", "", color_format_locked)
        worksheet6.merge_range("C3:F3", "", color_format_locked)
        worksheet7.merge_range("C3:F3", "", color_format_locked)

        if schedule_date == 0:
            worksheet2.write_string(2, 6, "ORDER NO:", order_format)
            worksheet3.write_string(2, 6, "ORDER NO:", order_format)
            worksheet4.write_string(2, 6, "ORDER NO:", order_format)
            worksheet5.write_string(2, 6, "ORDER NO:", order_format)
            worksheet6.write_string(2, 6, "ORDER NO:", order_format)
            worksheet7.write_string(2, 6, "ORDER NO:", order_format)
        else:
            worksheet2.write_string(2, 6, "PRICES VALID FROM:", order_format)
            worksheet3.write_string(2, 6, "PRICES VALID FROM:", order_format)
            worksheet4.write_string(2, 6, "PRICES VALID FROM:", order_format)
            worksheet5.write_string(2, 6, "PRICES VALID FROM:", order_format)
            worksheet6.write_string(2, 6, "PRICES VALID FROM:", order_format)
            worksheet7.write_string(2, 6, "PRICES VALID FROM:", order_format)

        worksheet2.write_string(2, 0, "CUSTOMER:", color_format_locked)
        worksheet3.write_string(2, 0, "CUSTOMER:", color_format_locked)
        worksheet4.write_string(2, 0, "CUSTOMER:", color_format_locked)
        worksheet5.write_string(2, 0, "CUSTOMER:", color_format_locked)
        worksheet6.write_string(2, 0, "CUSTOMER:", color_format_locked)
        worksheet7.write_string(2, 0, "CUSTOMER:", color_format_locked)

        worksheet2.write_string(2, 1, customer_number, color_format_locked)
        worksheet3.write_string(2, 1, customer_number, color_format_locked)
        worksheet4.write_string(2, 1, customer_number, color_format_locked)
        worksheet5.write_string(2, 1, customer_number, color_format_locked)
        worksheet6.write_string(2, 1, customer_number, color_format_locked)
        worksheet7.write_string(2, 1, customer_number, color_format_locked)

        # ADD GENEARTED DATE
        # DATE FORMAT
        date_format = workbook.add_format()
        date_format.set_align("left")
        date_format.set_align("vcenter")
        date_format.set_bg_color("white")

        worksheet2.merge_range("A2:B2", f"Date created:  {time}", date_format)
        worksheet3.merge_range("A2:B2", f"Date created:  {time}", date_format)
        worksheet4.merge_range("A2:B2", f"Date created:  {time}", date_format)
        worksheet5.merge_range("A2:B2", f"Date created:  {time}", date_format)
        worksheet6.merge_range("A2:B2", f"Date created:  {time}", date_format)
        worksheet7.merge_range("A2:B2", f"Date created:  {time}", date_format)

        # USE ROW NUM TO ADD 7 11% TEXT
        t38_row = _038T_rownum + 5
        worksheet2.merge_range(
            f"A{t38_row}:H{t38_row}",
            """S7 AVAILABLE AT AN ADDITIONAL 11%""",
            merge_formatC,
        )
        u38_row = _038U_rownum + 5
        worksheet3.merge_range(
            f"A{u38_row}:H{u38_row}",
            """S7 AVAILABLE AT AN ADDITIONAL 11%""",
            merge_formatC,
        )

        t50_row = _050T_rownum + 5
        worksheet4.merge_range(
            f"A{t50_row}:H{t50_row}",
            """S7 AVAILABLE AT AN ADDITIONAL 11%""",
            merge_formatC,
        )
        u50_row = _050U_rownum + 5
        worksheet5.merge_range(
            f"A{u50_row}:H{u50_row}",
            """S7 AVAILABLE AT AN ADDITIONAL 11%""",
            merge_formatC,
        )

        t76_row = _076T_rownum + 5
        worksheet6.merge_range(
            f"A{t76_row}:H{t76_row}",
            """S7 AVAILABLE AT AN ADDITIONAL 11%""",
            merge_formatC,
        )
        u76_row = _076U_rownum + 5
        worksheet7.merge_range(
            f"A{u76_row}:H{u76_row}",
            """S7 AVAILABLE AT AN ADDITIONAL 11%""",
            merge_formatC,
        )

        # DEFAULT ROW
        worksheet1.set_default_row(16)
        worksheet2.set_default_row(16)
        worksheet3.set_default_row(16)
        worksheet4.set_default_row(16)
        worksheet5.set_default_row(16)
        worksheet6.set_default_row(16)
        worksheet7.set_default_row(16)

        # AC WHITCHER ROW
        worksheet1.set_row(0, 30)
        worksheet2.set_row(0, 30)
        worksheet3.set_row(0, 30)
        worksheet4.set_row(0, 30)
        worksheet5.set_row(0, 30)
        worksheet6.set_row(0, 30)
        worksheet7.set_row(0, 30)

        # HEADER ROW
        worksheet1.set_row(3, 28)
        worksheet2.set_row(3, 28)
        worksheet3.set_row(3, 28)
        worksheet4.set_row(3, 28)
        worksheet5.set_row(3, 28)
        worksheet6.set_row(3, 28)
        worksheet7.set_row(3, 28)

        # CUSTOMER NUMBER & ORDER NUMBER ROW
        worksheet2.set_row(2, 28)
        worksheet3.set_row(2, 28)
        worksheet4.set_row(2, 28)
        worksheet5.set_row(2, 28)
        worksheet6.set_row(2, 28)
        worksheet7.set_row(2, 28)

        # ORDER SUMMARY ROW HEIGHT
        worksheet1.set_row(2, 28)

        # HIDE I COLUMNS ON ALL PRODUCT SHEETS
        worksheet1.set_column("F:I", None, None, {"hidden": True})
        worksheet2.set_column("I:I", None, None, {"hidden": True})
        worksheet3.set_column("I:I", None, None, {"hidden": True})
        worksheet4.set_column("I:I", None, None, {"hidden": True})
        worksheet5.set_column("I:I", None, None, {"hidden": True})
        worksheet6.set_column("I:I", None, None, {"hidden": True})
        worksheet7.set_column("I:I", None, None, {"hidden": True})

        # SET HEADER FORMAT
        for i in range(len(columnsT)):
            worksheet2.write_string(3, i, columnsT[i], header_format)
            worksheet3.write_string(3, i, columnsU[i], header_format)
            worksheet4.write_string(3, i, columnsT[i], header_format)
            worksheet5.write_string(3, i, columnsU[i], header_format)
            worksheet6.write_string(3, i, columnsT[i], header_format)
            worksheet7.write_string(3, i, columnsU[i], header_format)

        # SET SUMMARY HEADER FORMAT
        for i in range(len(columns_summary)):
            worksheet1.write_string(3, i, columns_summary[i], header_format)

        # HIDE SUMMARY SHEET IF SCHEDULED PRICE LIST
        if schedule_date != 0:
            worksheet1.hide()

        # WORKSHEET PROTECTION
        worksheet1.protect("acwhitcher1234")
        worksheet2.protect("acwhitcher1234")
        worksheet3.protect("acwhitcher1234")
        worksheet4.protect("acwhitcher1234")
        worksheet5.protect("acwhitcher1234")
        worksheet6.protect("acwhitcher1234")
        worksheet7.protect("acwhitcher1234")

        # ADD SUMMARY HEADING FOR SUMMARY PAGE
        worksheet1.merge_range("A3:C3", "ORDER SUMMARY", color_format_unlocked)
        worksheet1.write_string("D3", "CUSTOMER NO:", order_format)
        worksheet1.write_string("E3", "-- Enter number here --", color_format_unlocked)

        # MESSAGE FOR CUSTOMER
        message = "   ** GLOBAL ORDER NUMBER **\n\nPlease enter the ORDER NUMBER on the summary tab."
        message_options = {
            "font_size": 11,
            "x_scale": 2,
            "y_scale": 1.5,
        }

        # HIDE ROWS THAT ARE ZERO
        if len(_038T_hidden_rows) > 0:
            for row_num in _038T_hidden_rows:
                worksheet2.set_row(row_num, None, None, {"hidden": True})

        if len(_038U_hidden_rows) > 0:
            for row_num in _038U_hidden_rows:
                worksheet3.set_row(row_num, None, None, {"hidden": True})

        if len(_050T_hidden_rows) > 0:
            for row_num in _050T_hidden_rows:
                worksheet4.set_row(row_num, None, None, {"hidden": True})

        if len(_050U_hidden_rows) > 0:
            for row_num in _050U_hidden_rows:
                worksheet5.set_row(row_num, None, None, {"hidden": True})

        if len(_076T_hidden_rows) > 0:
            for row_num in _076T_hidden_rows:
                worksheet6.set_row(row_num, None, None, {"hidden": True})

        if len(_076U_hidden_rows) > 0:
            for row_num in _076U_hidden_rows:
                worksheet7.set_row(row_num, None, None, {"hidden": True})

        # ADD FORMULA FOR CUSTOMER NUMBER IN PRODUCT SHEETS
        if schedule_date == 0:
            order_number_formula = '=IF(summary!E3="-- Enter number here --", "- - - - - - - -", summary!E3)'
            worksheet2.write(2, 7, order_number_formula, color_format_locked)
            worksheet2.write_comment("H3", message, message_options)

            worksheet3.write(2, 7, order_number_formula, color_format_locked)
            worksheet3.write_comment("H3", message, message_options)

            worksheet4.write(2, 7, order_number_formula, color_format_locked)
            worksheet4.write_comment("H3", message, message_options)

            worksheet5.write(2, 7, order_number_formula, color_format_locked)
            worksheet5.write_comment("H3", message, message_options)

            worksheet6.write(2, 7, order_number_formula, color_format_locked)
            worksheet6.write_comment("H3", message, message_options)

            worksheet7.write(2, 7, order_number_formula, color_format_locked)
            worksheet7.write_comment("H3", message, message_options)
        else:
            worksheet2.write_string("H3", f"{schedule_date}", color_format_locked)
            worksheet3.write_string("H3", f"{schedule_date}", color_format_locked)
            worksheet4.write_string("H3", f"{schedule_date}", color_format_locked)
            worksheet5.write_string("H3", f"{schedule_date}", color_format_locked)
            worksheet6.write_string("H3", f"{schedule_date}", color_format_locked)
            worksheet7.write_string("H3", f"{schedule_date}", color_format_locked)

        len_38T = np.arange(5, _038T_rownum + 5)
        for i in len_38T:
            worksheet2.write(f"G{i}", "", unlocked)

        len_38U = np.arange(5, _038U_rownum + 5)
        for i in len_38U:
            worksheet3.write(f"G{i}", "", unlocked)

        len_50T = np.arange(5, _050T_rownum + 5)
        for i in len_50T:
            worksheet4.write(f"G{i}", "", unlocked)

        len_50U = np.arange(5, _050U_rownum + 5)
        for i in len_50U:
            worksheet5.write(f"G{i}", "", unlocked)

        len_76T = np.arange(5, _076T_rownum + 5)
        for i in len_76T:
            worksheet6.write(f"G{i}", "", unlocked)

        len_76U = np.arange(5, _076U_rownum + 5)
        for i in len_76U:
            worksheet7.write(f"G{i}", "", unlocked)

    writer.save()
    print(server_path)
    if server_path == "none":
        pass
    else:
        try:
            shutil.copyfile(
                f"{directory}\\S5_{customer_number.strip()}.xlsx",
                f"{server_path}\\S5_{customer_number.strip()}.xlsx",
            )
        except:
            pass
    if multi_zip_path != "null":
        shutil.copyfile(
            f"{directory}\\S5_{customer_number.strip()}.xlsx",
            f"{multi_zip_path}\\S5_{customer_number.strip()}.xlsx",
        )
