// Copyright (c) 2023, ANC and contributors
// For license information, please see license.txt

frappe.ui.form.on("Sub Process", {
	refresh(frm) {
        if (frm.is_new()) {
            frm.call({
                method: 'pqis.anc.doctype.sub_process.sub_process.auto_increment_id',
                callback: function(response) {
                    console.log("success", response);
        
                    if (response.message.status === "Success") {
                        frm.set_value('subprocessid', response.message.message);
                        frm.refresh_fields('subprocessid');
                        frm.set_df_property('subprocessid', 'read_only', 1);
                    } else {
                        frappe.throw(__(`Failed to increment Sub Process Id.`));
                    }
                },
                error: (r) => {
                    console.log("error", r);
                    frappe.throw(__(`Failed to increment Sub Process Id.`));
                }
            });
        } 
	},
});
