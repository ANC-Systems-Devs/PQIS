# Copyright (c) 2023, ANC and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
import frappe
import json
from frappe import whitelist
import requests

class RawData(Document):
	pass

@frappe.whitelist()
def post_to_esb(data):
	#URL to ESB location
    #url = "http://10.12.60.175:50102/ESBTEST"
    # url = "http://10.12.60.175:51002/neuronesb/api/v1/runtime"
    url = "http://10.12.60.92:50104/ESBPROD"
    #data needed to be sent
    data =json.dumps({
        'name':'RawData',
		'Data':str(data)
	})
    #sending the data to the esb
    return requests.post(url, json=data)
