console.log('[TheDigiHubs Worker] AI matching worker started.');
console.log('[TheDigiHubs Worker] In production, this process will consume RFQ matching jobs from Redis/BullMQ or Kafka/NATS.');

setInterval(() => {
  console.log(`[TheDigiHubs Worker] heartbeat ${new Date().toISOString()}`);
}, 30000);
