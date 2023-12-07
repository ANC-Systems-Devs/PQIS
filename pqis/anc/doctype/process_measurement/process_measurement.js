// Copyright (c) 2023, ANC and contributors
// For license information, please see license.txt

frappe.ui.form.on("Process Measurement", {
	refresh(frm) {
        $('*[data-fieldname="process_measurement_details"]').find('button.grid-add-row').addClass('hide');

        if (frm.is_new()) {
            frm.enable_save();

            frm.set_value('workflow_state_psm', "Not Saved");
            frm.refresh_fields('workflow_state_psm');

            frm.set_value('date', frappe.datetime.now_date());
            frm.refresh_fields('date');

            frm.set_value('datecreated', frappe.datetime.now_datetime());
            frm.refresh_fields("datecreated");

            frm.remove_custom_button('Submit');
            frm.remove_custom_button('Cancel');

            frm.call({
                method: 'pqis.anc.doctype.process_measurement.process_measurement.auto_increment_id',
                callback: function(response) {
                    console.log("success", response);
        
                    if (response.message.status === "Success") {
                        frm.set_value('processmeasurementid', response.message.message);
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
            frm.enable_save();

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
                                        if (item.is_null !== "Null") {
                                            // black
                                            if (item.value >= colorItem[0].ll && item.value <= colorItem[0].hl) {
                                                $("div[data-fieldname=process_measurement_details]").find(`div.grid-row[data-idx=${item.idx}]`).find('.grid-static-col[data-fieldname="value"]').css({'background-color': '#21130d'});
                                                $("div[data-fieldname=process_measurement_details]").find(`div.grid-row[data-idx=${item.idx}]`).find('.grid-static-col[data-fieldname="value"] div[class="static-area ellipsis"] div').css({'font-weight': 'bold'}).css({'color': '#FFFFFF'});
                                            }

                                            // blue
                                            if ((item.value >= colorItem[0].lc && item.value < colorItem[0].ll) || (item.value > colorItem[0].hl && item.value <= colorItem[0].hc)) {
                                                $("div[data-fieldname=process_measurement_details]").find(`div.grid-row[data-idx=${item.idx}]`).find('.grid-static-col[data-fieldname="value"]').css({'background-color': '#0e7bae'});
                                                $("div[data-fieldname=process_measurement_details]").find(`div.grid-row[data-idx=${item.idx}]`).find('.grid-static-col[data-fieldname="value"] div[class="static-area ellipsis"] div').css({'font-weight': 'bold'}).css({'color': '#FFFFFF'});
                                            } 
                                            
                                            // red
                                            if (item.value < colorItem[0].lc || item.value > colorItem[0].hc) {
                                                $("div[data-fieldname=process_measurement_details]").find(`div.grid-row[data-idx=${item.idx}]`).find('.grid-static-col[data-fieldname="value"]').css({'background-color': '#C70039'});
                                                $("div[data-fieldname=process_measurement_details]").find(`div.grid-row[data-idx=${item.idx}]`).find('.grid-static-col[data-fieldname="value"] div[class="static-area ellipsis"] div').css({'font-weight': 'bold'}).css({'color': '#FFFFFF'});
                                            }

                                            // purple
                                            if (item.value < colorItem[0].lr || item.value > colorItem[0].hr) {
                                                $("div[data-fieldname=process_measurement_details]").find(`div.grid-row[data-idx=${item.idx}]`).find('.grid-static-col[data-fieldname="value"]').css({'background-color': '#9575cd'});
                                                $("div[data-fieldname=process_measurement_details]").find(`div.grid-row[data-idx=${item.idx}]`).find('.grid-static-col[data-fieldname="value"] div[class="static-area ellipsis"] div').css({'font-weight': 'bold'}).css({'color': '#FFFFFF'});
                                            }
                                        }

                                        if (item.is_null === "Null") {
                                            $("div[data-fieldname=process_measurement_details]").find(`div.grid-row[data-idx=${item.idx}]`).find('.grid-static-col[data-fieldname="value"] div[class="static-area ellipsis"] div').html("null");
                                        }
                                    }
                                });
                            }
                        } else {
                            frappe.throw(__(`Failed to fetch Process Spec records.`));
                        }
                    },
                    error: (r) => {
                        console.log("error", r);
                        frappe.throw(__(`Failed to fetch Process Spec records.`));
                    }
            });
        }

        if (frm.doc.workflow_state_psm === "Draft") {
            $('.actions-btn-group').hide();

            frm.set_df_property('processmeasurementid', 'read_only', 1);

            frm.add_custom_button('Submit', () => {
                frm.set_value('workflow_state_psm', "Entered");
                frm.save();
            }).addClass("btn-primary");

            frm.add_custom_button('Cancel', () => {
                frm.set_value('workflow_state_psm', "Cancelled");
                frm.save();
            });

            let newValue = frm.doc.process_measurement_details;

            newValue.map((item) => {
                item.value = item.is_null === "Null" ? undefined : item.value;
            });

            frm.doc.process_measurement_details = newValue;
        }
        
        if (frm.doc.workflow_state_psm === "Entered") {
            $('.actions-btn-group').hide();

            cur_frm.page.btn_secondary.hide();

            frm.remove_custom_button('Submit');
            frm.remove_custom_button('Cancel');
            frm.set_df_property('processmeasurementid', 'read_only', 1);

            if (frm.doc.cannot_edit === 1) {
                frm.set_df_property('processmeasurementid', 'read_only', 1);
                frm.set_df_property('areaid', 'read_only', 1);
                frm.set_df_property('processid', 'read_only', 1);
                frm.set_df_property('date', 'read_only', 1);
                frm.set_df_property('process_measurement_details', 'read_only', 1);
            }

            frm.add_custom_button('Submit', () => {
                frm.set_value('workflow_state_psm', "Updated");
                frm.save();
            }).addClass("btn-primary");
        }

        if (frm.doc.workflow_state_psm === "Updated") {
            cur_frm.page.btn_secondary.hide();

            frm.set_df_property('processmeasurementid', 'read_only', 1);
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

        if (!frm.is_new()) {
            $("div[data-fieldname=process_measurement_details]").find(`div.grid-heading-row`).find('.grid-static-col').css('height', '50px');
            $("div[data-fieldname=process_measurement_details]").find(`div.grid-heading-row`).find('.grid-static-col[title="Previous Date Value"]').find('.static-area').html(`<p>Previous Date Value<br>(${frappe.datetime.add_days(frm.doc.date, -1)})</p>`);
            $("div[data-fieldname=process_measurement_details]").find(`div.grid-heading-row`).find('.grid-static-col[title="Previous Second Date Value"]').find('.static-area').html(`<p>Previous Second Date Value<br>(${frappe.datetime.add_days(frm.doc.date, -2)})</p>`);
        }
	},

    process_measurement_details(frm) {

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
        frm.enable_save();

        cur_frm.clear_table("process_measurement_details"); 
        cur_frm.refresh_fields("process_measurement_details");

        frm.set_value('processid', undefined);
        frm.refresh_fields('processid');
        frm.set_value('processdesc', undefined);
        frm.refresh_fields('processdesc');
    },

    processid(frm) {
        frm.enable_save();

        fetchChildList(frm, cur_frm);
    },

    date(frm) {
        frm.enable_save();

        fetchChildList(frm, cur_frm);
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
            if (frm.doc.workflow_state_psm === "Not Saved" || frm.doc.workflow_state_psm === "Draft" || frm.doc.workflow_state_psm === "Entered") {
                item.is_null = item.value === undefined ? "Null" : "";
            }
        });

        frm.set_value('process_measurement_details', newValue);
        frm.refresh_fields("process_measurement_details");

        if (frm.doc.workflow_state_psm === "Not Saved") {
            frm.set_value('workflow_state_psm', "Draft");
            frm.refresh_fields('workflow_state_psm');
        }
    }
});

