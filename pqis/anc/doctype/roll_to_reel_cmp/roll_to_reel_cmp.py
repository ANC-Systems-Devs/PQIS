# Copyright (c) 2025, ANC and contributors
# For license information, please see license.txt

import frappe
import requests
import xml.etree.ElementTree as ET
from frappe.model.document import Document
from datetime import datetime, timedelta
from frappe.utils import get_datetime, now_datetime, add_days, format_datetime
import pandas as pd
import numpy as np
import jinja2
import pdfkit
import os
from weasyprint import HTML
import pyodbc
from typing import List, Dict

from decimal import Decimal


class RolltoReelCMP(Document):
	def validate(self):
		if self.is_new():
			if (self.start_time and self.turnup_time):
				# frappe.msgprint(f"Start time: {self.start_time} and turnup time: {self.turnup_time}")

				mops_value = get_MOPS_data(
					starttime= self.start_time.strftime("%m-%d-%Y %H:%M:%S"),
					turnuptime= self.turnup_time.strftime("%m-%d-%Y %H:%M:%S")
				)
				
				if mops_value is not None and mops_value != self.reel_bwt:
					frappe.msgprint(f"Mops Value: {mops_value}")
					self.reel_bwt = float(mops_value)
				else:
					frappe.msgprint(("VALUE NOT UPDATED"))
		else:
			old_doc = self.get_doc_before_save()
			if old_doc:
				# frappe.msgprint(f"Old Start: {old_doc.start_time}, Old Turnup: {old_doc.turnup_time}")
				# frappe.msgprint(f"Current Start: {self.start_time}, Current Turnup: {self.turnup_time}")
				if (self.start_time and self.turnup_time and (
					get_datetime(self.start_time) != get_datetime(old_doc.start_time) or 
					get_datetime(self.turnup_time) != get_datetime(old_doc.turnup_time
				))):
					frappe.msgprint(f"Start time: {self.start_time} and turnup time: {self.turnup_time}")

					mops_value = get_MOPS_data(
						starttime= self.start_time.strftime("%m-%d-%Y %H:%M:%S"),
						turnuptime= self.turnup_time.strftime("%m-%d-%Y %H:%M:%S")
					)

					if mops_value is not None and mops_value != self.reel_bwt:
						frappe.msgprint(f"Mops Value: {mops_value}")
						self.reel_bwt = float(mops_value)
						self.roll_sub_reel = float(self.roll_bwt or 0) - float(mops_value)
					else:
						frappe.msgprint(("VALUE NOT UPDATED"))
	
	def on_update(self):
		# frappe.msgprint("UPDATED")
		roll_value = float(self.roll_bwt)
		reel_value = float(self.reel_bwt)
		roll_sub_reel = roll_value - reel_value
		self.roll_sub_reel = roll_sub_reel
		frappe.db.set_value("Roll to Reel CMP", self.reel, "roll_sub_reel", roll_sub_reel)

@frappe.whitelist()
def get_MOPS_data(starttime, turnuptime):
	url = "http://10.12.60.77:5000/api/MopsHIstoryOne"
	headers = {
		"Content-Type": "application/json"
	}

	body = {
		"TagName": "761AI362WTAVG",
		"start": starttime,
		"end": turnuptime,
		"numValues": "1",
		"interpolationMethod": "Aggregate",
		"aggregateType": "PointAverage"
	}

	try:
		res = requests.post(url, json=body, headers=headers)
		if res.status_code == 200:
			root = ET.fromstring(res.text)
			value = root.find(".//Value").text
			return value
		else:
			frappe.msgprint(f"Failed to get a successful response")

	except Exception as e:
		print(f"An error occureed while API call: {e}")
		frappe.msgprint(f"An error occureed while API call: {str(e)}")



@frappe.whitelist()
def generate_report():
	reels = frappe.db.get_list("Roll to Reel CMP", pluck = "name")
	column = ["Tappi", "Accuray Reel BWT Average", "Roll BWT Average", "Roll - Reel"]
	df = pd.DataFrame(columns=column)
	
	for reel in reels:
		reel_detail = frappe.db.get_value("Roll to Reel CMP", reel, ["reel_bwt", "roll_bwt", "roll_sub_reel"], as_dict = 1)
		row = {
			"Tappi": reel,
			"Accuray Reel BWT Average": reel_detail["reel_bwt"],
			"Roll BWT Average": reel_detail["roll_bwt"],
			"Roll - Reel": reel_detail["roll_sub_reel"]
		}
		df = pd.concat([df, pd.DataFrame(row, index=[0])], ignore_index=True)
	
	df["Accuray Reel BWT Average"] = df["Accuray Reel BWT Average"].apply(pd.to_numeric)
	df["Roll BWT Average"] = df["Roll BWT Average"].apply(pd.to_numeric)
	df["Roll - Reel"] = df["Roll - Reel"].apply(pd.to_numeric)
	df = df.replace(np.nan,"",regex=True)
	df = df.replace("NaT","",regex=True)

	header_df = pd.DataFrame(columns=column)
	headers = {
		"Tappi": "Tappi",
		"Accuray Reel BWT Average": "Accuray Reel BWT Average",
		"Roll BWT Average": "Roll BWT Average",
		"Roll - Reel": "Roll - Reel"
	}
	header_df = pd.concat([header_df, pd.DataFrame(headers, index=[0])], ignore_index=True)
	final_df = pd.concat([header_df, df], ignore_index=True)
	return final_df.to_json(orient="index")




