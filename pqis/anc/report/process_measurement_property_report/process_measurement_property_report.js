// Copyright (c) 2023, ANC and contributors
// For license information, please see license.txt

frappe.query_reports["Process Measurement Property Report"] = {
	"filters": [
		{
            'fieldname': 'propertyid',
            'label': 'Property ID',
            'fieldtype': 'Link',
            'options': 'Property'
        },
		{
            'fieldname': 'datefrm',
            'label': 'Date From',
            'fieldtype': 'Date',
            'default': frappe.datetime.now_date()
        },
		{
            'fieldname': 'dateto',
            'label': 'Date To',
            'fieldtype': 'Date',
            'default': frappe.datetime.now_date()
        },
	],
	"formatter": function(value, row, column, data, default_formatter) {
		let response = default_formatter(value, row, column, data);
		if (data.nullstat === "Null") {
			if (column.id == "value") {
				response = "<div style='text-align: right'>null</div>";
			}
		} 
		
		return response;
	},
};
