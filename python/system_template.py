import pandas as pd
import numpy as np
import xlsxwriter
import warnings
warnings.filterwarnings("ignore", 'This pattern has match groups')
warnings.filterwarnings("ignore", 'divide by zero encountered in true_divide')
warnings.filterwarnings("ignore", 'invalid value encountered in multiply')


# Template Function
def system_template_fn(customer_individual_reforms):
    '''Take template sample supplied by Jurgen and populate with customer pricing'''
    global time
    global pricing_key_array
    num_customers = int(len(customer_individual_reforms.keys()))

    # Read in sheets for template
    template_sample_item_pricing = pd.read_excel(
        '/DATA-A/Whitcher Docs/Pricing_Program/master_item_list/\
    price_template/price_template.xlsx',
        sheet_name='Item_Pricing')
    template_sample_price_list_tax_authorities = pd.read_excel(
        '/DATA-A/Whitcher Docs/Pricing_Program/master_item_list/\
    price_template/price_template.xlsx',
        sheet_name='Price_List_Tax_Authorities')
    template_sample_pricing_price_checks = pd.read_excel(
        '/DATA-A/Whitcher Docs/Pricing_Program/master_item_list/\
    price_template/price_template.xlsx',
        sheet_name='Pricing_Price_Checks')
    template_sample_pricing_details = pd.read_excel(
        '/DATA-A/Whitcher Docs/Pricing_Program/master_item_list/\
    price_template/price_template.xlsx',
        sheet_name='Item_Pricing_Details')

    # Make dir
    os.makedirs(
        f'/DATA-A/Whitcher Docs/Pricing_Program/master_item_list/generated_files/system_templates_{time}',
        exist_ok=True)
    folder = f'/DATA-A/Whitcher Docs/Pricing_Program/master_item_list/generated_files/system_templates_{time}/'
    IP_df = ''
    PLTA_df = ''
    PPC_df = ''
    PD_df = ''
    master_price_df = ''

    count = 0
    for key, customer_master in customer_individual_reforms.items():

        customer_master = customer_master.copy()
        customer_master.reset_index(inplace=True)

        # Item_Pricing
        IPcols = template_sample_item_pricing.columns
        IP = pd.DataFrame(index=np.arange(0, len(customer_master)),
                          columns=IPcols)
        IP.set_index(np.arange(0, len(customer_master)))
        IP['CURRENCY'] = 'ZAR'
        IP['ITEMNO'] = customer_master['itemno']
        IP['PRICELIST'] = customer_master['pricelist']
        IP['DESC'] = customer_master['desc']

        # Price_List_Tax_Authorities
        PLTAcols = template_sample_price_list_tax_authorities.columns
        PLTA = pd.DataFrame(index=np.arange(0, len(customer_master)),
                            columns=PLTAcols)
        PLTA.set_index(np.arange(0, len(customer_master)))
        PLTA['CURRENCY'] = pd.NA
        PLTA['ITEMNO'] = pd.NA
        PLTA['PRICELIST'] = pd.NA
        PLTA['AUTHORITY'] = pd.NA
        PLTA['TAXINCL'] = pd.NA
        PLTA['TAXCLASS'] = pd.NA
        PLTA['TXCLSDESC'] = pd.NA
        PLTA['TXAUTHDESC'] = pd.NA

        # Pricing_Price_Checks
        PPCcols = template_sample_pricing_price_checks.columns
        PPC = pd.DataFrame(index=np.arange(0, len(customer_master)),
                           columns=PPCcols)
        PPC.set_index(np.arange(0, len(customer_master)))
        PPC['CURRENCY'] = pd.NA
        PPC['ITEMNO'] = pd.NA
        PPC['PRICELIST'] = pd.NA
        PPC['UID'] = pd.NA
        PPC['EXISTS'] = pd.NA
        PPC['CGTPERCENT'] = pd.NA
        PPC['CLTPERCENT'] = pd.NA
        PPC['CGTAMOUNT'] = pd.NA
        PPC['CLTAMOUNT'] = pd.NA

        # Item_Pricing_Details
        PDcols = template_sample_pricing_details.columns
        PD = pd.DataFrame(index=np.arange(0, len(customer_master)),
                          columns=PDcols)
        PD.set_index(np.arange(0, len(customer_master)))
        PD['CURRENCY'] = 'ZAR'
        PD['ITEMNO'] = customer_master['itemno']
        PD['PRICELIST'] = customer_master['pricelist']
        PD['DPRICETYPE'] = 1
        PD['QTYUNIT'] = 'M3'
        PD['WEIGHTUNIT'] = pd.NA
        PD['UNITPRICE'] = customer_master['unitprice']

        if count == 0:
            IP_df = IP
            PLTA_df = PLTA
            PPC_df = PPC
            PD_df = PD
            customer_master_df = customer_master
        else:
            IP_df = pd.concat([IP_df, IP], axis=0, ignore_index=True)
            PLTA_df = pd.concat([PLTA_df, PLTA], axis=0, ignore_index=True)
            PPC_df = pd.concat([PPC_df, PPC], axis=0, ignore_index=True)
            PD_df = pd.concat([PD_df, PD], axis=0, ignore_index=True)
            customer_master_df = pd.concat(
                [customer_master_df, customer_master],
                axis=0,
                ignore_index=True)

        count += 1

    # Create Customer key_array
    def key_array_fn():

        key_temp = pd.DataFrame(index=np.arange(
            0, master_price.shape[0] * num_customers, 1),
                                columns=['cust', 'itemno', 'desc', 'p_ratio'])
        key_temp['itemno'] = PD_df['ITEMNO'].values
        key_temp['desc'] = IP_df['DESC'].values
        key_temp['cust'] = PD_df['PRICELIST'].values
        key_temp['p_ratio'] = 0

        try:
            key_temp['p_ratio'] = (PD_df['UNITPRICE'] /
                                   customer_master_df['unitprice']).fillna(0)
        except ZeroDivisionError as z:
            print(z)

        pickle.dump(
            master_price,
            open(
                f'/DATA-A/Whitcher Docs/Pricing_Program/master_item_list/pickled_files/{time}_pricing_key_array.p',
                'wb'))

    key_array_fn()

    with pd.ExcelWriter(f'{folder}/all_system_template_{time}.xlsx',
                        engine='xlsxwriter') as writer:

        IP_df.to_excel(writer,
                       sheet_name='Item_Pricing',
                       index=False,
                       startrow=1,
                       header=False)
        PLTA_df.to_excel(writer,
                         sheet_name='Price_List_Tax_Authorities',
                         index=False,
                         startrow=1,
                         header=False)
        PPC_df.to_excel(writer,
                        sheet_name='Pricing_Price_Checks',
                        index=False,
                        startrow=1,
                        header=False)
        PD_df.to_excel(writer,
                       sheet_name='Item_Pricing_Details',
                       index=False,
                       startrow=1,
                       header=False)

        # Define name of sheets
        workbook = writer.book
        workbook.define_name("Item_Pricing",
                             f'=Item_Pricing!$A$1:$K${IP_df.shape[0]}')
        workbook.define_name(
            "Price_List_Tax_Authorities",
            f'=Price_List_Tax_Authorities!$A$1:$K${PLTA_df.shape[0]}')
        workbook.define_name(
            "Pricing_Price_Checks",
            f'=Pricing_Price_Checks!$A$1:$K${PPC_df.shape[0]}')
        workbook.define_name(
            "Item_Pricing_Details",
            f'=Item_Pricing_Details!$A$1:$K${PD_df.shape[0]}')

        # Remove formatting on headers
        worksheet1 = writer.sheets['Item_Pricing']
        for col_num, value in enumerate(IP_df.columns):
            worksheet1.write(0, col_num, value)

        worksheet2 = writer.sheets['Price_List_Tax_Authorities']
        for col_num, value in enumerate(PLTA_df.columns):
            worksheet2.write(0, col_num, value)

        worksheet3 = writer.sheets['Pricing_Price_Checks']
        for col_num, value in enumerate(PPC_df.columns):
            worksheet3.write(0, col_num, value)

        worksheet4 = writer.sheets['Item_Pricing_Details']
        for col_num, value in enumerate(PD_df.columns):
            worksheet4.write(0, col_num, value)

        writer.save()