@frappe.whitelist()
def update_roll_bwt(report_query=False):
	reels = frappe.db.get_list("Roll to Reel CMP", fields=["reel", "roll_bwt", "start_time"])
	cursor = connect_db()

	if not cursor:
		frappe.msgprint("DB connection failed")
		return
	
	for reel in reels:
		reel_id = reel.reel
		start_time = get_datetime(reel.start_time)
		roll_bwt = float(reel.roll_bwt)
		reel_updated = False

		if report_query:
			if roll_bwt == 0:
				roll_bwt_avg = get_roll_data(cursor, reel_id, start_time)
				# frappe.db.set_value("Roll to Reel CMP", reel, "roll_bwt", round(roll_bwt_avg, 2))
				doc = frappe.get_doc("Roll to Reel CMP", reel_id)
				doc.roll_bwt = round(roll_bwt_avg, 2)
				doc.save(ignore_permissions=True)
				reel_updated = True

		if start_time >= add_days(now_datetime(), -2) and not reel_updated:
			roll_bwt_avg = get_roll_data(cursor, reel_id, start_time)
			# frappe.db.set_value("Roll to Reel CMP", reel, "roll_bwt", round(roll_bwt_avg, 2))

			doc = frappe.get_doc("Roll to Reel CMP", reel_id)
			doc.roll_bwt = round(roll_bwt_avg, 2)
			doc.save(ignore_permissions=True)				



		

@frappe.whitelist()
def generate_pdf_document(reel_id=None, start_date=None, end_date=None):
	script_dir = os.path.dirname(os.path.abspath(__file__))
	template_loader = jinja2.FileSystemLoader(searchpath=script_dir)
	template_env = jinja2.Environment(loader=template_loader)
	template = template_env.get_template("template.html")
	 
	filters = []

	# add all the filters based on reel_id, start_date, end_date
	if reel_id:
		filters.append(["reel", "=", reel_id])
	if start_date and end_date:
		start_date += " 07:00:00"
		end_date += " 07:00:00"
		filters.append(["start_time", ">=", start_date])
		filters.append(["start_time", "<=", end_date])
	elif start_date:
		end_date += " 07:00:00"
		filters.append(["start_time", ">=", start_date])
	elif end_date:
		end_date += " 07:00:00"
		filters.append(["start_time", "<=", end_date])
	
	reels = frappe.db.get_list("Roll to Reel CMP", fields = ["reel", "reel_bwt", "roll_bwt", "roll_sub_reel", "grade_code"], filters=filters)

	if not reels:
		frappe.throw("No data found for the given filters.")
	
	# update the roll bwt before fetching reel data
	update_roll_bwt(report_query=True)
	reels = frappe.db.get_list("Roll to Reel CMP", fields = ["reel", "reel_bwt", "roll_bwt", "roll_sub_reel", "grade_code"], filters=filters, order_by="reel asc")

	count = len(reels)
	total_reel = 0
	total_roll = 0
	total_diff = 0
	for reel in reels:
		total_reel += float(reel.reel_bwt)
		total_roll += float(reel.roll_bwt)
		total_diff += float(reel.roll_sub_reel)
	
	context = {
		"reels": reels,
		"average_reel": (total_reel/count),
		"average_roll": (total_roll/count),
		"average_diff": (total_diff/count),
	}

	html_out = template.render(context)

	# Render PDF
	pdf = HTML(string=html_out, base_url=script_dir).write_pdf()

	# Save to Frappe file system or return as download
	file_path = os.path.join(frappe.get_site_path("public", "files"), "roll_to_reel_report.pdf")
	with open(file_path, "wb") as f:
		f.write(pdf)

	return {
		"filters": filters,
		"file_url": f"/files/roll_to_reel_report.pdf",
		"message": "PDF generated successfully"
	}



def connect_db():
	try:
		conn = pyodbc.connect(
			'DRIVER={ODBC Driver 17 for SQL Server};'
			'SERVER=10.13.20.10;'
			'DATABASE=TM_DB_PRODUCTION;'
			'UID=sa;'
			'PWD=!LJf22@*'
		)

		cursor = conn.cursor()
		return cursor
	except Exception as e:
		print("Database connection failed: ", e)
		return None


def safe_convert(value):
    if isinstance(value, datetime):
        return value.strftime("%Y-%m-%d %H:%M:%S")
    elif isinstance(value, Decimal):
        return float(value)
    else:
        return value


