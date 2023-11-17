# Copyright (c) 2023, ANC and contributors
# For license information, please see license.txt

import frappe
import json
from frappe.model.document import Document

@frappe.whitelist()
def save_raw_data(data):
	try:
		doc = frappe.new_doc('Raw Data')
		deserialize = json.loads(data)
		doc.rawdataid = deserialize.get('rawdataid')
		doc.data = deserialize.get('data')
		doc.datetime = deserialize.get('datetime')
		doc.sourceid = 6
		doc.sourcename = deserialize.get('sourcename')
		doc.status = deserialize.get('status')
		doc.save()  
		return {"status": "Success", "message": "Successfully saved the raw data record."}
	except Exception as e: 
		return {"status": "Error", "message": "Failed to save record.", "exception": e}
	
class Roll(Document):
	pass
