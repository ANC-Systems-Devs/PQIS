// Copyright (c) 2023, ANC and contributors
// For license information, please see license.txt

frappe.ui.form.on("Process Measurement", {
	refresh(frm) {
        $('*[data-fieldname="process_measurement_details"]').find('button.grid-add-row').addClass('hide');

        if (frm.is_new()) {
            frm.set_value('workflow_state', "Not Saved");
            frm.refresh_fields('workflow_state');

            frm.set_value('date', frappe.datetime.now_date());
            frm.refresh_fields('date');

            frm.remove_custom_button('Submit');
            frm.remove_custom_button('Cancel');

            frm.call({
                method: 'pqis.anc.doctype.process_measurement.process_measurement.auto_increment_id',
                callback: function(response) {
                    console.log("success", response);
        
                    if (response.message.status === "Success") {
                        frm.set_value('processmeasurementid', response.message.result);
                        frm.refresh_fields('processmeasurementid');
                        frm.set_df_property('processmeasurementid', 'read_only', 1);
                    } else {
                        frappe.throw(__(`Failed to increment Process Measurement Id.`));
                    }
                },
                error: (r) => {
                    console.log("error", r);
                    frappe.throw(__(`Failed to increment Process Measurement Id.`));
                }
            });
        } else {
            $("div[data-fieldname=process_measurement_details]").find(`div.grid-heading-row`).find('.grid-static-col').css('height', '50px');
            $("div[data-fieldname=process_measurement_details]").find(`div.grid-heading-row`).find('.grid-static-col[title="Previous Date Value"]').find('.static-area').html(`<p>Previous Date Value<br>(${frappe.datetime.add_days(frm.doc.date, -1)})</p>`);
            $("div[data-fieldname=process_measurement_details]").find(`div.grid-heading-row`).find('.grid-static-col[title="Previous Second Date Value"]').find('.static-area').html(`<p>Previous Date Second Value<br>(${frappe.datetime.add_days(frm.doc.date, -2)})</p>`);
            
            const colorParam = {
                'areaid': frm.doc.areaid,
                'processid': frm.doc.processid
            }

            frm.call({
                method: 'pqis.anc.doctype.process_measurement.process_measurement.fetch_processspec_for_color',
                args: { 'data':  JSON.stringify(colorParam) },
                    callback: function(response) {
                        console.log("success", response);

                        if (response.message.status === "Success") {
                            if (response.message.message.length !== 0) {
                                const colorValue = response.message.message;
                        
                                $.each(cur_frm.doc["process_measurement_details"], function(i, item) {
                                    let colorItem = colorValue.filter(v => parseInt(v.subprocessid) === parseInt(item.subprocessid) && parseInt(v.propertyid) === parseInt(item.propertyid));

                                    if (colorItem.length !== 0) {
                                        if (item.value >= colorItem[0].ll && item.value <= colorItem[0].hl) {
                                            $("div[data-fieldname=process_measurement_details]").find(`div.grid-row[data-idx=${item.idx}]`).find('.grid-static-col[data-fieldname="value"] div[class="static-area ellipsis"] div').css({'color': '#21130d'});
                                        }

                                        if ((item.value >= colorItem[0].lc && item.value < colorItem[0].ll) || (item.value > colorItem[0].hl && item.value <= colorItem[0].hc)) {
                                            $("div[data-fieldname=process_measurement_details]").find(`div.grid-row[data-idx=${item.idx}]`).find('.grid-static-col[data-fieldname="value"] div[class="static-area ellipsis"] div').css({'color': '#0e7bae'});
                                        } 
                                        
                                        if (item.value < colorItem[0].lc || item.value > colorItem[0].hc) {
                                            $("div[data-fieldname=process_measurement_details]").find(`div.grid-row[data-idx=${item.idx}]`).find('.grid-static-col[data-fieldname="value"] div[class="static-area ellipsis"] div').css({'color': '#C70039'});
                                        }
                                    }

                                    if (item.is_null === "Null") {
                                        $("div[data-fieldname=process_measurement_details]").find(`div.grid-row[data-idx=${item.idx}]`).find('.grid-static-col[data-fieldname="value"] div[class="static-area ellipsis"] div').html("null");
                                        $("div[data-fieldname=process_measurement_details]").find(`div.grid-row[data-idx=${item.idx}]`).find('.grid-static-col[data-fieldname="value"] div[class="static-area ellipsis"] div').css({'color': '#21130d'});
                                    }
                                });
                            }
                        } else {
                            frappe.throw(__(`Failed to fetch process spec records.`));
                        }
                    },
                    error: (r) => {
                        console.log("error", r);
                        frappe.throw(__(`Failed to fetch process spec records.`));
                    }
            });
        }

        if (frm.doc.workflow_state_psm === "Draft") {
            $('.actions-btn-group').hide();

            frm.add_custom_button('Submit', () => {
                frm.set_value('workflow_state', "Entered");
                frm.save();
            }).addClass("btn-primary");

            frm.add_custom_button('Cancel', () => {
                frm.set_value('workflow_state', "Cancelled");
                frm.save();
            });
        }
        
        if (frm.doc.workflow_state_psm === "Entered") {
            cur_frm.page.btn_secondary.hide();

            frm.remove_custom_button('Submit');
            frm.remove_custom_button('Cancel');

            frm.set_df_property('areaid', 'read_only', 1);
            frm.set_df_property('processid', 'read_only', 1);
            frm.set_df_property('date', 'read_only', 1);
            frm.set_df_property('process_measurement_details', 'read_only', 1);
        }

        if (frm.doc.workflow_state_psm === "Cancelled") {
            cur_frm.page.btn_secondary.hide();

            frm.remove_custom_button('Submit');
            frm.remove_custom_button('Cancel');

            frm.set_df_property('areaid', 'read_only', 1);
            frm.set_df_property('processid', 'read_only', 1);
            frm.set_df_property('date', 'read_only', 1);
            frm.set_df_property('process_measurement_details', 'read_only', 1);
        }
	},

    onload(frm, cdt, cdn) {
        // for process link
        frm.set_query("processid", function() {
            return {
                "filters": {
                    "areaid": frm.doc.areaid
                }
            };
        });

        //for subprocess link on child table
        frm.set_query("subprocessid", "process_measurement_details", function() {
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

        cur_frm.clear_table("process_measurement_details"); 
        cur_frm.refresh_fields("process_measurement_details");
    },

    processid(frm) {
        cur_frm.clear_table("process_measurement_details"); 
        cur_frm.refresh_fields("process_measurement_details");

        if (frm.doc.areaid !== undefined && frm.doc.processid !== undefined) {
            fetchChildList(frm);
        }
    },

    date(frm) {
        if (frm.doc.areaid !== undefined && frm.doc.processid !== undefined) {
            cur_frm.clear_table("process_measurement_details"); 
            cur_frm.refresh_fields("process_measurement_details");

            fetchChildList(frm);
        }
    },

    process_measurement_details_on_form_rendered(frm, cdt, cdn) {
        cur_frm.fields_dict["process_measurement_details"].grid.wrapper.find(".grid-insert-row").hide();
        cur_frm.fields_dict["process_measurement_details"].grid.wrapper.find(".grid-append-row").hide();
        cur_frm.fields_dict["process_measurement_details"].grid.wrapper.find(".grid-insert-row-below").hide();
        cur_frm.fields_dict["process_measurement_details"].grid.wrapper.find(".grid-move-row").hide();
    },

    before_save(frm) {
        let newValue = frm.doc.process_measurement_details;

        newValue.map((item) => {    
            item.is_null = item.value === null ? "Null" : "";
        });

        frm.set_value('process_measurement_details', newValue);
        frm.refresh_fields("process_measurement_details");

        if (frm.doc.workflow_state_psm === "Not Saved") {
            frm.set_value('workflow_state', "Draft");
            frm.refresh_fields('workflow_state');
        }
    }
});

function fetchChildList(frm) {
    frm.call({
        method: 'pqis.anc.doctype.process_measurement.process_measurement.fetch_processspec',
        args: { 'data':  JSON.stringify({'areaid': frm.doc.areaid, 'processid': frm.doc.processid}),
                'firstDate': JSON.stringify({'areaid': frm.doc.areaid, 'processid': frm.doc.processid, 'date': frappe.datetime.add_days(frm.doc.date, -1)}),
                'secondDate': JSON.stringify({'areaid': frm.doc.areaid, 'processid': frm.doc.processid, 'date': frappe.datetime.add_days(frm.doc.date, -2)})
              },
        callback: function(response) {
            console.log("success", response);

            if (response.message.status === "Success") {
                let count = response.message.result;

                response.message.message.map((item) => { 
                    let prevValue = "";
                    let prev2ndValue = "";

                    if (response.message.firstprev.length !== 0) {
                        let list = response.message.firstprev.filter(v => parseInt(v.subprocessid) === parseInt(item.subprocessid) && parseInt(v.propertyid) === parseInt(item.propertyid));
                        prevValue = list[0].value;
                    }

                    if (response.message.secondprev.length !== 0) {
                        let secondList = response.message.secondprev.filter(v => parseInt(v.subprocessid) === parseInt(item.subprocessid) && parseInt(v.propertyid) === parseInt(item.propertyid));
                        prev2ndValue = secondList[0].value;
                    }

                    frm.add_child('process_measurement_details', {
                        processmeasurementdtlid: `PSMD0${count++}`,
                        subprocessid: item.subprocessid,
                        subprocessdesc: item.subprocess,
                        propertyid: item.propertyid,
                        property: item.property_name,
                        tag: item.tag,
                        units: item.units,
                        value: null,
                        is_null: "Null",
                        prev_value_first: prevValue,
                        prev_value_second: prev2ndValue
                    });
                });

                frm.refresh_fields("process_measurement_details");

                $.each(cur_frm.doc["process_measurement_details"], function(i, item) {
                    $("div[data-fieldname=process_measurement_details]").find(`div.grid-row[data-idx=${item.idx}]`).find('.grid-static-col[data-fieldname="value"] div[class="static-area ellipsis"] div').html("null");
                });

                $("div[data-fieldname=process_measurement_details]").find(`div.grid-heading-row`).find('.grid-static-col').css('height', '50px');
                $("div[data-fieldname=process_measurement_details]").find(`div.grid-heading-row`).find('.grid-static-col[title="Previous Date Value"]').find('.static-area').html(`<p>Previous Date Value<br>(${frappe.datetime.add_days(frm.doc.date, -1)})</p>`);
                $("div[data-fieldname=process_measurement_details]").find(`div.grid-heading-row`).find('.grid-static-col[title="Previous Second Date Value"]').find('.static-area').html(`<p>Previous Date Second Value<br>(${frappe.datetime.add_days(frm.doc.date, -2)})</p>`);                
            } else {
                frappe.throw(__(`Failed to fetch sub process records.`));
            }
        },
        error: (r) => {
            console.log("error", r);
            frappe.throw(__(`Failed to fetch sub process records.`));
        }
    });
}