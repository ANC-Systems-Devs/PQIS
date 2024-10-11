# Copyright (c) 2023, ANC and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

@frappe.whitelist()
def auto_increment_id():
	try:
		doc = frappe.db.sql("""
                SELECT
                    next_not_cached_value
                FROM `property_id_seq`
                """)

		number = doc[0][0]
		formatted = f'PROP{number:04d}'

		return {"status": "Success", "message": formatted}
	except Exception as e: 
		return {"status": "Error", "message": "Failed to fetch record.", "exception": e}


@frappe.whitelist()
def update_property_conversions(propertyid, imperial_unit, conversion_multiplier):
    try:
        # Debugging - Check what values are passed
        frappe.msgprint(f"Updating Property Conversion for Property ID: {propertyid}")
        frappe.msgprint(f"Imperial Unit: {imperial_unit}, Conversion Multiplier: {conversion_multiplier}")

        # Fetch the Property Conversion records that match the given propertyid
        conversion_records = frappe.get_all(
            'Property Conversions',  # Target doctype
            filters={'property_conversion_id': propertyid},  # Match the propertyid
            fields=['name', 'imperial_unit', 'conversion_multiplier']  # Fetch required fields
        )

        if conversion_records:
            for record in conversion_records:
                # Debugging - Check what record is being fetched
                frappe.msgprint(f"Fetched Record: {record}")

                # Get the document for each record and update fields
                doc = frappe.get_doc('Property Conversions', record['name'])

                # Debugging - Check current values before updating
                frappe.msgprint(f"Current Imperial Unit: {doc.imperial_unit}, Current Conversion Multiplier: {doc.conversion_multiplier}")

                # Update the fields in the document
                doc.imperial_unit = imperial_unit  # Update the imperial unit
                doc.conversion_multiplier = conversion_multiplier  # Update the conversion multiplier

                # Debugging - Check values before saving
                frappe.msgprint(f"New Imperial Unit: {doc.imperial_unit}, New Conversion Multiplier: {doc.conversion_multiplier}")

                # Save the updated document
                doc.save()

            return {"status": "Success", "message": "Property Conversions updated."}
        else:
            return {"status": "Error", "message": "No matching Property Conversions found."}

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Property Conversions Update Error")
        return {"status": "Error", "message": str(e)}

class Property(Document):
	pass