def get_roll_data(cursor, reel_id, start_time):

	# start_time_dt = datetime.strptime(start_time, "%Y-%m-%d %H:%M:%S")
	to_date = start_time + timedelta(days=2)
	to_date_str = to_date.strftime("%Y-%m-%d")
	start_time_date = start_time.strftime("%Y-%m-%d")

	params = [start_time_date, to_date_str]
	if reel_id:
		params.append(reel_id)
	params = tuple(params)

	query = """
		SET NOCOUNT ON;
		EXEC [tm].[TMEXP_RollBasisWeight] @from = ?, @to = ?, @reel_no = ?;
	"""
	
	cursor.execute(query, params)

	rows = cursor.fetchall()
	
	total_rolls = len(rows)
	roll_sum = 0

	# print("Result:")
	for row in rows:
		# safe_row = [safe_convert(v) for v in row]

		# with open(os.path.join(os.path.dirname(__file__), "roll_data_log.txt"), "a") as logger:
		# 	logger.write(f"Row: {safe_row}\n")
		if row[3]:
			roll_sum += row[3]
		else:
			roll_sum += 0
		# print(row)
	
	if roll_sum == 0 and total_rolls == 0:
		return 0

	roll_bwt_average = roll_sum/total_rolls

	return roll_bwt_average

MOPS_BASE = "http://10.12.60.77:5000"
# TAG_NAME  = "ANCROLLREELBWTDIFF"
TAG_NAME  = "ANCROLLREELBWTDIFF-TEST"
@frappe.whitelist()
def updateMops(start: str, end: str):
	"""
    Client passes start/end as 'YYYY-MM-DD HH:mm:ss' (user tz).
    We parse and use them directly for filtering.
    """

	filters = []
	if start:
        # validate/normalize; we still pass the same string/dt into the filter
		start_dt = get_datetime(start)
		filters.append(["turnup_time", ">=", start_dt])
		
	if end:
		end_dt = get_datetime(end)
		filters.append(["turnup_time", "<=", end_dt])


	# fetch the reels with the given filters
	reels = frappe.db.get_list(
		"Roll to Reel CMP", 
		fields = ["reel", "reel_bwt", "roll_bwt", "turnup_time"],
		filters=filters
		)
	
	# write to mops for the reels with the roll_bwt - reel_bwt value
	# into the tag ANCROLLREELBWTDIFF
	# TimeStamp = turnup_time

	payload: List[Dict] = []
	skipped: List[Dict] = []

	for r in reels:
		reel_bwt = r.get("reel_bwt")
		roll_bwt = r.get("roll_bwt") or 0
		ts       = r.get("turnup_time")

		if reel_bwt is None or roll_bwt is None or ts is None:
			skipped.append({
				"name": r.get("name"),
				"reason": "Missing reel_bwt/roll_bwt/turnup_time",
				"reel_bwt": reel_bwt, "roll_bwt": roll_bwt, "turnup_time": ts
			})
			continue

		# calculate roll_bwt - reel_bwt
		try:
			diff = float(roll_bwt) - float(reel_bwt)
		except Exception:
			skipped.append({
				"name": r.get("name"),
				"reason": "Non-numeric bwt",
				"reel_bwt": reel_bwt, "roll_bwt": roll_bwt
			})
			continue
		
		# Use expected MOPS timestamp format: MM-DD-YYYY HH:MM:SS
		ts_str = get_datetime(ts).strftime("%m-%d-%Y %H:%M:%S")
		payload.append({
        	"TagName": TAG_NAME,
        	"DoubleValue": diff,
        	"TimeStamp": ts_str
		})


	attempted = len(reels)
	to_send   = len(payload)

	# -------- POST to MOPS ----------
	sent = 0
	errors: List[str] = []

	headers = {"Content-Type": "application/json"}
	try:
		if to_send == 0:
			pass  # nothing to send
		elif to_send == 1:
			# WriteOne
			url = f"{MOPS_BASE}/api/MopsWriteOne"
			resp = requests.post(url, headers=headers, json=payload[0])
			if resp.ok:
				sent = 1
			else:
				errors.append(f"WriteOne HTTP {resp.status_code}: {resp.text}")
		else:
			# WriteMany, chunk if you want (example: batches of 500)
			url = f"{MOPS_BASE}/api/MopsWriteMany"
			batch_size = 500
			for i in range(0, to_send, batch_size):
				batch = payload[i:i+batch_size]
				resp = requests.post(url, headers=headers, json=batch)
				if resp.ok:
					sent += len(batch)
				else:
					errors.append(f"WriteMany HTTP {resp.status_code} at batch {i}-{i+len(batch)-1}: {resp.text}")
	except Exception as e:
		# Log and bubble a summarized error up in the response (but do not raise to the client)
		frappe.log_error(frappe.get_traceback(), "MOPS write failed")
		errors.append(f"Exception while writing to MOPS: {e}")





	return {
		"attempted": attempted,       # rows fetched in window
		"prepared": to_send,          # rows we created payloads for
		"sent": sent,                 # rows successfully POSTed
		"skipped": skipped,           # rows skipped with reasons
		"errors": errors              # any HTTP/exception errors
	}
	
