frappe.listview_settings['Process Measurement'] = {
    refresh: function(listview) {
        console.log("List view refresh triggered");

        // Adjust role check if needed
        if (frappe.user.has_role && frappe.user.has_role('Admin')) {
            console.log("Admin role detected");

            // Only add once
            if (!listview.page.custom_update_missing_btn_added) {
                listview.page.custom_update_missing_btn_added = true;

                listview.page.add_inner_button(__('Update Missing Data'), function() {
                    handleButtonClick(listview);
                });
            }
        }
    }
};

function handleButtonClick(listview) {
    console.log("Button Clicked");

    // Prompt for date range
    frappe.prompt(
        [
            {
                fieldname: 'from_date',
                label: 'From Date',
                fieldtype: 'Date',
                reqd: 1
            },
            {
                fieldname: 'to_date',
                label: 'To Date',
                fieldtype: 'Date',
                reqd: 1
            }
        ],
        function(values) {
            // Simple validation
            if (values.from_date > values.to_date) {
                frappe.msgprint(__('From Date cannot be after To Date.'));
                return;
            }

            frappe.call({
                method: 'pqis.anc.doctype.process_measurement.process_measurement.sendMissingDataToESB',
                args: {
                    from_date: values.from_date,
                    to_date: values.to_date
                },
                freeze: true,
                freeze_message: __('Sending data to ESB...'),
                callback: function(response) {
                    if (response && response.message) {
                        frappe.msgprint(response.message);
                    } else {
                        frappe.msgprint(__('Finished, but no message was returned from the server.'));
                    }
                },
                error: function(err) {
                    frappe.msgprint(__('Failed to send data to ESB. Check the server logs for details.'));
                }
            });
        },
        __('Select Date Range'),
        __('Send')
    );
}
