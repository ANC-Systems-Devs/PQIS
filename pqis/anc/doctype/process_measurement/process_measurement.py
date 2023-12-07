# Copyright (c) 2023, ANC and contributors
# For license information, please see license.txt

import frappe
import json
from frappe.model.document import Document

@frappe.whitelist()
def auto_increment_id():
	try:
		doc = frappe.db.sql("""
                SELECT
                    next_not_cached_value
                FROM `process_measurement_id_seq`
                """)

		number = doc[0][0]
		formatted = f'PRCM{number:04d}'

		return {"status": "Success", "message": formatted}
	except Exception as e: 
		return {"status": "Error", "message": "Failed to fetch record.", "exception": e}
	
@frappe.whitelist()
def fetch_processspec_for_color(data):
	try:
		deserialize = json.loads(data)
		doc = frappe.db.get_value('Process Specs', deserialize, 'name')

		# child table
		docChild = frappe.db.get_all('Process Spec Details',
						filters = { 'parent': doc, 'active': 1 },
						fields = ['name', 'subprocessid', 'propertyid', 'lr', 'lc', 'll', 'tgt', 'hl', 'hc', 'hr']
						)
		return {"status": "Success", "message": docChild}
	except Exception as e: 
		return {"status": "Error", "message": "Failed to save record.", "exception": e}

@frappe.whitelist()
def fetch_processspec(data, firstDate, secondDate):
	try:
		deserialize = json.loads(data)
		doc = frappe.db.get_value('Process Specs', deserialize, 'name')
		docParent = frappe.db.get_value('Process Specs', deserialize, ['name', 'areaid', 'processid'])
		
		# child table
		docChild = frappe.db.get_all('Process Spec Details',
						filters = { 'parent': doc, 'active': 1 },
						fields = ['name', 'subprocessid', 'subprocess', 'propertyid', 'property_name', 'tag', 'units', 'measureid' , 'measurename', 'seq', 'startdate', 'starttime', 'enddate', 'endtime'],
						order_by='seq asc',
						)

		# count child list
		docChildCount = frappe.db.count('Process Measurement Detail')
		count = docChildCount + 1

		# previous value
		firstLoad = json.loads(firstDate)
		prevParent = frappe.db.get_all('Process Measurement',
						filters = firstLoad,
						fields = ['name', 'modified', 'date'],
						order_by='modified desc',
						)
		
		if len(prevParent) == 0:
			prevChild = []
		else:
			prevChild = frappe.db.get_all('Process Measurement Detail',
							filters = { 'parent': prevParent[0].get('name') },
							fields = ['subprocessid', 'propertyid', 'value', 'is_null']
							)
		
		# previous 2nd value
		secondLoad = json.loads(secondDate)
		prev2ndParent = frappe.db.get_all('Process Measurement',
						filters = secondLoad,
						fields = ['name', 'modified', 'date'],
						order_by='modified desc',
						)
		
		if len(prev2ndParent) == 0:
			prev2ndChild = []
		else:
			prev2ndChild = frappe.db.get_all('Process Measurement Detail',
							filters = { 'parent': prev2ndParent[0].get('name') },
							fields = ['subprocessid', 'propertyid', 'value', 'is_null']
							)
		
		return {"status": "Success", "parent": docParent, "message": docChild, "result": count, "firstprev": prevChild, "secondprev": prev2ndChild}
	except Exception as e: 
		return {"status": "Error", "message": "Failed to save record.", "exception": e}
	
class ProcessMeasurement(Document):
	pass
