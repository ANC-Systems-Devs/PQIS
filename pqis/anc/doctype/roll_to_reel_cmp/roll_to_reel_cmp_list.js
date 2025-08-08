frappe.listview_settings["Roll to Reel CMP"] = {
    refresh: function(listview) {
        listview.page.add_inner_button("Create Report", function () {
            show_report_filters();
        })
    }
}



function show_report_filters() {
    frappe.prompt([
        {
            label: 'Reel ID',
            fieldname: 'reel_id',
            fieldtype: 'Data',
            reqd: 0
        },
        {
            label: 'Start Date',
            fieldname: 'start_date',
            fieldtype: 'Datetime',
            reqd: 0
        },
        {
            label: 'End Date',
            fieldname: 'end_date',
            fieldtype: 'Datetime',
            reqd: 0
        }
    ],
    function (values) {
        // User clicked Submit
        create_report(values);
    },
    'Filter Report',
    'Generate Report'
    );
}




function create_report(filters) {
    frappe.msgprint("Create Report");
    frappe.call({
        method: "pqis.anc.doctype.roll_to_reel_cmp.roll_to_reel_cmp.generate_pdf_document",
        args: {
            reel_id: filters.reel_id,
            start_date: filters.start_date,
            end_date: filters.end_date
        },
        callback: function(r) {
            if (r.message.file_url) {
                frappe.msgprint(r.message.message);
                frappe.msgprint("Filters used: " + JSON.stringify(r.message.filters, null, 2));
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