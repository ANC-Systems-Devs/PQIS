import pyodbc

def connect_db():
	try:
		conn = pyodbc.connect(
			'DRIVER={ODBC Driver 17 for SQL Server};'
			'SERVER=10.13.20.10;'
			'DATABASE=TM_DB_PRODUCTION;'
			'UID=sa;'
			'PWD=!LJf22@*'
		)
		cursor = conn.cursor()
		return cursor
	except Exception as e:
		print("Database connection failed: ", e)
		return None


def get_roll_data(reel_id):
	cursor = connect_db()
	if not cursor:
		return

	query = '''
		SELECT inventory_no, basis_weight_actual
		FROM [TM_DB_Production].[tm].[inventory]
		WHERE inventory_no LIKE ?;
	'''

	backup_query = '''
		SELECT inventory_no, basis_weight_actual
		FROM [TM_DB_Production].[tm].[inv_history]
		WHERE inventory_no LIKE ?;
	'''

	query_param = reel_id + "%"

	rows = cursor.execute(query, query_param).fetchall()

	if len(rows) == 0:
		print("No data found in primary table. Trying backup...")
		rows = cursor.execute(backup_query, query_param).fetchall()
    
	total_rolls = len(rows)
	roll_sum = 0

	print("Result:")
	for row in rows:
		roll_sum += row[1]
		print(row)
	
	roll_bwt_average = roll_sum/total_rolls
	print(round(roll_bwt_average,2))




get_roll_data("AB1W0422")
