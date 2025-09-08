# Copyright (c) 2023, ANC and contributors
# For license information, please see license.txt

import frappe
from frappe import _ 
import requests
import json
from frappe.model.document import Document
from frappe.permissions import allow_everything
import os
import xml.etree.ElementTree as ET
import datetime
from frappe.utils import get_datetime, format_datetime, now_datetime
from frappe.utils.csvutils import build_csv_response
	
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

	def after_save(self):
		frappe.msgprint(f"Reel {self.reelid} has been saved.")
		
		# Check if buildstatus is 'Tested' and print a message
		if self.buildstatus == 'Tested':
			frappe.msgprint(f"Reel {self.reelid} has passed the testing phase.")


	def on_update(self):
		"""
			Handles the update process for the Reel object. It performs the following actions:

			- If the Reel is updated or created:
				- Displays a message indicating its update.
				- If the Reel's build status is 'Complete', it fetches properties from the 'DataHub' source, retrieves their values via an external API, 
				inserts the property data into the 'Reel Quality' table, and sends them to the ESB system .
				- If the Reel's build status is 'Tested', fetches Reel Qualities info for the properties from the 'Paperlab' source and sends them to the ESB system.
			
			Function steps:
			1. Check if the Reel is new or updated.
			2. Handle the 'Complete' build status by fetching and processing properties from 'DataHub'.
			3. Make API calls to retrieve property values, and insert them into the 'Reel Quality' table.
			4. Handle and insert conversion properties if applicable.
			5. Send the added properties to the ESB system for further processing.

			Raises:
				ValueError: If 'starttime' or 'turnuptime' fields are missing when the build status is 'Complete'.
				Exception: If an error occurs during property fetching or API calls.
			
			Returns:
				None
   		"""
		if self.is_new():
			frappe.msgprint(f"New Reel {self.reelid} has been created.")
		else:
			frappe.msgprint(f"Reel {self.reelid} has been updated.")
			if self.buildstatus == 'Complete':
				added_properties = [] 
				frappe.msgprint(f"Reel {self.reelid} has passed the update testing phase.")
				# self.send_reel_creation_email(self.reelid)
				try:
					reel_id = self.reelid
					starttime = self.starttime
					turnuptime = self.turnuptime

					if not starttime or not turnuptime:
						frappe.throw(_("Start Time and Turn-up Time are required before marking the reel Complete"))

					#Fetching properties with 'DataHub' source and valid rt_tag
					properties = fetch_properties(['DataHub']) or []
				except Exception as e:
					frappe.msgprint(f"An error occurred while fetching properties: {str(e)}")

				#For each property, making an API call and inserting data into Reel Quality
				for prop in properties:
					property_data = {
						'reelid': reel_id,
						'propertyid': prop['propertyid'],
						'property': prop['property'],
						'rt_tag': prop['rt_tag'],
						'starttime': starttime,
						'turnuptime': turnuptime,
						'value': '',  # Empty field for value to be fetched from API
						'name': prop['name']
					}

					# Checking if the property already exists in Reel Quality for the given reel_id
					existing_reel_quality_entry = frappe.get_all(
						'Reel Quality', 
						filters={'reelid': reel_id, 'propertyid': property_data['name']},
						fields=['name']
					)

					if not existing_reel_quality_entry:  # Only proceed if the entry does not exist
						# Making the API call
						added_properties.append(prop)
						rt_tag = property_data['rt_tag']
						url = "http://10.12.60.77:5000/api/MopsHIstoryOne"
						headers = {"Content-Type": "application/json"}
						data = {
							"TagName": rt_tag,
							"start": str(property_data['starttime']),
							"end": str(property_data['turnuptime']),
							"numValues": "14",
							"interpolationMethod": "Aggregate",
							"aggregateType": "PointAverage"
						}
						

						response = None
						try:
							response = requests.post(url, headers=headers, json=data)
							if response.status_code == 200:
								# Parsing XML response to extract the value
								root = ET.fromstring(response.text)
								values = root.find(".//Value").text
								property_data['value'] = values

								# Inserting new entry into 'Reel Quality'
								frappe.get_doc({
									'doctype': 'Reel Quality',
									'reelid': reel_id,
									'propertyid': property_data['name'],
									'property': property_data['property'],
									'average': property_data['value'],  # Using value from API response
									'standard_deviation': None,
									'mean': None,
									'minimum': None,
									'maximum': None,
									'median': None,
									'scanlength': None,
									'scanfrequency': None,
									'detailcount': None,
									'valuetype': None
								}).insert(ignore_permissions=True)

								# Handling conversion properties if needed
								conversion_properties = insert_missing_conversion_properties(property_data, reel_id)
								added_properties.extend(conversion_properties)
								frappe.msgprint(f"New Reel Quality Entry Created: {property_data}")
							else:
								frappe.msgprint(f"Failed to get a successful response: {response.status_code}")
								raise Exception("Status Code Not 200")
						except Exception as e:
							if not response:
								response = {"status_code": "Failed", "text": str(e)}
							reel_object = {"doctype": "Reel", "name": reel_id}
							call_info = {"url": url, "header": headers, "load": data}
							send_api_error(reel_object, call_info, response, "Failed")
							frappe.msgprint(f"An error occurred during the API call: {str(e)}")
					else:
						# If the property already exists, skipping the insertion
						frappe.msgprint(f"Property {property_data['propertyid']} already exists in Reel Quality for Reel ID {reel_id}, skipping.")
				
				# If added properties, send them to ESB
				if added_properties:
					send_added_properties_json(reel_id, added_properties)

			elif self.buildstatus == 'Tested':
				try:
					reel_id = self.reelid
					added_properties = fetch_properties(['Paperlab'])
					if added_properties:
						send_added_properties_json(reel_id, added_properties)
				except Exception as e:
					frappe.msgprint(f"An error occurred while fetching Paperlab properties: {str(e)}")


	# # def after_insert(self):
	def insert_datahub_data(self):
		# 1. Notify that a new reel has been created
		frappe.msgprint(f"New Reel {self.reelid} has been created.")
		
		# 2. Call the function to send an email about reel creation
		# self.send_reel_creation_email(self.reelid)

		# 3. Fetch information of the reel that has been inserted
		try:
			reel_id = self.reelid
			starttime = self.starttime
			turnuptime = self.turnuptime

			# 4. Fetch properties with 'DataHub' source and valid rt_tag
			properties = fetch_properties(['DataHub'])
		except Exception as e:
			frappe.msgprint(f"An error occurred while fetching properties: {str(e)}")

		# 5. For each property, make an API call and insert data into Reel Quality
		for prop in properties:

			property_data = {
				'reelid': reel_id,
				'propertyid': prop['propertyid'],
				'property': prop['property'],
				'rt_tag': prop['rt_tag'],
				'starttime': starttime,
				'turnuptime': turnuptime,
				'value': ''  # Empty field for value to be fetched from API
			}

			# Make the API call
			rt_tag = property_data['rt_tag']
			url = "http://10.12.60.77:5000/api/MopsHIstoryOne"
			headers = {"Content-Type": "application/json"}
			data = {
				"TagName": rt_tag,
				"start": str(property_data['starttime']),
				"end": str(property_data['turnuptime']),
				"numValues": "14",
				"interpolationMethod": "Aggregate",
				"aggregateType": "PointAverage"
			}

			try:
				response = requests.post(url, headers=headers, json=data, timeout=10)
				if response.status_code == 200:
					# Parse XML response to extract the value
					root = ET.fromstring(response.text)
					values = root.find(".//Value").text
					property_data['value'] = values
					
					# Insert new entry into 'Reel Quality'
					frappe.get_doc({
						'doctype': 'Reel Quality',
						'reelid': reel_id,
						'propertyid': property_data['propertyid'][-3:],
						'property': property_data['property'],
						'average': property_data['value'],  # Use value from API response
						'standard_deviation': None,
						'mean': None,
						'minimum': None,
						'maximum': None,
						'median': None,
						'scanlength': None,
						'scanfrequency': None,
						'detailcount': None,
						'valuetype': None
					}).insert(ignore_permissions=True)
					insert_missing_conversion_properties(property_data, reel_id)
					frappe.msgprint(f"New Reel Quality Entry Created: {property_data}")
					
				else:
					frappe.msgprint(f"Failed to get a successful response: {response.status_code}")
			except Exception as e:
				frappe.msgprint(f"An error occurred during the API call: {str(e)}")

	#  This hook is run after reel is created
	#  This creates a Roll to Reel CMP doc with only the reel field set
	def after_insert(self):
		doc = frappe.get_doc({
			"doctype": "Roll to Reel CMP",
			"reel": self.reelid,
		})
		doc.insert()
		
	def send_reel_creation_email(self, reel_id):
		# Fetching Reel Quality entries that match the reel ID
		try:
			reel_quality_entries = frappe.get_all(
				'Reel Quality',
				filters={'reelid': reel_id},
				fields=['propertyid', 'property', 'average']  # Fetching the required fields
			)
		except Exception as e:
			frappe.msgprint(f"An error occurred while fetching Reel Quality entries: {str(e)}")
			return
		
		# Setting email content
		email_content = f"New Reel {reel_id} has been created.<br>"
		if reel_quality_entries:
			email_content += "Here are the associated Reel Quality entries:<br><br>"
			for entry in reel_quality_entries:
				email_content += f"Property ID: {entry['propertyid']}, Property: {entry['property']}, Average: {entry['average']}<br>"
		else:
			email_content += "No Reel Quality entries found for this Reel.<br>"

		# Sending the email
		try:
			frappe.sendmail(
				recipients=['shadabm@albertanewsprint.com'],  # Recipient email
				subject=f"New Reel {reel_id} Created",
				message=email_content
			)
			frappe.msgprint(f"Email sent to shadabm@albertanewsprint.com regarding Reel {reel_id}.")
		except Exception as e:
			frappe.msgprint(f"An error occurred while sending the email: {str(e)}")


