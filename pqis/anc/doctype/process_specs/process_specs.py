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
                FROM `process_specs_id_seq`
                """)

		number = doc[0][0]
		formatted = f'PRCSP{number:04d}'

		return {"status": "Success", "message": formatted}
	except Exception as e: 
		return {"status": "Error", "message": "Failed to fetch record.", "exception": e}

@frappe.whitelist()
def auto_increment_child_id(data):
	try:
		doc = frappe.db.count('Process Spec Details')
		deserialize = json.loads(data)
		count = len(deserialize) + doc
		formatted = f'PRCSPDTL{count:04d}'

		return {"status": "Success", "result": formatted}
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
			docChild = frappe.db.sql("""
                SELECT
                    next_not_cached_value
                FROM `process_spec_details_id_seq`
                """)

			number = docChild[0][0]
			formatted = f'PRCSPDTL{number:04d}'

			return {"status": "Success", "message": doc, "result": formatted}
	except Exception as e: 
		return {"status": "Error", "message": "Failed to save record.", "exception": e}
		
class ProcessSpecs(Document):
	pass
