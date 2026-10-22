import test from 'node:test';
import assert from 'node:assert/strict';
import { deployment } from './deployment.ts';
test('local preview works without publishing destination',()=>assert.deepEqual(deployment({}),{site:'http://localhost:4321',base:'/'}));
test('production fails closed without both explicit values',()=>{
 assert.throws(()=>deployment({GUIDE_DEPLOY:'1'}));
 assert.throws(()=>deployment({GUIDE_DEPLOY:'1',GUIDE_SITE_URL:'https://owner.github.io'}));
});
test('project and user pages retain exact base',()=>{
 assert.equal(deployment({GUIDE_DEPLOY:'1',GUIDE_SITE_URL:'https://owner.github.io',GUIDE_BASE_PATH:'/guide/'}).base,'/guide/');
 assert.equal(deployment({GUIDE_DEPLOY:'1',GUIDE_SITE_URL:'https://owner.github.io',GUIDE_BASE_PATH:'/'}).base,'/');
});
test('credentials, query, non-origin site and invalid base rejected',()=>{
 for(const site of ['https://user:secret@example.com','https://example.com/path','https://example.com/?key=x','file:///tmp'])assert.throws(()=>deployment({GUIDE_SITE_URL:site}));
 for(const base of ['//evil.com','../guide','/../guide/','/guide?x=1'])assert.throws(()=>deployment({GUIDE_BASE_PATH:base}));
 assert.throws(()=>deployment({GUIDE_DEPLOY:'1',GUIDE_SITE_URL:'http://example.com',GUIDE_BASE_PATH:'/'}));
});
