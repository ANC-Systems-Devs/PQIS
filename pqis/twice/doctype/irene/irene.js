// Copyright (c) 2023, ANC and contributors
// For license information, please see license.txt

frappe.ui.form.on("Irene", {
	refresh(frm) {
        frappe.call({
            method: 'pqis.redvelvet.doctype.irene.irene.getrole',
            callback: function(response) {
                    console.log("erika", response);
            },
            error: (r) => {
                    console.log("erika", r);
            }
        });
	},
});
