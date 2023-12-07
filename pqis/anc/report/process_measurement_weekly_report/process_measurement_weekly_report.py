# Copyright (c) 2023, ANC and contributors
# For license information, please see license.txt

import frappe
from frappe.utils import add_to_date

def execute(filters=None):
	if not filters: 
		filters = {}

	columns, result = [], []

	columns = get_columns(filters)
	result = fetch_psm_weekly_rpt(filters)
	
	if not result:
		frappe.msgprint("No records found.")
		return columns, []
	else :
		return columns, result

def get_columns(filters):
	date = filters.get('date')
	return [
		{
            'fieldname': 'areaid',
            'label': 'Area ID',
            'fieldtype': 'Data',
			'hidden': 1
        }, {
            'fieldname': 'area',
            'label': 'Area',
            'fieldtype': 'Data',
			'width': 150
        }, {
            'fieldname': 'processid',
            'label': 'Process ID',
            'fieldtype': 'Data',
			'hidden': 1
        }, {
            'fieldname': 'process',
            'label': 'Process',
            'fieldtype': 'Data',
			'width': 150
        }, {
            'fieldname': 'subprocessid',
            'label': 'Subprocess ID',
            'fieldtype': 'Data',
			'hidden': 1
        }, {
            'fieldname': 'subprocess',
            'label': 'SubProcess',
            'fieldtype': 'Data',
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
            'fieldname': 'isnull',
            'label': "isnull",
            'fieldtype': 'Date',
			'hidden': 1
        }, {
            'fieldname': 'week_start_date',
            'label': "Week Start Date ({})".format(date),
            'fieldtype': 'Float'
        }, {
            'fieldname': 'week_start_date_fst',
            'label': "Week Start Date-1 ({})".format(add_to_date(date, days=-1)),
            'fieldtype': 'Float'
        }, {
            'fieldname': 'week_start_date_snd',
            'label': "Week Start Date-2 ({})".format(add_to_date(date, days=-2)),
            'fieldtype': 'Float'
        }, {
            'fieldname': 'week_start_date_trd',
            'label': "Week Start Date-3 ({})".format(add_to_date(date, days=-3)),
            'fieldtype': 'Float'
        }, {
            'fieldname': 'week_start_date_frth',
            'label': "Week Start Date-4 ({})".format(add_to_date(date, days=-4)),
            'fieldtype': 'Float'
        }, {
            'fieldname': 'week_start_date_ffth',
            'label': "Week Start Date-5 ({})".format(add_to_date(date, days=-5)),
            'fieldtype': 'Float'
        }, {
            'fieldname': 'week_start_date_sxth',
            'label': "Week Start Date-6 ({})".format(add_to_date(date, days=-6)),
            'fieldtype': 'Float'
        }, {
            'fieldname': 'week_start_date_svnth',
            'label': "Week Start Date-7 ({})".format(add_to_date(date, days=-7)),
            'fieldtype': 'Float'
        }
	]

def fetch_psm_weekly_rpt(filters):
	date = filters.get('date')

	values = { 
		       "date": date, 
			   "fst_date": add_to_date(date, days=-1),
			   "snd_date": add_to_date(date, days=-2),
			   "trd_date": add_to_date(date, days=-3),
		       "frth_date": add_to_date(date, days=-4),
		       "ffth_date": add_to_date(date, days=-5),
		       "sxth_date": add_to_date(date, days=-6),
		       "svnth_date": add_to_date(date, days=-7) 
			 }
	

	query = frappe.db.sql("""
            SELECT
                tbl1.areaid as 'areaid',
                tbl1.desc as 'area',
                tbl1.processid as 'processid',
                tbl1.processdesc as 'process',
                tbl2.subprocessid as 'subprocessid',
                tbl2.subprocessdesc as 'subprocess',
                tbl2.propertyid as 'propertyid',
                tbl2.property as 'property',
                tbl2.tag as 'tag',
                tbl2.units as 'units',
			    tbl2.is_null as 'isnull',
                CASE WHEN tbl1.date = %(date)s THEN tbl2.value END AS 'week_start_date',
                CASE WHEN tbl1.date = %(fst_date)s THEN tbl2.value END AS 'week_start_date_fst',
                CASE WHEN tbl1.date = %(snd_date)s THEN tbl2.value END AS 'week_start_date_snd',
                CASE WHEN tbl1.date = %(trd_date)s THEN tbl2.value END AS 'week_start_date_trd',
                CASE WHEN tbl1.date = %(frth_date)s THEN tbl2.value END AS 'week_start_date_frth',
                CASE WHEN tbl1.date = %(ffth_date)s THEN tbl2.value END AS 'week_start_date_ffth',
                CASE WHEN tbl1.date = %(sxth_date)s THEN tbl2.value END AS 'week_start_date_sxth',
                CASE WHEN tbl1.date = %(svnth_date)s THEN tbl2.value END AS 'week_start_date_svnth'
            FROM `tabProcess Measurement` tbl1
                LEFT JOIN `tabProcess Measurement Detail` tbl2
                ON tbl1.name = tbl2.parent
    WHERE tbl1.date BETWEEN %(svnth_date)s AND %(date)s
    ORDER BY tbl1.desc, tbl1.processdesc, tbl2.subprocessdesc, tbl2.property ASC
	""", values=values)

	return query
