import frappe
from frappe.utils import get_datetime
from datetime import datetime, timedelta
from pytz import timezone

def all_mst():
    # Get the current datetime in UTC
    utc_now = datetime.now()

    # Specify the target timezones
    target_timezone = timezone('America/Denver')  # MST timezone

    # Convert the UTC datetime to the target timezone
    localized_time = utc_now.astimezone(target_timezone)

    # Format the localized time and convert to datetime
    formatted_time = get_datetime(localized_time.strftime('%Y-%m-%d %H:%M:%S'))

    documents = frappe.get_list("Process Measurement", 
                               filters={"workflow_state_psm": "Entered"},
                               fields=['name', 'datecreated']
                              )
    
    for doc in documents:
        creation_time = doc.get("datecreated")
        time_difference = formatted_time - creation_time
        if time_difference >= timedelta(hours=24):
            frappe.set_value("Process Measurement", doc.get("name"), "cannot_edit", 1)