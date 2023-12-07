# Copyright (c) 2023, ANC and contributors
# For license information, please see license.txt

import frappe

def execute(filters=None):
	if not filters: 
		filters = {}

	columns, result = [], []

	columns = get_columns()
	result = fetch_psm_property_rpt(filters)
	
	if result == "Empty":
		return [], []
	elif not result:
		frappe.msgprint("No records found.")
		return columns, []
	else:
		return columns, result

def get_columns():
	return [
		{
            'fieldname': 'date',
            'label': 'Date',
            'fieldtype': 'Date',
			'width': 150
        }, {
            'fieldname': 'propertyid',
            'label': 'Property ID',
            'fieldtype': 'Data',
			'hidden': 1
        }, {
            'fieldname': 'property',
            'label': 'Property Name',
            'fieldtype': 'Data',
			'width': 200
        }, {
            'fieldname': 'tag',
            'label': 'Tag',
            'fieldtype': 'Data',
			'width': 150
        }, {
            'fieldname': 'units',
            'label': 'Units',
            'fieldtype': 'Data',
			'width': 100
        }, {
            'fieldname': 'value',
            'label': "Value",
            'fieldtype': 'Float'
        }, {
            'fieldname': 'nullstat',
            'label': "Is Null",
            'fieldtype': 'Int',
			'hidden': 1
        }
	]

def fetch_psm_property_rpt(filters):
    if filters.get('propertyid') is None:
        return "Empty"
    else:
        query = frappe.db.sql("""
                SELECT
                    tbl1.date as 'date',
                    tbl2.propertyid as 'propertyid',
                    tbl2.property as 'property',
                    tbl2.tag as 'tag',
                    tbl2.units as 'units',
                    tbl2.value AS 'value',
					tbl2.is_null AS 'nullstat'
                FROM `tabProcess Measurement` tbl1
                    LEFT JOIN `tabProcess Measurement Detail` tbl2
                    ON tbl1.name = tbl2.parent
                WHERE tbl1.date BETWEEN %(datefrm)s AND %(dateto)s
                AND tbl2.propertyid = %(propertyid)s
                ORDER BY tbl1.date, tbl2.property ASC
                """, values=filters)

        return query