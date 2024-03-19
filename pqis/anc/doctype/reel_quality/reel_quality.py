# Copyright (c) 2023, ANC and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class ReelQuality(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF
		from pqis.anc.doctype.reel_quality_detail.reel_quality_detail import ReelQualityDetail

		average: DF.Float
		detailcount: DF.Float
		maximum: DF.Float
		mean: DF.Float
		median: DF.Float
		minimum: DF.Float
		name: DF.Int | None
		property: DF.Data | None
		propertyid: DF.Link | None
		reel_quality_detail: DF.Table[ReelQualityDetail]
		reelid: DF.Link | None
		reelqualityid: DF.Data
		scanfrequency: DF.Float
		scanlength: DF.Float
		standard_deviation: DF.Float
		value: DF.Data | None
		valuetype: DF.Data | None
	# end: auto-generated types
	pass
