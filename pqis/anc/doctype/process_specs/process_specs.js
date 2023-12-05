// Copyright (c) 2023, ANC and contributors
// For license information, please see license.txt

let subprocess = "";
let subprocessDesc = "";

let datatable; 

frappe.ui.form.on("Process Specs", {
	refresh(frm) {
        var css = document.createElement('style');
        css.type = 'text/css';
        var styles = '.row-index {display:none;}';
        if (css.styleSheet) css.styleSheet.cssText = styles;
        else css.appendChild(document.createTextNode(styles));
        document.getElementsByTagName("head")[0].appendChild(css);

        if (frm.is_new()) {
            frm.set_value('workflow_state_pssp', "Not Saved");
            frm.refresh_fields('workflow_state_pssp');
            
            frm.call({
                method: 'pqis.anc.doctype.process_specs.process_specs.auto_increment_id',
                callback: function(response) {
                    console.log("success", response);
        
                    if (response.message.status === "Success") {
                        frm.set_value('processspecid', response.message.message);
                        frm.refresh_fields('processspecid');
                        frm.set_df_property('processspecid', 'read_only', 1);
                    } else {
                        frappe.throw(__(`Failed to increment Process Spec Id.`));
                    }
                },
                error: (r) => {
                    console.log("error", r);
                    frappe.throw(__(`Failed to increment Process Spec Id.`));
                }
            });
        }
	},

    onload(frm) {
        if (frm.doc.workflow_state_pssp === "Entered") {
            frm.set_df_property('areaid', 'read_only', 1);
            frm.set_df_property('processid', 'read_only', 1);

            $('*[data-fieldname="process_spec_details"]').find('.grid-add-row').hide();
            frm.set_df_property('process_spec_details', 'read_only', 1);

            if (frm.doc.startdate == null && frm.doc.starttime == null && frm.doc.enddate == null && frm.doc.endtime == null) {
                $('*[data-fieldname="html_rqqf"]').hide();
            }
        }
        
        // for process link
        frm.set_query("processid", function() {
            return {
                "filters": {
                    "areaid": frm.doc.areaid
                }
            };
        });

        //for subprocess link on child table
        frm.set_query("subprocessid", "process_spec_details", function() {
            return {
                "filters": {
                    "processid": frm.doc.processid
                }
            }
        });
    },

    areaid(frm) {
        frm.set_value('processid', "");
        frm.refresh_fields('processid');

        cur_frm.clear_table("process_spec_details"); 
        cur_frm.refresh_fields("process_spec_details");
    },

    processid(frm) {
        cur_frm.clear_table("process_spec_details"); 
        cur_frm.refresh_fields("process_spec_details");

        if (frm.doc.processid !== "") {
            const fetchDupParam = {
                                    'areaid': frm.doc.areaid,
                                    'processid': frm.doc.processid,
                                    'active': 1
                                  }

            const fetchParam = {
                                'processid': frm.doc.processid
                               }

            frm.call({
                method: 'pqis.anc.doctype.process_specs.process_specs.fetch_psdtl_subprocess',
                args: {
                        'dupdata': JSON.stringify(fetchDupParam),
                        'data': JSON.stringify(fetchParam)
                      },
                callback: function(response) {
                    console.log("success", response);
        
                    if (response.message.status === "Duplicate") {
                        frm.set_value('areaid', "");
                        frm.refresh_fields('areaid');

                        frm.set_value('processid', "");
                        frm.set_value('processdesc', "");
                        frm.refresh_fields('processid');
                        frm.refresh_fields('processdesc');

                        frappe.msgprint({
                            title: __('Warning'),
                            indicator: 'red',
                            message: __(`Area ${frm.doc.areaid} and Process ${frm.doc.processid} combination already exists in ${response.message.id}.`)
                        });

                    } else if (response.message.status === "Success") {
                        if (response.message.message.length === 1) {
                            subprocess = response.message.message[0].name;
                            subprocessDesc = response.message.message[0].description;
                        } else {
                            subprocess = "";
                            subprocessDesc = "";
                        }

                        response.message.message.map((item) => {    
                            frm.add_child('process_spec_details', {
                                processspecdtlid: response.message.result,
                                subprocessid: item.name,
                                subprocess: item.description
                            });
                            frm.refresh_fields("process_spec_details");
                        });
                    } else {
                        frappe.throw(__(`Failed to fetch Sub Process records.`));
                    }
                },
                error: (r) => {
                    console.log("error", r);
                    frappe.throw(__(`Failed to fetch Sub Process records.`));
                }
            });
        }
    },

    before_save(frm) {
        if (frm.doc.workflow_state_pssp === "Not Saved") {
            frm.set_value('workflow_state_pssp', "Draft");
            frm.refresh_fields('workflow_state_pssp');
        }
    }
});

frappe.ui.form.on('Process Spec Details', {
    process_spec_details_add(frm, cdt, cdn) {
        let item = locals[cdt][cdn];

        frm.call({
            method: 'pqis.anc.doctype.process_specs.process_specs.auto_increment_child_id',
            args: { 'data':  JSON.stringify(frm.doc.process_spec_details) },
            callback: function(response) {
                console.log("success", response);
                
                if (response.message.status === "Success") {
                    item.processspecdtlid = response.message.message;
                }
            },
            error: (r) => {
                console.log("error", r);
            }
        });
        
        if (subprocess !== "") {
            item.subprocessid = subprocess;
            item.subprocess = subprocessDesc;
        }
    }
});