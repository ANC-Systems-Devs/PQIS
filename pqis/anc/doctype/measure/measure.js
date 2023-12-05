// Copyright (c) 2023, ANC and contributors
// For license information, please see license.txt

frappe.ui.form.on("Measure", {
	refresh(frm) {
        if (frm.is_new()) {
            frm.call({
                method: 'pqis.anc.doctype.measure.measure.auto_increment_id',
                callback: function(response) {
                    console.log("success", response);
        
                    if (response.message.status === "Success") {
                        frm.set_value('measureid', response.message.message);
                        frm.refresh_fields('measureid');
                        frm.set_df_property('measureid', 'read_only', 1);
                    } else {
                        frappe.throw(__(`Failed to increment Measure Id.`));
                    }
                },
                error: (r) => {
                    console.log("error", r);
                    frappe.throw(__(`Failed to increment Measure Id.`));
                }
            });
        } 
	},
});
