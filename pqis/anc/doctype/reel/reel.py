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
		doc.sourceid = 5
		doc.sourcename = deserialize.get('sourcename')
		doc.status = deserialize.get('status')
		doc.save()  
		return {"status": "Success", "message": "Successfully saved the raw data record."}
	except Exception as e: 
		return {"status": "Error", "message": "Failed to save record.", "exception": e}
	
class Reel(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		buildstatus: DF.Literal['Pending', 'Complete']
		gradecode: DF.Link | None
		gradecodedesc: DF.Data | None
		name: DF.Int | None
		reelid: DF.Data
		starttime: DF.Datetime
		turnuptime: DF.Datetime | None
	# end: auto-generated types
	pass