@frappe.whitelist()
def send_post_request():
	try:
		# Step 1: Fetch properties with 'DataHub' or 'Paperlab' source
		properties = fetch_properties(['DataHub', 'Paperlab'])
		# frappe.msgprint(f"Propertiesssssss {properties}")
		

		# Step 2: Fetch reels where starttime and turnuptime have values
		reels = fetch_reels()
		# frappe.msgprint(f"Reel IDdddssss {reels}")
		

		# Step 3: For each reel, process Reel Quality and find missing properties
		for reel in reels:
			reel_id = reel.get('reelid')
			starttime = reel.get('starttime')
			turnuptime = reel.get('turnuptime')

			# Step 4: Fetch Reel Quality entries for the current Reel ID
			reel_quality_property_ids = fetch_reel_quality_entries(reel_id)
			# frappe.msgprint(f"Reel IDdddssss {reel_quality_property_ids}")

			#Step 5: Find missing properties for this reel
			missing_properties = find_missing_properties(properties, reel_quality_property_ids, reel_id, starttime, turnuptime)
			frappe.msgprint(f"Missing Properties {missing_properties}")

			# # Step 6: Perform API call and insert missing properties only for the specific reel ID
			if (reel_id == "EQ70102") and missing_properties:
				api_call_and_insert(missing_properties, reel_id)
			# else:
			#     for missing in missing_properties:
			#         frappe.msgprint(f"Reel ID: {reel_id}, Missing Property: {missing['propertyid']} - {missing['property']} - {missing['rt_tag']}")

	except Exception as e:
		frappe.msgprint(f"An error occurred while processing Reel Quality: {str(e)}")
