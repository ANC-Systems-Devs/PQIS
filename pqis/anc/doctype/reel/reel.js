// Copyright (c) 2023, ANC and contributors
// For license information, please see license.txt

frappe.ui.form.on("Reel", {
  refresh(frm) {
      const appRole = frappe.user_roles.includes("Grade Book Admin");
      
      if (appRole === false) {
              cur_frm.fields_dict['reel_qualities'].grid.wrapper.find('.btn-open-row').hide();

              $('*[data-fieldname="reel_qualities"]').find('.grid-add-row').hide();
      }

      if (!frm.is_new()) {
        frm.disable_save();

        frm.add_custom_button('Manual Entry', () => {
          const d = new frappe.ui.Dialog({
            title: "New Raw Data",
            fields: [
                    {
                    fieldname: "rawdataid",
                    fieldtype: "Data",
                    label: "Raw Data ID",
                    reqd: 1,
                    unique: 1
                    },
                    {
                    fieldname: "data",
                    fieldtype: "Data",
                    label: "Data"
                    },
                    {
                    fieldname: "datetime",
                    fieldtype: "Datetime",
                    label: "Datetime",
                    default: frappe.datetime.now_datetime()
                    },
                    {
                    fieldname: "sourceid",
                    fieldtype: "Data",
                    label: "Source ID",
                    default: "MNLRE",
                    read_only: 1
                    },
                    {
                    fieldname: "sourcename",
                    fieldtype: "Data",
                    label: "Source",
                    default: "MNLRE NAME",
                    read_only: 1
                    },
                    {
                    fieldname: "column_break_ujwp",
                    fieldtype: "Column Break"
                    },
                    {
                    fieldname: "status",
                    fieldtype: "Select",
                    label: "Status",
                    options: "Processed\nNot Processed",
                    reqd: 1,
                    default: "Processed"
                    },
            ],
            primary_action(values) {
                    const dataDialog = values;
                    frm.call({
                        method: 'pqis.anc.doctype.reel.reel.save_raw_data',
                        args: { 'data': JSON.stringify(dataDialog) },
                        callback: function(response) {
                            console.log("success", response);

                            if (response.message.status === "Success") {
                              frappe.msgprint(__(`${response.message.message}`));
                            } else {
                              frappe.throw(__(`Failed to save record.`));
                            }

                            frm.reload_doc()
                        },
                        error: (r) => {
                            console.log("error", r);
                            frappe.throw(__(`Failed to save record.`));
                        }
                    });

                    d.hide();
            }
          });

          d.show();
        }).addClass("btn-primary");
      }
  },
  create_json: function(frm) {
    // Call the server-side method to create the JSON for the reel
    frappe.call({
        method: 'pqis.anc.doctype.reel.reel.create_json_for_reel',  // Path to your server-side method
        args: {
            reel_id: frm.doc.reelid  // Send the current reel ID from the form
        },
        callback: function(response) {
            if (response.message) {
                // If response contains JSON, convert it to a blob and download
                let reelData = JSON.stringify(response.message, null, 4);  // Pretty print JSON
                let blob = new Blob([reelData], { type: 'application/json' });
                let url = window.URL.createObjectURL(blob);
                let a = document.createElement('a');
                a.href = url;
                a.download = `Reel_${frm.doc.reelid}_Quality_Report.json`;  // Dynamic file name
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);

                // Optionally display the JSON in a popup
                frappe.msgprint({
                    title: __('Reel JSON'),
                    message: `<pre>${reelData}</pre>`,  // Pretty print the JSON
                    wide: true
                });
            } else {
                frappe.msgprint(__('Failed to generate JSON or no data available.'));
            }
        }
    });
}

});
