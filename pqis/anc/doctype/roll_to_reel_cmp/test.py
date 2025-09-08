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
		if row[1]:
			roll_sum += row[1]
		# print(row)
	
	roll_bwt_average = roll_sum/total_rolls
	print(f"My query: {round(roll_bwt_average,2)}")
	return rows



def get_roll_bwt(reel_id=None):
	cursor = connect_db()
	params = ["2025-07-01", "2025-08-01"]
	if reel_id:
		params.append(reel_id)
	params = tuple(params)

	query = """
		SET NOCOUNT ON;
		EXEC [tm].[TMEXP_RollBasisWeight] @from = ?, @to = ?, @reel_no = ?;
	"""
	
	cursor.execute(query, params)

	rows = cursor.fetchall()
	
	total_rolls = len(rows)
	roll_sum = 0

	# print("Result:")
	for row in rows:
		roll_sum += row[3]
		print(row)
	
	if roll_sum == 0 and total_rolls == 0:
		print(f"Store procedure: {0}")
	else:
		roll_bwt_average = roll_sum/total_rolls
		print(f"Store procedure: {roll_bwt_average}")

	return rows


# print(get_roll_bwt("AB1G1713"))
# get_roll_data("AB1G1714")


store_procedure = get_roll_bwt("AB1G1714")
my_query = get_roll_data("AB1G1714")
# print()
# print()
# get_roll_data("AB1G1713")

# max_len = max(len(store_procedure), len(my_query))

# for i in range(max_len):
# 	if i < len(store_procedure) and i < len(my_query):
# 		print(f"Store: {store_procedure[i][2]} - {store_procedure[i][3]}  |  My query: {my_query[i][0]} - {my_query[i][1]}  |  Same: {my_query[i][1] == store_procedure[i][3] and store_procedure[i][2] == my_query[i][0]}")
# 	elif i < len(store_procedure):
# 		print(f"Store: {store_procedure[i][2]} - {store_procedure[i][3]}")
# 	else:
# 		print(f"My query: {my_query[i][0]} - {my_query[i][1]}")