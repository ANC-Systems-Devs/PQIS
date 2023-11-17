# Copyright (c) 2023, ANC and contributors
# For license information, please see license.txt

import frappe
import json
from frappe.model.document import Document


@frappe.whitelist()
def auto_increment_id():
	try:
		doc = frappe.db.count('Process Measurement')
		count = doc + 1

		return {"status": "Success", "result": "{}{}".format("PSM0", count)}
	except Exception as e: 
		return {"status": "Error", "message": "Failed to save record.", "exception": e}
	
@frappe.whitelist()
def save_raw_data(data):
	try:
		doc = frappe.new_doc('Raw Data')
		deserialize = json.loads(data)
		doc.rawdataid = deserialize.get('rawdataid')
		doc.data = deserialize.get('data')
		doc.datetime = deserialize.get('datetime')
		doc.sourceid = 7
		doc.sourcename = deserialize.get('sourcename')
		doc.status = deserialize.get('status')
		doc.save()  
		return {"status": "Success", "message": "Successfully saved the raw data record."}
	except Exception as e: 
		return {"status": "Error", "message": "Failed to save record.", "exception": e}

@frappe.whitelist()
def fetch_processspec_for_color(data):
	try:
		deserialize = json.loads(data)
		doc = frappe.db.get_value('Process Specs', deserialize, 'name')

		# child table
		docChild = frappe.db.get_all('Process Spec Details',
						filters = { 'parent': doc, 'active': 1 },
						fields = ['name', 'subprocessid', 'propertyid', 'lc', 'll', 'tgt', 'hl', 'hc']
						)
		return {"status": "Success", "message": docChild}
	except Exception as e: 
		return {"status": "Error", "message": "Failed to save record.", "exception": e}

@frappe.whitelist()
def fetch_processspec(data, firstDate, secondDate):
	try:
		deserialize = json.loads(data)
		doc = frappe.db.get_value('Process Specs', deserialize, 'name')
		
		# child table
		docChild = frappe.db.get_all('Process Spec Details',
						filters = { 'parent': doc, 'active': 1 },
						fields = ['name', 'subprocessid', 'subprocess', 'propertyid', 'property_name', 'tag', 'units']
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
							fields = ['subprocessid', 'propertyid', 'value']
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
							fields = ['subprocessid', 'propertyid', 'value']
							)
		
		return {"status": "Success", "message": docChild, "result": count, "firstprev": prevChild, "secondprev": prev2ndChild}
	except Exception as e: 
		return {"status": "Error", "message": "Failed to save record.", "exception": e}
	
@frappe.whitelist()
def update_psm_parent_child_id(parentId, data):
	try:
		doc = frappe.db.set_value('Process Measurement', parentId, 'processmeasurementid', parentId, update_modified=False)

		# child table
		deserialize = json.loads(data)
		for d in deserialize:
			frappe.db.set_value('Process Measurement Detail', d.get('name'), 'processmeasurementdtlid', d.get('name'), update_modified=False)
		
		return {"status": "Success"}
	except Exception as e: 
		return {"status": "Error", "message": "Failed to save record.", "exception": e}

class ProcessMeasurement(Document):
	pass
