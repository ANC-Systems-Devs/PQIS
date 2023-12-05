// Copyright (c) 2023, ANC and contributors
// For license information, please see license.txt

frappe.query_reports["Process Measurement Weekly Report"] = {
	"filters": [
		{
            'fieldname': 'date',
            'label': 'Week Start Date',
            'fieldtype': 'Date',
            'default': frappe.datetime.now_date()
        },
	],
	"formatter": function(value, row, column, data, default_formatter) {
		let response = default_formatter(value, row, column, data);

		//current
		if (data.week_start_date == null) {
			if (column.id === "week_start_date") {
				response = "<div style='text-align: right'>null</div>";
			}
		} else {
			if (data.isnull === "Null") {
				if (column.id === "week_start_date") {
					response = "<div style='text-align: right'>null</div>";
				}
			}
		}
		
		//1st
		if (data.week_start_date_fst == null) {
			if (column.id === "week_start_date_fst") {
				response = "<div style='text-align: right'>null</div>";
			}
		} else {
			if (data.isnull === "Null") {
				if (column.id === "week_start_date_fst") {
					response = "<div style='text-align: right'>null</div>";
				}
			}
		}

		//2nd
		if (data.week_start_date_snd) {
			if (column.id === "week_start_date_snd") {
				response = "<div style='text-align: right'>null</div>";
			}
		} else {
			if (data.isnull === "Null") {
				if (column.id === "week_start_date_snd") {
					response = "<div style='text-align: right'>null</div>";
				}
			}
		}

		//3rd
		if (data.week_start_date_trd == null) {
			if (column.id === "week_start_date_trd") {
				response = "<div style='text-align: right'>null</div>";
			}
		} else {
			if (data.isnull === "Null") {
				if (column.id === "week_start_date_trd") {
					response = "<div style='text-align: right'>null</div>";
				}
			}
		}

		//4th
		if (data.week_start_date_frth == null) {
			if (column.id === "week_start_date_frth") {
				response = "<div style='text-align: right'>null</div>";
			}
		} else {
			if (data.isnull === "Null") {
				if (column.id === "week_start_date_frth") {
					response = "<div style='text-align: right'>null</div>";
				}
			}
		}

		//5th
		if (data.week_start_date_ffth === null) {
			if (column.id === "week_start_date_ffth") {
				response = "<div style='text-align: right'>null</div>";
			}
		} else {
			if (data.isnull === "Null") {
				if (column.id === "week_start_date_ffth") {
					response = "<div style='text-align: right'>null</div>";
				}
			}
		}

		//6th
		if (data.week_start_date_sxth == null) { 
			if (column.id === "week_start_date_sxth") {
				response = "<div style='text-align: right'>null</div>";
			}
		} else {
			if (data.isnull === "Null") {
				if (column.id === "week_start_date_sxth") {
					response = "<div style='text-align: right'>null</div>";
				}
			}
		}

		//7th
		if (data.week_start_date_svnth == null) {
			if (column.id === "week_start_date_svnth") {
				response = "<div style='text-align: right'>null</div>";
			}
		} else {
			if (data.isnull === "Null") {
				if (column.id === "week_start_date_svnth") {
					response = "<div style='text-align: right'>null</div>";
				}
			}
		}

		return response;
	},
};
