// Copyright (c) 2025, ANC and contributors
// For license information, please see license.txt

frappe.ui.form.on("Roll to Reel CMP", {

    // validate: async function (frm) {
    //     let starttime = frm.doc.start_time;
    //     let turnuptime = frm.doc.turnup_time;

    //     const r = await frappe.call({
    //         method: "pqis.anc.doctype.roll_to_reel_cmp.roll_to_reel_cmp.get_MOPS_data",
    //         args: {
    //             starttime: starttime,
    //             turnuptime: turnuptime
    //         },
    //     });

    //     if (r.message) {
    //         let mops_value = r.message;
    //         let difference = parseFloat(frm.doc.roll_bwt) - parseFloat(mops_value);
    //         frm.set_value("reel_bwt", mops_value);
    //         frm.set_value("roll_sub_reel", String(difference));
    //     } else {
    //         frappe.msgprint("VALUE NOT UPDATED");
    //     }
    // }
});
