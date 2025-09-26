// Copyright (c) 2023, ANC and contributors
// For license information, please see license.txt

frappe.ui.form.on("Process Measurement", {
	refresh(frm) {
        $('*[data-fieldname="process_measurement_details"]').find('button.grid-add-row').addClass('hide');

        $('*[data-label="Print"]').closest('a').hide();
        $('*[data-original-title="Print"]').hide();

        frm.set_df_property('processmeasurementid', 'read_only', 1);
        
        if (frm.is_new()) {
            frm.enable_save();

            $('*[data-fieldname="set_time"]').hide();
            $('*[data-fieldname="apply_time"]').hide();

            // Stop setting values to today's date by default
            // frm.set_value('date', frappe.datetime.now_date());
            // frm.refresh_fields('date');
            
            
            frm.set_value('datecreated', frappe.datetime.now_datetime());
            frm.refresh_fields("datecreated");

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
                                        // black
                                        if (parseFloat(item.value) >= colorItem[0].ll && parseFloat(item.value) <= colorItem[0].hl) {
                                            $("div[data-fieldname=process_measurement_details]").find(`div.grid-row[data-idx=${item.idx}]`).find('.grid-static-col[data-fieldname="value"]').css({'background-color': '#21130d'});
                                            $("div[data-fieldname=process_measurement_details]").find(`div.grid-row[data-idx=${item.idx}]`).find('.grid-static-col[data-fieldname="value"] div[class="static-area ellipsis"]').css({'font-weight': 'bold'}).css({'color': '#FFFFFF'});
                                            $("div[data-fieldname=process_measurement_details]").find(`div.grid-row[data-idx=${item.idx}]`).find('.grid-static-col[data-fieldname="value"] div[class="static-area ellipsis"] div').css({'font-weight': 'bold'}).css({'color': '#FFFFFF'});
                                        }

                                        // blue
                                        if ((parseFloat(item.value) >= colorItem[0].lc && parseFloat(item.value) < colorItem[0].ll) || (parseFloat(item.value) > colorItem[0].hl && parseFloat(item.value) <= colorItem[0].hc)) {
                                            $("div[data-fieldname=process_measurement_details]").find(`div.grid-row[data-idx=${item.idx}]`).find('.grid-static-col[data-fieldname="value"]').css({'background-color': '#0e7bae'});
                                            $("div[data-fieldname=process_measurement_details]").find(`div.grid-row[data-idx=${item.idx}]`).find('.grid-static-col[data-fieldname="value"] div[class="static-area ellipsis"]').css({'font-weight': 'bold'}).css({'color': '#FFFFFF'});
                                            $("div[data-fieldname=process_measurement_details]").find(`div.grid-row[data-idx=${item.idx}]`).find('.grid-static-col[data-fieldname="value"] div[class="static-area ellipsis"] div').css({'font-weight': 'bold'}).css({'color': '#FFFFFF'});
                                        } 
                                        
                                        // red
                                        if (parseFloat(item.value) < colorItem[0].lc && parseFloat(item.value) > colorItem[0].hc) {
                                            $("div[data-fieldname=process_measurement_details]").find(`div.grid-row[data-idx=${item.idx}]`).find('.grid-static-col[data-fieldname="value"]').css({'background-color': '#C70039'});
                                            $("div[data-fieldname=process_measurement_details]").find(`div.grid-row[data-idx=${item.idx}]`).find('.grid-static-col[data-fieldname="value"] div[class="static-area ellipsis"]').css({'font-weight': 'bold'}).css({'color': '#FFFFFF'});
                                            $("div[data-fieldname=process_measurement_details]").find(`div.grid-row[data-idx=${item.idx}]`).find('.grid-static-col[data-fieldname="value"] div[class="static-area ellipsis"] div').css({'font-weight': 'bold'}).css({'color': '#FFFFFF'});
                                        }

                                        // purple
                                        if (parseFloat(item.value) < colorItem[0].lr && parseFloat(item.value) > colorItem[0].hr) {
                                            $("div[data-fieldname=process_measurement_details]").find(`div.grid-row[data-idx=${item.idx}]`).find('.grid-static-col[data-fieldname="value"]').css({'background-color': '#9575cd'});
                                            $("div[data-fieldname=process_measurement_details]").find(`div.grid-row[data-idx=${item.idx}]`).find('.grid-static-col[data-fieldname="value"] div[class="static-area ellipsis"]').css({'font-weight': 'bold'}).css({'color': '#FFFFFF'});
                                            $("div[data-fieldname=process_measurement_details]").find(`div.grid-row[data-idx=${item.idx}]`).find('.grid-static-col[data-fieldname="value"] div[class="static-area ellipsis"] div').css({'font-weight': 'bold'}).css({'color': '#FFFFFF'});
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

        if (!frm.is_new()) {
            $("div[data-fieldname=process_measurement_details]").find(`div.grid-heading-row`).find('.grid-static-col').css('height', '50px');
            $("div[data-fieldname=process_measurement_details]").find(`div.grid-heading-row`).find('.grid-static-col[title="Previous Value"]').find('.static-area').html(`<p>Previous Value<br>(${frappe.datetime.add_days(frm.doc.date, -1)})</p>`);
            $("div[data-fieldname=process_measurement_details]").find(`div.grid-heading-row`).find('.grid-static-col[title="Previous -1 Value"]').find('.static-area').html(`<p>Previous -1 Value<br>(${frappe.datetime.add_days(frm.doc.date, -2)})</p>`);
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

    after_workflow_action(frm){
        if (frm.doc.workflow_state == 'Entered'){
            console.log("reached");
            let process_measurement_details_data = []
            frm.doc.process_measurement_details.forEach((row) => {
                process_measurement_details_data.push({
                    "time": row.time,
                    "tag": row.tag,
                    "value": row.value
                })
            });
            frappe.call({
                method: 'pqis.anc.doctype.process_measurement.process_measurement.generate_post_to_esb',
                args: {
                    name: frm.doc.name,
                    date: frm.doc.date,
                    process_measurement_details: process_measurement_details_data
                },
                callback: function(r){
                    // sendFlag = true;
                    console.log("webhook started");
                    console.log(r);
                }
            })
        }
    },

    after_save(frm){
        if(frm.doc.workflow_state == "Entered"){
            console.log("reached");
            let process_measurement_details_data = []
            frm.doc.process_measurement_details.forEach((row) => {
                process_measurement_details_data.push({
                    "time": row.time,
                    "tag": row.tag,
                    "value": row.value
                })
            });
            frappe.call({
                method: 'pqis.anc.doctype.process_measurement.process_measurement.generate_post_to_esb',
                args: {
                    name: frm.doc.name,
                    date: frm.doc.date,
                    process_measurement_details: process_measurement_details_data
                },
                callback: function(r){
                    // sendFlag = true;
                    console.log("webhook started");
                    console.log(r);
                }
            })
        }
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

        // fetchChildList(frm, cur_frm);
        // To prevent duplicate data entr
        if (frm.doc.date){
            fetchChildList(frm, cur_frm);
        }
    },

    date(frm) {
        frm.enable_save();

        fetchChildList(frm, cur_frm);
    },

    apply_time(frm){
        let newValue = frm.doc.process_measurement_details;

        newValue.map((item) => {
            item.time = frm.doc.set_time
        });

        frm.doc.process_measurement_details = newValue;

        frm.refresh_fields('process_measurement_details');
    },

    process_measurement_details_on_form_rendered(frm, cdt, cdn) {
        cur_frm.fields_dict["process_measurement_details"].grid.wrapper.find(".grid-insert-row").hide();
        cur_frm.fields_dict["process_measurement_details"].grid.wrapper.find(".grid-append-row").hide();
        cur_frm.fields_dict["process_measurement_details"].grid.wrapper.find(".grid-insert-row-below").hide();
        cur_frm.fields_dict["process_measurement_details"].grid.wrapper.find(".grid-move-row").hide();
    },

    reprocess(frm) {
        if(frm.doc.workflow_state == "Entered"){
            console.log("reached");
            let process_measurement_details_data = []
            frm.doc.process_measurement_details.forEach((row) => {
                process_measurement_details_data.push({
                    "time": row.time,
                    "tag": row.tag,
                    "value": row.value
                })
            });
            frappe.call({
                method: 'pqis.anc.doctype.process_measurement.process_measurement.generate_post_to_esb',
                args: {
                    name: frm.doc.name,
                    date: frm.doc.date,
                    process_measurement_details: process_measurement_details_data
                },
                callback: function(r){
                    // sendFlag = true;
                    console.log("webhook started");
                    console.log(r);
                }
            })
        }
    }
});

frappe.ui.form.on('Process Measurement Detail', {
    value(frm, cdt, cdn) {
        validateValue(frm,cdt,cdn);
    },
 });

function fetchChildList(frm, cur_frm) {
    
    // frm.doc.areaid != undefined && frm.doc.processid != undefined

    // allow childDoc fetch when area,process,date is set - to prevent duplication of rows
    if (frm.doc.areaid && frm.doc.processid && frm.doc.date) {
        $('*[data-fieldname="set_time"]').hide();
        $('*[data-fieldname="apply_time"]').hide();

        cur_frm.clear_table("process_measurement_details"); 
        cur_frm.refresh_fields("process_measurement_details");

        frm.call({
            method: 'pqis.anc.doctype.process_measurement.process_measurement.fetch_processspec',
            args: { 'data':  JSON.stringify({'areaid': frm.doc.areaid, 'processid': frm.doc.processid, 'active': 1, 'workflow_state': ['!=', 'Draft']}),
                    'firstDate': JSON.stringify({'areaid': frm.doc.areaid, 'processid': frm.doc.processid, 'date': frappe.datetime.add_days(frm.doc.date, -1)}),
                    'secondDate': JSON.stringify({'areaid': frm.doc.areaid, 'processid': frm.doc.processid, 'date': frappe.datetime.add_days(frm.doc.date, -2)})
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
                                    prevValue = list[0]?.value;
                                }

                                if (response.message.secondprev.length !== 0) {
                                    let secondList = response.message.secondprev.filter(v => parseInt(v.subprocessid) === parseInt(item.subprocessid) && parseInt(v.propertyid) === parseInt(item.propertyid));
                                    prev2ndValue = secondList[0]?.value;
                                }

                                let formattedString = String(count++).padStart(4, '0');

                                frm.add_child('process_measurement_details', {
                                    time: frappe.datetime.now_time(),
                                    processmeasurementdtlid: `PRCMDTL0${formattedString}`,
                                    subprocessid: item.subprocessid,
                                    subprocessdesc: item.subprocess,
                                    propertyid: item.propertyid,
                                    property: item.property_name,
                                    tag: item.tag,
                                    units: item.units,
                                    measureid: item.measureid == null ? "null" : item.measureid,
                                    measurename: item.measurename,
                                    value: "",
                                    prev_value_first: prevValue,
                                    prev_value_second: prev2ndValue
                                });
                            }
                        });

                        frm.refresh_fields("process_measurement_details");
                        frm.set_value('set_time', frappe.datetime.now_time());
                        frm.refresh_fields('set_time');
                        
                        $('*[data-fieldname="set_time"]').show();
                        $('*[data-fieldname="apply_time"]').show();

                        $("div[data-fieldname=process_measurement_details]").find(`div.grid-heading-row`).find('.grid-static-col').css('height', '50px');
                        $("div[data-fieldname=process_measurement_details]").find(`div.grid-heading-row`).find('.grid-static-col[title="Previous Value"]').find('.static-area').html(`<p>Previous Value<br>(${frappe.datetime.add_days(frm.doc.date, -1)})</p>`);
                        $("div[data-fieldname=process_measurement_details]").find(`div.grid-heading-row`).find('.grid-static-col[title="Previous -1 Value"]').find('.static-area').html(`<p>Previous -1 Value<br>(${frappe.datetime.add_days(frm.doc.date, -2)})</p>`);
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

function validateValue(frm,cdt,cdn) {
    let item = locals[cdt][cdn];
 
    if (item.value != null && item.value !== "") {
        if (!$.isNumeric(item.value)) {
            item.value = "";
            frm.refresh_fields('process_measurement_details');
            frappe.throw(__(`Value must be a number.`));
        }
    }
}