frappe.ui.form.on('Process Measurement Detail', {
    value(frm, cdt, cdn) {
        let item = locals[cdt][cdn];
 
        if (item.value == null) {
            item.is_null = "Null";
            item.value = undefined;
        } else {
            item.is_null = "";
        }
        
        frm.refresh_field('process_measurement_details');
    }
 });

function fetchChildList(frm, cur_frm) {
    if (frm.doc.areaid != undefined && frm.doc.processid != undefined) {
        cur_frm.clear_table("process_measurement_details"); 
        cur_frm.refresh_fields("process_measurement_details");

        frm.call({
            method: 'pqis.anc.doctype.process_measurement.process_measurement.fetch_processspec',
            args: { 'data':  JSON.stringify({'areaid': frm.doc.areaid, 'processid': frm.doc.processid, 'active': 1, 'workflow_state_pssp': ['!=', 'Draft']}),
                    'firstDate': JSON.stringify({'areaid': frm.doc.areaid, 'processid': frm.doc.processid, 'date': frappe.datetime.add_days(frm.doc.date, -1), 'workflow_state_psm': "Entered"}),
                    'secondDate': JSON.stringify({'areaid': frm.doc.areaid, 'processid': frm.doc.processid, 'date': frappe.datetime.add_days(frm.doc.date, -2), 'workflow_state_psm': "Entered"})
                },
            callback: function(response) {
                console.log("success", response);

                const currentDate = frm.doc.date;
                const currentTime = frappe.datetime.now_time();

                if (response.message.status === "Success") {
                    let count = response.message.result;

                    if (response.message.parent == null) {
                        frappe.msgprint({
                            title: __('Warning'),
                            indicator: 'red',
                            message: __(`Area ${frm.doc.areaid} and Process ${frm.doc.processid} combination is still in Draft state.`)
                        });

                        frm.disable_save();
                    } else {
                        response.message.message.map((item) => {
                            let canAddChild = true;
                            
                            if (item.startdate == null && item.enddate == null) {
                                if (currentTime >= item.starttime && currentTime < item.endtime) {
                                    canAddChild = false;
                                }
                            } else if (item.starttime == null && item.endtime == null) {
                                if (currentDate >= item.startdate && currentDate <= item.enddate) {
                                    canAddChild = false;
                                }
                            } else {
                                if ((currentDate >= item.startdate && currentDate <= item.enddate) || (currentTime >= item.starttime && currentTime <= item.endtime)) {
                                    canAddChild = false;
                                }
                            }
                            
                            if (canAddChild) {
                                let prevValue = "";
                                let prev2ndValue = "";

                                if (response.message.firstprev.length !== 0) {
                                    let list = response.message.firstprev.filter(v => parseInt(v.subprocessid) === parseInt(item.subprocessid) && parseInt(v.propertyid) === parseInt(item.propertyid));
                                    prevValue = list[0].is_null === "Null" ? "null" : list[0].value;
                                }

                                if (response.message.secondprev.length !== 0) {
                                    let secondList = response.message.secondprev.filter(v => parseInt(v.subprocessid) === parseInt(item.subprocessid) && parseInt(v.propertyid) === parseInt(item.propertyid));
                                    prev2ndValue = secondList[0].is_null === "Null" ? "null" : secondList[0].value;
                                }

                                let formattedString = String(count++).padStart(4, '0');

                                frm.add_child('process_measurement_details', {
                                    processmeasurementdtlid: `PRCMDTL0${formattedString}`,
                                    subprocessid: item.subprocessid,
                                    subprocessdesc: item.subprocess,
                                    propertyid: item.propertyid,
                                    property: item.property_name,
                                    tag: item.tag,
                                    units: item.units,
                                    measureid: item.measureid == null ? "null" : item.measureid,
                                    measurename: item.measurename,
                                    value: undefined,
                                    is_null: "Null",
                                    prev_value_first: prevValue,
                                    prev_value_second: prev2ndValue
                                });
                            }
                        });

                        frm.refresh_fields("process_measurement_details");

                        $.each(cur_frm.doc["process_measurement_details"], function(i, item) {
                            $("div[data-fieldname=process_measurement_details]").find(`div.grid-row[data-idx=${item.idx}]`).find('.grid-static-col[data-fieldname="value"] div[class="static-area ellipsis"] div').html("null");
                        });

                        $("div[data-fieldname=process_measurement_details]").find(`div.grid-heading-row`).find('.grid-static-col').css('height', '50px');
                        $("div[data-fieldname=process_measurement_details]").find(`div.grid-heading-row`).find('.grid-static-col[title="Previous Date Value"]').find('.static-area').html(`<p>Previous Date Value<br>(${frappe.datetime.add_days(frm.doc.date, -1)})</p>`);
                        $("div[data-fieldname=process_measurement_details]").find(`div.grid-heading-row`).find('.grid-static-col[title="Previous Second Date Value"]').find('.static-area').html(`<p>Previous Date Second Value<br>(${frappe.datetime.add_days(frm.doc.date, -2)})</p>`);
                    }
                } else {
                    frappe.throw(__(`Failed to fetch Process Spec records.`));
                }
            },
            error: (r) => {
                console.log("error", r);
                frappe.throw(__(`Failed to fetch Process Spec records.`));
            }
        });
    }
}