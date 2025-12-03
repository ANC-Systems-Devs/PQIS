# Copyright (c) 2023, ANC and contributors
# For license information, please see license.txt

import frappe
import json
from frappe.model.document import Document
import requests
import pyodbc

from datetime import datetime, timedelta  
@frappe.whitelist()
def auto_increment_id():
	try:
		doc = frappe.db.sql("""
                SELECT
                    next_not_cached_value
                FROM `process_measurement_id_seq`
                """)

		number = doc[0][0]
		formatted = f'PRCM{number:04d}'

		return {"status": "Success", "message": formatted}
	except Exception as e: 
		return {"status": "Error", "message": "Failed to fetch record.", "exception": e}
	
@frappe.whitelist()
def fetch_processspec_for_color(data):
	try:
		deserialize = json.loads(data)
		doc = frappe.db.get_value('Process Specs', deserialize, 'name')

		# child table
		docChild = frappe.db.get_all('Process Spec Details',
						filters = { 'parent': doc, 'active': 1 },
						fields = ['name', 'subprocessid', 'propertyid', 'lr', 'lc', 'll', 'tgt', 'hl', 'hc', 'hr']
						)
		return {"status": "Success", "message": docChild}
	except Exception as e: 
		return {"status": "Error", "message": "Failed to save record.", "exception": e}

@frappe.whitelist()
def fetch_processspec(data, firstDate, secondDate):
	try:
		# Converts the incoming JSON string into a Python dictionary
		deserialize = json.loads(data)
		doc = frappe.db.get_value('Process Specs', deserialize, 'name')
		docParent = frappe.db.get_value('Process Specs', deserialize, ['name', 'areaid', 'processid'])
		
		# child table
		docChild = frappe.db.get_all('Process Spec Details',
						filters = { 'parent': doc, 'active': 1 },
						fields = ['name', 'subprocessid', 'subprocess', 'propertyid', 'property_name', 'tag', 'units', 'measureid' , 'measurename', 'seq', 'startdate', 'starttime', 'enddate', 'endtime'],
						order_by='seq asc',
						)

		# count child list
		docChildCount = frappe.db.count('Process Measurement Detail')
		count = docChildCount + 1

		# previous value
		firstLoad = json.loads(firstDate)
		prevParent = frappe.db.get_all('Process Measurement',
						filters = firstLoad,
						fields = ['name', 'modified', 'date'],
						order_by='modified desc',
						)
		
		if len(prevParent) == 0:
			prevChild = []
		else:
			prevChild = frappe.db.get_all('Process Measurement Detail',
							filters = { 'parent': prevParent[0].get('name') },
							fields = ['subprocessid', 'propertyid', 'value', 'is_null']
							)
		
		# previous 2nd value
		secondLoad = json.loads(secondDate)
		prev2ndParent = frappe.db.get_all('Process Measurement',
						filters = secondLoad,
						fields = ['name', 'modified', 'date'],
						order_by='modified desc',
						)
		
		if len(prev2ndParent) == 0:
			prev2ndChild = []
		else:
			prev2ndChild = frappe.db.get_all('Process Measurement Detail',
							filters = { 'parent': prev2ndParent[0].get('name') },
							fields = ['subprocessid', 'propertyid', 'value', 'is_null']
							)
		
		return {"status": "Success", "parent": docParent, "message": docChild, "result": count, "firstprev": prevChild, "secondprev": prev2ndChild}
	except Exception as e: 
		return {"status": "Error", "message": "Failed to save record.", "exception": e}
	
class ProcessMeasurement(Document):
	pass
@frappe.whitelist()
def generate_post_to_esb(name, date, process_measurement_details):
	#URL to ESB location
	# url = "http://10.12.60.92:50104/ESBPROD"
	url = "http://10.12.60.175:50102/ESBTEST"

	if(int(name) < 100):
		formatted_name = "PRMC00" + name
	else:
		formatted_name = "PRMC0" + name
	
	#data needed to be sent
	data = {
		"name":formatted_name,
		"date":date,
		"process_measurement_details":json.loads(process_measurement_details)
	}

	headers = {
        'Content-Type': 'application/json'
    }
	try:
		response = requests.post(url, headers=headers, json=data, timeout=5)
		if response.status_code != 200 and response.status_code != 202:
			raise Exception("Unsuccessful post")
		else:
			doc = frappe.get_doc({
				"doctype": "Message Queue",
				"url": url,
				"status": "Sent",
				"original_doctype": "Process Measurement",
				"error_time": datetime.now(),
				"header": headers,
				"message": data
			})
			doc.insert()
			frappe.db.set_value("Message Queue", doc.name, "original_name", name)
		return response.text
	except Exception as e:
		doc = frappe.get_doc({
			"doctype": "Message Queue",
			"url": url,
			"original_doctype": "Process Measurement",
			"error_time": datetime.now(),
			"header": headers,
			"message": data
		})
		doc.insert()
		frappe.db.set_value("Message Queue", doc.name, "original_name", name)
		return str(e)

