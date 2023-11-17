// Copyright (c) 2023, ANC and contributors
// For license information, please see license.txt

let isWeeklyClicked = false;
let subprocess = "";
let subprocessDesc = "";

let datatable; 

frappe.ui.form.on("Process Specs", {
	refresh(frm) {
        isWeeklyClicked = false;

        $('*[data-fieldname="section_break_dvys"]').hide();

        if (frm.is_new()) {
            frm.set_value('workflow_state', "Not Saved");
            frm.refresh_fields('workflow_state');

            frm.call({
                method: 'pqis.anc.doctype.process_specs.process_specs.auto_increment_id',
                callback: function(response) {
                    console.log("success", response);
        
                    if (response.message.status === "Success") {
                        frm.set_value('processspecid', response.message.result);
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

        // if (!frm.is_new()) {
        //     frm.add_custom_button('Weekly Report', () => {
        //         $('*[data-fieldname="process_spec_details"]').hide();
        //         $('button[data-label="Weekly%20Report"]').hide();
                
        //         isWeeklyClicked = true;

        //         frm.set_df_property("processspecid", "read_only", 1);
        //         frm.disable_save();

        //         $('button[data-label="Back"]').show();
        //         $('*[data-fieldname="section_break_dvys"]').show();

        //         frm.fields_dict['html_ztrj'].html(` <style>
        //                                                 ul, #Area {
        //                                                             list-style-type: none;
        //                                                         }
                                                
        //                                                 #Area {
        //                                                         margin: 0;
        //                                                         padding: 0;
        //                                                     }
                                                
        //                                                 .caret {
        //                                                         cursor: pointer;
        //                                                         -webkit-user-select: none;
        //                                                         -moz-user-select: none;
        //                                                         -ms-user-select: none;
        //                                                         user-select: none;
        //                                                     }
                                                
        //                                                 .caret::before {
        //                                                                 content: "\\25B6";
        //                                                                 color: black;
        //                                                                 display: inline-block;
        //                                                                 margin-right: 6px;
        //                                                             }
                                                
        //                                                 .caret-down::before {
        //                                                                     -ms-transform: rotate(90deg);
        //                                                                     -webkit-transform: rotate(90deg);
        //                                                                     transform: rotate(90deg);  
        //                                                                     }
                                                
        //                                                 .nested {
        //                                                             display: none;
        //                                                         }
                                                
        //                                                 .active {
        //                                                             display: block;
        //                                                         }

        //                                                 .fetch {
        //                                                             cursor: pointer;
        //                                                     }
                                                            
        //                                                 .selected {
        //                                                             background: #66c2ff;
        //                                                         }
                                                        
        //                                                 .selected span {
        //                                                                 color: #ffffff;
        //                                                             }
        //                                             </style>
                                            
        //                                             <ul id="Area">
        //                                                 <li><span class="caret caret-down">Environment</span>
        //                                                     <ul class="nested active">
        //                                                         <li><span class="caret caret-down">Effluent Treatment</span>
        //                                                             <ul class="nested active">
        //                                                                 <li class="fetch selected" data-name="Green River"><span>Green River</span></li>
        //                                                                 <li class="fetch" data-name="Effluent"><span>Effluent</span></li>
        //                                                                 <li class="fetch" data-name="Flows"><span>Flows</span></li>
        //                                                                 <li class="fetch" data-name="Bucket Samples"><span>Bucket Samples</span></li>
        //                                                                 <li class="fetch" data-name="Red River"><span>Red River</span></li>
        //                                                             </ul>
        //                                                         </li>
        //                                                         <li class="fetch" data-name="Water Treatment"><span>&#x268A; Water Treatment</span></li>
        //                                                     </ul>
        //                                                 </li>
        //                                                 <li class="fetch" data-name="Pulp"><span>&#x268A; Pulp</span></li>
        //                                                 <li><span class="caret">Raw Material</span>
        //                                                     <ul class="nested">
        //                                                         <li class="fetch" data-name="KIND">KIND</li>
        //                                                         <li class="fetch" data-name="HOK">HOK</li>
        //                                                         <li class="fetch" data-name="Vrieshank">Vrieshank</li>
        //                                                     </ul>
        //                                                 </li>
        //                                                 <li class="fetch" data-name="PM1 Wet End"><span>&#x268A; PM1 Wet End</span></li>
        //                                             </ul> `);

        //         //for tree view
        //         const toggler = Array.from($(".caret"));

        //         toggler.map((element, id) => {
        //             toggler[id].addEventListener("click", function() {
        //                 this.parentElement.querySelector(".nested").classList.toggle("active");
        //                 this.classList.toggle("caret-down");
        //             });
        //         });

        //         //fetch data
        //         $('.fetch').click(function() {
        //             $('.fetch').removeClass("selected");
        //             $(this).addClass("selected");
                    
        //             const details = $(this).attr("data-name");
        //             const date = new Date(frm.doc.date);
        //             date.setDate(date.getDate() + 6);

        //             fetchWeeklyData(frm.doc.processspecid, frm.doc.date, moment(date).format("YYYY-MM-DD"), details);
        //         });

        //         frm.fields_dict['html_nzrn'].html(` <link href="https://unpkg.com/frappe-datatable@0.0.5/dist/frappe-datatable.min.css" rel="stylesheet">
        //                                             <div id="datatable"></div>
        //                                             <script src="https://unpkg.com/sortablejs@1.7.0/Sortable.min.js"></script>
        //                                             <script src="https://unpkg.com/clusterize.js@0.18.0/clusterize.min.js"></script>
        //                                             <script src="https://unpkg.com/frappe-datatable@0.0.5/dist/frappe-datatable.min.js"></script> `);

        //         const details = $(".selected").attr("data-name");
        //         const date = new Date(frm.doc.date);
        //         date.setDate(date.getDate() + 6);

        //         fetchWeeklyData(frm.doc.processspecid, frm.doc.date, moment(date).format("YYYY-MM-DD"), details);
        //     }).addClass("btn-info");

        //     frm.add_custom_button('Back', () => {
        //         frm.reload_doc();
        //         frm.fields_dict['html_ztrj'].html(``);
        //         frm.fields_dict['html_nzrn'].html(``);
        //         frm.set_df_property("processspecid", "read_only", 0);
        //         frm.enable_save();

        //         $('*[data-fieldname="section_break_dvys"]').hide();
        //         $('*[data-fieldname="process_spec_details"]').show();
        //         $('button[data-label="Weekly%20Report"]').show();
                
        //         isWeeklyClicked = false;

        //         $('button[data-label="Back"]').hide();
        //     }).addClass("btn-warning");

        //     $('button[data-label="Back"]').hide();
        // }
	},

    onload(frm, cdt, cdn) {
        if (frm.doc.workflow_state_pssp === "Entered") {
            frm.set_df_property('areaid', 'read_only', 1);
            frm.set_df_property('processid', 'read_only', 1);

            cur_frm.fields_dict['process_spec_details'].grid.wrapper.find('.btn-open-row').hide();
            $('*[data-fieldname="process_spec_details"]').find('.grid-add-row').hide();
            frm.set_df_property('process_spec_details', 'read_only', 1);
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

        //for sub process link
        // frm.set_query("subprocessid", function() {
        //     return {
        //         "filters": {
        //             "processid": frm.doc.processid
        //         }
        //     };
        // });

        //for property link on child table
        // frm.set_query("propertyid", "process_spec_details", function() {
        //     return {
        //         "filters": {
        //             "subprocessid": frm.doc.subprocessid
        //         }
        //     }
        // });
    },

    date(frm) {
        if (isWeeklyClicked) {
            const details = $(".selected").attr("data-name");
            const date = new Date(frm.doc.date);
            date.setDate(date.getDate() + 6);

            fetchWeeklyData(frm.doc.processspecid, frm.doc.date, moment(date).format("YYYY-MM-DD"), details);
        }
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
                                 'processid': frm.doc.processid
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
                                processspecdtlid: `PSSPD0${response.message.result}`,
                                subprocessid: item.name,
                                subprocess: item.description
                            });
                            frm.refresh_fields("process_spec_details");
                        });
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
    },

    // subprocessid(frm) { 
    //     cur_frm.clear_table("process_spec_details"); 
    //     cur_frm.refresh_fields("process_spec_details");
    // },

    before_save(frm) {
        if (frm.doc.workflow_state_pssp === "Not Saved") {
            frm.set_value('workflow_state', "Draft");
            frm.refresh_fields('workflow_state');
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
                    item.processspecdtlid = `PSSPD0${response.message.result + 1}`;
                } else {
                    item.processspecdtlid = `PSSPD0${frm.doc.process_spec_details.length + 1}`;
                }
            },
            error: (r) => {
                console.log("error", r);
                
                item.processspecdtlid = `PSSPD0${frm.doc.process_spec_details.length + 1}`;
            }
        });
        
        if (subprocess !== "") {
            item.subprocessid = subprocess;
            item.subprocess = subprocessDesc;
        }
    }
});

