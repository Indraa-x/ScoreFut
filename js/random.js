/** Unbiased integer in [0, length), from fresh Web Crypto entropy each call. */
export function cryptoRandomIndex(length,source=globalThis.crypto) {
  const range=0x100000000;
  if(!Number.isSafeInteger(length)||length<1||length>range)throw new RangeError('Quantidade de opções inválida.');
  if(length===1)return 0;
  const cutoff=range-range%length,word=new Uint32Array(1);
  // Reject the incomplete final bucket so modulo never favors an option.
  do {source.getRandomValues(word);} while(word[0]>=cutoff);
  return word[0]%length;
}
