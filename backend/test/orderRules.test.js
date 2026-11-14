import test from 'node:test';
import assert from 'node:assert/strict';
import { canTransition, validCheckoutItems } from '../src/orderRules.js';

test('valid order flow', () => {
  assert.equal(canTransition('pending', 'confirmed'), true);
  assert.equal(canTransition('confirmed', 'shipped'), true);
  assert.equal(canTransition('shipped', 'delivered'), true);
});
test('cancellations restore only pre-shipment orders', () => {
  assert.equal(canTransition('pending', 'cancelled'), true);
  assert.equal(canTransition('confirmed', 'cancelled'), true);
  assert.equal(canTransition('shipped', 'cancelled'), false);
  assert.equal(canTransition('delivered', 'cancelled'), false);
  assert.equal(canTransition('cancelled', 'confirmed'), false);
  assert.equal(canTransition('pending', 'pending'), false);
  assert.equal(canTransition('unknown', 'cancelled'), false);
});
test('valid checkout cart', () => {
  assert.equal(validCheckoutItems([{product_id:1,quantity:2},{product_id:2,quantity:1}]), true);
  assert.equal(validCheckoutItems([{product_id:'1',quantity:1}]), true);
});
test('reject invalid checkout carts', () => {
  const invalid = [null, [], {}, [{product_id:1,quantity:0}],
    [{product_id:1,quantity:1.5}], [{product_id:1,quantity:10001}],
    [{product_id:1,quantity:1},{product_id:'1',quantity:3}],
    [{product_id:-1,quantity:1}], [{product_id:'abc',quantity:1}],
    Array.from({length:41}, (_,i)=>({product_id:i+1,quantity:1}))];
  invalid.forEach(cart => assert.equal(validCheckoutItems(cart), false));
});