function fetchChildDoctype(frm, detail) {
    let value = "";
    switch (detail) {
        case "Green River":
            value = {
                'parent': frm.doc.name,
                'area': 1,
                'process_id': 2,
                'subprocess': 2
            }
            break;
        case "Effluent":
            value = {
                'parent': frm.doc.name,
                'area': 1,
                'process_id': 2,
                'subprocess': 1
            }
            break;
        case "Flows":
            value = {
                'parent': frm.doc.name,
                'area': 1,
                'process_id': 2,
                'subprocess': 3
            }
            break;
        case "Bucket Samples":
            value = {
                'parent': frm.doc.name,
                'area': 1,
                'process_id': 2,
                'subprocess': 5
            }
            break;
        case "Red River":
            value = {
                'parent': frm.doc.name,
                'area': 1,
                'process_id': 2,
                'subprocess': 6
            }
            break;
        case "Water Treatment":
            value = {
                'parent': frm.doc.name,
                'area': 1,
                'process_id': 3
            }
            break;
        case "Pulp":
            value = {
                'parent': frm.doc.name,
                'area': 3
            }
            break;
        case "KIND":
            value = {
                'parent': frm.doc.name,
                'area': 2,
                'process_id': 4
            }
            break;
        case "HOK":
            value = {
                'parent': frm.doc.name,
                'area': 2,
                'process_id': 5
            }
            break;
        case "Vrieshank":
            value = {
                'parent': frm.doc.name,
                'area': 2,
                'process_id': 6
            }
            break;
        case "PM1 Wet End":
            value = {
                'parent': frm.doc.name,
                'area': 4
            }
            break;
    }

    frm.call({
        method: 'pqis.anc.doctype.process_specs.process_specs.fetch_psdtl',
        args: { 'data': JSON.stringify(value) },
        callback: function(response) {
            console.log("success", response);

            if (response.message.status === "Success") {
                if (response.message.message.length != 0) {
                    response.message.message.map((item) => {
                        arrayChildTbl.push(item);

                        frm.add_child('process_spec_details', item);
                        frm.refresh_fields("process_spec_details");
                    });
                }
            } else {
                frappe.throw(__(`Failed to fetch ` + detail + ` records.`));
            }
        },
        error: (r) => {
            console.log("error", r);
            frappe.throw(__(`Failed to fetch ` + detail + ` records.`));
        }
    });
}

