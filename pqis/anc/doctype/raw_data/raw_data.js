// Copyright (c) 2023, ANC and contributors
// For license information, please see license.txt

frappe.ui.form.on("Raw Data", {
    // refresh(frm) {

    // },
    reprocess: function (frm) {
        frappe.call({
            method: 'pqis.anc.doctype.raw_data.raw_data.post_to_esb',
            args: {
                // id: id,
                data: frm.doc.data
            },
            callback: function (response) {
                console.log(response);
            }
        })
    }
});
