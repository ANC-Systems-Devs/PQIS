# Copyright (c) 2023, ANC and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

@frappe.whitelist()
def auto_increment_id():
	try:
		doc = frappe.db.count('Area')
		count = doc + 1

		return {"status": "Success", "result": "{}{}".format("A0", count)}
	except Exception as e: 
		return {"status": "Error", "message": "Failed to save record.", "exception": e}
	
class Area(Document):
	pass
