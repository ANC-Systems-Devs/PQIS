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
});