@frappe.whitelist()
def api_call_and_insert(missing_properties, reel_id):
	url = "http://10.12.60.77:5000/api/MopsHIstoryOne"
	headers = {"Content-Type": "application/json"}

	for missing in missing_properties:
		rt_tag = missing['rt_tag']
		data = {
			"TagName": rt_tag,
			"start": str(missing['starttime']),
			"end": str(missing['turnuptime']),
			"numValues": "14",
			"interpolationMethod": "Aggregate",
			"aggregateType": "PointAverage"
		}

		try:
			response = requests.post(url, headers=headers, json=data)
			if response.status_code == 200:
				root = ET.fromstring(response.text)
				values = root.find(".//Value").text
				missing['value'] = values
				property_id_numeric = missing['name']
				frappe.get_doc({
					'doctype': 'Reel Quality',
					'reelid': reel_id,
					'propertyid': property_id_numeric,
					'property': missing['property'],
					'average': missing['value'],
					'standard_deviation': None,
					'mean': None,
					'minimum': None,
					'maximum': None,
					'median': None,
					'scanlength': None,
					'scanfrequency': None,
					'detailcount': None,
					'valuetype': None
				}).insert()
				insert_missing_conversion_properties(missing, reel_id)
			else:
				frappe.msgprint(f"Failed to get a successful response: {response.status_code}")
		except Exception as e:
			frappe.msgprint(f"An error occurred during the API call: {str(e)}")

