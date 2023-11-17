# Copyright (c) 2023, ANC and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

@frappe.whitelist()
def getrole():
	try:
		return "Hi"
	except Exception as e: 
		return "Hello"

class Irene(Document):
	pass
