// Copyright (c) 2023, ANC and contributors
// For license information, please see license.txt

frappe.ui.form.on("Process", {
	refresh(frm) {
        if (frm.is_new()) {
            frm.call({
                method: 'pqis.anc.doctype.process.process.auto_increment_id',
                callback: function(response) {
                    console.log("success", response);
        
                    if (response.message.status === "Success") {
                        frm.set_value('processid', response.message.result);
                        frm.refresh_fields('processid');
                        frm.set_df_property('processid', 'read_only', 1);
                    } else {
                        frappe.throw(__(`Failed to increment Process Id.`));
                    }
                },
                error: (r) => {
                    console.log("error", r);
                    frappe.throw(__(`Failed to increment Process Id.`));
                }
            });
        } 
	},
});