# connect to testdb
def connect_db():
	conn, cursor = connect_db()
	try:
		cursor.execute(
			'DRIVER={ODBC Driver 17 for SQL Server};'
            'SERVER=dev-dw-v01.ad.altanewsprint.ca;'
            'DATABASE=AdventureWorksDW2022(MS Test DB);'
            'UID=neuron;'
            'PWD=a1bert@123456;'
		)
		# Make the rows JSON-serializable
		columns = [col[0] for col in cursor.description]
		data = [dict(zip(columns, row)) for row in cursor.fetchall()]

		return {"status": "ok", "rows": data}
	except Exception as e:
		frappe.throw(f"Database connection failed: {str(e)}")


@frappe.whitelist()
def sendMissingDataToESB(from_date, to_date):
	"""
    Called from listview button.
    Fetch Process Measurement docs between from_date and to_date (inclusive),
    build payloads, and send them to ESB using generateposttoesb().
    """

	# Fetch submitted records in the date range (adjust filters as needed)
	pm_docs = frappe.get_all(
        "Process Measurement",
        filters={
            "date": ["between", [from_date, to_date]],
            "docstatus": 1,  # submitted only
        },
        fields=["name", "date"],
        order_by="date asc, name asc",
    )

	if not pm_docs:
		return f"No Process Measurement records found between {from_date} and {to_date}."


	sent_count = 0
	error_count = 0

	for pm in pm_docs:
		pm_name = str(pm["name"])       # numeric string, e.g. "6220"
		pm_date = str(pm["date"])       # "2025-11-06"

		# Fetch child rows
		details = frappe.get_all(
			"Process Measurement Detail",
			filters={
				"parent": pm_name,
				"parenttype": "Process Measurement",
			},
			fields=["time", "tag", "value"],
			order_by="idx asc",
		)

		if not details:
            # nothing to send for this PM
			continue

        # Build the detail list in the format ESB expects
		detail_list = []

		for d in details:
			raw_time = d.get("time")
			# Convert timedelta/time to string "HH:MM:SS"
			if isinstance(raw_time, timedelta):
				time_str = str(raw_time)          # e.g. '07:30:51'
			else:
				time_str = raw_time or ""         # cover None/empty

			tag = d.get("tag") or ""

			value_raw = d.get("value")
			# ESB expects value as STRING
			value_str = "" if value_raw is None else str(value_raw)

			detail_list.append(
				{
					"time": time_str,
					"tag": tag,
					"value": value_str,
				}
			)

		
		# Convert detail list to JSON string for generate_post_to_esb
		detail_json = json.dumps(detail_list)

		try:
			# This will:
			#  - format name as PRMC00xx / PRMC0xxxx
			#  - build final data dict
			#  - POST to ESB
			#  - log Message Queue entry
			res = generate_post_to_esb(pm_name, pm_date, detail_json)
			sent_count += 1
		except Exception:
			error_count += 1
			frappe.log_error(frappe.get_traceback(), "sendMissingDataToESB error")

	msg = (
        f"Attempted to send {len(pm_docs)} Process Measurement record(s) "
        f"between {from_date} and {to_date}.<br>"
        f"Successfully called ESB for {sent_count} record(s)."
    )

	if error_count:
		msg += f"<br>{error_count} record(s) raised errors. Check Error Logs for details."

	return msg


# writes to the DW when a PM entry is made 
@frappe.whitelist()
def transferDataFromFrappeToDW():
	try:
		frappe.logger().info("Connecting to SQL Server...")
		conn = pyodbc.connect(
            'DRIVER={ODBC Driver 17 for SQL Server};'
            'SERVER=dev-dw-v01.ad.altanewsprint.ca;'
            'DATABASE=AdventureWorksDW2022(MS Test DB);'
            'UID=neuron;'
            'PWD=a1bert@123456;'
        )
		cursor = conn.cursor()
		cursor.execute("""
            SELECT TOP (100)
                [CurrencyKey],
                [CurrencyAlternateKey],
                [CurrencyName]
            FROM [AdventureWorksDW2022(MS Test DB)].[dbo].[DimCurrency];
        """)
		columns = [col[0] for col in cursor.description]
		data = [dict(zip(columns, row)) for row in cursor.fetchall()]
		return {"message": data}
	except Exception as e:
		print("❌ Connection failed:")
		print(e)
	finally:
		cursor.close()
		conn.close()
