# Copyright (c) 2023, ANC and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
import frappe
import json
from datetime import datetime
import requests

class RawData(Document):
	pass

@frappe.whitelist()
def post_to_esb(data):
	#URL to ESB location
    #url = "http://10.12.60.175:50102/ESBTEST"
    # url = "http://10.12.60.175:51002/neuronesb/api/v1/runtime"
    url = "http://10.12.60.75:50104/ESBPROD"
    
    headers = {
        'Content-Type': 'application/json'
    }
    
    #data needed to be sent
    data =json.dumps({
        'name':'RawData',
		'Data':str(data)
	})
    #sending the data to the esb
    try:
        response = requests.post(url, headers=headers, json=data)
        if response.status_code != 200 and response.status_code != 202:
            raise Exception("Unsuccessful post")
        else:
            frappe.get_doc({
                "doctype": "Message Queue",
                "url": url,
                "status": "Sent",
                "original_doctype": "Raw Data",
                "error_time": datetime.now(),
                "header": headers,
                "message": data
            }).insert()
        return response.text
    except Exception as e:
        frappe.get_doc({
            "doctype": "Message Queue",
            "url": url,
            "original_doctype": "Raw Data",
            "error_time": datetime.now(),
            "header": headers,
            "message": data
        }).insert()
        return str(e)
