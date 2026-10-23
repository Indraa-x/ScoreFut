import test from 'node:test';
import assert from 'node:assert/strict';
import {dragPreviewScale} from '../js/player-drag.js';

test('the held circle is larger in transit and matches the field marker when it reaches a legal position',()=>{
  for(const size of [40,48,58,64]){
    assert.equal(dragPreviewScale(Infinity,size),1.5);
    assert.equal(dragPreviewScale(500,size),1.5);
    assert.equal(dragPreviewScale(0,size),1);
    assert.equal(dragPreviewScale(size*.55,size),1);
    assert.ok(dragPreviewScale(size,size)>1);
    assert.ok(dragPreviewScale(size,size)<1.5);
  }
});

test('approaching a position shrinks the preview continuously without overshooting its limits',()=>{
  for(const size of [40,58,64]){
    let previous=1.5;
    for(let distance=300;distance>=0;distance--){
      const scale=dragPreviewScale(distance,size);
      assert.ok(Number.isFinite(scale)&&scale>=1&&scale<=1.5);
      assert.ok(scale<=previous+1e-12);
      assert.ok(previous-scale<.02);
      previous=scale;
    }
  }
});

test('the preview fits the destination circle even when it differs from the source size',()=>{
  for(const [source,target] of [[58,64],[64,48],[40,58]]){
    assert.equal(dragPreviewScale(0,source,target)*source,target);
    assert.equal(dragPreviewScale(500,source,target),1.5);
    assert.equal(dragPreviewScale(target*.55,source,target)*source,target);
  }
});