@frappe.whitelist()
def find_missing_properties(properties, reel_quality_property_ids, reel_id, starttime, turnuptime):
	missing_properties = []
	for prop in properties:
		property_id_last_3 = prop['name']
		if property_id_last_3 not in reel_quality_property_ids and prop['rt_tag']:
			missing_properties.append({
				'reelid': reel_id,
				'propertyid': prop['propertyid'],
				'property': prop['property'],
				'rt_tag': prop['rt_tag'],
				'starttime': starttime,
				'turnuptime': turnuptime,
				'value': '',
				'name': prop['name']
			})
	return missing_properties

@frappe.whitelist()
def fetch_reel_quality_entries(reel_id):
	try:
		reel_quality_entries = frappe.get_all(
			'Reel Quality',
			filters={'reelid': reel_id},
			fields=['propertyid']
		)
		return {entry.get('propertyid') for entry in reel_quality_entries}
	except Exception as e:
		frappe.msgprint(f"An error occurred while fetching Reel Quality entries: {str(e)}")


@frappe.whitelist()
def fetch_reels():
	try:
		reels = frappe.get_all(
			'Reel',
			filters={
				'reelid': ['!=', ''],
				'starttime': ['!=', None],
				'turnuptime': ['!=', None],
				'buildstatus': 'Tested'
			},
			fields=['reelid', 'starttime', 'turnuptime']
		)
		return reels
	except Exception as e:
		frappe.msgprint(f"An error occurred while fetching reels: {str(e)}")

@frappe.whitelist()
def fetch_properties(source):
	try:
		# Ensure 'source' is a list for the 'in' operator
		if isinstance(source, str):
			source = [source]  # Convert to list if a single string is provided

		properties = frappe.get_all(
			'Property',  
			filters={
				'sourcename': ['in', source],  # Use the 'in' operator with a list of sources
				'rt_tag': ['!=', None]  # Only include properties with valid rt_tag
			},
			fields=['propertyid', 'property', 'rt_tag','name']  # Fetch the required fields
		)
		return properties
	except Exception as e:
		frappe.msgprint(f"An error occurred while fetching properties: {str(e)}")

@frappe.whitelist()
def insert_missing_conversion_properties(missing, reel_id):
	added_conversion_properties = []
	try:
		property_id_numeric = missing['name']
		
		missing_conversion_properties = frappe.get_all(
			'Property Conversions',
			filters={
				'parent': property_id_numeric,
				'parenttype': 'Property',
				'parentfield': 'property_conversions_name'
			},
			fields=['conversion_multiplier', 'property_conversion_name', 'property_conversion_id']
		)

		for conversion in missing_conversion_properties:
			existing_conversion_entry = frappe.get_all(
				'Reel Quality',
				filters={'reelid': reel_id, 'propertyid': conversion['property_conversion_id']},
				fields=['name']
			)

			if not existing_conversion_entry:
				converted_value = float(missing['value']) * float(conversion['conversion_multiplier'])

				frappe.get_doc({
					'doctype': 'Reel Quality',
					'reelid': reel_id,
					'propertyid': conversion['property_conversion_id'],
					'property': conversion['property_conversion_name'],
					'average': converted_value,
					'standard_deviation': None,
					'mean': None,
					'minimum': None,
					'maximum': None,
					'median': None,
					'scanlength': None,
					'scanfrequency': None,
					'detailcount': None,
					'valuetype': None
				}).insert()

				added_conversion_properties.append({
					"propertyid": conversion['property_conversion_id'],
					"property": conversion['property_conversion_name'],
					"average": converted_value,
					"quality_form": None,
					"units": None,
					"conversion_multiplier": conversion['conversion_multiplier'],
					"name": conversion['property_conversion_id']
				})

				frappe.msgprint(f"New Reel Quality Entry Created from Conversion Property: {conversion}")

	except Exception as e:
		frappe.msgprint(f"An error occurred while inserting conversion properties: {str(e)}")
	return added_conversion_properties

