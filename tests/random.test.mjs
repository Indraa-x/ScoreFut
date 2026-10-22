import test from 'node:test';
import assert from 'node:assert/strict';
import {cryptoRandomIndex} from '../js/random.js';

test('crypto indices reject the incomplete modulo bucket before selecting a club',()=>{
 const words=[0xffffffff,0xfffffffc,27,0,28];let calls=0;
 const source={getRandomValues(target){target[0]=words[calls++];return target;}};
 assert.equal(cryptoRandomIndex(28,source),27);assert.equal(calls,3);
 assert.equal(cryptoRandomIndex(28,source),0);assert.equal(calls,4);
 assert.equal(cryptoRandomIndex(28,source),0);assert.equal(calls,5);
});
test('every option has an equal number of accepted integer values',()=>{
 const counts=[0,0,0];let next=0;
 const source={getRandomValues(target){target[0]=next++;return target;}};
 for(let i=0;i<300;i++)counts[cryptoRandomIndex(3,source)]++;
 assert.deepEqual(counts,[100,100,100]);
 assert.equal(cryptoRandomIndex(1,null),0);
 for(const count of [0,-1,1.5,NaN,0x100000001])assert.throws(()=>cryptoRandomIndex(count,source),RangeError);
});