function fetchWeeklyData(processspecid, dateStart, dateEnd, detail) {
    let value = "";
    switch (detail) {
        case "Green River":
            value = {
                'processspecid': processspecid,
                'area': 1,
                'process_id': 2,
                'subprocess': 2,
                'prsdtl_date': ['between', [dateStart, dateEnd]]
            }
            break;
        case "Effluent":
            value = {
                'processspecid': processspecid,
                'area': 1,
                'process_id': 2,
                'subprocess': 1,
                'prsdtl_date': ['between', [dateStart, dateEnd]]
            }
            break;
        case "Flows":
            value = {
                'processspecid': processspecid,
                'area': 1,
                'process_id': 2,
                'subprocess': 3,
                'prsdtl_date': ['between', [dateStart, dateEnd]]
            }
            break;
        case "Bucket Samples":
            value = {
                'processspecid': processspecid,
                'area': 1,
                'process_id': 2,
                'subprocess': 5,
                'prsdtl_date': ['between', [dateStart, dateEnd]]
            }
            break;
        case "Red River":
            value = {
                'processspecid': processspecid,
                'area': 1,
                'process_id': 2,
                'subprocess': 6,
                'prsdtl_date': ['between', [dateStart, dateEnd]]
            }
            break;
        case "Water Treatment":
            value = {
                'processspecid': processspecid,
                'area': 1,
                'process_id': 3,
                'prsdtl_date': ['between', [dateStart, dateEnd]]
            }
            break;
        case "Pulp":
            value = {
                'processspecid': processspecid,
                'area': 3,
                'prsdtl_date': ['between', [dateStart, dateEnd]]
            }
            break;
        case "KIND":
            value = {
                'processspecid': processspecid,
                'area': 2,
                'process_id': 4,
                'prsdtl_date': ['between', [dateStart, dateEnd]]
            }
            break;
        case "HOK":
            value = {
                'processspecid': processspecid,
                'area': 2,
                'process_id': 5,
                'prsdtl_date': ['between', [dateStart, dateEnd]]
            }
            break;
        case "Vrieshank":
            value = {
                'processspecid': processspecid,
                'area': 2,
                'process_id': 6,
                'prsdtl_date': ['between', [dateStart, dateEnd]]
            }
            break;
        case "PM1 Wet End":
            value = {
                'processspecid': processspecid,
                'area': 4,
                'prsdtl_date': ['between', [dateStart, dateEnd]]
            }
            break;
    }

    frappe.call({
        method: 'pqis.anc.doctype.process_specs.process_specs.fetch_weekly_rpt',
        args: { 'data': JSON.stringify(value) },
        callback: function(response) {
            console.log("success", response);

            if (response.message.status === "Success") {
                let result = [];

                    
                if (response.message.message.length != 0) {
                    response.message.message.map((item) => {
                        result.push([ item.property_name, item.units, item.prsdtl_date, item.time, item.target ]);
                    });
                }

                datatable = new DataTable('#datatable', {
                                                            columns: [{ name: 'Property', },
                                                                        { name: 'Units', },
                                                                        { name: 'Date', format: value => moment(value).format("MM/DD/YYYY")},
                                                                        { name: 'Time', },
                                                                        { name: 'Target'}],
                                                            data: result,
                                                            layout: 'fixed',
                                                            noDataMessage: 'No records',
                                                            getEditor: function() {
                                                                return {
                                                                    initValue(value) {
                                                                        oldValue = value;
                                                                    },
                                                                }
                                                            }
                                                        });
            } else {
                frappe.throw(__(`Failed to fetch weekly reports.`));
            }
        },
        error: (r) => {
            console.log("error", r);
            frappe.throw(__(`Failed to fetch weekly reports.`));
        }
    });
}