@frappe.whitelist()
def create_json_for_reel(reel_id):
	try:
		reel_quality_entries = frappe.get_all(
			'Reel Quality',
			filters={'reelid': reel_id},
			fields=[
				'propertyid', 'property', 'average', 'standard_deviation', 'mean', 
				'minimum', 'maximum', 'median', 'scanlength', 'scanfrequency', 
				'detailcount', 'valuetype'
			]
		)

		if not reel_quality_entries:
			return {"error": f"No Reel Quality entries found for Reel ID {reel_id}"}

		reel_info = frappe.get_doc('Reel', reel_id)
		starttime = reel_info.starttime.strftime('%Y-%m-%d %H:%M:%S') if reel_info.starttime else None
		turnuptime = reel_info.turnuptime.strftime('%Y-%m-%d %H:%M:%S') if reel_info.turnuptime else None

		for entry in reel_quality_entries:
			property_details = frappe.get_all(
				'Property',
				filters={'name': entry['propertyid']},
				fields=['quality_form', 'units', 'conversion_multiplier']
			)
			if property_details:
				property_detail = property_details[0]
				entry['quality_form'] = property_detail.get('quality_form', None)
				entry['units'] = property_detail.get('units', None)
				entry['conversion_multiplier'] = property_detail.get('conversion_multiplier', None)
			else:
				entry['quality_form'] = None
				entry['units'] = None
				entry['conversion_multiplier'] = None

			entry['propertyid'] = entry.get('propertyid', None)
			entry['property'] = entry.get('property', None)
			entry['average'] = entry.get('average', 0)
			entry['standard_deviation'] = entry.get('standard_deviation', 0)
			entry['mean'] = entry.get('mean', 0)
			entry['minimum'] = entry.get('minimum', 0)
			entry['maximum'] = entry.get('maximum', 0)
			entry['median'] = entry.get('median', 0)
			entry['scanlength'] = entry.get('scanlength', 0)
			entry['scanfrequency'] = entry.get('scanfrequency', 0)
			entry['detailcount'] = entry.get('detailcount', 0)
			entry['valuetype'] = entry.get('valuetype', None)

		reel_json = {
			"reelid": reel_id,
			"starttime": starttime,
			"turnuptime": turnuptime,
			"doctype": "Datahub Reel Quality Data Entry",
			"entries": reel_quality_entries
		}

		return reel_json

	except Exception as e:
		frappe.msgprint(f"An error occurred while creating JSON: {str(e)}")
		return {"error": str(e)}

