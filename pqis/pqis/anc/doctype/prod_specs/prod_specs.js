// Copyright (c) 2023, ANC and contributors
// For license information, please see license.txt

frappe.ui.form.on("Prod Specs", {
	refresh(frm) {
        const appRole = frappe.user_roles.includes("Grade Book Admin");
        
        if (appRole === false) {
                cur_frm.fields_dict['product_spec_details'].grid.wrapper.find('.btn-open-row').hide();

                hideTheButtonWrapper = $('*[data-fieldname="product_spec_details"]');
                hideTheButtonWrapper .find('.grid-add-row').hide();
        }
	},
});

