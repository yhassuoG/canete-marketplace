#!/bin/bash
cat > /tmp/test_order.json << 'ENDJSON'
{"tenantId":"eecfd498-1c5b-4096-864a-1b4bd4a61200","customerId":"d9f43177-2b88-4f9d-8f17-c4f193a9d409","customerName":"Yussef Guzman","customerPhone":"961710933","deliveryType":"pickup","paymentMethod":"cash","items":[{"name":"Test Fix","price":10.00,"qty":1}]}
ENDJSON
docker cp /tmp/test_order.json canete-api-1:/tmp/test_order.json
docker exec canete-api-1 curl -s -X POST http://localhost:8080/api/v1/orders \
  -H "Content-Type: application/json" \
  -d @/tmp/test_order.json
echo
