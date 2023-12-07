import frappe
from datetime import datetime, timedelta

def all():
    documents = frappe.get_list("Process Measurement", 
                               filters={"workflow_state_psm": "Entered"},
                               fields=['name', 'datecreated']
                              )
    
    for doc in documents:
        creation_time = doc.get("datecreated")
        time_difference = datetime.now() - creation_time
        if time_difference >= timedelta(hours=24):
            frappe.set_value("Process Measurement", doc.get("name"), "cannot_edit", 1)
