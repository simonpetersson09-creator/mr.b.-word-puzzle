/** Copies committed Word Puzzle assets, as in the other Mr. B native pipelines. */
import { cpSync, existsSync } from 'node:fs';
if(!existsSync('android/app/src/main/res'))throw new Error('Android project missing');
if(!existsSync('resources/android/res'))throw new Error('Word Puzzle Android images missing');
cpSync('resources/android/res','android/app/src/main/res',{recursive:true});
console.log('Word Puzzle Android icon and splash resources restored');