@frappe.whitelist()
def send_added_properties_json(reel_id, added_properties):
	try:
		if isinstance(added_properties, str):
			added_properties = frappe.parse_json(added_properties)
		
		# Fetch the reel information
		# frappe.msgprint(f"In the function with added properties: {added_properties}")
		reel_info = frappe.get_doc('Reel', reel_id)

		# Convert starttime and turnuptime to string (ISO 8601 format)
		starttime = reel_info.starttime.strftime('%Y-%m-%d %H:%M:%S') if reel_info.starttime else None
		turnuptime = reel_info.turnuptime.strftime('%Y-%m-%d %H:%M:%S') if reel_info.turnuptime else None

		# Prepare the list to hold added property entries
		added_reel_quality_entries = []

		# Fetch additional data for the added properties from Reel Quality
		for prop in added_properties:
			# Fetch the relevant fields from the 'Reel Quality' doctype for the specific property
			reel_quality_entry = frappe.get_all(
				'Reel Quality',
				filters={
					'reelid': reel_id,
					'propertyid': prop['name']  # Fetch only this property using 'name'
				},
				fields=['propertyid', 'property', 'average']
			)

			if reel_quality_entry:
				entry = reel_quality_entry[0]  # Fetch the first entry

				# Fetch 'quality_form', 'units', and 'conversion_multiplier' from the Property doctype
				property_details = frappe.get_all(
					'Property',
					filters={'name': entry['propertyid']},  # Fetch using the property name
					fields=['quality_form', 'units', 'conversion_multiplier']
				)

				if property_details:
					property_detail = property_details[0]  # Access the first dictionary in the list
					entry['quality_form'] = property_detail.get('quality_form')
					entry['units'] = property_detail.get('units')
					entry['conversion_multiplier'] = property_detail.get('conversion_multiplier')
				else:
					# Set to null if not found
					entry['quality_form'] = None
					entry['units'] = None
					entry['conversion_multiplier'] = None

				# Create a simplified entry with the required fields
				simplified_entry = {
					"propertyid": entry['propertyid'],
					"property": entry['property'],
					"average": entry['average'],
					"quality_form": entry['quality_form'],
					"units": entry['units'],
					"conversion_multiplier": entry['conversion_multiplier']
				}

				# Append the simplified entry to the list
				added_reel_quality_entries.append(simplified_entry)

		# Construct the JSON object to be sent
		added_reel_json = {
			"reelid": reel_id,
			"starttime": starttime,
			"turnuptime": turnuptime,
			"doctype": "Datahub Reel Quality Data Entry",
			"entries": added_reel_quality_entries  # Only the simplified properties
		}
		# frappe.msgprint(f"Constructed JSON: {added_reel_json}")

		# Send this JSON data to the external system (ESB)
		# url = "http://10.12.50.85:8002/ESB_Shadab"  # Local Shadab ESB
		# url = "http://10.12.60.175:50104/ESBPROD"  # ESB Test V01 URL
		# url = "http://10.12.60.75:50104/ESBPROD"  # ESB Prod V01 URL
		
		headers = {
			'Content-Type': 'application/json'
		}

		response = None
		# Send the request
		try:
			response = requests.post(url, headers=headers, json=added_reel_json, timeout=10)
			if response.status_code != 200 and response.status_code != 202:
				raise Exception("Unsuccessful post to ESB.")
			else:
				reel_object = {"doctype": "Reel", "name": reel_id}
				call_info = {"url": url, "header": headers, "load": added_reel_json}
				send_api_error(reel_object, call_info, response, "Success")			
				frappe.msgprint("Added properties sent successfully to ESB.")
		except Exception as e:
			doc = frappe.get_doc({
				"doctype": "Message Queue",
				"url": url,
				"status": "Pending",
				"original_doctype": "Reel",
				"error_time": datetime.datetime.now(),
				"header": headers,
				"message": added_reel_json
			})
			doc.insert()
			frappe.db.set_value("Message Queue", doc.name, "original_name", reel_id)
			if not response:
				response = {"status_code": "Failed", "text": str(e)}
			reel_object = {"doctype": "Reel", "name": reel_id}
			call_info = {"url": url, "header": headers, "load": added_reel_json}
			send_api_error(reel_object, call_info, response, "Failed")
			frappe.msgprint(f"An error occurred while sending to ESB: {str(e)}")

	except Exception as e:
		frappe.msgprint(f"An error occurred: {str(e)}")

	return added_reel_json



def send_api_error(object, call_info, response, status):
	doc = frappe.get_doc({
		"doctype": "API Errors",
		"original_doctype": object["doctype"],
		"original_name": object["name"],
		"api_url": call_info["url"],
		"fail_time": datetime.datetime.now(),
		"http_code": response["status_code"] if isinstance(response, dict) else response.status_code,
		"http_response": response["text"] if isinstance(response, dict) else response.text,
		"call_header": call_info["header"],
		"call_load": call_info["load"],
		"status": status
	})
	doc.insert()
	frappe.msgprint("PUT DATA IN API ERROR")