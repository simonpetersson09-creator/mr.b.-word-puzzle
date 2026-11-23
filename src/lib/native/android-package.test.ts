import {describe,it,expect} from 'vitest';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
// @ts-expect-error Build-time script is JavaScript and never enters the app bundle.
import {androidPackageHashes,verifyAndroidPackage} from '../../../scripts/android-package.mjs';

function fixture(run: (root: string, write: (path: string, value: string) => void) => void) {
  const root=mkdtempSync(join(tmpdir(),'word-android-package-'));
  const write=(path:string,value:string)=>{mkdirSync(dirname(join(root,path)),{recursive:true});writeFileSync(join(root,path),value);};
  try {
    for(const path of ['src/example.ts','native-shell/index.html','scripts/build.mjs','resources/android/res/icon.png','dist-native/index.html','dist-native/assets/game.js','android/app/src/main/assets/public/index.html','android/app/src/main/assets/public/assets/game.js','android/app/src/main/assets/capacitor.plugins.json','android/app/build.gradle','android/build.gradle','android/variables.gradle','android/capacitor.settings.gradle','android/app/capacitor.build.gradle','android/app/src/main/AndroidManifest.xml','android/app/src/main/java/com/mrb/wordpuzzle/MainActivity.java','capacitor.config.ts','vite.native.config.ts','package.json','bun.lock']) write(path,'unchanged');
    write('android/app/src/main/assets/capacitor.config.json',JSON.stringify({appId:'com.mrb.wordpuzzle',appName:'Mr.B. Word Puzzle',webDir:'dist-native'}));
    run(root,write);
  }finally{rmSync(root,{recursive:true,force:true});}
}
const receipt=(root:string)=>({version:2,packageId:'com.mrb.wordpuzzle',hashes:androidPackageHashes(root)});

describe('Android offline release package',()=>{
  it('accepts a current complete offline package for com.mrb.wordpuzzle',()=>fixture(root=>{
    expect(()=>verifyAndroidPackage(receipt(root),root)).not.toThrow();
  }));
  it('rejects iOS identity in Android assets',()=>fixture((root,write)=>{
    write('android/app/src/main/assets/capacitor.config.json',JSON.stringify({appId:'se.shiningdays.mrbwordpuzzle',appName:'Mr.B. Word Puzzle',webDir:'dist-native'}));
    expect(()=>verifyAndroidPackage(receipt(root),root)).toThrow('com.mrb.wordpuzzle');
  }));
  it('rejects online server configuration',()=>fixture((root,write)=>{
    write('android/app/src/main/assets/capacitor.config.json',JSON.stringify({appId:'com.mrb.wordpuzzle',appName:'Mr.B. Word Puzzle',webDir:'dist-native',server:{url:'https://example.invalid'}}));
    expect(()=>verifyAndroidPackage(receipt(root),root)).toThrow('local dist-native bundle');
  }));
  it('rejects stale JS even when HTML still matches',()=>fixture((root,write)=>{
    write('android/app/src/main/assets/public/assets/game.js','old game');
    expect(()=>verifyAndroidPackage(receipt(root),root)).toThrow('Offline Android bundle mismatch');
  }));
  it('rejects source files added since sync',()=>fixture((root,write)=>{
    const saved=receipt(root);write('src/new.ts','new source');
    expect(()=>verifyAndroidPackage(saved,root)).toThrow('file set changed');
  }));
  it('rejects files removed since sync',()=>fixture(root=>{
    const saved=receipt(root);rmSync(join(root,'src/example.ts'));
    expect(()=>verifyAndroidPackage(saved,root)).toThrow('file set changed');
  }));
  it('rejects changed plugin linkage',()=>fixture((root,write)=>{
    const saved=receipt(root);write('android/app/capacitor.build.gradle','wrong plugins');
    expect(()=>verifyAndroidPackage(saved,root)).toThrow('Native package stale');
  }));
  it('rejects obsolete extra bundled assets',()=>fixture((root,write)=>{
    write('android/app/src/main/assets/public/assets/obsolete.js','old code');
    expect(()=>verifyAndroidPackage(receipt(root),root)).toThrow('stale files');
  }));
  it('requires new sync for legacy receipts',()=>fixture(root=>{
    expect(()=>verifyAndroidPackage({hashes:androidPackageHashes(root)},root)).toThrow('receipt missing or outdated');
  }));
});