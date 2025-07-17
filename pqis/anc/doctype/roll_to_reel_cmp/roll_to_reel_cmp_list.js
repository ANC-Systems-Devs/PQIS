frappe.listview_settings["Roll to Reel CMP"] = {
    refresh: function(listview) {
        listview.page.add_inner_button("Create Report", function () {
            create_report();
        })
    }
}

function create_report() {
    frappe.msgprint("Create Report");
    frappe.call({
        method: "pqis.anc.doctype.roll_to_reel_cmp.roll_to_reel_cmp.generate_pdf_document",
        callback: function(r) {
            if (r.message.file_url) {
                frappe.msgprint(r.message.message);
                window.open(r.message.file_url);
            }
        }
        // callback: function (r) {
        //     if (r.message) {
        //         let report = r.message;
        //         frappe.tools.downloadify(JSON.parse(report), null, "Roll to Reel BWT Comparison");
        //     }
        // }
    })
}