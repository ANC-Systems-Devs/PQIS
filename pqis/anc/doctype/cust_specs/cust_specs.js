// Copyright (c) 2023, ANC and contributors
// For license information, please see license.txt

frappe.ui.form.on("Cust Specs", {
	refresh(frm) {
        const appRole = frappe.user_roles.includes("Grade Book Admin");
        
        if (appRole === false) {
                cur_frm.fields_dict['customer_spec_detail'].grid.wrapper.find('.btn-open-row').hide();

                hideTheButtonWrapper = $('*[data-fieldname="customer_spec_detail"]');
                hideTheButtonWrapper .find('.grid-add-row').hide();
        }
	},
});

