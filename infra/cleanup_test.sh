#!/bin/bash
docker exec canete-postgres-1 psql -U postgres -d canete_marketplace -c "DELETE FROM canete_marketplace.orders WHERE id = '5ff1fd41-e3e2-476f-bb1d-5dd92d1ed75a';"
# Also revert the logged-in customer's stats (remove the test order's effect)
docker exec canete-postgres-1 psql -U postgres -d canete_marketplace -c "UPDATE canete_marketplace.customers SET total_orders = total_orders - 1, total_spent = total_spent - 10, loyalty_points = loyalty_points - 10 WHERE id = 'd9f43177-2b88-4f9d-8f17-c4f193a9d409' AND total_orders > 0;"
echo "Done"
