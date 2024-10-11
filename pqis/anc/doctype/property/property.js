// Copyright (c) 2023, ANC and contributors
// For license information, please see license.txt

frappe.ui.form.on("Property", {
	refresh(frm) {
        if (frm.is_new()) {
            frm.call({
                method: 'pqis.anc.doctype.property.property.auto_increment_id',
                callback: function(response) {
                    console.log("success", response);
        
                    if (response.message.status === "Success") {
                        frm.set_value('propertyid', response.message.message);
                        frm.refresh_fields('propertyid');
                        frm.set_df_property('propertyid', 'read_only', 1);
                    } else {
                        frappe.throw(__(`Failed to increment Property Id.`));
                    }
                },
                error: (r) => {
                    console.log("error", r);
                    frappe.throw(__(`Failed to increment Property Id.`));
                }
            });
        } 
	},

    // On Save: After the Property form is saved, update the Property Conversions
    after_save(frm) {
        frappe.call({
            method: 'pqis.anc.doctype.property.property.update_property_conversions',
            args: {
                propertyid: frm.doc.name,  // Get the propertyid from the form  
                imperial_unit: frm.doc.units,  // Get the imperial unit from the form
                conversion_multiplier: frm.doc.conversion_multiplier  // Get the conversion multiplier from the form
            },
            callback: function(response) {
                if (response.message.status === "Success") {
                    frappe.msgprint("Property Conversions updated successfully.");
                } else {
                    frappe.msgprint("Failed to update Property Conversions.");
                }
            }
        });
    }
});
