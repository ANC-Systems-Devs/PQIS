frappe.listview_settings["Roll to Reel CMP"] = {
    refresh: function(listview) {
        listview.page.add_inner_button("Create Report", function () {
            show_report_filters();
        });
        if (frappe.user_roles.includes("Admin")) {
        // added to manually test the update to the MOPS 
        listview.page.add_inner_button("Update MOPS for Roll-Reel", function () {
            updateMopsForRollSubReel();
        })
    }
}
}

function updateMopsForRollSubReel() {
    // compute the window: [now - 3 days, now - 2 days]
    const base = frappe.datetime.now_datetime();

    // keep same clock time, shift by whole days
    const start = frappe.datetime.add_days(base, -3); // now - 3 days
    const end   = frappe.datetime.add_days(base, -2); // now - 2 days

    // frappe.msgprint(start,end)

    frappe.call({
        method: "pqis.anc.doctype.roll_to_reel_cmp.roll_to_reel_cmp.updateMops",
        args: { start, end },
        // args: { start: "2025-09-05 00:00:00", end: "2025-09-05 23:59:59" },  -- for testing purpose
        freeze: true,
        freeze_message: __("Writing to MOPS…"),
    }).then(r => {
        const m = r.message || {};
        frappe.msgprint(
            `Fetched ${m.attempted||0}, prepared ${m.prepared||0}, sent ${m.sent||0}.` +
            (m.errors?.length ? ` Errors: ${m.errors.join("; ")}` : "")
        )
        // If your server method actually performs updates, you can show details here.
        // console.log("Rows:", msg.rows);
    }).catch(e => {
        console.error(e);
        frappe.msgprint(__("Failed to update MOPS. See console for details."));
    });

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
            fieldtype: 'Date',
            reqd: 0
        },
        {
            label: 'End Date',
            fieldname: 'end_date',
            fieldtype: 'Date',
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
    frappe.msgprint("Creating Report...");
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
                // frappe.msgprint("Filters used: " + JSON.stringify(r.message.filters, null, 2));
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