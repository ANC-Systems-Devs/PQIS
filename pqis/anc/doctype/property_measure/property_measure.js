// Copyright (c) 2023, ANC and contributors
// For license information, please see license.txt

frappe.ui.form.on("Property Measure", {
	refresh(frm) {
        if (frm.is_new()) {
            frm.call({
                method: 'pqis.anc.doctype.property_measure.property_measure.auto_increment_id',
                callback: function(response) {
                    console.log("success", response);
        
                    if (response.message.status === "Success") {
                        frm.set_value('propertymeasureid', response.message.message);
                        frm.refresh_fields('propertymeasureid');
                        frm.set_df_property('propertymeasureid', 'read_only', 1);
                    } else {
                        frappe.throw(__(`Failed to increment Property Measure Id.`));
                    }
                },
                error: (r) => {
                    console.log("error", r);
                    frappe.throw(__(`Failed to increment Property Measure Id.`));
                }
            });
        } 
	},
});
