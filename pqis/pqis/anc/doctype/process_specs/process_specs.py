# Copyright (c) 2023, ANC and contributors
# For license information, please see license.txt

import frappe
import json
from frappe.model.document import Document

@frappe.whitelist()
def auto_increment_id():
	try:
		doc = frappe.db.count('Process Specs')
		count = doc + 1

		return {"status": "Success", "result": "{}{}".format("PSSP0", count)}
	except Exception as e: 
		return {"status": "Error", "message": "Failed to save record.", "exception": e}

@frappe.whitelist()
def auto_increment_child_id(data):
	try:
		doc = frappe.db.count('Process Spec Details')
		deserialize = json.loads(data)
		count = len(deserialize) + doc

		return {"status": "Success", "result": count}
	except Exception as e: 
		return {"status": "Error", "message": "Failed to save record.", "exception": e}
	
@frappe.whitelist()
def fetch_psdtl(data):
	try:
		deserialize = json.loads(data)
		doc = frappe.db.get_all('Process Spec Details',
						filters = deserialize,
						fields = ['name', 'creation', 'modified', 'modified_by', 'owner', 'docstatus', 'idx', 'propertyid', 'property_name', 'time', 'target', 'parent', 'parentfield', 'parenttype', 'area', 'process_id', 'subprocess', 'units', 'prsdtl_date', 'processspecid']
						)
		return {"status": "Success", "message": doc}
	except Exception as e: 
		return {"status": "Error", "message": "Failed to save record.", "exception": e}

@frappe.whitelist()
def fetch_psdtl_subprocess(dupdata, data):
	try:
		# check if exist
		dupDeserialize = json.loads(dupdata)
		ifExist = frappe.db.exists("Process Specs", dupDeserialize)

		if ifExist != None:
			processSpecID = frappe.db.get_value('Process Specs', dupDeserialize, 'processspecid')

			return {"status": "Duplicate", "id": processSpecID}
		else:
			deserialize = json.loads(data)
			doc = frappe.db.get_all('Sub Process',
							filters = deserialize,
							fields = ['name', 'subprocessid', 'description']
							)
			
			# count child list
			docChildCount = frappe.db.count('Process Spec Details')
			count = docChildCount + 1

			return {"status": "Success", "message": doc, "result": count}
	except Exception as e: 
		return {"status": "Error", "message": "Failed to save record.", "exception": e}
	
@frappe.whitelist()
def save_psdtl(parent, data):
	try:
		frappe.db.delete("Process Spec Details", { "parent": parent })

		deserialize = json.loads(data)
		for d in deserialize:
			doc = frappe.new_doc('Process Spec Details')
			doc.propertyid = d.get('propertyid')
			doc.property_name = d.get('property_name')
			doc.time = d.get('time')
			doc.target = d.get('target')
			doc.parent = parent
			doc.parentfield = d.get('parentfield')
			doc.parenttype = d.get('parenttype')
			doc.area = d.get('area')
			doc.process_id = d.get('process_id')
			doc.subprocess = d.get('subprocess')
			doc.units = d.get('units')
			doc.prsdtl_date = d.get('prsdtl_date')
			doc.processspecid = d.get('processspecid')
			doc.save()  
			
		return {"status": "Success", "message": deserialize}
	except Exception as e: 
		return {"status": "Error", "exception": e}
	
@frappe.whitelist()
def fetch_weekly_rpt(data):
	try:
		deserialize = json.loads(data)
		doc = frappe.db.get_all('Process Spec Details',
						filters= deserialize,
						fields = ['property_name', "units", 'prsdtl_date', 'time', "target"]
						)
		return {"status": "Success", "message": doc}
	except Exception as e: 
		return {"status": "Error", "message": "Failed to save record.", "exception": e}
	
class ProcessSpecs(Document):
	pass
