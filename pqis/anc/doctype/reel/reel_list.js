frappe.listview_settings['Reel'] = {
    refresh: function(listview) {
        console.log("List view refresh triggered");

        if (frappe.user_roles.includes('Admin')) {
            console.log("Admin role detected");

            // Check if the 'Test Mops' button already exists before adding it
            if (!$('.btn-test-mops').length) {
                listview.page.add_inner_button(__('Test Mops'), function() {
                    // This function is called only when the button is explicitly clicked
                    handleTestMopsButtonClick(listview);
                });  // Add a class to track the button
            }
        }
    }
}

// Function to handle the button click
function handleTestMopsButtonClick(listview) {
    console.log("Test Mops Button Clicked");

    // Call the Python function 'send_post_request'
    frappe.call({
        method: 'pqis.anc.doctype.reel.reel.send_post_request',  // Update with the actual module path
        callback: function(response) {
            // Handle the response
            if (response.message) {
                frappe.msgprint(__('Mops data has been updated.'));
            } else {
                frappe.msgprint(__('Failed to update Mops data.'));
            }
        }
    });
}
